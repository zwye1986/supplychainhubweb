import { getDictLabel } from '@/utils/dict'
import { OfferStatusEnum } from '../manage/detail/utils/fulfillment'
export { OfferStatusEnum }

/** 合作商品供应价模式（接口 priceMode） */
export const OfferPriceModeEnum = {
  FIXED: 'FIXED',
  REALTIME: 'REALTIME',
  DISCOUNT: 'DISCOUNT'
} as const

export const OFFER_PRICE_MODE_OPTIONS = [
  { value: OfferPriceModeEnum.FIXED, label: '固定值' },
  { value: OfferPriceModeEnum.REALTIME, label: '实时更新' },
  { value: OfferPriceModeEnum.DISCOUNT, label: '按供货折扣' }
]

/** 合作商品上架状态 */
export const ProductShelfStatusEnum = {
  OFF: 0, // 下架
  ON: 1 // 上架
} as const

export const PRODUCT_SHELF_STATUS_OPTIONS = [
  { value: ProductShelfStatusEnum.ON, label: '上架', type: 'success' as const },
  { value: ProductShelfStatusEnum.OFF, label: '下架', type: 'info' as const }
]

/** 合作商品状态（接口 status） */
export const OFFER_STATUS_OPTIONS = [
  { value: OfferStatusEnum.PUBLISHED, label: '上架', type: 'success' as const },
  { value: OfferStatusEnum.SUSPENDED, label: '下架', type: 'info' as const }
]

/** 能力标签选项 */
export const SUPPLIER_CAPABILITY_OPTIONS = [
  { value: 'manufacturer', label: '生产型' },
  { value: 'trader', label: '贸易型' },
  { value: 'service', label: '服务型' },
  { value: 'distributor', label: '分销型' }
]

/** 配送区域类型（接口 deliveryRegionType） */
export const DeliveryAreaTypeEnum = {
  NATIONWIDE: 'NATIONWIDE',
  DESIGNATED: 'DESIGNATED'
} as const

export const DELIVERY_AREA_TYPE_OPTIONS = [
  { value: DeliveryAreaTypeEnum.NATIONWIDE, label: '全国' },
  { value: DeliveryAreaTypeEnum.DESIGNATED, label: '指定区域' }
]

/** 发货时效（接口 shippingSlaCode） */
export const ShippingTimelinessEnum = {
  SAME_DAY: 'SAME_DAY',
  NEXT_DAY: 'NEXT_DAY',
  HOURS_48: 'HOURS_48',
  HOURS_72: 'HOURS_72',
  CUSTOM: 'CUSTOM'
} as const

export const SHIPPING_TIMELINESS_OPTIONS = [
  { value: ShippingTimelinessEnum.SAME_DAY, label: '当日发' },
  { value: ShippingTimelinessEnum.NEXT_DAY, label: '次日发' },
  { value: ShippingTimelinessEnum.HOURS_48, label: '48小时发' },
  { value: ShippingTimelinessEnum.HOURS_72, label: '72小时发' },
  { value: ShippingTimelinessEnum.CUSTOM, label: '自定义' }
]

/** 结算方式选项（接口 settlementMethod） */
export const SUPPLIER_SETTLEMENT_OPTIONS = [
  { value: 'DAILY', label: '日结' },
  { value: 'WEEKLY', label: '周结' },
  { value: 'MONTHLY', label: '月结' },
  { value: 'QUARTERLY', label: '季结' },
  { value: 'PREPAID', label: '预付' }
]

/** 开票抬头类型（接口 titleType：ENTERPRISE / PERSONAL） */
export const InvoiceTitleTypeEnum = {
  ENTERPRISE: 'ENTERPRISE',
  PERSONAL: 'PERSONAL'
} as const

/** 开票抬头类型选项 */
export const INVOICE_TITLE_TYPE_OPTIONS = [
  { value: InvoiceTitleTypeEnum.ENTERPRISE, label: '企业' },
  { value: InvoiceTitleTypeEnum.PERSONAL, label: '个人' }
]

/** 对接方式选项（接口 integrationModes） */
export const SUPPLIER_INTEGRATION_OPTIONS = [
  { value: 'API', label: 'API直连' },
  { value: 'H5', label: 'H5直连' },
  { value: 'MANUAL', label: '人工对接' }
]

/** 获取能力标签文案 */
export const getCapabilityLabel = (tag: string): string => {
  return SUPPLIER_CAPABILITY_OPTIONS.find((item) => item.value === tag)?.label || tag
}

/** 获取配送区域类型文案 */
export const getDeliveryAreaTypeLabel = (value?: string): string => {
  return DELIVERY_AREA_TYPE_OPTIONS.find((item) => item.value === value)?.label || '-'
}

/** 获取发货时效文案 */
export const getShippingTimelinessLabel = (value?: string, customValue?: string): string => {
  if (value === ShippingTimelinessEnum.CUSTOM) {
    return customValue || '自定义'
  }
  return SHIPPING_TIMELINESS_OPTIONS.find((item) => item.value === value)?.label || '-'
}

/** 获取结算方式文案 */
export const getSettlementLabel = (value?: string | number): string => {
  return SUPPLIER_SETTLEMENT_OPTIONS.find((item) => item.value === value)?.label || '-'
}

/** 获取对接方式文案 */
export const getIntegrationLabel = (value: string): string => {
  return SUPPLIER_INTEGRATION_OPTIONS.find((item) => item.value === value)?.label || value
}

/** 获取合作商品供应价模式文案（接口 priceMode） */
export const getOfferPriceModeLabel = (value?: string): string => {
  return (
    getDictLabel('supply_chain_offer_price_mode', value) ||
    OFFER_PRICE_MODE_OPTIONS.find((item) => item.value === value)?.label ||
    value ||
    '-'
  )
}

/** 获取合作商品上架状态文案 */
export const getProductShelfStatusLabel = (status?: number): string => {
  return PRODUCT_SHELF_STATUS_OPTIONS.find((item) => item.value === status)?.label || '-'
}

/** 获取合作商品上架状态标签类型 */
export const getProductShelfStatusType = (
  status?: number
): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  return PRODUCT_SHELF_STATUS_OPTIONS.find((item) => item.value === status)?.type || 'info'
}

/** 获取合作商品状态文案（接口 status） */
export const getOfferStatusLabel = (status?: string): string => {
  return OFFER_STATUS_OPTIONS.find((item) => item.value === status)?.label || status || '-'
}

/** 获取合作商品状态标签类型（接口 status） */
export const getOfferStatusType = (
  status?: string
): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  return OFFER_STATUS_OPTIONS.find((item) => item.value === status)?.type || 'info'
}

/** 分转元 */
export const centsToYuan = (cents?: number | null) => {
  if (cents === undefined || cents === null) return undefined
  return Number((Number(cents) / 100).toFixed(2))
}

/** 元转分 */
export const yuanToCents = (yuan?: number | null) => {
  if (yuan === undefined || yuan === null) return undefined
  return Math.round(Number(yuan) * 100)
}

/** 金额分格式化为元文案 */
export const formatCentsYuan = (cents?: number | null) => {
  const yuan = centsToYuan(cents)
  return yuan === undefined ? '-' : yuan.toFixed(2)
}

/** 折扣基点转百分比，10000=100% */
export const bpToPercent = (bp?: number | null) => {
  if (bp === undefined || bp === null) return undefined
  return Number((Number(bp) / 100).toFixed(2))
}

/** 百分比转折扣基点 */
export const percentToBp = (percent?: number | null) => {
  if (percent === undefined || percent === null) return undefined
  return Math.round(Number(percent) * 100)
}

/** 规范化供货模式为数组 */
export const normalizeSupplyModes = (mode?: string | number | Array<string | number>): string[] => {
  if (mode === undefined || mode === null || mode === '') return []
  if (Array.isArray(mode)) return mode.map(String).filter(Boolean)
  return [String(mode)]
}

/** 分销商合作状态（接口枚举名） */
export const DistributorStatusEnum = {
  NORMAL: 'ACTIVE',
  PAUSED: 'SUSPENDED',
  BLACKLIST: 'BLACKLIST'
} as const

export type DistributorStatus = (typeof DistributorStatusEnum)[keyof typeof DistributorStatusEnum]

export const DISTRIBUTOR_STATUS_OPTIONS = [
  { value: DistributorStatusEnum.NORMAL, label: '正常' },
  { value: DistributorStatusEnum.PAUSED, label: '暂停分销' },
  { value: DistributorStatusEnum.BLACKLIST, label: '黑名单' }
]

/** 分销等级：1 一级 / 2 二级 / 3 三级 */
export const DistributionLevelEnum = {
  L1: 1,
  L2: 2,
  L3: 3
} as const

export const DISTRIBUTION_LEVEL_OPTIONS = [
  { value: DistributionLevelEnum.L1, label: '一级分销商' },
  { value: DistributionLevelEnum.L2, label: '二级分销商' },
  { value: DistributionLevelEnum.L3, label: '三级分销商' }
]

/** 合作模式（接口枚举名，可多选） */
export const COOPERATION_MODE_OPTIONS = [
  { value: 'DIRECT', label: '直营分销' },
  { value: 'AGENT', label: '代理分销' },
  { value: 'CHANNEL', label: '渠道分销' }
]

/** 分销商类型（接口枚举名） */
export const DISTRIBUTOR_TYPE_OPTIONS = [
  { value: 'ENTERPRISE', label: '企业' },
  { value: 'PERSONAL', label: '个人' },
  { value: 'PLATFORM', label: '平台入驻' }
]

/** 分销品类 */
export const DIST_CATEGORY_OPTIONS = [
  { value: 'equity', label: '权益' },
  { value: 'physical', label: '实物商品' },
  { value: 'movie', label: '电影票' },
  { value: 'dining', label: '点餐服务' },
  { value: 'supermarket', label: '商超外卖' }
]

/** 可分销商品类型 */
export const DIST_PRODUCT_TYPE_OPTIONS = [
  { value: 'equity_product', label: '权益商品' },
  { value: 'movie', label: '电影' },
  { value: 'dining', label: '点餐' },
  { value: 'jd', label: '京东' },
  { value: 'vip', label: '唯品会' }
]

/** 供货择优倾向 */
export const SUPPLY_PREFERENCE_OPTIONS = [
  { value: 'stable', label: '稳定优先' },
  { value: 'price', label: '价格优先' },
  { value: 'comprehensive', label: '综合优先' }
]

/** 分销商品调价方式 */
export const DistPriceAdjustModeEnum = {
  SUGGEST: 1, // 按分销价=销售建议价
  CUSTOM: 2 // 自定义设置
} as const

export const DIST_PRICE_ADJUST_MODE_OPTIONS = [
  { value: DistPriceAdjustModeEnum.SUGGEST, label: '按分销价=销售建议价' },
  { value: DistPriceAdjustModeEnum.CUSTOM, label: '自定义设置' }
]

/** 分销商品 L2 调价方式（PATCH l2AdjustMode） */
export const DistL2AdjustModeEnum = {
  FOLLOW_TEMPLATE: 'FOLLOW_TEMPLATE',
  EQUAL_L1: 'EQUAL_L1',
  CUSTOM: 'CUSTOM'
} as const

export const DIST_L2_ADJUST_MODE_OPTIONS = [
  { value: DistL2AdjustModeEnum.FOLLOW_TEMPLATE, label: '跟随模板' },
  { value: DistL2AdjustModeEnum.EQUAL_L1, label: '等于L1' },
  { value: DistL2AdjustModeEnum.CUSTOM, label: '自定义公式' }
]

export const getDistL2AdjustModeLabel = (value?: string): string => {
  return DIST_L2_ADJUST_MODE_OPTIONS.find((item) => item.value === value)?.label || value || '-'
}

export const getDistributorStatusLabel = (status?: string): string => {
  return DISTRIBUTOR_STATUS_OPTIONS.find((item) => item.value === status)?.label || '未知'
}

export const getDistributorStatusType = (
  status?: string
): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    [DistributorStatusEnum.NORMAL]: 'success',
    [DistributorStatusEnum.PAUSED]: 'warning',
    [DistributorStatusEnum.BLACKLIST]: 'danger'
  }
  return (status && map[status]) || 'info'
}

/** 项目状态（接口枚举名；创建仅允许 DRAFT / ACTIVE） */
export const ProjectStatusEnum = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE'
} as const

export const PROJECT_STATUS_OPTIONS = [
  { value: ProjectStatusEnum.DRAFT, label: '草稿', type: 'info' as const },
  { value: ProjectStatusEnum.ACTIVE, label: '进行中', type: 'success' as const }
]

/** 项目类型封闭枚举 */
export const PROJECT_TYPE_OPTIONS = [
  { value: 'WELFARE', label: '企业福利' },
  { value: 'BENEFIT', label: '员工权益' },
  { value: 'CAMPAIGN', label: '专项活动' },
  { value: 'SUBSIDY', label: '补贴项目' },
  { value: 'GROUP', label: '团购项目' }
]

/** 结算方类型，本期仅 DISTRIBUTOR */
export const SettlementPartyTypeEnum = {
  DISTRIBUTOR: 'DISTRIBUTOR'
} as const

export const SETTLEMENT_PARTY_TYPE_OPTIONS = [
  { value: SettlementPartyTypeEnum.DISTRIBUTOR, label: '分销商' }
]

/** 目录模式 */
export const CatalogModeEnum = {
  MANAGED: 'MANAGED',
  INDEPENDENT: 'INDEPENDENT'
} as const

export const CATALOG_MODE_OPTIONS = [
  { value: CatalogModeEnum.MANAGED, label: '中台管理' },
  { value: CatalogModeEnum.INDEPENDENT, label: '项目独立' }
]

/** 项目商品 L3 调价方式 */
export const ProjectL3AdjustModeEnum = {
  FOLLOW_L2: 'FOLLOW_L2',
  EQUAL_L1: 'EQUAL_L1',
  CUSTOM: 'CUSTOM'
} as const

export const PROJECT_L3_ADJUST_MODE_OPTIONS = [
  { value: ProjectL3AdjustModeEnum.FOLLOW_L2, label: '沿用分销商基础价' },
  { value: ProjectL3AdjustModeEnum.EQUAL_L1, label: '等于平台默认分销价' },
  { value: ProjectL3AdjustModeEnum.CUSTOM, label: '自定义公式' }
]

/** 冻结版本结算层级 */
export const PRICE_SOURCE_OPTIONS = [
  { value: 'L1', label: '平台默认定价' },
  { value: 'L2', label: '分销商基础价' },
  { value: 'L3', label: '项目专属价' }
]

export const getDistributionLevelLabel = (value?: number): string => {
  return DISTRIBUTION_LEVEL_OPTIONS.find((item) => item.value === value)?.label || '-'
}

export const getCooperationModeLabel = (value?: string): string => {
  if (!value) return '-'
  const aliases: Record<string, string> = {
    direct: 'DIRECT',
    agent: 'AGENT',
    channel: 'CHANNEL'
  }
  const key = aliases[value] || value
  return COOPERATION_MODE_OPTIONS.find((item) => item.value === key)?.label || value
}

export const getDistributorTypeLabel = (value?: string): string => {
  if (!value) return '-'
  const aliases: Record<string, string> = {
    enterprise: 'ENTERPRISE',
    personal: 'PERSONAL',
    platform: 'PLATFORM'
  }
  const key = aliases[value] || value
  return DISTRIBUTOR_TYPE_OPTIONS.find((item) => item.value === key)?.label || value
}

export const getDistCategoryLabel = (value?: string): string => {
  if (!value) return '-'
  return DIST_CATEGORY_OPTIONS.find((item) => item.value === value)?.label || value
}

export const getDistProductTypeLabel = (value?: string): string => {
  if (!value) return '-'
  return DIST_PRODUCT_TYPE_OPTIONS.find((item) => item.value === value)?.label || value
}

export const getSupplyPreferenceLabel = (value?: string): string => {
  return SUPPLY_PREFERENCE_OPTIONS.find((item) => item.value === value)?.label || '-'
}

export const getDistPriceAdjustModeLabel = (value?: number): string => {
  return DIST_PRICE_ADJUST_MODE_OPTIONS.find((item) => item.value === value)?.label || '-'
}

export const getProjectStatusLabel = (status?: string): string => {
  if (!status) return '-'
  return PROJECT_STATUS_OPTIONS.find((item) => item.value === status)?.label || status
}

export const getProjectStatusType = (
  status?: string
): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  return PROJECT_STATUS_OPTIONS.find((item) => item.value === status)?.type || 'info'
}

export const getProjectTypeLabel = (value?: string): string => {
  if (!value) return '-'
  const aliases: Record<string, string> = {
    welfare: 'WELFARE',
    benefit: 'BENEFIT',
    campaign: 'CAMPAIGN',
    subsidy: 'SUBSIDY',
    group: 'GROUP'
  }
  const key = aliases[value] || value
  return PROJECT_TYPE_OPTIONS.find((item) => item.value === key)?.label || value
}

export const getSettlementPartyTypeLabel = (value?: string): string => {
  if (!value) return '-'
  const aliases: Record<string, string> = {
    distributor: SettlementPartyTypeEnum.DISTRIBUTOR,
    platform: SettlementPartyTypeEnum.DISTRIBUTOR
  }
  const key = aliases[value] || value
  return SETTLEMENT_PARTY_TYPE_OPTIONS.find((item) => item.value === key)?.label || value
}

export const getCatalogModeLabel = (value?: string): string => {
  return CATALOG_MODE_OPTIONS.find((item) => item.value === value)?.label || value || '-'
}

export const getProjectL3AdjustModeLabel = (value?: string): string => {
  return PROJECT_L3_ADJUST_MODE_OPTIONS.find((item) => item.value === value)?.label || value || '-'
}

export const getPriceSourceLabel = (value?: string): string => {
  if (!value) return '-'
  return PRICE_SOURCE_OPTIONS.find((item) => item.value === value)?.label || value
}
