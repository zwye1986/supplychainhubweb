import request from '@/config/axios'
import qs from 'qs'
import { DistributorMockApi } from './mock'

export type {
  AcceptanceCatalogRecalculateRespVO,
  AddBuyerProductsReqVO,
  BuyerSelectionCatalogSaveRespVO,
  AddProjectProductsReqVO,
  BatchStatusReqVO,
  BuyerChildItem,
  BuyerDetail,
  BuyerInvoiceView,
  BuyerListItem,
  BuyerProductBatchPricingReqVO,
  BuyerProductCreatePricingReqVO,
  BuyerProductItemReqVO,
  BuyerSaveReqVO,
  DistributorContactVO,
  DistributorInvoiceVO,
  DistributorProjectVO,
  DistributorProductVO,
  DistributorVO,
  DistributorPageParam,
  DistPlatformSkuVO,
  DistFormulaRuleReqVO,
  InvoiceSaveReqVO,
  BuyerProductListItem,
  BuyerProductPageParam,
  PatchBuyerProductReqVO,
  NamedRef,
  ProductTypeRef,
  PatchProjectListingReqVO,
  ProjectDetail,
  ProjectApplicationCredentials,
  ProjectCapability,
  ProjectIssuedCredential,
  ProjectFormulaRuleView,
  ProjectListingListItem,
  ProjectPricingConfigView,
  ProjectPageParam,
  ProjectProductBatchPricingReqVO,
  ProjectProductItemReqVO,
  ProjectProductVO,
  ProjectSaveReqVO,
  ProjectVO
} from './types'

export { toProductTypeCodes, toProductTypeItems } from './types'

import type {
  AcceptanceCatalogRecalculateRespVO,
  AddBuyerProductsReqVO,
  BuyerSelectionCatalogSaveRespVO,
  AddProjectProductsReqVO,
  BatchStatusReqVO,
  BuyerChildItem,
  BuyerDetail,
  BuyerInvoiceView,
  BuyerListItem,
  BuyerProductBatchPricingReqVO,
  BuyerSaveReqVO,
  DistributorPageParam,
  DistributorProductVO,
  InvoiceSaveReqVO,
  BuyerProductListItem,
  BuyerProductPageParam,
  PatchBuyerProductReqVO,
  PatchProjectListingReqVO,
  ProjectDetail,
  ProjectApplicationCredentials,
  ProjectCapability,
  ProjectIssuedCredential,
  ProjectListingListItem,
  ProjectPageParam,
  ProjectProductBatchPricingReqVO,
  ProjectSaveReqVO
} from './types'

/** 关联项目、分销层级、新增商品、项目选品等尚未接真实接口时使用 */
export const USE_DISTRIBUTOR_MOCK = true

const compactArray = <T>(values?: T[] | null) =>
  values?.length
    ? values.filter((item) => item !== undefined && item !== null && item !== '')
    : undefined

const serializeBuyerQuery = (query: Record<string, unknown>) =>
  qs.stringify(query, { arrayFormat: 'repeat', skipNulls: true, allowDots: true })

const buildBuyerPageParams = (params: DistributorPageParam = {}) => {
  const distributionLevels = compactArray(params.distributionLevels)
    ?.map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0)
  const query: Record<string, unknown> = {}
  if (params.view) {
    query.view = params.view
  } else {
    query.pageNo = params.pageNo || 1
    query.pageSize = params.pageSize || 20
  }
  if (params.buyerName?.trim()) query.buyerName = params.buyerName.trim()
  if (params.buyerCode?.trim()) query.buyerCode = params.buyerCode.trim()
  if (distributionLevels?.length) query.distributionLevels = distributionLevels
  if (compactArray(params.cooperationModes))
    query.cooperationModes = compactArray(params.cooperationModes)
  if (compactArray(params.sellableCategories)) {
    query.sellableCategories = compactArray(params.sellableCategories)
  }
  if (compactArray(params.status)) query.status = compactArray(params.status)
  if (params.updatedFrom) query.updatedFrom = params.updatedFrom
  if (params.updatedTo) query.updatedTo = params.updatedTo
  if (params.excludeBuyerCode) query.excludeBuyerCode = params.excludeBuyerCode
  const forLevel = params.forLevel != null ? Number(params.forLevel) : undefined
  if (forLevel != null && Number.isInteger(forLevel) && forLevel > 0) query.forLevel = forLevel
  return query
}

export const DistributorApi = {
  /** 分页查询分销商：GET /supply-chain/buyers。默认按组织树返回，根列表只有一级，children 嵌套二/三级；pageNo/pageSize/total 只计一级 */
  getDistributorPage: async (params: DistributorPageParam) => {
    return await request.get<{ list: BuyerListItem[]; total: number }>({
      url: '/supply-chain/buyers',
      params: buildBuyerPageParams(params),
      paramsSerializer: serializeBuyerQuery
    })
  },

  /** 获取分销商名称列表（供下拉选择，view=simple） */
  getDistributorNameList: async (params?: Pick<DistributorPageParam, 'status'>) => {
    const data = await request.get({
      url: '/supply-chain/buyers',
      params: buildBuyerPageParams({ view: 'simple', status: params?.status }),
      paramsSerializer: serializeBuyerQuery
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
  getParentOptions: async (params?: { excludeBuyerCode?: string; forLevel?: number | string }) => {
    const data = await request.get({
      url: '/supply-chain/buyers',
      params: buildBuyerPageParams({
        view: 'parent-options',
        excludeBuyerCode: params?.excludeBuyerCode,
        forLevel: params?.forLevel != null ? Number(params.forLevel) : undefined
      }),
      paramsSerializer: serializeBuyerQuery
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

  /** 批量暂停或恢复：PATCH /supply-chain/buyers，status 仅 ACTIVE / SUSPENDED */
  batchUpdateDistributorStatus: async (buyerCodes: string[], status: string) => {
    const data: BatchStatusReqVO = { buyerCodes, status }
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
    const productType = compactArray(
      Array.isArray(params?.productType)
        ? params.productType
        : params?.productType
          ? [params.productType]
          : undefined
    )?.map(String)
    const query: Record<string, unknown> = {
      pageNo: params?.pageNo || 1,
      pageSize: params?.pageSize || 20
    }
    if (productType?.length) query.productType = productType
    if (params?.projectCode) query.projectCode = params.projectCode
    if (params?.keyword?.trim()) query.keyword = params.keyword.trim()
    if (params?.categoryCode?.trim()) query.categoryCode = params.categoryCode.trim()
    return await request.get<{ list: BuyerProductListItem[]; total: number }>({
      url: `/supply-chain/buyers/${buyerCode}/products`,
      params: query,
      paramsSerializer: serializeBuyerQuery
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

  /** 从标品关联分销商品：POST /buyers/{buyerCode}/products，返回 BPD_ 编号列表 */
  createBuyerProducts: async (buyerCode: string, data: AddBuyerProductsReqVO) => {
    return await request.post<BuyerSelectionCatalogSaveRespVO>({
      url: `/supply-chain/buyers/${buyerCode}/products`,
      data
    })
  },

  /**
   * 批量保存分销商通用定价：PUT /buyers/{buyerCode}/products/pricing
   * 仅更新路径分销商下选中商品的通用定价版本；单事务全量成功或回滚，税务仅用于结算展示。
   */
  saveBuyerProductPricing: async (buyerCode: string, data: BuyerProductBatchPricingReqVO) => {
    return await request.put<BuyerSelectionCatalogSaveRespVO>({
      url: `/supply-chain/buyers/${buyerCode}/products/pricing`,
      data
    })
  },

  /**
   * 同步重算受理目录：POST /buyers/{buyerCode}/products/{buyerProductCode}/acceptance-catalog/recalculate
   */
  recalculateAcceptanceCatalog: async (buyerCode: string, buyerProductCode: string) => {
    return await request.post<AcceptanceCatalogRecalculateRespVO>({
      url: `/supply-chain/buyers/${buyerCode}/products/${buyerProductCode}/acceptance-catalog/recalculate`
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

  /** 查询分销商全部下级：GET /buyers/{buyerCode}/children，直属+孙级扁平列表，排除归档，按创建时间倒序 */
  getBuyerChildren: async (buyerCode: string) => {
    const data = await request.get<BuyerChildItem[] | { list?: BuyerChildItem[] }>({
      url: `/supply-chain/buyers/${buyerCode}/children`
    })
    return Array.isArray(data) ? data : data?.list || []
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
  /** 接入能力独立于应用凭证，不因开通应用自动授予。 */
  getCapabilities: async (projectCode: string) => {
    return await request.get<ProjectCapability[]>({
      url: `/supply-chain/projects/${projectCode}/capabilities`
    })
  },

  enableStandardProduct: async (projectCode: string, expectedVersion: number | null) => {
    return await request.post<{ changed: boolean }>({
      url: `/supply-chain/projects/${projectCode}/capabilities/standard-product/enable`,
      data: { expectedVersion }
    })
  },

  disableStandardProduct: async (
    projectCode: string,
    expectedVersion: number | null,
    reason: string
  ) => {
    return await request.post<{ changed: boolean }>({
      url: `/supply-chain/projects/${projectCode}/capabilities/standard-product/disable`,
      data: { expectedVersion, confirmed: true, reason: reason.trim() }
    })
  },

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

  /** 开通项目应用；appKey 只在本次响应返回。 */
  enableApplication: async (projectCode: string) => {
    return await request.post<ProjectIssuedCredential>({
      url: `/supply-chain/projects/${projectCode}/application/enable`
    })
  },

  /** 轮换项目 appKey；新密钥只在本次响应返回。 */
  rotateApplication: async (projectCode: string) => {
    return await request.post<ProjectIssuedCredential>({
      url: `/supply-chain/projects/${projectCode}/application/rotate`
    })
  },

  /** 吊销项目全部活动凭证。 */
  revokeApplication: async (projectCode: string, reason: string) => {
    return await request.post<boolean>({
      url: `/supply-chain/projects/${projectCode}/application/revoke`,
      data: { confirmed: true, reason }
    })
  },

  /** 查询应用身份和脱敏版本记录。 */
  getApplicationCredentials: async (projectCode: string) => {
    return await request.get<ProjectApplicationCredentials>({
      url: `/supply-chain/projects/${projectCode}/application/credentials`
    })
  },

  /** 新增项目：POST /projects，系统生成 PRJ_ 编码，返回 projectCode */
  createProject: async (data: ProjectSaveReqVO) => {
    return await request.post<string>({ url: '/supply-chain/projects', data })
  },

  /** 编辑项目：PUT /projects/{projectCode}，可改状态；非草稿改 buyerCode 会拒绝 */
  updateProject: async (projectCode: string, data: ProjectSaveReqVO) => {
    return await request.put<boolean>({ url: `/supply-chain/projects/${projectCode}`, data })
  },

  /** 分页查询项目商品：GET /projects/{projectCode}/products，只返回未移除行，金额单位 CNY 分 */
  getProductPage: async (
    projectCode: string,
    params?: { pageNo?: number; pageSize?: number; productType?: string | string[] }
  ) => {
    const productType = compactArray(
      Array.isArray(params?.productType)
        ? params.productType
        : params?.productType
          ? [params.productType]
          : undefined
    )?.map(String)
    const query: Record<string, unknown> = {
      pageNo: params?.pageNo || 1,
      pageSize: params?.pageSize || 20
    }
    if (productType?.length) query.productType = productType
    return await request.get<{ list: ProjectListingListItem[]; total: number }>({
      url: `/supply-chain/projects/${projectCode}/products`,
      params: query,
      paramsSerializer: serializeBuyerQuery
    })
  },

  /** 从分销商品发布到项目目录：POST /projects/{projectCode}/products */
  createProducts: async (projectCode: string, data: AddProjectProductsReqVO) => {
    return await request.post<BuyerSelectionCatalogSaveRespVO>({
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

  /**
   * 批量保存项目综合定价：PUT /projects/{projectCode}/products/pricing
   * 单事务全量成功或回滚；未配置的分组传 inherited=true。
   */
  saveProductPricing: async (projectCode: string, data: ProjectProductBatchPricingReqVO) => {
    return await request.put<BuyerSelectionCatalogSaveRespVO>({
      url: `/supply-chain/projects/${projectCode}/products/pricing`,
      data
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
