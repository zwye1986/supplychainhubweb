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
  /** 可售品类 */
  categoryCode: string
  categoryName?: string
  /** 商品类型 */
  productType?: string
  productTypeName?: string
  /** 商品分类 */
  productCategory?: string
  productCategoryName?: string
  /** 供货模式（可多选）：dropshipping / batch / pickup / api / h5 */
  supplyMode?: string[]
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
  /** 商品名称 */
  spuName?: string
  skuId?: number
  /** SKU规格 */
  skuName?: string
  /** SKU编号 */
  skuCode?: string
  categoryCode?: string
  categoryName?: string
  productType?: string
  productTypeName?: string
  productCategory?: string
  productCategoryName?: string
  /** 销售建议价（元） */
  suggestPrice?: number
  /** 供应价模式：1固定值 / 2实时更新 / 3按供货折扣 */
  supplyPriceMode?: number
  /** 供应价（元） */
  supplyPrice?: number
  /** 供货折扣（%） */
  supplyDiscount?: number
  /** 供货模式（可多选） */
  supplyMode?: string[]
  supplyLimit?: number
  minOrderQty?: number
  /** 上架状态：0下架 / 1上架 */
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
  /** 可售品类（列表展示 / 筛选） */
  category?: string[]
  /** 商品类型（列表展示） */
  productType?: string[]
  /** 商品分类（列表展示） */
  productCategory?: string[]
  /** 供货模式（列表展示 / 筛选，字符串编码）：dropshipping / batch / api 等 */
  supplyMode?: string[]
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
  /** 营业执照文件 URL 列表，最多 5 个 */
  businessLicenseUrls?: string[]
  legalPersonName?: string
  /** 法人身份证正反面 URL 列表，最多 2 个 */
  legalIdUrls?: string[]
  legalPersonMobile?: string
  contactAddress?: string
  settlementType?: string
  settlementCycle?: number
  /** 对接方式：api / h5 / manual，多选 */
  integrationMethods?: string[]
  /** 正式接入日期 YYYY-MM-DD */
  accessDate?: string
  /** 接入时间（列表展示，兼容旧字段） */
  accessTime?: string
  /** 合作说明 */
  cooperationRemark?: string
  bankName?: string
  bankAccount?: string
  /** 当前账户可用余额 */
  accountBalance?: number
  /** 其他资质文件 URL 列表，最多 5 个 */
  otherCertUrls?: string[]
  remark?: string
  contacts?: SupplierContactVO[]
  supplyConfigs?: SupplierSupplyConfigVO[]
  productCount?: number
  /** 合作商品 SKU 数（列表展示） */
  skuCount?: number
  contactName?: string
  contactMobile?: string
  updateTime?: string
  createTime?: string
}

/** 供应商分页查询参数 */
export interface SupplierPageParam {
  pageNo: number
  pageSize: number
  name?: string
  code?: string
  category?: string[]
  supplyMode?: string[]
  status?: number[]
  updateTime?: string[]
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
  productType?: string
  productCategory?: string
  marketPrice?: number
}
