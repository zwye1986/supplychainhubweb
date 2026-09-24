import type { RouteStrategy } from '@/api/routing/types'

export const ROUTE_MODE_OPTIONS = [
  { value: 'AUTO', label: '自动路由' },
  { value: 'FIXED', label: '固定供应商' }
]

export const SCOPE_MODE_OPTIONS = [
  { value: 'ALL', label: '全部' },
  { value: 'SPECIFIED', label: '指定' }
]

export const ROUTE_STRATEGY_OPTIONS: { value: RouteStrategy; label: string; hint: string }[] = [
  { value: 'STABLE', label: '稳定优先', hint: '稳定性评分越高，越优先分配' },
  { value: 'PRICE', label: '价格优先', hint: '供货价越低，越优先分配' },
  { value: 'COMPOSITE', label: '综合排序', hint: '按权重综合计算最优供应商' }
]

export const ROUTE_STATUS_OPTIONS = [
  { value: 'ENABLED', label: '启用', type: 'success' },
  { value: 'DISABLED', label: '停用', type: 'info' }
]

export const createPriorities = () => [
  { id: 'p1', strategy: 'STABLE' as RouteStrategy },
  { id: 'p2', strategy: 'PRICE' as RouteStrategy },
  { id: 'p3', strategy: 'COMPOSITE' as RouteStrategy }
]

export const createWeights = () => ({ stability: 40, price: 30, timeliness: 30 })

export const formatScope = (mode?: string, names?: string[], allText = '全部') => {
  if (mode !== 'SPECIFIED') return allText
  return names?.length ? names.join('、') : allText
}

export const getStrategyLabel = (value?: RouteStrategy) =>
  ROUTE_STRATEGY_OPTIONS.find((item) => item.value === value)?.label || '-'

export const getStrategyHint = (value?: RouteStrategy) =>
  ROUTE_STRATEGY_OPTIONS.find((item) => item.value === value)?.hint || ''

export const getOptionLabel = <T extends { value: any; label: string }>(options: T[], value?: any) =>
  options.find((item) => item.value === value)?.label || '-'

export const getOptionType = <T extends { value: any; type?: string }>(options: T[], value?: any) =>
  (options.find((item) => item.value === value)?.type || 'info') as any
