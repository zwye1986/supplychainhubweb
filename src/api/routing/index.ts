import request from '@/config/axios'
import qs from 'qs'
import type { RouteRulePageParam, RouteRuleStatus, RouteRuleVO } from './types'

export type {
  RouteMode,
  RoutePriorityVO,
  RouteRulePageParam,
  RouteRuleStatus,
  RouteRuleVO,
  RouteStrategy,
  RouteWeightVO,
  ScopeMode
} from './types'

const compactList = (list?: string[]) => {
  const values = (list || []).map((item) => String(item || '').trim()).filter(Boolean)
  return values.length ? values : undefined
}

const buildPageQuery = (params: RouteRulePageParam) => {
  const query: Record<string, unknown> = {
    pageNo: params.pageNo || 1,
    pageSize: params.pageSize || 10
  }
  if (params.name?.trim()) query.name = params.name.trim()
  const distributorCodes = compactList(params.distributorCodes)
  if (distributorCodes) query.distributorCodes = distributorCodes
  const projectCodes = compactList(params.projectCodes)
  if (projectCodes) query.projectCodes = projectCodes
  const productTypeCodes = compactList(params.productTypeCodes)
  if (productTypeCodes) query.productTypeCodes = productTypeCodes
  const supplierCodes = compactList(params.supplierCodes)
  if (supplierCodes) query.supplierCodes = supplierCodes
  if (params.status) query.status = params.status
  const updaters = compactList(params.updaters)
  if (updaters) query.updaters = updaters
  if (params.updateFrom) query.updateFrom = params.updateFrom
  if (params.updateTo) query.updateTo = params.updateTo
  return query
}

const serializeQuery = (query: Record<string, unknown>) =>
  qs.stringify(query, { arrayFormat: 'repeat', skipNulls: true, allowDots: true })

/** 保存时只提交接口字段，名称类回显字段由服务端返回 */
const toSaveBody = (data: RouteRuleVO) => ({
  name: data.name?.trim(),
  distributorMode: data.distributorMode,
  distributorCodes: data.distributorCodes || [],
  projectMode: data.projectMode,
  projectCodes: data.projectCodes || [],
  productTypeMode: data.productTypeMode,
  productTypeCodes: data.productTypeCodes || [],
  routeMode: data.routeMode,
  supplierMode: data.supplierMode,
  supplierCodes:
    data.routeMode === 'FIXED'
      ? data.primarySupplierCode
        ? [data.primarySupplierCode]
        : []
      : data.supplierMode === 'SPECIFIED'
        ? data.supplierCodes || []
        : [],
  primarySupplierCode: data.routeMode === 'FIXED' ? data.primarySupplierCode : undefined,
  status: data.status,
  ruleCode: data.ruleCode || undefined,
  priorities: (data.priorities || []).map((item, index) => ({
    id: `p${index + 1}`,
    strategy: item.strategy
  })),
  weights: data.weights
})

export const RoutingApi = {
  /** 分页查询当前生效的标准商品路由规则 */
  getPage: async (params: RouteRulePageParam) => {
    return await request.get<{ list: RouteRuleVO[]; total: number }>({
      url: '/supply-chain/routing-rules',
      params: buildPageQuery(params),
      paramsSerializer: serializeQuery
    })
  },
  /** 查询当前生效版本内的一条规则 */
  get: async (ruleCode: string) => {
    return await request.get<RouteRuleVO>({
      url: `/supply-chain/routing-rules/${encodeURIComponent(ruleCode)}`
    })
  },
  /** 新增路由规则，忽略 body.ruleCode */
  create: async (data: RouteRuleVO) => {
    return await request.post<RouteRuleVO>({
      url: '/supply-chain/routing-rules',
      data: toSaveBody(data)
    })
  },
  /** 编辑路由规则，ruleCode 须与路径一致 */
  update: async (ruleCode: string, data: RouteRuleVO) => {
    return await request.put<RouteRuleVO>({
      url: `/supply-chain/routing-rules/${encodeURIComponent(ruleCode)}`,
      data: { ...toSaveBody(data), ruleCode }
    })
  },
  /** 删除路由规则并立即补丁发布 */
  delete: async (ruleCode: string) => {
    return await request.delete<boolean>({
      url: `/supply-chain/routing-rules/${encodeURIComponent(ruleCode)}`
    })
  },
  /** 启停路由规则：ENABLED 启用 / DISABLED 停用 */
  changeStatus: async (ruleCode: string, status: RouteRuleStatus) => {
    return await request.put<RouteRuleVO>({
      url: `/supply-chain/routing-rules/${encodeURIComponent(ruleCode)}/status`,
      data: { status }
    })
  }
}
