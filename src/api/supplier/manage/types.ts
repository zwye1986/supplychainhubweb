/** 联系人 */
export interface SupplierContactVO {
  id?: number
  name: string
  mobile: string
  email?: string
}

/** 供货配置 */
export interface SupplierSupplyConfigVO {
  id?: number
  categoryCode: string
  categoryName?: string
  supplyMode?: number
  supplyLimit?: number
  minOrderQty?: number
}

/** 开票信息 */
export interface SupplierInvoiceVO {
  id?: number
  supplierId?: number
  titleType: number
  invoiceTitle?: string
  socialCreditCode?: string
  phone?: string
  bankName?: string
  bankAccount?: string
  invoiceAddress?: string
}

/** 合作商品 */
export interface SupplierProductVO {
  id?: number
  supplierId?: number
  spuId?: number
  spuName?: string
  skuId?: number
  skuName?: string
  skuCode?: string
  categoryCode?: string
  categoryName?: string
  supplyPriceMode?: number
  supplyPrice?: number
  supplyDiscount?: number
  supplyMode?: number
  supplyLimit?: number
  minOrderQty?: number
  status?: number
  createTime?: string
}

/** 供应商 */
export interface SupplierVO {
  id?: number
  code?: string
  name: string
  shortName?: string
  status?: number
  capabilityTags?: string[]
  /** 配送区域类型：nationwide / specified */
  deliveryAreaType?: string
  /** 指定区域时的地区 ID（省市区） */
  deliveryAreaId?: number
  /** 发货时效：same_day / next_day / 48h / 72h / custom */
  shippingTimeliness?: string
  /** 自定义发货时效文案 */
  shippingTimelinessCustom?: string
  /** 是否支持售后 */
  supportAfterSale?: boolean
  companyName?: string
  socialCreditCode?: string
  legalPersonName?: string
  legalPersonIdNo?: string
  registerAddress?: string
  businessAddress?: string
  settlementType?: number | string
  settlementCycle?: number
  contractNo?: string
  contractStartDate?: string
  contractEndDate?: string
  accountName?: string
  bankName?: string
  bankAccount?: string
  businessLicenseUrl?: string
  legalIdFrontUrl?: string
  legalIdBackUrl?: string
  otherCertUrls?: string[]
  remark?: string
  contacts?: SupplierContactVO[]
  supplyConfigs?: SupplierSupplyConfigVO[]
  productCount?: number
  contactName?: string
  contactMobile?: string
  updateTime?: string
  createTime?: string
}

/** 标品 SKU（新增商品弹窗） */
export interface PlatformSkuVO {
  spuId: number
  spuName: string
  skuId: number
  skuName: string
  skuCode: string
  categoryCode: string
  categoryName: string
  marketPrice?: number
}
