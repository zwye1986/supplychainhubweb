import type { ChannelMarkupVO, PricingTemplateVO, RegionMarkupVO } from '@/api/pricing/types'

export const MOVIE_KIND_OPTIONS = [
  { value: 'FAST', label: '快充模板' },
  { value: 'SLOW', label: '慢充模板' }
]

export const DINING_CHANNELS = [
  { code: 'KFC', name: '肯德基' },
  { code: 'MCD', name: '麦当劳' },
  { code: 'PH', name: '必胜客' },
  { code: 'NAIXUE', name: '奈雪的茶' },
  { code: 'LUCKIN', name: '瑞幸咖啡' },
  { code: 'STARBUCKS', name: '星巴克' },
  { code: 'COTTI', name: '库迪' }
]

export const H5_CHANNELS = [
  { code: 'TB_FLASH', name: '淘宝闪购' },
  { code: 'AMAP_TAXI', name: '高德打车' },
  { code: 'DIDI_TAXI', name: '滴滴打车' }
]

export const CITY_OPTIONS = [
  { value: '江苏-南京', label: '江苏省南京市' },
  { value: '江苏-苏州', label: '江苏省苏州市' },
  { value: '浙江-杭州', label: '浙江省杭州市' },
  { value: '四川-成都', label: '四川省成都市' },
  { value: '四川-宜宾', label: '四川省宜宾市' },
  { value: '上海-上海', label: '上海市' },
  { value: '北京-北京', label: '北京市' },
  { value: '广东-深圳', label: '广东省深圳市' }
]

export const TAX_RATE_OPTIONS = [
  { value: 6, label: '6%' },
  { value: 9, label: '9%' },
  { value: 13, label: '13%' },
  { value: 0, label: '不征税' }
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

export const formatFormula = (formula?: { base?: string; percent?: number; op?: string; amount?: number }) => {
  if (!formula) return '—'
  const baseMap: Record<string, string> = { MARKET: '市场价', SUGGEST: '销售建议价', SUPPLY: '供应价' }
  return `${baseMap[formula.base || 'MARKET'] || '市场价'}*${formula.percent ?? 0}%${formula.op || '+'}${formula.amount ?? 0}元`
}

export const formatServiceFee = (fee?: { percent?: number; op?: string; amount?: number }) => {
  if (!fee) return '订单金额*0%+0元'
  return `订单金额*${fee.percent ?? 0}%${fee.op || '+'}${fee.amount ?? 0}元`
}

export const formatMarkup = (row?: RegionMarkupVO) => {
  if (!row) return '—'
  if (row.mode === 'MARKET') return '使用市场价'
  return formatFormula(row.formula)
}

export const formatRegion = (row?: RegionMarkupVO) => {
  if (!row) return '—'
  if (!row.cities?.length || row.cities.includes('NATION')) return '全国'
  return (row.cityLabels || row.cities).join('、')
}

export const formatScope = (mode?: string, names?: string[], allText = '全部') => {
  if (mode !== 'SPECIFIED') return allText
  return names?.length ? names.join('、') : allText
}

export const createRegion = (national = false): RegionMarkupVO => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  cities: national ? ['NATION'] : [],
  cityLabels: national ? ['全国'] : [],
  mode: 'CUSTOM',
  formula: { base: 'MARKET', percent: 110, op: '+', amount: 0 },
  serviceFee: { percent: 0, op: '+', amount: 0 }
})

export const createChannel = (code: string, name: string): ChannelMarkupVO => ({
  channelCode: code,
  channelName: name,
  serviceFee: { percent: 0, op: '+', amount: 0 },
  national: createRegion(true),
  regions: [],
  hideThreshold: 2
})

export const createDistPrice = () => ({
  mode: 'SUGGEST' as const,
  formula: { base: 'SUGGEST', percent: 101, op: '+', amount: 0 },
  taxMode: 'TAX_INCLUDED' as const,
  taxRate: 6,
  hideThreshold: 3
})
