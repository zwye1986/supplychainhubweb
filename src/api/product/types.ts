/** 销售建议价规则（SKU.suggestedSalePriceRule） */
export interface SuggestedSalePriceRule {
  mode?: string
  base?: string
  percentage?: number
  operator?: string
  operand?: number
  fixedPriceCents?: number
}

/** 默认定价公式：DIRECT_MARKET_PRICE 直接等于市场价，CUSTOM 自定义 */
export type FormulaRuleMode = 'DIRECT_MARKET_PRICE' | 'CUSTOM'
export type FormulaRuleBase = 'MARKET_PRICE' | 'SUGGESTED_SALE_PRICE' | 'SUPPLY_PRICE'
export type FormulaRuleOperator = 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'DIVIDE'

/** PUT /supply-chain/products/skus/pricing 分销价 / 销售价公式 */
export interface FormulaRuleReqVO {
  mode: FormulaRuleMode
  base?: FormulaRuleBase
  percentage?: number
  operator?: FormulaRuleOperator
  operand?: number
}

/** PUT /supply-chain/products/skus/pricing 服务费规则 */
export interface ServiceFeeRuleReqVO {
  percentage?: number
  operator: FormulaRuleOperator
  operand?: number
  hideCopy?: boolean
  copy?: string
}

/**
 * 税率动态字典中的“不征税”稳定编码；其它税率仍从启用字典读取，不枚举全部税率。
 * 设计见后端 docs/superpowers/specs/2026-09-15-generic-batch-pricing-design.md#4-税务展示属性。
 */
export const PRICING_TAX_RATE_CODES = { NON_TAXABLE: 'NON_TAXABLE' } as const

/** PUT /supply-chain/products/skus/pricing 平台商品 SKU 默认批量定价；SPU 与 SKU 均须已上架。 */
export interface PlatformSkuBatchPricingReqVO {
  platformSkuCodes: string[]
  distributionRule: FormulaRuleReqVO
  salesRule: FormulaRuleReqVO
  serviceFeeRule: ServiceFeeRuleReqVO
  distributionHideThresholdPercent?: number
  salesHideThresholdPercent?: number
  /** 是否含税，须与税率编码同时提交；仅用于结算展示，不参与价格计算。 */
  taxIncluded: boolean
  /** 启用税率字典编码；不含税时仍必填 NON_TAXABLE，含税时提交所选启用编码。 */
  taxRateCode: string
}

/**
 * 批量上下架失败明细项。
 * 设计见 docs/superpowers/specs/2026-09-11-supply-chain-product-center-design.md#4110
 */
export interface ProductBatchStatusFailedItemVO {
  /** 实体类型：SPU 或 SKU */
  entityType: 'SPU' | 'SKU'
  /** 失败项业务编码（spuCode 或 skuCode） */
  code: string
  /** 稳定错误码，与 SupplyChainErrorCodeConstants 对齐 */
  errorCode: number
  /** 错误消息 */
  errorMessage: string
  /** 同步上架组内的具体失败实体类型 */
  failedEntityType?: 'SPU' | 'SKU' | null
  /** 同步上架组内的具体失败实体业务编码 */
  failedEntityCode?: string | null
}

/**
 * 同步上架以 SPU 与全部未归档 SKU 为原子组；失败组没有部分成功规格。
 * 设计见后端 docs/superpowers/specs/2026-10-11-platform-product-batch-shelf-sync-design.md#5-结果与页面交互。
 */
export interface ProductBatchStatusGroupVO {
  spuCode: string
  skuCodes: string[]
  succeeded: boolean
  failedEntityType?: 'SPU' | 'SKU' | null
  failedEntityCode?: string | null
}

/**
 * 批量上下架结果。
 * 普通模式按实体计数；同步模式按 SPU 原子组计数并给出全部处理范围，调用方须先校验完整回执。
 * 用户核对当前状态后可主动重新选择失败项，异常不自动重发写请求。
 */
export interface ProductBatchStatusResultVO {
  /** 成功处理项的业务编码列表（SPU 与 SKU 混合） */
  succeeded: string[]
  /** 失败明细列表 */
  failed: ProductBatchStatusFailedItemVO[]
  /** true 表示按商品组同步上架，缺省/false 沿用逐实体模式 */
  syncSkuOnShelf?: boolean
  /** 同步模式下每个请求 SPU 的实际处理范围与整组结果 */
  groups?: ProductBatchStatusGroupVO[]
}

/** 已通过模式、组范围与失败定位校验的同步上架回执。 */
export interface ProductShelfSyncResultVO extends ProductBatchStatusResultVO {
  syncSkuOnShelf: true
  groups: ProductBatchStatusGroupVO[]
}

/** GET /supply-chain/products/skus/{skuCode}/pricing 定价状态 */
export type PlatformPricingStatus =
  | 'UNPRICED'
  | 'READY'
  | 'RECALCULATING'
  | 'DEPENDENCY_MISSING'
  | 'CALCULATION_FAILED'
  | 'MARGIN_HIDDEN'

export interface HideRuleVO {
  distributionThresholdPercent?: number
  salesThresholdPercent?: number
}

export interface TaxMetadataVO {
  taxIncluded?: boolean
  taxRateCode?: string
  taxRateLabel?: string
}

/** GET /supply-chain/products/skus/{skuCode}/fulfillment-scores 合作供应商评分行 */
export interface SkuFulfillmentScoreItem {
  supplierCode?: string
  supplierName?: string
  offerNo?: string
  /** 稳定性评分，0-100，默认 80 */
  stabilityScore?: number
  /** 时效性评分，0-100，默认 80 */
  timelinessScore?: number
}

/** GET /supply-chain/products/skus/{skuCode}/fulfillment-scores */
export interface SkuFulfillmentScoreView {
  skuCode?: string
  skuName?: string
  spuCode?: string
  spuName?: string
  items?: SkuFulfillmentScoreItem[]
}

/** PUT /supply-chain/products/skus/{skuCode}/fulfillment-scores 保存行 */
export interface SkuFulfillmentScoreItemReqVO {
  supplierCode: string
  stabilityScore?: number
  timelinessScore?: number
}

/** PUT /supply-chain/products/skus/{skuCode}/fulfillment-scores */
export interface SkuFulfillmentScoreSaveReqVO {
  items: SkuFulfillmentScoreItemReqVO[]
}

/** PUT /supply-chain/products/skus/{skuCode}/fulfillment-scores 回执 */
export interface ScoreUpdateResult {
  updatedCount?: number
}

/** GET /supply-chain/products/skus/{skuCode}/pricing 当前完整默认定价 */
export interface PlatformPricingDetail {
  platformSkuCode?: string
  currentVersionId?: number
  versionNo?: number
  pricingStatus?: PlatformPricingStatus | string
  unavailableReason?: string
  distributionRule?: FormulaRuleReqVO
  salesRule?: FormulaRuleReqVO
  serviceFeeRule?: ServiceFeeRuleReqVO
  hideRule?: HideRuleVO
  taxMetadata?: TaxMetadataVO
  marketPriceCents?: number
  suggestedSalePriceCents?: number
  supplyPriceCents?: number
  distributionPriceCents?: number
  salesPriceCents?: number
  distributionMarginPercent?: number
  effectiveHideThresholdPercent?: number
  currency?: string
  publishedBy?: number
  publishedAt?: string
}

/** SPU 状态：0草稿，10已上架/启用，20已下架/停用 */
export const PRODUCT_STATUS = {
  DRAFT: 0,
  ON_SHELF: 10,
  OFF_SHELF: 20
} as const

export type ProductStatusValue = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS]

export interface SupplierSimpleInfo {
  supplierCode?: string
  supplierName?: string
}

/** 管理端列表 SKU 明细（GET /supply-chain/products/management-page） */
export interface ProductManagementSkuItem {
  skuCode?: string
  skuName?: string
  marketPrice?: number
  suggestedSalePrice?: number
  suggestedSalePriceCents?: number
  supplyPrice?: number
  supplyPriceExclusive?: number
  taxIncluded?: boolean
  taxRate?: number
  taxRateDisplay?: string
  taxAmount?: number
  suppliers?: SupplierSimpleInfo[]
  totalInventory?: number
  fulfillmentType?: string
  fulfillmentTypeDisplay?: string
  status?: number | string
  suggestedSalePriceRule?: SuggestedSalePriceRule
}

/** 管理端列表 SPU 聚合项 */
export interface ProductManagementSpuItem {
  spuCode?: string
  spuName?: string
  coverUrl?: string
  productType?: string
  productTypeName?: string
  primaryCategoryName?: string
  brandName?: string
  status?: number | string
  unshelveMode?: string
  unshelveModeDisplay?: string
  updatedAt?: string
  skus?: ProductManagementSkuItem[]
}

/** 管理端分页查询参数 */
export interface ProductManagementPageParam {
  tabCode?: string
  keyword?: string
  productType?: string
  categoryId?: number | number[] | string
  brandId?: number | string
  status?: number
  unshelveMode?: string
  fulfillmentType?: string
  marketPriceMin?: number
  marketPriceMax?: number
  supplyPriceMin?: number
  supplyPriceMax?: number
  supplierCode?: string
  /** 新增供应商品时为 true，排除该供应商已添加的报价 */
  excludeAddedSupplierOffers?: boolean
  /** 分销商编号，新增分销商品时按分销商过滤可关联标品 */
  buyerCode?: string
  updateTimeStart?: string
  updateTimeEnd?: string
  pageNo?: number
  pageSize?: number
}

/** 复合保存 SKU */
export interface SkuItemSaveReqVO {
  /** 管理状态：0草稿，10启用，20停用，90已归档；新增时省略以继承父商品管理状态 */
  status?: number
  skuCode?: string
  skuName: string
  faceValue: number
  marketPrice?: number
  suggestedSalePriceRule?: SuggestedSalePriceRule
  picUrl?: string
  detailPics?: string[]
  description?: string
  skuInventory?: number
  userLimitEnabled?: boolean
  userLimitPeriod?: string
  userLimitQuantity?: number
  phoneBindLimitEnabled?: boolean
  phoneBindLimitPeriod?: string
  phoneBindLimitQuantity?: number
}

/** 复合保存 SPU */
export interface SpuSaveReqVO {
  spuCode?: string
  spuName: string
  brandId: number
  sellableCategory: string
  productType: string
  primaryCategoryId: number
  productClassification: string
  fulfillmentType: string
  deliveryType?: string
  status?: number
  userLimitEnabled?: boolean
  userLimitPeriod?: string
  userLimitQuantity?: number
  phoneBindLimitEnabled?: boolean
  phoneBindLimitPeriod?: string
  phoneBindLimitQuantity?: number
  skus: SkuItemSaveReqVO[]
}

/** 详情 SKU */
export interface SkuDetail extends Omit<SkuItemSaveReqVO, 'status'> {
  /** 管理状态：0草稿，10启用，20停用，90已归档 */
  status?: number | string
  supplyPrice?: number
  suppliers?: SupplierSimpleInfo[]
  totalInventory?: number
}

/** 平台 SPU 详情 */
export interface SpuDetail {
  spuCode?: string
  /** 平台SPU内部全局短序号，供SKU编码父段引用 */
  codeScopeNo?: number
  spuName?: string
  brandId?: number
  brandName?: string
  sellableCategory?: string
  productType?: string
  primaryCategoryId?: number
  productClassification?: string
  fulfillmentType?: string
  fulfillmentTypeDisplay?: string
  deliveryType?: string
  status?: number
  userLimitEnabled?: boolean
  userLimitPeriod?: string
  userLimitQuantity?: number
  phoneBindLimitEnabled?: boolean
  phoneBindLimitPeriod?: string
  phoneBindLimitQuantity?: number
  skus?: SkuDetail[]
  createdAt?: string
  updatedAt?: string
}

/** 分类管理状态：0草稿，10启用，20停用，90已归档 */
export const CATEGORY_STATUS = {
  DRAFT: 0,
  ENABLED: 10,
  DISABLED: 20,
  ARCHIVED: 90
} as const

export type CategoryStatusValue = (typeof CATEGORY_STATUS)[keyof typeof CATEGORY_STATUS]

/** 管理树查询（GET /supply-chain/categories/management-tree） */
export interface CategoryListParam {
  categoryName?: string
  status?: number
}

/** 管理树 / 详情节点（GET /supply-chain/categories/management-tree、/{categoryCode}） */
export interface ProductCategoryVO {
  id?: number
  categoryCode?: string
  /** 分类节点内部全局短序号，供直接子分类编码父段引用 */
  categoryNodeNo?: number
  categoryName: string
  categoryLevel?: number
  parentId?: number
  parentCategoryCode?: string
  sort?: number
  visible?: number
  status?: number
  effectiveVisible?: boolean
  productCount?: number
  children?: ProductCategoryVO[]
  createdAt?: string
  updatedAt?: string
}

/** 分类保存请求（POST/PUT /supply-chain/categories） */
export interface CategorySaveReqVO {
  categoryCode?: string
  categoryName: string
  parentCategoryCode?: string | null
  sort?: number
  visible?: number
  status?: number
}

/** 品牌管理状态：0草稿，10启用，20停用，90已归档 */
export const BRAND_STATUS = {
  DRAFT: 0,
  ENABLED: 10,
  DISABLED: 20,
  ARCHIVED: 90
} as const

export type BrandStatusValue = (typeof BRAND_STATUS)[keyof typeof BRAND_STATUS]

/** 分页查询（GET /supply-chain/brands） */
export interface BrandPageParam {
  keyword?: string
  status?: number
  pageNo?: number
  pageSize?: number
}

/** 品牌保存请求（POST/PUT /supply-chain/brands） */
export interface BrandSaveReqVO {
  brandCode?: string
  brandName: string
  shortName?: string
  englishName?: string
  logoUrl: string
  description?: string
  sort?: number
  status?: number
}

/** 品牌视图（GET /supply-chain/brands、/{brandCode}） */
export interface ProductBrandVO {
  brandCode?: string
  brandName: string
  shortName?: string
  englishName?: string
  logoUrl?: string
  description?: string
  sort?: number
  status?: number
  productCount?: number
  spuCount?: number
  createdAt?: string
  updatedAt?: string
}

/** 商品类型管理状态：0草稿，10启用，20停用，90已归档 */
export const PRODUCT_TYPE_STATUS = {
  DRAFT: 0,
  ENABLED: 10,
  DISABLED: 20,
  ARCHIVED: 90
} as const

export type ProductTypeStatusValue = (typeof PRODUCT_TYPE_STATUS)[keyof typeof PRODUCT_TYPE_STATUS]

/** 分页查询（GET /supply-chain/product-types） */
export interface ProductTypePageParam {
  keyword?: string
  status?: number
  pageNo?: number
  pageSize?: number
}

/** 商品类型保存请求（POST /supply-chain/product-types） */
export interface ProductTypeSaveReqVO {
  typeCode?: string
  typeName: string
  iconUrl?: string
  sort?: number
  status?: number
  description?: string
  remark?: string
}

/** 商品类型视图（GET /supply-chain/product-types） */
export interface ProductTypeVO {
  typeCode?: string
  typeName: string
  iconUrl?: string
  sort?: number
  status?: number
  description?: string
  remark?: string
  productCount?: number
  spuCount?: number
  skuCount?: number
  createdAt?: string
  updatedAt?: string
}
