import request from '@/config/axios'

export type {
  SupplierContactVO,
  SupplierSupplyConfigVO,
  SupplierInvoiceVO,
  InvoiceSaveReqVO,
  SupplierInvoiceView,
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
  InvoiceSaveReqVO,
  SupplierInvoiceView,
  SupplierPageParam,
  SupplierProductVO,
  SupplierSaveReqVO,
  SupplierSupplyConfigVO,
  SupplierSupplyScopeDO
} from './types'

export const SupplierApi = {
  getSupplierPage: async (params: SupplierPageParam | any) => {
    return await request.get({ url: '/supply-chain/suppliers', params })
  },

  /** 获取供应商名称列表（供下拉选择，view=simple，字段 id / supplierName） */
  getSupplierNameList: async (queryParams: any) => {
    return await request.get({
      url: '/supply-chain/suppliers',
      params: queryParams
    })
  },

  /** 供应商详情（身份用 supplierCode） */
  getSupplier: async (supplierCode: string) => {
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

  /** 查询开票信息：GET /suppliers/{supplierCode}/invoice
   *  无开票行时后端用档案预填返回且不落库；已保存行明文回传。不回写档案。
   */
  getInvoice: async (supplierCode: string) => {
    return await request.get<SupplierInvoiceView>({
      url: `/supply-chain/suppliers/${supplierCode}/invoice`
    })
  },

  /** 保存开票信息：PUT /suppliers/{supplierCode}/invoice（upsert，开户账号明文存储） */
  saveInvoice: async (supplierCode: string, data: InvoiceSaveReqVO) => {
    return await request.put<SupplierInvoiceView>({
      url: `/supply-chain/suppliers/${supplierCode}/invoice`,
      data
    })
  },

  /** 查询供货配置：GET /suppliers/{supplierCode}/supply-scopes */
  getSupplyScopes: async (supplierCode: string) => {
    return await request.get<SupplierSupplyScopeDO[]>({
      url: `/supply-chain/suppliers/${supplierCode}/supply-scopes`
    })
  },

  getSupplyConfigList: async (supplierId: number) => {
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
    return await request.get({ url: '/scm/supplier/product/page', params })
  },

  deleteProduct: async (id: number) => {
    return await request.delete({ url: '/scm/supplier/product/delete?id=' + id })
  },

  createProducts: async (supplierId: number, products: SupplierProductVO[]) => {
    return await request.post({
      url: '/scm/supplier/product/create-batch',
      data: { supplierId, products }
    })
  },

  updateProduct: async (data: SupplierProductVO) => {
    return await request.put({ url: '/scm/supplier/product/update', data })
  },

  getPlatformSkuPage: async (params: any) => {
    return await request.get({ url: '/scm/supplier/platform-sku/page', params })
  }
}
