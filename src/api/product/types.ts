export type AdjustMode = 'MARKET' | 'CUSTOM' | 'FIXED'
export type FormulaBase = 'MARKET' | 'SUGGEST' | 'SUPPLY'
export type FormulaOp = '+' | '-' | '*' | '/'

export interface FormulaVO {
  base?: FormulaBase
  percent?: number
  op?: FormulaOp
  amount?: number
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
  categoryId?: number
  brandId?: number
  status?: number
  unshelveMode?: string
  fulfillmentType?: string
  marketPriceMin?: number
  marketPriceMax?: number
  supplyPriceMin?: number
  supplyPriceMax?: number
  supplierCode?: string
  updateTimeStart?: string
  updateTimeEnd?: string
  pageNo?: number
  pageSize?: number
}

/** 复合保存 SKU */
export interface SkuItemSaveReqVO {
  skuCode?: string
  skuName: string
  fulfillmentType: string
  faceValue: number
  marketPrice?: number
  suggestedSalePrice?: number
  taxIncluded?: boolean
  taxRate?: number
  minQuantity?: number
  maxQuantity?: number
  userLimitEnabled?: boolean
  userLimitPeriod?: string
  userLimitQuantity?: number
  orderLimitEnabled?: boolean
  phoneBindLimitEnabled?: boolean
  phoneBindLimitPeriod?: string
  phoneBindLimitQuantity?: number
  status?: number
}

/** 复合保存 SPU */
export interface SpuSaveReqVO {
  spuCode?: string
  spuName: string
  subtitle?: string
  brandId: number
  primaryCategoryId?: number
  secondaryCategoryIds?: number[]
  sellableCategory: string
  productType: string
  productClassification: string
  coverUrl?: string
  sliderImageUrls?: string[]
  useInstruction?: string
  description?: string
  deliveryType?: string
  minQuantity?: number
  maxQuantity?: number
  status?: number
  skus: SkuItemSaveReqVO[]
}

/** 详情 SKU */
export interface SkuDetail extends SkuItemSaveReqVO {
  targetSchemaCode?: string
  targetSchemaVersion?: number
  resultSchemaCode?: string
  resultSchemaVersion?: number
  effectiveSellable?: boolean
}

/** 平台 SPU 详情 */
export interface SpuDetail {
  spuCode?: string
  spuName?: string
  subtitle?: string
  brandId?: number
  brandName?: string
  primaryCategoryId?: number
  primaryCategoryName?: string
  secondaryCategoryIds?: number[]
  sellableCategory?: string
  productType?: string
  productClassification?: string
  coverUrl?: string
  sliderImageUrls?: string[]
  useInstruction?: string
  description?: string
  deliveryType?: string
  minQuantity?: number
  maxQuantity?: number
  status?: number
  skus?: SkuDetail[]
  createdAt?: string
  updatedAt?: string
}

export interface ProductCategoryVO {
  id?: number
  parentId: number
  name: string
  code?: string
  typeCodes?: string[]
  status: number
  remark?: string
  spuCount?: number
  children?: ProductCategoryVO[]
  updateTime?: string
}

export interface ProductBrandVO {
  id?: number
  name: string
  shortName?: string
  code: string
  logo?: string
  intro?: string
  spuCount?: number
  protectedBrand?: boolean
  updateTime?: string
}

export interface ProductTypeVO {
  id?: number
  name: string
  code: string
  icon?: string
  status: number
  remark?: string
  spuCount?: number
  skuCount?: number
  updateTime?: string
}
