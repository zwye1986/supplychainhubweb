import dayjs from 'dayjs'
import { PLATFORM_SKU_MOCK_LIST } from '@/api/supplier/manage/mock/platformSkus'
import type {
  DistPlatformSkuVO,
  DistributorInvoiceVO,
  DistributorProductVO,
  DistributorVO
} from '../types'
import { DISTRIBUTOR_MOCK_LIST } from './distributors'
import { DIST_INVOICE_MOCK_LIST } from './invoices'
import { DIST_PRODUCT_MOCK_LIST } from './products'
import { PROJECT_MOCK_LIST } from './projects'

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data))

const distributors = clone(DISTRIBUTOR_MOCK_LIST)
const invoices = clone(DIST_INVOICE_MOCK_LIST)
const products = clone(DIST_PRODUCT_MOCK_LIST)
const projects = clone(PROJECT_MOCK_LIST)
const platformSkus = clone(PLATFORM_SKU_MOCK_LIST) as DistPlatformSkuVO[]

let distributorSeq = Math.max(0, ...distributors.map((item) => item.id || 0))
let contactSeq = Math.max(
  0,
  ...distributors.flatMap((item) => (item.contacts || []).map((c) => c.id || 0))
)
let invoiceSeq = Math.max(0, ...invoices.map((item) => item.id || 0))
let productSeq = Math.max(0, ...products.map((item) => item.id || 0))

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
      .map((item) => clone(item))
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
