import request from '@/config/axios'
import { DistributorMockApi } from './mock'

export type {
  AddProjectProductsReqVO,
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
  PatchProjectListingReqVO,
  ProjectDetail,
  ProjectListingListItem,
  ProjectPageParam,
  ProjectProductItemReqVO,
  ProjectProductVO,
  ProjectSaveReqVO,
  ProjectVO
} from './types'

import type {
  AddProjectProductsReqVO,
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
  PatchProjectListingReqVO,
  ProjectDetail,
  ProjectListingListItem,
  ProjectPageParam,
  ProjectSaveReqVO
} from './types'

/** 关联项目、分销层级、新增商品、项目选品等尚未接真实接口时使用 */
export const USE_DISTRIBUTOR_MOCK = true

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

  /** 分销商关联项目：GET /projects?buyerCode=，不要走 GET /buyers/{code}/projects */
  getProjectList: async (buyerCode: string) => {
    const data = await request.get<{ list?: ProjectDetail[]; total?: number } | ProjectDetail[]>({
      url: '/supply-chain/projects',
      params: { buyerCode, pageNo: 1, pageSize: 100 }
    })
    return Array.isArray(data) ? data : data?.list || []
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

const compactProjectPageParams = (params: ProjectPageParam | Record<string, any> = {}) => {
  const query: Record<string, any> = {
    pageNo: params.pageNo,
    pageSize: params.pageSize
  }
  if (params.projectName) query.projectName = params.projectName
  if (params.projectCode) query.projectCode = params.projectCode
  if (params.buyerCode) query.buyerCode = params.buyerCode
  if (Array.isArray(params.status) && params.status.length) query.status = params.status
  if (Array.isArray(params.projectType) && params.projectType.length) {
    query.projectType = params.projectType
  }
  if (params.periodFrom) query.periodFrom = params.periodFrom
  if (params.periodTo) query.periodTo = params.periodTo
  if (params.view) query.view = params.view
  return query
}

const mapProjectSimpleList = (data: any) => {
  const list = Array.isArray(data) ? data : data?.list || []
  return list.map((item: { projectCode?: string; projectName?: string }) => ({
    projectCode: item.projectCode || '',
    projectName: item.projectName || ''
  }))
}

export const ProjectApi = {
  /** 分页查询项目：GET /supply-chain/projects */
  getProjectPage: async (params: ProjectPageParam | any) => {
    return await request.get<{ list: ProjectDetail[]; total: number }>({
      url: '/supply-chain/projects',
      params: compactProjectPageParams(params)
    })
  },

  /** 项目名称下拉：GET /projects?view=simple，返回 {projectCode,projectName}[] */
  getProjectNameList: async () => {
    const data = await request.get({
      url: '/supply-chain/projects',
      params: { view: 'simple' }
    })
    return mapProjectSimpleList(data)
      .filter((item) => item.projectName)
      .map((item) => ({
        value: item.projectName,
        label: item.projectName,
        code: item.projectCode
      }))
  },

  /** 项目编号下拉：GET /projects?view=simple */
  getProjectCodeList: async () => {
    const data = await request.get({
      url: '/supply-chain/projects',
      params: { view: 'simple' }
    })
    return mapProjectSimpleList(data)
      .filter((item) => item.projectCode)
      .map((item) => ({
        value: item.projectCode,
        label: item.projectCode,
        name: item.projectName
      }))
  },

  /** 项目详情：GET /projects/{projectCode}，身份用 projectCode */
  getProject: async (projectCode: string) => {
    return await request.get<ProjectDetail>({
      url: `/supply-chain/projects/${projectCode}`
    })
  },

  /** 新增项目：POST /projects，系统生成 PRJ_ 编码，返回 projectCode */
  createProject: async (data: ProjectSaveReqVO) => {
    return await request.post<string>({ url: '/supply-chain/projects', data })
  },

  /** 编辑项目：文档未单独列出更新接口，创建后如需改档案按 buyers 同构 PUT /projects/{projectCode} */
  updateProject: async (projectCode: string, data: ProjectSaveReqVO) => {
    return await request.put<boolean>({ url: `/supply-chain/projects/${projectCode}`, data })
  },

  /** 分页查询项目商品：GET /projects/{projectCode}/products，只返回未移除行，金额单位 CNY 分 */
  getProductPage: async (projectCode: string, params?: { pageNo?: number; pageSize?: number }) => {
    return await request.get<{ list: ProjectListingListItem[]; total: number }>({
      url: `/supply-chain/projects/${projectCode}/products`,
      params
    })
  },

  /** 从分销商品发布到项目目录：POST /projects/{projectCode}/products */
  createProducts: async (projectCode: string, data: AddProjectProductsReqVO) => {
    return await request.post<string[]>({
      url: `/supply-chain/projects/${projectCode}/products`,
      data
    })
  },

  /** 逻辑移除项目商品：DELETE /projects/{projectCode}/products/{listingCode} */
  deleteProduct: async (projectCode: string, listingCode: string) => {
    return await request.delete<boolean>({
      url: `/supply-chain/projects/${projectCode}/products/${listingCode}`
    })
  },

  /** 详情改项目商品 L3 覆盖：PATCH /projects/{projectCode}/products/{listingCode} */
  patchProduct: async (
    projectCode: string,
    listingCode: string,
    data: PatchProjectListingReqVO
  ) => {
    return await request.patch<boolean>({
      url: `/supply-chain/projects/${projectCode}/products/${listingCode}`,
      data
    })
  }
}
