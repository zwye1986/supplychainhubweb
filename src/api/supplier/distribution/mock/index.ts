import dayjs from 'dayjs'
import { PLATFORM_SKU_MOCK_LIST } from '@/api/supplier/manage/mock/platformSkus'
import type {
  DistPlatformSkuVO,
  DistributorInvoiceVO,
  DistributorProductVO,
  DistributorVO,
  ProjectProductVO,
  ProjectVO
} from '../types'
import { DISTRIBUTOR_MOCK_LIST } from './distributors'
import { DIST_INVOICE_MOCK_LIST } from './invoices'
import { DIST_PRODUCT_MOCK_LIST } from './products'
import { PROJECT_PRODUCT_MOCK_LIST } from './projectProducts'
import { PROJECT_MOCK_LIST } from './projects'

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data))

const distributors = clone(DISTRIBUTOR_MOCK_LIST)
const invoices = clone(DIST_INVOICE_MOCK_LIST)
const products = clone(DIST_PRODUCT_MOCK_LIST)
const projects = clone(PROJECT_MOCK_LIST)
const projectProducts = clone(PROJECT_PRODUCT_MOCK_LIST)
const platformSkus = clone(PLATFORM_SKU_MOCK_LIST) as DistPlatformSkuVO[]

let distributorSeq = Math.max(0, ...distributors.map((item) => item.id || 0))
let contactSeq = Math.max(
  0,
  ...distributors.flatMap((item) => (item.contacts || []).map((c) => c.id || 0))
)
let invoiceSeq = Math.max(0, ...invoices.map((item) => item.id || 0))
let productSeq = Math.max(0, ...products.map((item) => item.id || 0))
let projectSeq = Math.max(0, ...projects.map((item) => item.id || 0))
let projectProductSeq = Math.max(0, ...projectProducts.map((item) => item.id || 0))

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

const syncListFields = (item: DistributorVO) => {
  const firstContact = item.contacts?.[0]
  item.contactName = firstContact?.name || item.contactName || ''
  item.contactMobile = firstContact?.mobile || item.contactMobile || ''
  item.skuCount = products.filter((p) => p.distributorId === item.id).length || item.skuCount || 0
  item.projectCount =
    projects.filter((p) => p.distributorId === item.id).length || item.projectCount || 0
  item.childCount = distributors.filter((d) => d.parentId === item.id).length
  item.cooperationMode = Array.isArray(item.cooperationMode)
    ? item.cooperationMode
    : item.cooperationMode
      ? [String(item.cooperationMode)]
      : []
  item.category = item.category || []
  item.productType = item.productType || []
  if (item.parentId) {
    item.parentName = distributors.find((d) => d.id === item.parentId)?.name || item.parentName || ''
  } else {
    item.parentName = ''
  }
  if (!item.cooperationTime && item.cooperationStartDate) {
    item.cooperationTime = `${item.cooperationStartDate} 00:00:00`
  }
  return item
}

const resolveSettlementParty = (item: ProjectVO) => {
  if (item.settlementPartyType === 'platform') return '平台结算'
  return item.distributorName || item.settlementParty || ''
}

const syncProjectFields = (item: ProjectVO) => {
  const dist = distributors.find((d) => d.id === item.distributorId)
  item.distributorName = dist?.name || item.distributorName || ''
  const rows = projectProducts.filter((p) => p.projectId === item.id)
  item.skuCount = rows.length
  item.projectPriceSkuCount = rows.filter(
    (p) => p.projectPriceCovered && p.projectPrice != null
  ).length
  item.settlementParty = resolveSettlementParty(item)
  return item
}

const getDistributorSkuPrice = (distributorId?: number, skuId?: number, fallback = 0) => {
  if (!distributorId || !skuId) return fallback
  const found = products.find((item) => item.distributorId === distributorId && item.skuId === skuId)
  return found?.distPrice ?? fallback
}

const refreshDistributorSkuCoverage = (distributorId?: number, skuId?: number) => {
  if (!distributorId || !skuId) return
  const distProduct = products.find(
    (item) => item.distributorId === distributorId && item.skuId === skuId
  )
  if (!distProduct) return
  const covering = projectProducts.filter(
    (item) =>
      item.distributorId === distributorId &&
      item.skuId === skuId &&
      item.projectPriceCovered &&
      item.projectPrice != null
  )
  if (covering.length) {
    const names = covering
      .map((row) => projects.find((p) => p.id === row.projectId)?.name)
      .filter(Boolean) as string[]
    distProduct.projectPriceCovered = true
    distProduct.projectPrice = covering[0].projectPrice
    distProduct.finalPrice = covering[0].projectPrice
    distProduct.priceSource = '项目专属价'
    distProduct.projectNames = [...new Set(names)]
  } else {
    distProduct.projectPriceCovered = false
    distProduct.projectPrice = undefined
    distProduct.finalPrice = distProduct.distPrice
    distProduct.priceSource = '分销商基础价'
    distProduct.projectNames = []
  }
}

const refreshDistributorProjectCount = (distributorId?: number) => {
  if (!distributorId) return
  const dist = distributors.find((item) => item.id === distributorId)
  if (dist) {
    dist.projectCount = projects.filter((item) => item.distributorId === distributorId).length
    dist.updateTime = now()
  }
}

const paginate = <T>(list: T[], pageNo = 1, pageSize = 20) => {
  const start = (pageNo - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total: list.length }
}

/** 收集某分销商的所有下级 ID（用于循环绑定校验） */
const collectDescendantIds = (id: number, result = new Set<number>()) => {
  distributors
    .filter((item) => item.parentId === id)
    .forEach((child) => {
      if (child.id && !result.has(child.id)) {
        result.add(child.id)
        collectDescendantIds(child.id, result)
      }
    })
  return result
}

const assertNoCycle = (id: number | undefined, parentId: number | undefined) => {
  if (!parentId) return
  if (id && id === parentId) {
    throw new Error('上级分销商不能选择自身')
  }
  if (id && collectDescendantIds(id).has(parentId)) {
    throw new Error('禁止循环绑定：不能选择下级分销商作为上级')
  }
}

const assertCompanyUnique = (data: DistributorVO) => {
  const companyName = data.companyName?.trim()
  const creditCode = data.socialCreditCode?.trim()
  if (!companyName || !creditCode) return
  const duplicated = distributors.find(
    (item) =>
      item.id !== data.id &&
      item.companyName === companyName &&
      item.socialCreditCode === creditCode
  )
  if (duplicated) {
    throw new Error('公司名称与统一社会信用代码组合已存在')
  }
}

const genCode = () => {
  distributorSeq += 1
  // PRD 简写示例：18-001
  const yy = dayjs().format('YY')
  return `${yy}-${String(distributorSeq).padStart(3, '0')}`
}

export const DistributorMockApi = {
  async getDistributorPage(params: any) {
    await delay()
    let list = [...distributors].map((item) => syncListFields(clone(item)))
    if (params?.name) {
      const keyword = String(params.name).trim().toLowerCase()
      list = list.filter(
        (item) =>
          item.name?.toLowerCase().includes(keyword) ||
          item.code?.toLowerCase().includes(keyword) ||
          item.companyName?.toLowerCase().includes(keyword)
      )
    }
    if (params?.code) {
      const code = String(params.code).trim().toLowerCase()
      list = list.filter((item) => item.code?.toLowerCase().includes(code))
    }
    if (Array.isArray(params?.level) && params.level.length) {
      list = list.filter((item) => params.level.includes(item.level))
    }
    if (params?.parentId) {
      list = list.filter((item) => item.parentId === Number(params.parentId))
    }
    if (Array.isArray(params?.cooperationMode) && params.cooperationMode.length) {
      list = list.filter((item) =>
        (item.cooperationMode || []).some((mode) => params.cooperationMode.includes(mode))
      )
    }
    if (Array.isArray(params?.category) && params.category.length) {
      list = list.filter((item) =>
        (item.category || []).some((cat) => params.category.includes(cat))
      )
    }
    if (Array.isArray(params?.status) && params.status.length) {
      list = list.filter((item) => params.status.includes(item.status))
    }
    if (Array.isArray(params?.updateTime) && params.updateTime.length === 2) {
      const [start, end] = params.updateTime
      list = list.filter((item) => {
        if (!item.updateTime) return false
        return item.updateTime >= start && item.updateTime <= end
      })
    }
    list.sort((a, b) => String(b.updateTime || '').localeCompare(String(a.updateTime || '')))
    return paginate(list, params?.pageNo || 1, params?.pageSize || 20)
  },

  async getDistributorNameList() {
    await delay(100)
    return distributors
      .map((item) => syncListFields(clone(item)))
      .map((item) => ({ value: item.name, label: item.name, id: item.id, level: item.level }))
  },

  async getDistributorCodeList() {
    await delay(100)
    return distributors
      .map((item) => syncListFields(clone(item)))
      .map((item) => ({ value: item.code || '', label: item.code || '', id: item.id }))
      .filter((item) => item.value)
  },

  /** 可选上级列表：排除自身及下级 */
  async getParentOptions(excludeId?: number) {
    await delay(100)
    const blocked = excludeId ? collectDescendantIds(excludeId) : new Set<number>()
    if (excludeId) blocked.add(excludeId)
    return distributors
      .filter((item) => item.id && !blocked.has(item.id) && (item.level || 1) < 3)
      .map((item) => ({
        id: item.id!,
        name: item.name,
        level: item.level,
        code: item.code
      }))
  },

  async getDistributor(id: number) {
    await delay()
    const found = distributors.find((item) => item.id === id)
    if (!found) throw new Error('分销商不存在')
    return syncListFields(clone(found))
  },

  async createDistributor(data: DistributorVO) {
    await delay()
    assertNoCycle(undefined, data.parentId)
    assertCompanyUnique(data)
    const id = ++distributorSeq
    const contacts = (data.contacts || []).map((c) => ({ ...c, id: ++contactSeq }))
    const created: DistributorVO = {
      ...clone(data),
      id,
      code: data.code || genCode(),
      contacts,
      createTime: now(),
      updateTime: now(),
      cooperationTime: data.cooperationStartDate
        ? `${data.cooperationStartDate} 00:00:00`
        : now()
    }
    distributors.unshift(created)
    return syncListFields(clone(created))
  },

  async updateDistributor(data: DistributorVO) {
    await delay()
    const index = distributors.findIndex((item) => item.id === data.id)
    if (index < 0) throw new Error('分销商不存在')
    assertNoCycle(data.id, data.parentId)
    assertCompanyUnique(data)
    const contacts = (data.contacts || []).map((c) => ({
      ...c,
      id: c.id || ++contactSeq
    }))
    distributors[index] = {
      ...distributors[index],
      ...clone(data),
      contacts,
      updateTime: now()
    }
    return syncListFields(clone(distributors[index]))
  },

  async updateDistributorStatus(id: number, status: number) {
    await delay()
    const found = distributors.find((item) => item.id === id)
    if (!found) throw new Error('分销商不存在')
    found.status = status
    found.updateTime = now()
    return true
  },

  async getInvoice(distributorId: number) {
    await delay()
    const found = invoices.find((item) => item.distributorId === distributorId)
    return found ? clone(found) : null
  },

  async saveInvoice(data: DistributorInvoiceVO) {
    await delay()
    const index = invoices.findIndex((item) => item.distributorId === data.distributorId)
    if (index >= 0) {
      invoices[index] = { ...invoices[index], ...clone(data) }
      return clone(invoices[index])
    }
    const created = { ...clone(data), id: ++invoiceSeq }
    invoices.push(created)
    return clone(created)
  },

  async getProjectList(distributorId: number) {
    await delay()
    return projects
      .filter((item) => item.distributorId === distributorId)
      .map((item) => syncProjectFields(clone(item)))
      .sort((a, b) => String(b.createTime || '').localeCompare(String(a.createTime || '')))
  },

  async getProductPage(params: any) {
    await delay()
    let list = products.filter((item) => item.distributorId === Number(params?.distributorId))
    // categoryCode 参数同时兼容品类编码 / 商品类型筛选
    if (params?.categoryCode) {
      const key = String(params.categoryCode)
      list = list.filter(
        (item) => item.categoryCode === key || item.productType === key
      )
    }
    if (params?.keyword) {
      const keyword = String(params.keyword).trim().toLowerCase()
      list = list.filter(
        (item) =>
          item.spuName?.toLowerCase().includes(keyword) ||
          item.skuName?.toLowerCase().includes(keyword) ||
          item.skuCode?.toLowerCase().includes(keyword)
      )
    }
    list.sort((a, b) => String(b.createTime || '').localeCompare(String(a.createTime || '')))
    return paginate(list.map(clone), params?.pageNo || 1, params?.pageSize || 20)
  },

  async deleteProduct(id: number) {
    await delay()
    const index = products.findIndex((item) => item.id === id)
    if (index >= 0) products.splice(index, 1)
    return true
  },

  async createProducts(distributorId: number, rows: DistributorProductVO[]) {
    await delay()
    const created = rows.map((row) => {
      const item: DistributorProductVO = {
        ...clone(row),
        id: ++productSeq,
        distributorId,
        createTime: now(),
        status: row.status ?? 1,
        projectPriceCovered: false,
        projectNames: []
      }
      products.unshift(item)
      return item
    })
    const dist = distributors.find((item) => item.id === distributorId)
    if (dist) {
      dist.skuCount = products.filter((p) => p.distributorId === distributorId).length
      dist.updateTime = now()
    }
    return created.map(clone)
  },

  async getChildren(distributorId: number) {
    await delay()
    return distributors
      .filter((item) => item.parentId === distributorId)
      .map((item) => syncListFields(clone(item)))
      .sort((a, b) => String(b.createTime || '').localeCompare(String(a.createTime || '')))
  },

  async getPlatformSkuPage(params: any) {
    await delay()
    let list = platformSkus.map((item) =>
      clone({
        ...item,
        supplyPrice: item.supplyPrice ?? Number(((item.marketPrice || 0) * 0.55).toFixed(2))
      })
    )
    if (params?.keyword) {
      const keyword = String(params.keyword).trim().toLowerCase()
      list = list.filter(
        (item) =>
          item.spuName?.toLowerCase().includes(keyword) ||
          item.skuName?.toLowerCase().includes(keyword) ||
          item.skuCode?.toLowerCase().includes(keyword)
      )
    }
    if (params?.categoryCode) {
      const key = String(params.categoryCode)
      list = list.filter(
        (item) => item.categoryCode === key || item.productType === key
      )
    }
    return paginate(list, params?.pageNo || 1, params?.pageSize || 10)
  }
}

export const ProjectMockApi = {
  async getProjectPage(params: any) {
    await delay()
    let list = projects.map((item) => syncProjectFields(clone(item)))
    if (params?.name) {
      const keyword = String(params.name).trim().toLowerCase()
      list = list.filter(
        (item) =>
          item.name?.toLowerCase().includes(keyword) ||
          item.code?.toLowerCase().includes(keyword)
      )
    }
    if (params?.code) {
      const code = String(params.code).trim().toLowerCase()
      list = list.filter((item) => item.code?.toLowerCase().includes(code))
    }
    if (Array.isArray(params?.status) && params.status.length) {
      list = list.filter((item) => params.status.includes(item.status))
    }
    if (params?.distributorId) {
      list = list.filter((item) => item.distributorId === Number(params.distributorId))
    }
    if (Array.isArray(params?.projectType) && params.projectType.length) {
      list = list.filter((item) => params.projectType.includes(item.projectType))
    }
    if (Array.isArray(params?.period) && params.period.length === 2) {
      const [start, end] = params.period
      list = list.filter((item) => {
        if (!item.startDate || !item.endDate) return false
        return item.startDate <= end && item.endDate >= start
      })
    }
    list.sort((a, b) => String(b.updateTime || '').localeCompare(String(a.updateTime || '')))
    return paginate(list, params?.pageNo || 1, params?.pageSize || 12)
  },

  async getProjectNameList() {
    await delay(100)
    return projects
      .map((item) => syncProjectFields(clone(item)))
      .map((item) => ({ value: item.name, label: item.name, id: item.id }))
  },

  async getProjectCodeList() {
    await delay(100)
    return projects
      .map((item) => syncProjectFields(clone(item)))
      .map((item) => ({ value: item.code || '', label: item.code || '', id: item.id }))
      .filter((item) => item.value)
  },

  async getProject(id: number) {
    await delay()
    const found = projects.find((item) => item.id === id)
    if (!found) throw new Error('项目不存在')
    return syncProjectFields(clone(found))
  },

  async createProject(data: ProjectVO) {
    await delay()
    if (!data.distributorId) throw new Error('请选择关联分销商')
    const dist = distributors.find((item) => item.id === data.distributorId)
    if (!dist) throw new Error('关联分销商不存在')
    const id = ++projectSeq
    const created: ProjectVO = {
      ...clone(data),
      id,
      code: data.code || `PRJ${dayjs().format('YYYYMMDD')}${String(id).padStart(3, '0')}`,
      distributorName: dist.name,
      skuCount: 0,
      projectPriceSkuCount: 0,
      createTime: now(),
      updateTime: now()
    }
    created.settlementParty = resolveSettlementParty(created)
    projects.unshift(created)
    refreshDistributorProjectCount(created.distributorId)
    return syncProjectFields(clone(created))
  },

  async updateProject(data: ProjectVO) {
    await delay()
    const index = projects.findIndex((item) => item.id === data.id)
    if (index < 0) throw new Error('项目不存在')
    const prevDistributorId = projects[index].distributorId
    if (data.distributorId) {
      const dist = distributors.find((item) => item.id === data.distributorId)
      if (!dist) throw new Error('关联分销商不存在')
      data.distributorName = dist.name
    }
    projects[index] = {
      ...projects[index],
      ...clone(data),
      updateTime: now()
    }
    projects[index].settlementParty = resolveSettlementParty(projects[index])
    if (prevDistributorId !== projects[index].distributorId) {
      refreshDistributorProjectCount(prevDistributorId)
      refreshDistributorProjectCount(projects[index].distributorId)
    }
    return syncProjectFields(clone(projects[index]))
  },

  async updateProjectStatus(id: number, status: number) {
    await delay()
    const found = projects.find((item) => item.id === id)
    if (!found) throw new Error('项目不存在')
    found.status = status
    found.updateTime = now()
    return true
  },

  async getProductPage(params: any) {
    await delay()
    let list = projectProducts.filter((item) => item.projectId === Number(params?.projectId))
    if (params?.categoryCode) {
      const key = String(params.categoryCode)
      list = list.filter((item) => item.categoryCode === key || item.productType === key)
    }
    if (params?.keyword) {
      const keyword = String(params.keyword).trim().toLowerCase()
      list = list.filter(
        (item) =>
          item.spuName?.toLowerCase().includes(keyword) ||
          item.skuName?.toLowerCase().includes(keyword) ||
          item.skuCode?.toLowerCase().includes(keyword)
      )
    }
    list.sort((a, b) => String(b.createTime || '').localeCompare(String(a.createTime || '')))
    return paginate(list.map(clone), params?.pageNo || 1, params?.pageSize || 20)
  },

  async deleteProduct(id: number) {
    await delay()
    const index = projectProducts.findIndex((item) => item.id === id)
    if (index < 0) return true
    const removed = projectProducts[index]
    projectProducts.splice(index, 1)
    refreshDistributorSkuCoverage(removed.distributorId, removed.skuId)
    return true
  },

  async createProducts(projectId: number, rows: ProjectProductVO[]) {
    await delay()
    const project = projects.find((item) => item.id === projectId)
    if (!project) throw new Error('项目不存在')
    const created = rows.map((row) => {
      const distPrice = getDistributorSkuPrice(
        project.distributorId,
        row.skuId,
        row.suggestPrice || 0
      )
      const covered = row.adjustMode !== 0 && row.projectPrice != null
      const item: ProjectProductVO = {
        ...clone(row),
        id: ++projectProductSeq,
        projectId,
        distributorId: project.distributorId,
        distPrice,
        projectPriceCovered: covered,
        projectPrice: covered ? row.projectPrice : undefined,
        finalPrice: covered ? row.projectPrice : distPrice,
        priceSource: covered ? '项目专属价' : '分销商基础价',
        createTime: now(),
        status: row.status ?? 1
      }
      projectProducts.unshift(item)
      refreshDistributorSkuCoverage(item.distributorId, item.skuId)
      return item
    })
    project.updateTime = now()
    return created.map(clone)
  }
}
