import request from '@/config/axios'
import { DistributorMockApi, ProjectMockApi } from './mock'

export type {
  BatchStatusReqVO,
  BuyerDetail,
  BuyerInvoiceView,
  BuyerSaveReqVO,
  DistributorContactVO,
  DistributorInvoiceVO,
  DistributorProjectVO,
  DistributorProductVO,
  DistributorVO,
  DistributorPageParam,
  DistPlatformSkuVO,
  InvoiceSaveReqVO,
  BuyerProductListItem,
  BuyerProductPageParam,
  PatchBuyerProductReqVO,
  NamedRef,
  ProjectVO,
  ProjectPageParam,
  ProjectProductVO
} from './types'

import type {
  BatchStatusReqVO,
  BuyerDetail,
  BuyerInvoiceView,
  BuyerSaveReqVO,
  DistributorPageParam,
  DistributorProductVO,
  InvoiceSaveReqVO,
  BuyerProductListItem,
  BuyerProductPageParam,
  PatchBuyerProductReqVO,
  ProjectPageParam,
  ProjectProductVO,
  ProjectVO
} from './types'

/** 关联项目、分销层级、新增商品、项目选品等尚未接真实接口时使用 */
export const USE_DISTRIBUTOR_MOCK = true
/** 项目管理尚未接真实接口 */
export const USE_PROJECT_MOCK = true

export const DistributorApi = {
  /** 分页查询分销商：GET /supply-chain/buyers */
  getDistributorPage: async (params: DistributorPageParam | any) => {
    return await request.get({ url: '/supply-chain/buyers', params })
  },

  /** 获取分销商名称列表（供下拉选择，view=simple） */
  getDistributorNameList: async () => {
    const data = await request.get({
      url: '/supply-chain/buyers',
      params: { view: 'simple' }
    })
    const list = Array.isArray(data) ? data : data?.list || []
    return list.map((item: { buyerCode?: string; buyerName?: string }) => ({
      value: item.buyerName || '',
      label: item.buyerName || '',
      code: item.buyerCode
    }))
  },

  getDistributorCodeList: async () => {
    const data = await request.get({
      url: '/supply-chain/buyers',
      params: { view: 'simple' }
    })
    const list = Array.isArray(data) ? data : data?.list || []
    return list
      .map((item: { buyerCode?: string; buyerName?: string }) => ({
        value: item.buyerCode || '',
        label: item.buyerCode || '',
        name: item.buyerName
      }))
      .filter((item) => item.value)
  },

  /** 上级下拉：GET /buyers?view=parent-options */
  getParentOptions: async (params?: { excludeBuyerCode?: string; forLevel?: number }) => {
    const data = await request.get({
      url: '/supply-chain/buyers',
      params: {
        view: 'parent-options',
        excludeBuyerCode: params?.excludeBuyerCode,
        forLevel: params?.forLevel
      }
    })
    const list = Array.isArray(data) ? data : data?.list || []
    return list.map(
      (item: {
        buyerCode?: string
        buyerName?: string
        code?: string
        name?: string
        distributionLevel?: number
        level?: number
      }) => ({
        buyerCode: item.buyerCode || item.code || '',
        buyerName: item.buyerName || item.name || '',
        distributionLevel: item.distributionLevel ?? item.level
      })
    )
  },

  /** 分销商详情：GET /supply-chain/buyers/{buyerCode}，身份用 buyerCode */
  getDistributor: async (buyerCode: string) => {
    return await request.get<BuyerDetail>({ url: `/supply-chain/buyers/${buyerCode}` })
  },

  /** 新增分销商（含期初）：POST /supply-chain/buyers，返回 buyerCode */
  createDistributor: async (data: BuyerSaveReqVO) => {
    return await request.post<string>({ url: '/supply-chain/buyers', data })
  },

  /** 编辑分销商档案：PUT /supply-chain/buyers/{buyerCode}，勿传 openingBalanceCents */
  updateDistributor: async (buyerCode: string, data: BuyerSaveReqVO) => {
    return await request.put<boolean>({ url: `/supply-chain/buyers/${buyerCode}`, data })
  },

  /** 变更合作状态：PATCH /supply-chain/buyers；单条也走该接口，supplierCodes 只传一个 buyerCode */
  batchUpdateDistributorStatus: async (supplierCodes: string[], status: string) => {
    const data: BatchStatusReqVO = { supplierCodes, status }
    return await request.patch<boolean>({ url: '/supply-chain/buyers', data })
  },

  /** 查询开票信息：GET /buyers/{buyerCode}/invoice
   *  无开票行时后端用档案预填返回且不落库；已保存行明文回传。不回写档案。
   */
  getInvoice: async (buyerCode: string) => {
    return await request.get<BuyerInvoiceView>({
      url: `/supply-chain/buyers/${buyerCode}/invoice`
    })
  },

  /** 保存开票信息：PUT /buyers/{buyerCode}/invoice（upsert，开户账号明文存储） */
  saveInvoice: async (buyerCode: string, data: InvoiceSaveReqVO) => {
    return await request.put<BuyerInvoiceView>({
      url: `/supply-chain/buyers/${buyerCode}/invoice`,
      data
    })
  },

  getProjectList: async (distributorId: number) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.getProjectList(distributorId)
    return await request.get({
      url: '/scm/distributor/project/list?distributorId=' + distributorId
    })
  },

  /** 分页查询分销商品：GET /buyers/{buyerCode}/products，只返回未移除行，金额单位 CNY 分 */
  getBuyerProductPage: async (buyerCode: string, params?: BuyerProductPageParam) => {
    return await request.get<{ list: BuyerProductListItem[]; total: number }>({
      url: `/supply-chain/buyers/${buyerCode}/products`,
      params
    })
  },

  /** 逻辑移除分销商品：DELETE /buyers/{buyerCode}/products/{buyerProductCode} */
  deleteBuyerProduct: async (buyerCode: string, buyerProductCode: string) => {
    return await request.delete<boolean>({
      url: `/supply-chain/buyers/${buyerCode}/products/${buyerProductCode}`
    })
  },

  /** 改分销商品 L2 覆盖：PATCH /buyers/{buyerCode}/products/{buyerProductCode} */
  patchBuyerProduct: async (
    buyerCode: string,
    buyerProductCode: string,
    data: PatchBuyerProductReqVO
  ) => {
    return await request.patch<boolean>({
      url: `/supply-chain/buyers/${buyerCode}/products/${buyerProductCode}`,
      data
    })
  },

  /** 项目选品等仍走 mock 的分销商品分页（按 distributorId） */
  getProductPage: async (params: any) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.getProductPage(params)
    return await request.get({ url: '/scm/distributor/product/page', params })
  },

  deleteProduct: async (id: number) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.deleteProduct(id)
    return await request.delete({ url: '/scm/distributor/product/delete?id=' + id })
  },

  createProducts: async (distributorId: number, products: DistributorProductVO[]) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.createProducts(distributorId, products)
    return await request.post({
      url: '/scm/distributor/product/create-batch',
      data: { distributorId, products }
    })
  },

  getChildren: async (distributorId: number) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.getChildren(distributorId)
    return await request.get({
      url: '/scm/distributor/children?distributorId=' + distributorId
    })
  },

  getPlatformSkuPage: async (params: any) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.getPlatformSkuPage(params)
    return await request.get({ url: '/scm/distributor/platform-sku/page', params })
  }
}

export const ProjectApi = {
  getProjectPage: async (params: ProjectPageParam | any) => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.getProjectPage(params)
    return await request.get({ url: '/scm/project/page', params })
  },

  getProjectNameList: async () => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.getProjectNameList()
    return await request.get({ url: '/scm/project/simple-list' })
  },

  getProjectCodeList: async () => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.getProjectCodeList()
    return await request.get({ url: '/scm/project/code-list' })
  },

  getProject: async (id: number) => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.getProject(id)
    return await request.get({ url: '/scm/project/get?id=' + id })
  },

  createProject: async (data: ProjectVO) => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.createProject(data)
    return await request.post({ url: '/scm/project/create', data })
  },

  updateProject: async (data: ProjectVO) => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.updateProject(data)
    return await request.put({ url: '/scm/project/update', data })
  },

  updateProjectStatus: async (id: number, status: number) => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.updateProjectStatus(id, status)
    return await request.put({ url: '/scm/project/update-status', data: { id, status } })
  },

  getProductPage: async (params: any) => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.getProductPage(params)
    return await request.get({ url: '/scm/project/product/page', params })
  },

  deleteProduct: async (id: number) => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.deleteProduct(id)
    return await request.delete({ url: '/scm/project/product/delete?id=' + id })
  },

  createProducts: async (projectId: number, products: ProjectProductVO[]) => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.createProducts(projectId, products)
    return await request.post({
      url: '/scm/project/product/create-batch',
      data: { projectId, products }
    })
  }
}
