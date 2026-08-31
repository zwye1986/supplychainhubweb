import request from '@/config/axios'
import { SupplierMockApi } from './mock'

export type {
  SupplierContactVO,
  SupplierSupplyConfigVO,
  SupplierInvoiceVO,
  SupplierProductVO,
  SupplierVO,
  PlatformSkuVO
} from './types'

import type {
  SupplierInvoiceVO,
  SupplierProductVO,
  SupplierSupplyConfigVO,
  SupplierVO
} from './types'

/** 本地 JSON 模拟开关：后端就绪后改为 false */
export const USE_SUPPLIER_MOCK = true

export const SupplierApi = {
  getSupplierPage: async (params: any) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.getSupplierPage(params)
    return await request.get({ url: '/scm/supplier/page', params })
  },

  getSupplier: async (id: number) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.getSupplier(id)
    return await request.get({ url: '/scm/supplier/get?id=' + id })
  },

  createSupplier: async (data: SupplierVO) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.createSupplier(data)
    return await request.post({ url: '/scm/supplier/create', data })
  },

  updateSupplier: async (data: SupplierVO) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.updateSupplier(data)
    return await request.put({ url: '/scm/supplier/update', data })
  },

  deleteSupplier: async (id: number) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.deleteSupplier(id)
    return await request.delete({ url: '/scm/supplier/delete?id=' + id })
  },

  updateSupplierStatus: async (id: number, status: number) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.updateSupplierStatus(id, status)
    return await request.put({ url: '/scm/supplier/update-status', data: { id, status } })
  },

  getInvoice: async (supplierId: number) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.getInvoice(supplierId)
    return await request.get({ url: '/scm/supplier/invoice/get?supplierId=' + supplierId })
  },

  saveInvoice: async (data: SupplierInvoiceVO) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.saveInvoice(data)
    return await request.post({ url: '/scm/supplier/invoice/save', data })
  },

  getSupplyConfigList: async (supplierId: number) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.getSupplyConfigList(supplierId)
    return await request.get({ url: '/scm/supplier/supply-config/list?supplierId=' + supplierId })
  },

  saveSupplyConfigs: async (supplierId: number, configs: SupplierSupplyConfigVO[]) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.saveSupplyConfigs(supplierId, configs)
    return await request.post({
      url: '/scm/supplier/supply-config/save',
      data: { supplierId, configs }
    })
  },

  getProductPage: async (params: any) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.getProductPage(params)
    return await request.get({ url: '/scm/supplier/product/page', params })
  },

  deleteProduct: async (id: number) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.deleteProduct(id)
    return await request.delete({ url: '/scm/supplier/product/delete?id=' + id })
  },

  createProducts: async (supplierId: number, products: SupplierProductVO[]) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.createProducts(supplierId, products)
    return await request.post({
      url: '/scm/supplier/product/create-batch',
      data: { supplierId, products }
    })
  },

  getPlatformSkuPage: async (params: any) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.getPlatformSkuPage(params)
    return await request.get({ url: '/scm/supplier/platform-sku/page', params })
  }
}
