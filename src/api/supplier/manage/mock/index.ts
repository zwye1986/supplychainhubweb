import dayjs from 'dayjs'
import type {
  PlatformSkuVO,
  SupplierInvoiceVO,
  SupplierProductVO,
  SupplierSupplyConfigVO,
  SupplierVO
} from '../types'
import { INVOICE_MOCK_LIST } from './invoices'
import { PLATFORM_SKU_MOCK_LIST } from './platformSkus'
import { PRODUCT_MOCK_LIST } from './products'
import { SUPPLIER_MOCK_LIST } from './suppliers'

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data))

const suppliers = clone(SUPPLIER_MOCK_LIST)
const invoices = clone(INVOICE_MOCK_LIST)
const products = clone(PRODUCT_MOCK_LIST)
const platformSkus = clone(PLATFORM_SKU_MOCK_LIST)

let supplierSeq = Math.max(0, ...suppliers.map((item) => item.id || 0))
let contactSeq = Math.max(
  0,
  ...suppliers.flatMap((item) => (item.contacts || []).map((c) => c.id || 0))
)
let supplyConfigSeq = Math.max(
  0,
  ...suppliers.flatMap((item) => (item.supplyConfigs || []).map((c) => c.id || 0))
)
let invoiceSeq = Math.max(0, ...invoices.map((item) => item.id || 0))
let productSeq = Math.max(0, ...products.map((item) => item.id || 0))

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

const syncListFields = (supplier: SupplierVO) => {
  const firstContact = supplier.contacts?.[0]
  supplier.contactName = firstContact?.name || supplier.contactName || ''
  supplier.contactMobile = firstContact?.mobile || supplier.contactMobile || ''
  supplier.supplierCode = supplier.supplierCode || supplier.code
  supplier.supplierName = supplier.supplierName || supplier.name
  supplier.code = supplier.code || supplier.supplierCode
  supplier.name = supplier.name || supplier.supplierName
  const relatedCount = products.filter((item) => item.supplierId === supplier.id).length
  // 列表 SKU 数优先保留 mock 配置；没有配置时再用实际关联商品数
  supplier.productCount = relatedCount || supplier.productCount || 0
  supplier.skuCount = supplier.skuCount ?? relatedCount
  if (!supplier.category?.length && supplier.supplyConfigs?.length) {
    supplier.category = [
      ...new Set(
        supplier.supplyConfigs
          .map((item) => item.categoryCode)
          .filter((code): code is string => !!code)
      )
    ]
  }
  if (!supplier.categories?.length && supplier.category?.length) {
    supplier.categories = supplier.category.map((name) => ({ name }))
  }
  if (!supplier.productTypes?.length && supplier.productType?.length) {
    supplier.productTypes = supplier.productType.map((name) => ({ name }))
  }
  if (!supplier.productCategories?.length && supplier.productCategory?.length) {
    supplier.productCategories = supplier.productCategory.map((name) => ({ name }))
  }
  if (!supplier.supplyModes?.length && supplier.supplyMode?.length) {
    supplier.supplyModes = supplier.supplyMode.map((name) => ({ name }))
  }
  if (!supplier.accessTime && supplier.accessDate) {
    supplier.accessTime = `${supplier.accessDate} 00:00:00`
  }
  if (supplier.onboardedAt == null && supplier.accessTime) {
    supplier.onboardedAt = supplier.accessTime
  }
  if (supplier.updatedAt == null && supplier.updateTime) {
    supplier.updatedAt = supplier.updateTime
  }
  return supplier
}

const paginate = <T>(list: T[], pageNo = 1, pageSize = 20) => {
  const start = (pageNo - 1) * pageSize
  return {
    list: list.slice(start, start + pageSize),
    total: list.length
  }
}

export const SupplierMockApi = {
  async getSupplierPage(params: any) {
    await delay()
    let list = [...suppliers].map((item) => syncListFields(clone(item)))
    const supplierName = params?.supplierName || params?.name
    if (supplierName) {
      const keyword = String(supplierName).trim().toLowerCase()
      list = list.filter(
        (item) =>
          item.supplierName?.toLowerCase().includes(keyword) ||
          item.name?.toLowerCase().includes(keyword) ||
          item.supplierCode?.toLowerCase().includes(keyword) ||
          item.code?.toLowerCase().includes(keyword) ||
          item.companyName?.toLowerCase().includes(keyword)
      )
    }
    const supplierCode = params?.supplierCode || params?.code
    if (supplierCode) {
      const keyword = String(supplierCode).trim().toLowerCase()
      list = list.filter(
        (item) =>
          item.supplierCode?.toLowerCase().includes(keyword) ||
          item.code?.toLowerCase().includes(keyword)
      )
    }

    if (Array.isArray(params?.status) && params.status.length > 0) {
      const statusSet = new Set(params.status.map((item: any) => String(item)))
      list = list.filter((item) => statusSet.has(String(item.status)))
    }

    if (Array.isArray(params?.categoryL1Ids) && params.categoryL1Ids.length > 0) {
      const idSet = new Set(params.categoryL1Ids.map((item: any) => Number(item)))
      list = list.filter((item) =>
        item.scopes?.some((scope) => scope.categoryL1Id != null && idSet.has(Number(scope.categoryL1Id)))
      )
    } else if (Array.isArray(params?.category) && params.category.length > 0) {
      list = list.filter((item) => item.category?.some((tag) => params.category.includes(tag)))
    }

    const supplyModes = params?.supplyModes || params?.supplyMode
    if (Array.isArray(supplyModes) && supplyModes.length > 0) {
      list = list.filter((item) => {
        const modes =
          item.supplyModes?.map((mode) => mode.name).filter(Boolean) || item.supplyMode || []
        return modes.some((tag) => supplyModes.includes(tag))
      })
    }
    if (params?.capabilityTag) {
      list = list.filter((item) => item.capabilityTags?.includes(params.capabilityTag))
    }
    if (params?.contactName) {
      const keyword = String(params.contactName).trim()
      list = list.filter((item) =>
        item.contacts?.some((contact) => contact.name?.includes(keyword))
      )
    }
    if (params?.updatedFrom || params?.updatedTo) {
      list = list.filter((item) => {
        const time = item.updatedAt || item.updateTime
        if (!time) return false
        if (params.updatedFrom && time < params.updatedFrom) return false
        if (params.updatedTo && time > params.updatedTo) return false
        return true
      })
    } else if (Array.isArray(params?.updateTime) && params.updateTime.length === 2) {
      const [start, end] = params.updateTime
      list = list.filter((item) => {
        const time = item.updatedAt || item.updateTime
        if (!time) return false
        return time >= start && time <= end
      })
    }
    list.sort((a, b) =>
      String(b.updatedAt || b.updateTime || '').localeCompare(String(a.updatedAt || a.updateTime || ''))
    )
    return paginate(list, params?.pageNo || 1, params?.pageSize || 20)
  },

  async getSupplierNameList() {
    await delay()
    return suppliers.map((item) => ({
      value: item.supplierName || item.name || '',
      label: item.supplierName || item.name || '',
      code: item.supplierCode || item.code
    }))
  },

  async getSupplier(id: number) {
    await delay()
    const target = suppliers.find((item) => item.id === id)
    if (!target) {
      return Promise.reject(new Error('供应商不存在'))
    }
    return syncListFields(clone(target))
  },

  async createSupplier(data: SupplierVO) {
    await delay()
    const exists = suppliers.some(
      (item) =>
        item.companyName === data.companyName && item.socialCreditCode === data.socialCreditCode
    )
    if (exists) {
      return Promise.reject(new Error('公司名称+统一社会信用代码已存在'))
    }
    supplierSeq += 1
    const contacts = (data.contacts || []).map((contact) => {
      contactSeq += 1
      return { ...contact, id: contactSeq }
    })
    const row: SupplierVO = {
      ...clone(data),
      id: supplierSeq,
      code: `SUP${dayjs().format('YYYY')}${String(supplierSeq).padStart(4, '0')}`,
      contacts,
      supplyConfigs: data.supplyConfigs || [],
      createTime: now(),
      updateTime: now()
    }
    syncListFields(row)
    suppliers.unshift(row)
    return row.id
  },

  async updateSupplier(data: SupplierVO) {
    await delay()
    const index = suppliers.findIndex((item) => item.id === data.id)
    if (index < 0) {
      return Promise.reject(new Error('供应商不存在'))
    }
    const exists = suppliers.some(
      (item) =>
        item.id !== data.id &&
        item.companyName === data.companyName &&
        item.socialCreditCode === data.socialCreditCode
    )
    if (exists) {
      return Promise.reject(new Error('公司名称+统一社会信用代码已存在'))
    }
    const contacts = (data.contacts || []).map((contact) => {
      if (contact.id) return contact
      contactSeq += 1
      return { ...contact, id: contactSeq }
    })
    suppliers[index] = syncListFields({
      ...suppliers[index],
      ...clone(data),
      contacts,
      updateTime: now()
    })
    return true
  },

  async deleteSupplier(id: number) {
    await delay()
    const index = suppliers.findIndex((item) => item.id === id)
    if (index < 0) {
      return Promise.reject(new Error('供应商不存在'))
    }
    suppliers.splice(index, 1)
    for (let i = invoices.length - 1; i >= 0; i--) {
      if (invoices[i].supplierId === id) invoices.splice(i, 1)
    }
    for (let i = products.length - 1; i >= 0; i--) {
      if (products[i].supplierId === id) products.splice(i, 1)
    }
    return true
  },

  async updateSupplierStatus(idOrCode: number | string, status: string) {
    await delay()
    const target = suppliers.find(
      (item) => item.id === idOrCode || item.code === idOrCode || item.supplierCode === idOrCode
    )
    if (!target) {
      return Promise.reject(new Error('供应商不存在'))
    }
    target.status = status
    target.updateTime = now()
    target.updatedAt = now()
    return true
  },

  async getInvoice(supplierId: number) {
    await delay()
    const invoice = invoices.find((item) => item.supplierId === supplierId)
    return invoice ? clone(invoice) : null
  },

  async saveInvoice(data: SupplierInvoiceVO) {
    await delay()
    const index = invoices.findIndex((item) => item.supplierId === data.supplierId)
    if (index >= 0) {
      invoices[index] = { ...invoices[index], ...clone(data), id: invoices[index].id }
    } else {
      invoiceSeq += 1
      invoices.push({ ...clone(data), id: invoiceSeq })
    }
    return true
  },

  async getSupplyConfigList(supplierId: number) {
    await delay()
    const target = suppliers.find((item) => item.id === supplierId)
    return clone(target?.supplyConfigs || [])
  },

  async saveSupplyConfigs(supplierId: number, configs: SupplierSupplyConfigVO[]) {
    await delay()
    const target = suppliers.find((item) => item.id === supplierId)
    if (!target) {
      return Promise.reject(new Error('供应商不存在'))
    }
    target.supplyConfigs = clone(configs).map((item) => {
      if (item.id) return item
      supplyConfigSeq += 1
      return { ...item, id: supplyConfigSeq }
    })
    target.category = [
      ...new Set(
        target.supplyConfigs
          .map((item) => item.categoryCode)
          .filter((code): code is string => !!code)
      )
    ]
    target.productType = [
      ...new Set(
        target.supplyConfigs
          .map((item) => item.productType)
          .filter((code): code is string => !!code)
      )
    ]
    target.productCategory = [
      ...new Set(
        target.supplyConfigs
          .map((item) => item.productCategory)
          .filter((code): code is string => !!code)
      )
    ]
    target.supplyMode = [
      ...new Set(target.supplyConfigs.flatMap((item) => item.supplyMode || []))
    ]
    target.updateTime = now()
    return true
  },

  async getProductPage(params: any) {
    await delay()
    let list = products.filter((item) => item.supplierId === Number(params?.supplierId))
    if (params?.categoryCode) {
      list = list.filter((item) => item.categoryCode === params.categoryCode)
    }
    if (params?.productType) {
      list = list.filter((item) => item.productType === params.productType)
    }
    if (params?.productCategory) {
      list = list.filter((item) => item.productCategory === params.productCategory)
    }
    list = clone(list).sort((a, b) =>
      String(b.createTime || '').localeCompare(String(a.createTime || ''))
    )
    return paginate(list, params?.pageNo || 1, params?.pageSize || 20)
  },

  async deleteProduct(id: number) {
    await delay()
    const index = products.findIndex((item) => item.id === id)
    if (index < 0) {
      return Promise.reject(new Error('合作商品不存在'))
    }
    const supplierId = products[index].supplierId
    products.splice(index, 1)
    const supplier = suppliers.find((item) => item.id === supplierId)
    if (supplier) {
      syncListFields(supplier)
      supplier.updateTime = now()
    }
    return true
  },

  async createProducts(supplierId: number, rows: SupplierProductVO[]) {
    await delay()
    const supplier = suppliers.find((item) => item.id === supplierId)
    if (!supplier) {
      return Promise.reject(new Error('供应商不存在'))
    }
    rows.forEach((row) => {
      const exists = products.some(
        (item) => item.supplierId === supplierId && item.skuId === row.skuId
      )
      if (exists) return
      productSeq += 1
      const supplyMode = Array.isArray(row.supplyMode)
        ? row.supplyMode.map(String)
        : row.supplyMode
          ? [String(row.supplyMode)]
          : []
      products.unshift({
        ...clone(row),
        id: productSeq,
        supplierId,
        supplyMode,
        status: row.status ?? 1,
        createTime: now()
      })
    })
    syncListFields(supplier)
    supplier.updateTime = now()
    return true
  },

  async updateProduct(data: SupplierProductVO) {
    await delay()
    const index = products.findIndex((item) => item.id === data.id)
    if (index < 0) {
      return Promise.reject(new Error('合作商品不存在'))
    }
    const supplyMode = Array.isArray(data.supplyMode)
      ? data.supplyMode.map(String)
      : data.supplyMode
        ? [String(data.supplyMode)]
        : products[index].supplyMode || []
    products[index] = {
      ...products[index],
      ...clone(data),
      supplyMode
    }
    const supplier = suppliers.find((item) => item.id === products[index].supplierId)
    if (supplier) {
      syncListFields(supplier)
      supplier.updateTime = now()
    }
    return true
  },

  async getPlatformSkuPage(params: any) {
    await delay()
    let list = [...platformSkus]
    if (params?.categoryCode) {
      list = list.filter((item) => item.categoryCode === params.categoryCode)
    }
    if (params?.productType) {
      list = list.filter((item) => item.productType === params.productType)
    }
    if (params?.productCategory) {
      list = list.filter((item) => item.productCategory === params.productCategory)
    }
    if (params?.keyword) {
      const keyword = String(params.keyword).trim().toLowerCase()
      list = list.filter(
        (item) =>
          item.spuName.toLowerCase().includes(keyword) ||
          item.skuName.toLowerCase().includes(keyword) ||
          item.skuCode.toLowerCase().includes(keyword)
      )
    }
    if (params?.supplierId) {
      const supplier = suppliers.find((item) => item.id === Number(params.supplierId))
      const configs = supplier?.supplyConfigs || []
      if (configs.length) {
        list = list.filter((sku) =>
          configs.some((config) => {
            if (config.categoryCode && sku.categoryCode !== config.categoryCode) return false
            if (config.productType && sku.productType && sku.productType !== config.productType) {
              return false
            }
            if (
              config.productCategory &&
              sku.productCategory &&
              sku.productCategory !== config.productCategory
            ) {
              return false
            }
            return true
          })
        )
      }
      const relatedSkuIds = new Set(
        products
          .filter((item) => item.supplierId === Number(params.supplierId))
          .map((item) => item.skuId)
      )
      list = list.filter((item) => !relatedSkuIds.has(item.skuId))
    }
    return paginate(clone(list), params?.pageNo || 1, params?.pageSize || 10)
  }
}
