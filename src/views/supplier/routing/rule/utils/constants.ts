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

export const PRODUCT_TYPE_OPTIONS = [
  { code: 'VIRTUAL_CARD', name: '虚拟卡密' },
  { code: 'VIRTUAL_RECHARGE', name: '虚拟直充' },
  { code: 'DINING', name: '点餐' },
  { code: 'MOVIE', name: '电影' },
  { code: 'JD', name: '京东' },
  { code: 'RT_MART', name: '大润发' },
  { code: 'TB_FLASH', name: '淘宝闪购' }
]

export const MOCK_DISTRIBUTORS = [
  { code: '18-001', name: '华东福利分销中心' },
  { code: '18-002', name: '苏州企业购分销商' },
  { code: '18-003', name: '华南积分商城' }
]

export const MOCK_PROJECTS = [
  { code: 'PRJ_20260701001', name: '华东企业年节福利包' },
  { code: 'PRJ_20260720002', name: '沪上互联网员工权益' },
  { code: 'PRJ_20260801003', name: '暑期电影通兑专项' },
  { code: 'PRJ_20260716001', name: '苏州园区午餐补贴' }
]

export const MOCK_SUPPLIERS = [
  { code: 'SUP-001', name: '腾讯会员供应商' },
  { code: 'SUP-002', name: '猫眼票务' },
  { code: 'SUP-003', name: '百胜餐饮' },
  { code: 'SUP-004', name: '京东慧采' },
  { code: 'SUP-005', name: '盒马鲜生' }
]

export const MOCK_UPDATERS = ['张运营', '李调度', '王配置']

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
