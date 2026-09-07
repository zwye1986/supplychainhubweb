import request from '@/config/axios'
import { SupplierMockApi } from './mock'

export type {
  SupplierContactVO,
  SupplierSupplyConfigVO,
  SupplierInvoiceVO,
  SupplierProductVO,
  SupplierVO,
  SupplierSaveReqVO,
  ChangeStatusReqVO,
  SupplierPageParam,
  PlatformSkuVO,
  SupplyScopeView,
  SupplierSupplyScopeDO,
  SaveScopesReqVO,
  ScopeReqVO,
  OfferListItem,
  OfferFormItem,
  OfferPageParam,
  OfferItemsReqVO,
  DraftReqVO,
  PatchOfferReqVO,
  NamedRef
} from './types'

import type {
  ChangeStatusReqVO,
  DraftReqVO,
  OfferItemsReqVO,
  OfferListItem,
  OfferPageParam,
  PatchOfferReqVO,
  SaveScopesReqVO,
  SupplierInvoiceVO,
  SupplierPageParam,
  SupplierProductVO,
  SupplierSaveReqVO,
  SupplierSupplyConfigVO,
  SupplierSupplyScopeDO,
  SupplierVO
} from './types'

/** 本地 JSON 模拟开关：后端就绪后改为 false */
export const USE_SUPPLIER_MOCK = true

export const SupplierApi = {
  getSupplierPage: async (params: SupplierPageParam | any) => {
    return await request.get({ url: '/supply-chain/suppliers', params })
  },

  /** 获取供应商名称列表（供下拉选择，view=simple） */
  getSupplierNameList: async () => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.getSupplierNameList()
    const data = await request.get({
      url: '/supply-chain/suppliers',
      params: { view: 'simple' }
    })
    const list = Array.isArray(data) ? data : data?.list || []
    return list.map((item: { supplierCode?: string; supplierName?: string }) => ({
      value: item.supplierName || '',
      label: item.supplierName || '',
      code: item.supplierCode
    }))
  },

  /** 供应商详情（身份用 supplierCode） */
  getSupplier: async (supplierCode: string) => {
    if (USE_SUPPLIER_MOCK) {
      // mock 仍按 id 兼容；真实接口使用 supplierCode
      const numericId = Number(supplierCode)
      if (!Number.isNaN(numericId) && String(numericId) === String(supplierCode)) {
        return SupplierMockApi.getSupplier(numericId)
      }
    }
    return await request.get({ url: `/supply-chain/suppliers/${supplierCode}` })
  },

  /** 新增供应商（含期初） */
  createSupplier: async (data: SupplierSaveReqVO) => {
    return await request.post({ url: '/supply-chain/suppliers', data })
  },

  /** 编辑供应商档案 */
  updateSupplier: async (supplierCode: string, data: SupplierSaveReqVO) => {
    return await request.put({ url: `/supply-chain/suppliers/${supplierCode}`, data })
  },

  deleteSupplier: async (id: number) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.deleteSupplier(id)
    return await request.delete({ url: '/scm/supplier/delete?id=' + id })
  },

  /** 变更合作状态：PUT /suppliers/{supplierCode}/status */
  updateSupplierStatus: async (supplierCode: string, targetStatus: string) => {
    const data: ChangeStatusReqVO = { targetStatus }
    return await request.put({
      url: `/supply-chain/suppliers/${supplierCode}/status`,
      data
    })
  },

  /** 批量暂停或恢复：PUT /suppliers/status/batch（status 仅 ACTIVE / SUSPENDED） */
  batchUpdateSupplierStatus: async (supplierCodes: string[], status: string) => {
    return await request.put({
      url: '/supply-chain/suppliers/status/batch',
      data: { supplierCodes, status }
    })
  },

  exportSupplier: async (params: any) => {
    return await request.download({ url: '/scm/supplier/export-excel', params })
  },

  getInvoice: async (supplierId: number) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.getInvoice(supplierId)
    return await request.get({ url: '/scm/supplier/invoice/get?supplierId=' + supplierId })
  },

  saveInvoice: async (data: SupplierInvoiceVO) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.saveInvoice(data)
    return await request.post({ url: '/scm/supplier/invoice/save', data })
  },

  /** 查询供货配置：GET /suppliers/{supplierCode}/supply-scopes */
  getSupplyScopes: async (supplierCode: string) => {
    return await request.get<SupplierSupplyScopeDO[]>({
      url: `/supply-chain/suppliers/${supplierCode}/supply-scopes`
    })
  },

  getSupplyConfigList: async (supplierId: number) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.getSupplyConfigList(supplierId)
    return await request.get({ url: '/scm/supplier/supply-config/list?supplierId=' + supplierId })
  },

  /** 保存供货配置：PUT /suppliers/{supplierCode}/supply-scopes（全量替换） */
  saveSupplyScopes: async (supplierCode: string, data: SaveScopesReqVO) => {
    return await request.put<boolean>({
      url: `/supply-chain/suppliers/${supplierCode}/supply-scopes`,
      data
    })
  },

  saveSupplyConfigs: async (supplierId: number, configs: SupplierSupplyConfigVO[]) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.saveSupplyConfigs(supplierId, configs)
    return await request.post({
      url: '/scm/supplier/supply-config/save',
      data: { supplierId, configs }
    })
  },

  /** 合作商品列表：GET /suppliers/{supplierCode}/offers */
  getOfferPage: async (supplierCode: string, params?: OfferPageParam) => {
    return await request.get<{ list: OfferListItem[]; total: number }>({
      url: `/supply-chain/suppliers/${supplierCode}/offers`,
      params
    })
  },

  /** 批量新增合作商品：POST /suppliers/{supplierCode}/offers */
  createOffers: async (supplierCode: string, data: OfferItemsReqVO) => {
    return await request.post<string[]>({
      url: `/supply-chain/suppliers/${supplierCode}/offers`,
      data
    })
  },

  /** 编辑合作商品：PUT /suppliers/{supplierCode}/offers/{offerNo} */
  updateOffer: async (supplierCode: string, offerNo: string, data: DraftReqVO) => {
    return await request.put<boolean>({
      url: `/supply-chain/suppliers/${supplierCode}/offers/${offerNo}`,
      data
    })
  },

  /** 移除合作商品：DELETE /suppliers/{supplierCode}/offers/{offerNo} */
  deleteOffer: async (supplierCode: string, offerNo: string) => {
    return await request.delete<boolean>({
      url: `/supply-chain/suppliers/${supplierCode}/offers/${offerNo}`
    })
  },

  /** 上架或下架：PATCH /suppliers/{supplierCode}/offers/{offerNo} */
  patchOffer: async (supplierCode: string, offerNo: string, data: PatchOfferReqVO) => {
    return await request.patch<boolean>({
      url: `/supply-chain/suppliers/${supplierCode}/offers/${offerNo}`,
      data
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

  updateProduct: async (data: SupplierProductVO) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.updateProduct(data)
    return await request.put({ url: '/scm/supplier/product/update', data })
  },

  getPlatformSkuPage: async (params: any) => {
    if (USE_SUPPLIER_MOCK) return SupplierMockApi.getPlatformSkuPage(params)
    return await request.get({ url: '/scm/supplier/platform-sku/page', params })
  }
}
