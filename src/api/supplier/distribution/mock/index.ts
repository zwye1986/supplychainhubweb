import dayjs from 'dayjs'
import { PLATFORM_SKU_MOCK_LIST } from './platformSkus'
import { toProductTypeItems } from '../types'
import type {
  DistPlatformSkuVO,
  DistributorProductVO,
  DistributorVO,
  ProjectProductVO,
  ProjectVO
} from '../types'
import { DISTRIBUTOR_MOCK_LIST } from './distributors'
import { DIST_PRODUCT_MOCK_LIST } from './products'
import { PROJECT_PRODUCT_MOCK_LIST } from './projectProducts'
import { PROJECT_MOCK_LIST } from './projects'

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data))

const distributors = clone(DISTRIBUTOR_MOCK_LIST)
const products = clone(DIST_PRODUCT_MOCK_LIST)
const projects = clone(PROJECT_MOCK_LIST)
const projectProducts = clone(PROJECT_PRODUCT_MOCK_LIST)
const platformSkus = clone(PLATFORM_SKU_MOCK_LIST) as DistPlatformSkuVO[]

let productSeq = Math.max(0, ...products.map((item) => item.id || 0))
let projectSeq = Math.max(0, ...projects.map((item) => item.id || 0))
let projectProductSeq = Math.max(0, ...projectProducts.map((item) => item.id || 0))

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

const syncListFields = (item: DistributorVO) => {
  const firstContact = item.contacts?.[0]
  item.contactName = firstContact?.name || item.contactName || ''
  item.contactMobile = firstContact?.mobile || item.contactMobile || ''
  item.primaryContactName = item.contactName
  item.primaryContactMobile = item.contactMobile
  item.skuCount = products.filter((p) => p.distributorId === item.id).length || item.skuCount || 0
  item.projectCount =
    projects.filter((p) => p.buyerCode === (item.buyerCode || item.code)).length ||
    item.projectCount ||
    0
  item.childCount = distributors.filter((d) => d.parentId === item.id).length
  item.cooperationMode = Array.isArray(item.cooperationMode)
    ? item.cooperationMode
    : item.cooperationMode
      ? [String(item.cooperationMode)]
      : []
  item.cooperationModes = item.cooperationModes?.length
    ? item.cooperationModes
    : item.cooperationMode
  item.category = item.category || []
  item.productType = item.productType || []
  item.buyerCode = item.buyerCode || item.code
  item.buyerName = item.buyerName || item.name
  item.code = item.code || item.buyerCode
  item.name = item.name || item.buyerName
  item.distributionLevel = item.distributionLevel ?? item.level
  item.level = item.level ?? item.distributionLevel
  if (!item.categories?.length && item.category?.length) {
    item.categories = item.category.map((name) => ({ name }))
  }
  if (!item.productTypes?.length && item.productType?.length) {
    item.productTypes = item.productType
  }
  if (item.parentId) {
    item.parentName =
      distributors.find((d) => d.id === item.parentId)?.buyerName ||
      distributors.find((d) => d.id === item.parentId)?.name ||
      item.parentName ||
      ''
  } else {
    item.parentName = ''
  }
  if (!item.cooperationTime && item.cooperationStartDate) {
    item.cooperationTime = `${item.cooperationStartDate} 00:00:00`
  }
  if (item.updatedAt == null && item.updateTime) {
    item.updatedAt = item.updateTime
  }
  return item
}

const syncProjectFields = (item: ProjectVO) => {
  const dist = distributors.find(
    (d) => d.buyerCode === item.buyerCode || d.code === item.buyerCode
  )
  item.buyerName = dist?.buyerName || dist?.name || item.buyerName || ''
  item.settlementPartyType = item.settlementPartyType || 'DISTRIBUTOR'
  item.catalogMode = item.catalogMode || 'MANAGED'
  if (!item.productTypes?.length && dist) {
    item.productTypes = toProductTypeItems(dist.productTypes || dist.productType)
  }
  const rows = projectProducts.filter((p) => p.projectId === item.id)
  item.skuCount = rows.length
  item.projectPriceSkuCount = rows.filter(
    (p) => p.projectPriceCovered && p.projectPrice != null
  ).length
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
      .map((row) => projects.find((p) => p.id === row.projectId)?.projectName)
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

const refreshDistributorProjectCount = (buyerCode?: string) => {
  if (!buyerCode) return
  const dist = distributors.find((item) => item.buyerCode === buyerCode || item.code === buyerCode)
  if (dist) {
    dist.projectCount = projects.filter((item) => item.buyerCode === buyerCode).length
    dist.updateTime = now()
  }
}

const paginate = <T>(list: T[], pageNo = 1, pageSize = 20) => {
  const start = (pageNo - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total: list.length }
}

export const DistributorMockApi = {
  async getProjectList(distributorId: number) {
    await delay()
    const dist = distributors.find((item) => item.id === distributorId)
    const buyerCode = dist?.buyerCode || dist?.code
    return projects
      .filter((item) => item.buyerCode === buyerCode)
      .map((item) => syncProjectFields(clone(item)))
      .sort((a, b) => String(b.projectCode || '').localeCompare(String(a.projectCode || '')))
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
    if (params?.projectName) {
      const keyword = String(params.projectName).trim().toLowerCase()
      list = list.filter((item) => item.projectName?.toLowerCase().includes(keyword))
    }
    if (params?.projectCode) {
      const code = String(params.projectCode).trim().toLowerCase()
      list = list.filter((item) => item.projectCode?.toLowerCase().includes(code))
    }
    if (Array.isArray(params?.status) && params.status.length) {
      list = list.filter((item) => params.status.includes(item.status))
    }
    if (params?.buyerCode) {
      list = list.filter((item) => item.buyerCode === params.buyerCode)
    }
    if (Array.isArray(params?.projectType) && params.projectType.length) {
      list = list.filter((item) => params.projectType.includes(item.projectType))
    }
    if (params?.periodFrom && params?.periodTo) {
      list = list.filter((item) => {
        if (!item.startDate || !item.endDate) return false
        return item.startDate <= params.periodTo && item.endDate >= params.periodFrom
      })
    }
    list.sort((a, b) => String(b.projectCode || '').localeCompare(String(a.projectCode || '')))
    return paginate(list, params?.pageNo || 1, params?.pageSize || 12)
  },

  async getProjectNameList() {
    await delay(100)
    return projects
      .map((item) => syncProjectFields(clone(item)))
      .map((item) => ({
        value: item.projectName,
        label: item.projectName,
        code: item.projectCode
      }))
  },

  async getProjectCodeList() {
    await delay(100)
    return projects
      .map((item) => syncProjectFields(clone(item)))
      .map((item) => ({
        value: item.projectCode || '',
        label: item.projectCode || '',
        name: item.projectName
      }))
      .filter((item) => item.value)
  },

  async getProject(projectCode: string) {
    await delay()
    const found = projects.find((item) => item.projectCode === projectCode || String(item.id) === projectCode)
    if (!found) throw new Error('项目不存在')
    return syncProjectFields(clone(found))
  },

  async createProject(data: ProjectVO) {
    await delay()
    if (!data.buyerCode) throw new Error('请选择关联分销商')
    const dist = distributors.find(
      (item) => item.buyerCode === data.buyerCode || item.code === data.buyerCode
    )
    if (!dist) throw new Error('关联分销商不存在')
    const id = ++projectSeq
    const created: ProjectVO = {
      ...clone(data),
      id,
      projectCode: data.projectCode || `PRJ_${dayjs().format('YYYYMMDD')}${String(id).padStart(3, '0')}`,
      buyerName: dist.buyerName || dist.name,
      settlementPartyType: data.settlementPartyType || 'DISTRIBUTOR',
      catalogMode: 'MANAGED',
      skuCount: 0,
      projectPriceSkuCount: 0
    }
    projects.unshift(created)
    refreshDistributorProjectCount(created.buyerCode)
    return syncProjectFields(clone(created))
  },

  async updateProject(data: ProjectVO) {
    await delay()
    const index = projects.findIndex(
      (item) => item.projectCode === data.projectCode || item.id === data.id
    )
    if (index < 0) throw new Error('项目不存在')
    const prevBuyerCode = projects[index].buyerCode
    if (data.buyerCode) {
      const dist = distributors.find(
        (item) => item.buyerCode === data.buyerCode || item.code === data.buyerCode
      )
      if (!dist) throw new Error('关联分销商不存在')
      data.buyerName = dist.buyerName || dist.name
    }
    projects[index] = {
      ...projects[index],
      ...clone(data)
    }
    if (prevBuyerCode !== projects[index].buyerCode) {
      refreshDistributorProjectCount(prevBuyerCode)
      refreshDistributorProjectCount(projects[index].buyerCode)
    }
    return syncProjectFields(clone(projects[index]))
  },

  async getProductPage(params: any) {
    await delay()
    const project = projects.find(
      (item) => item.projectCode === params?.projectCode || item.id === Number(params?.projectId)
    )
    let list = projectProducts.filter((item) => item.projectId === project?.id)
    const productType = params?.productType
    const typeCodes = (Array.isArray(productType) ? productType : productType ? [productType] : [])
      .map((item: unknown) => String(item))
      .filter(Boolean)
    if (typeCodes.length) {
      list = list.filter((item) => item.productType && typeCodes.includes(item.productType))
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
    const dist = distributors.find(
      (item) => item.buyerCode === project.buyerCode || item.code === project.buyerCode
    )
    const created = rows.map((row) => {
      const distPrice = getDistributorSkuPrice(dist?.id, row.skuId, row.suggestPrice || 0)
      const covered = row.adjustMode !== 0 && row.projectPrice != null
      const item: ProjectProductVO = {
        ...clone(row),
        id: ++projectProductSeq,
        projectId,
        distributorId: dist?.id,
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
    return created.map(clone)
  }
}
