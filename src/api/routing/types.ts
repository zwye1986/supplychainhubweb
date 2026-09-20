export type RouteMode = 'AUTO' | 'FIXED'
export type ScopeMode = 'ALL' | 'SPECIFIED'
export type RouteStrategy = 'STABLE' | 'PRICE' | 'COMPOSITE'
export type RouteRuleStatus = 'ENABLED' | 'DISABLED'

export interface RoutePriorityVO {
  id: string
  strategy: RouteStrategy
}

export interface RouteWeightVO {
  stability: number
  price: number
  timeliness: number
}

export interface RouteRuleVO {
  ruleCode: string
  name: string
  protectedRule?: boolean
  distributorMode: ScopeMode
  distributorCodes?: string[]
  distributorNames?: string[]
  projectMode: ScopeMode
  projectCodes?: string[]
  projectNames?: string[]
  productTypeMode: ScopeMode
  productTypeCodes?: string[]
  productTypeNames?: string[]
  routeMode: RouteMode
  supplierMode: ScopeMode
  supplierCodes?: string[]
  supplierNames?: string[]
  primarySupplierCode?: string
  primarySupplierName?: string
  priorities: RoutePriorityVO[]
  weights: RouteWeightVO
  status: RouteRuleStatus
  updater?: string
  updateTime?: string
}

export interface RouteRulePageParam {
  pageNo?: number
  pageSize?: number
  name?: string
  distributorCodes?: string[]
  projectCodes?: string[]
  productTypeCodes?: string[]
  supplierCodes?: string[]
  status?: RouteRuleStatus
  updaters?: string[]
  updateFrom?: string
  updateTo?: string
}
