/** 供应商合作状态（接口枚举名） */
export const SupplierStatusEnum = {
  NORMAL: 'ACTIVE', // 正常合作
  PAUSED: 'SUSPENDED', // 暂停供货
  BLACKLIST: 'BLACKLIST' // 黑名单
} as const

export type SupplierStatus = (typeof SupplierStatusEnum)[keyof typeof SupplierStatusEnum]

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

/** 合作商品页 / 新增弹窗：固定筛选分类 */
export const SUPPLIER_PRODUCT_FILTER_TAGS = [
  { value: 'equity', label: '权益商品' },
  { value: 'jd', label: '京东' },
  { value: 'movie', label: '电影快充' },
  { value: 'dining', label: '点餐' }
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

/** 供货模式选项（列表筛选：接口枚举名） */
export const SUPPLIER_SUPPLY_MODE_OPTIONS = [
  { value: 'API_DIRECT', label: 'API直发' },
  { value: 'H5_DIRECT', label: 'H5直发' },
  { value: 'DROP_SHIPPING', label: '一件代发' },
  { value: 'BATCH', label: '批量发货' },
  { value: 'PICKUP', label: '门店自提' },
  // 兼容旧 mock 编码
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
  REALTIME: 2, // 实时更新
  DISCOUNT: 3 // 按供货折扣
} as const

export const SUPPLY_PRICE_MODE_OPTIONS = [
  { value: SupplyPriceModeEnum.FIXED, label: '固定值' },
  { value: SupplyPriceModeEnum.REALTIME, label: '实时更新' },
  { value: SupplyPriceModeEnum.DISCOUNT, label: '按供货折扣' }
]

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
export const OfferStatusEnum = {
  PUBLISHED: 'PUBLISHED',
  SUSPENDED: 'SUSPENDED'
} as const

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
  SPECIFIED: 'SPECIFIED'
} as const

export const DELIVERY_AREA_TYPE_OPTIONS = [
  { value: DeliveryAreaTypeEnum.NATIONWIDE, label: '全国' },
  { value: DeliveryAreaTypeEnum.SPECIFIED, label: '指定区域' }
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

/** 获取可售品类文案 */
export const getCategoryLabel = (tag?: string): string => {
  if (!tag) return '-'
  return SUPPLIER_CATEGORY_OPTIONS.find((item) => item.value === tag)?.label || tag
}

/** 获取商品类型文案 */
export const getProductTypeLabel = (tag?: string): string => {
  if (!tag) return '-'
  return SUPPLIER_PRODUCT_TYPE_OPTIONS.find((item) => item.value === tag)?.label || tag
}

/** 获取商品分类文案 */
export const getProductCategoryLabel = (tag?: string): string => {
  if (!tag) return '-'
  return SUPPLIER_PRODUCT_CATEGORY_OPTIONS.find((item) => item.value === tag)?.label || tag
}

/** 合作商品 / 新增商品：类型、分类筛选标签 */
export type SupplyFilterTag = {
  key: string
  group: 'type' | 'category'
  value: string
  label: string
}

export const buildSupplyFilterTags = (
  configs: Array<{
    categoryCode?: string
    categoryName?: string
    productType?: string
    productTypeName?: string
  }> = []
) => {
  const typeMap = new Map<string, SupplyFilterTag>()
  const categoryMap = new Map<string, SupplyFilterTag>()
  configs.forEach((item) => {
    if (item.productType) {
      typeMap.set(item.productType, {
        key: `type:${item.productType}`,
        group: 'type',
        value: item.productType,
        label: item.productTypeName || getProductTypeLabel(item.productType)
      })
    }
    if (item.categoryCode) {
      categoryMap.set(item.categoryCode, {
        key: `category:${item.categoryCode}`,
        group: 'category',
        value: item.categoryCode,
        label: item.categoryName || getCategoryLabel(item.categoryCode)
      })
    }
  })
  return {
    typeTags: [...typeMap.values()],
    categoryTags: [...categoryMap.values()]
  }
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

/** 获取合作商品供应价模式文案（接口 priceMode） */
export const getOfferPriceModeLabel = (value?: string): string => {
  return OFFER_PRICE_MODE_OPTIONS.find((item) => item.value === value)?.label || value || '-'
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

/** 获取合作状态文案 */
export const getSupplierStatusLabel = (status?: string): string => {
  return SUPPLIER_STATUS_OPTIONS.find((item) => item.value === status)?.label || '未知'
}

/** 获取合作状态对应的 el-tag 类型 */
export const getSupplierStatusType = (
  status?: string
): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    [SupplierStatusEnum.NORMAL]: 'success',
    [SupplierStatusEnum.PAUSED]: 'warning',
    [SupplierStatusEnum.BLACKLIST]: 'danger'
  }
  return (status && map[status]) || 'info'
}

/** 分销商合作状态（PRD：正常 / 暂停分销 / 黑名单） */
export const DistributorStatusEnum = {
  NORMAL: 1,
  PAUSED: 2,
  BLACKLIST: 3
} as const

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

/** 合作模式（可多选）：直营分销 / 代理分销 / 渠道分销 */
export const COOPERATION_MODE_OPTIONS = [
  { value: 'direct', label: '直营分销' },
  { value: 'agent', label: '代理分销' },
  { value: 'channel', label: '渠道分销' }
]

/** 分销商类型 */
export const DISTRIBUTOR_TYPE_OPTIONS = [
  { value: 'enterprise', label: '企业' },
  { value: 'personal', label: '个人' },
  { value: 'platform', label: '平台入驻' }
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

export const getDistributorStatusLabel = (status?: number): string => {
  return DISTRIBUTOR_STATUS_OPTIONS.find((item) => item.value === status)?.label || '未知'
}

export const getDistributorStatusType = (
  status?: number
): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const map: Record<number, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    [DistributorStatusEnum.NORMAL]: 'success',
    [DistributorStatusEnum.PAUSED]: 'warning',
    [DistributorStatusEnum.BLACKLIST]: 'danger'
  }
  return (status != null && map[status]) || 'info'
}

/** 项目状态 */
export const ProjectStatusEnum = {
  DRAFT: 0,
  ACTIVE: 1,
  PAUSED: 2,
  CLOSED: 3
} as const

export const PROJECT_STATUS_OPTIONS = [
  { value: ProjectStatusEnum.DRAFT, label: '草稿', type: 'info' as const },
  { value: ProjectStatusEnum.ACTIVE, label: '进行中', type: 'success' as const },
  { value: ProjectStatusEnum.PAUSED, label: '已暂停', type: 'warning' as const },
  { value: ProjectStatusEnum.CLOSED, label: '已结束', type: 'info' as const }
]

/** 项目类型 */
export const PROJECT_TYPE_OPTIONS = [
  { value: 'welfare', label: '企业福利' },
  { value: 'benefit', label: '员工权益' },
  { value: 'campaign', label: '专项活动' },
  { value: 'subsidy', label: '补贴项目' },
  { value: 'group', label: '团购项目' }
]

/** 结算方类型 */
export const SettlementPartyTypeEnum = {
  DISTRIBUTOR: 'distributor',
  PLATFORM: 'platform'
} as const

export const SETTLEMENT_PARTY_TYPE_OPTIONS = [
  { value: SettlementPartyTypeEnum.DISTRIBUTOR, label: '关联分销商' },
  { value: SettlementPartyTypeEnum.PLATFORM, label: '平台结算' }
]

/** 项目专属价调价方式：0 沿用分销商基础价 / 1 按销售建议价 / 2 自定义 */
export const ProjectPriceAdjustModeEnum = {
  FOLLOW: 0,
  SUGGEST: 1,
  CUSTOM: 2
} as const

export const PROJECT_PRICE_ADJUST_MODE_OPTIONS = [
  { value: ProjectPriceAdjustModeEnum.FOLLOW, label: '沿用分销商基础价' },
  { value: ProjectPriceAdjustModeEnum.SUGGEST, label: '按项目价=销售建议价' },
  { value: ProjectPriceAdjustModeEnum.CUSTOM, label: '自定义设置' }
]

export const getDistributionLevelLabel = (value?: number): string => {
  return DISTRIBUTION_LEVEL_OPTIONS.find((item) => item.value === value)?.label || '-'
}

export const getCooperationModeLabel = (value?: string): string => {
  return COOPERATION_MODE_OPTIONS.find((item) => item.value === value)?.label || '-'
}

export const getDistributorTypeLabel = (value?: string): string => {
  return DISTRIBUTOR_TYPE_OPTIONS.find((item) => item.value === value)?.label || '-'
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

export const getProjectStatusLabel = (status?: number): string => {
  return PROJECT_STATUS_OPTIONS.find((item) => item.value === status)?.label || '-'
}

export const getProjectStatusType = (
  status?: number
): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  return PROJECT_STATUS_OPTIONS.find((item) => item.value === status)?.type || 'info'
}

export const getProjectTypeLabel = (value?: string): string => {
  if (!value) return '-'
  return PROJECT_TYPE_OPTIONS.find((item) => item.value === value)?.label || value
}

export const getSettlementPartyTypeLabel = (value?: string): string => {
  return SETTLEMENT_PARTY_TYPE_OPTIONS.find((item) => item.value === value)?.label || '-'
}

export const getProjectPriceAdjustModeLabel = (value?: number): string => {
  return PROJECT_PRICE_ADJUST_MODE_OPTIONS.find((item) => item.value === value)?.label || '-'
}
