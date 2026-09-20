import request from '@/config/axios'
import { RoutingMockApi } from './mock'
import type { RouteRulePageParam, RouteRuleVO } from './types'

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

export const USE_ROUTING_MOCK = true

export const RoutingApi = {
  getPage: async (params: RouteRulePageParam) => {
    if (USE_ROUTING_MOCK) return RoutingMockApi.getPage(params)
    return await request.get({ url: '/supply-chain/routing-rules', params })
  },
  get: async (ruleCode: string) => {
    if (USE_ROUTING_MOCK) return RoutingMockApi.get(ruleCode)
    return await request.get({ url: `/supply-chain/routing-rules/${ruleCode}` })
  },
  create: async (data: RouteRuleVO) => {
    if (USE_ROUTING_MOCK) return RoutingMockApi.create(data)
    return await request.post({ url: '/supply-chain/routing-rules', data })
  },
  update: async (ruleCode: string, data: RouteRuleVO) => {
    if (USE_ROUTING_MOCK) return RoutingMockApi.update(ruleCode, data)
    return await request.put({ url: `/supply-chain/routing-rules/${ruleCode}`, data })
  },
  delete: async (ruleCode: string) => {
    if (USE_ROUTING_MOCK) return RoutingMockApi.delete(ruleCode)
    return await request.delete({ url: `/supply-chain/routing-rules/${ruleCode}` })
  },
  changeStatus: async (ruleCode: string, status: RouteRuleVO['status']) => {
    if (USE_ROUTING_MOCK) return RoutingMockApi.changeStatus(ruleCode, status)
    return await request.put({ url: `/supply-chain/routing-rules/${ruleCode}/status`, data: { status } })
  }
}
