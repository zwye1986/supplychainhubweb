/** 供应商合作状态 */
export const SupplierStatusEnum = {
  NORMAL: 1, // 正常合作
  PAUSED: 2, // 暂停供货
  BLACKLIST: 3 // 黑名单
}

/** 合作状态选项 */
export const SUPPLIER_STATUS_OPTIONS = [
  { value: SupplierStatusEnum.NORMAL, label: '正常' },
  { value: SupplierStatusEnum.PAUSED, label: '暂停供货' },
  { value: SupplierStatusEnum.BLACKLIST, label: '黑名单' }
]

/** 可售品类 / 商品分类选项（供货配置、合作商品筛选） */
export const SUPPLIER_CATEGORY_OPTIONS = [
  { value: 'equity', label: '权益商品' },
  { value: 'movie', label: '电影快充' },
  { value: 'jd', label: '京东' },
  { value: 'dining', label: '点餐' },
  { value: 'takeout', label: '外卖' },
  { value: 'supermarket', label: '商超' },
  { value: 'hema', label: '盒马购' },
  { value: 'rtmart', label: '大润发' },
  { value: 'life', label: '生活服务' }
]

/** 商品类型选项 */
export const SUPPLIER_PRODUCT_TYPE_OPTIONS = [
  { value: 'equity_product', label: '权益商品' },
  { value: 'movie', label: '电影' },
  { value: 'jd', label: '京东' }
]

/** 商品分类选项（树形，此处用于标签展示） */
export const SUPPLIER_PRODUCT_CATEGORY_OPTIONS = [
  { value: 'electronics', label: '数码电子' },
  { value: 'virtual_card', label: '虚拟卡券类' },
  { value: 'movie_ticket', label: '电影快票' }
]

/** 供货模式选项（列表筛选：字符串编码） */
export const SUPPLIER_SUPPLY_MODE_OPTIONS = [
  { value: 'dropshipping', label: '一件代发' },
  { value: 'batch', label: '批量发货' },
  { value: 'pickup', label: '门店自提' },
  { value: 'api', label: 'API直发' },
  { value: 'h5', label: 'H5直发' }
]

/** 供货模式（详情供货配置 / 合作商品：数值） */
export const SupplyModeEnum = {
  SPOT: 1, // 现货
  DROPSHIP: 2, // 代发
  PRESALE: 3 // 预售
} as const

export const SUPPLY_MODE_OPTIONS = [
  { value: SupplyModeEnum.SPOT, label: '现货' },
  { value: SupplyModeEnum.DROPSHIP, label: '代发' },
  { value: SupplyModeEnum.PRESALE, label: '预售' }
]

/** 供应价模式 */
export const SupplyPriceModeEnum = {
  FIXED: 1, // 固定值
  DISCOUNT: 2 // 供货折扣
} as const

export const SUPPLY_PRICE_MODE_OPTIONS = [
  { value: SupplyPriceModeEnum.FIXED, label: '固定值' },
  { value: SupplyPriceModeEnum.DISCOUNT, label: '供货折扣' }
]

/** 能力标签选项 */
export const SUPPLIER_CAPABILITY_OPTIONS = [
  { value: 'manufacturer', label: '生产型' },
  { value: 'trader', label: '贸易型' },
  { value: 'service', label: '服务型' },
  { value: 'distributor', label: '分销型' }
]

/** 配送区域类型 */
export const DeliveryAreaTypeEnum = {
  NATIONWIDE: 'nationwide',
  SPECIFIED: 'specified'
} as const

export const DELIVERY_AREA_TYPE_OPTIONS = [
  { value: DeliveryAreaTypeEnum.NATIONWIDE, label: '全国' },
  { value: DeliveryAreaTypeEnum.SPECIFIED, label: '指定区域' }
]

/** 发货时效 */
export const ShippingTimelinessEnum = {
  SAME_DAY: 'same_day',
  NEXT_DAY: 'next_day',
  HOURS_48: '48h',
  HOURS_72: '72h',
  CUSTOM: 'custom'
} as const

export const SHIPPING_TIMELINESS_OPTIONS = [
  { value: ShippingTimelinessEnum.SAME_DAY, label: '当日发' },
  { value: ShippingTimelinessEnum.NEXT_DAY, label: '次日发' },
  { value: ShippingTimelinessEnum.HOURS_48, label: '48小时发' },
  { value: ShippingTimelinessEnum.HOURS_72, label: '72小时发' },
  { value: ShippingTimelinessEnum.CUSTOM, label: '自定义' }
]

/** 结算方式选项 */
export const SUPPLIER_SETTLEMENT_OPTIONS = [
  { value: 'daily', label: '日结' },
  { value: 'weekly', label: '周结' },
  { value: 'monthly', label: '月结' },
  { value: 'quarterly', label: '季结' },
  { value: 'prepaid', label: '预付' }
]

/** 开票抬头类型 */
export const InvoiceTitleTypeEnum = {
  ENTERPRISE: 1, // 企业
  PERSONAL: 2 // 个人
} as const

/** 开票抬头类型选项 */
export const INVOICE_TITLE_TYPE_OPTIONS = [
  { value: InvoiceTitleTypeEnum.ENTERPRISE, label: '企业' },
  { value: InvoiceTitleTypeEnum.PERSONAL, label: '个人' }
]

/** 对接方式选项 */
export const SUPPLIER_INTEGRATION_OPTIONS = [
  { value: 'api', label: 'API直连' },
  { value: 'h5', label: 'H5直连' },
  { value: 'manual', label: '人工对接' }
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

/** 获取可售品类文案 */
export const getCategoryLabel = (tag: string): string => {
  return SUPPLIER_CATEGORY_OPTIONS.find((item) => item.value === tag)?.label || tag
}

/** 获取商品类型文案 */
export const getProductTypeLabel = (tag: string): string => {
  return SUPPLIER_PRODUCT_TYPE_OPTIONS.find((item) => item.value === tag)?.label || tag
}

/** 获取商品分类文案 */
export const getProductCategoryLabel = (tag: string): string => {
  return SUPPLIER_PRODUCT_CATEGORY_OPTIONS.find((item) => item.value === tag)?.label || tag
}

/** 获取供货模式文案 */
export const getSupplyModeLabel = (tag?: string | number): string => {
  if (tag === undefined || tag === null || tag === '') return '-'
  const numericLabel = SUPPLY_MODE_OPTIONS.find((item) => item.value === tag)?.label
  if (numericLabel) return numericLabel
  return SUPPLIER_SUPPLY_MODE_OPTIONS.find((item) => item.value === tag)?.label || String(tag)
}

/** 获取供应价模式文案 */
export const getSupplyPriceModeLabel = (value?: number): string => {
  return SUPPLY_PRICE_MODE_OPTIONS.find((item) => item.value === value)?.label || '-'
}

/** 获取合作状态文案 */
export const getSupplierStatusLabel = (status: number): string => {
  return SUPPLIER_STATUS_OPTIONS.find((item) => item.value === status)?.label || '未知'
}

/** 获取合作状态对应的 el-tag 类型 */
export const getSupplierStatusType = (
  status: number
): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const map: Record<number, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    [SupplierStatusEnum.NORMAL]: 'success',
    [SupplierStatusEnum.PAUSED]: 'warning',
    [SupplierStatusEnum.BLACKLIST]: 'danger'
  }
  return map[status] || 'info'
}
