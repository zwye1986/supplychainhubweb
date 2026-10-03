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

/** PUT /supply-chain/products/skus/pricing 平台商品 SKU 默认批量定价 */
export interface PlatformSkuBatchPricingReqVO {
  platformSkuCodes: string[]
  distributionRule: FormulaRuleReqVO
  salesRule: FormulaRuleReqVO
  serviceFeeRule: ServiceFeeRuleReqVO
  distributionHideThresholdPercent?: number
  salesHideThresholdPercent?: number
  taxIncluded: boolean
  /** 含税时必填；不含税不要传 */
  taxRateCode?: string
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
}

/**
 * 批量上下架结果。
 * succeeded 与 failed 列表混合 SPU/SKU 编码；前端按项渲染「成功 N 项、失败 M 项」并可针对失败项重试。
 */
export interface ProductBatchStatusResultVO {
  /** 成功处理项的业务编码列表（SPU 与 SKU 混合） */
  succeeded: string[]
  /** 失败明细列表 */
  failed: ProductBatchStatusFailedItemVO[]
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
  status?: number
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
  status?: number
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
export interface SkuDetail extends SkuItemSaveReqVO {
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
