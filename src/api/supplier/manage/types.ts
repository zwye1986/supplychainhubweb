/** 联系人 */
export interface SupplierContactVO {
  id?: number
  name: string
  mobile: string
  email?: string
}

/** 新增/编辑供应商请求体（SupplierSaveReqVO） */
export interface SupplierSaveReqVO {
  supplierName: string
  contacts?: SupplierContactVO[]
  deliveryRegionType: string
  deliveryRegionAdcodes?: string[]
  aftersalesSupported: boolean
  shippingSlaCode?: string
  shippingSlaCustom?: string
  settlementMethod?: string
  settlementCycleDays?: number
  integrationModes?: string[]
  /** date-time */
  onboardedAt?: string
  status?: string
  cooperationNote?: string
  legalEntityName: string
  creditCode: string
  legalPersonName?: string
  legalPersonMobile?: string
  contactAddress?: string
  bankName?: string
  bankAccount?: string
  licenseFileKey?: string
  idFrontFileKey?: string
  idBackFileKey?: string
  qualificationFileKey?: string
  licenseFileKeys?: string[]
  qualificationFileKeys?: string[]
  capabilityTags?: string[]
  /** 期初余额，单位 CNY 分，仅创建可写 */
  openingBalanceCents?: number
}

/** 供货配置视图（接口 SupplyScopeView） */
export interface SupplyScopeView {
  id?: number
  categoryL1Id?: number
  categoryL1Name?: string
  categoryL2Id?: number
  categoryL2Name?: string
  categoryL3Id?: number
  categoryL3Name?: string
  supplyModes?: string[]
  maxQuantity?: number
  minQuantity?: number
}

/** 保存供货配置行（接口 ScopeReqVO） */
export interface ScopeReqVO {
  /** 可售品类内部主键 */
  categoryL1Id: number
  /** 商品类型内部主键 */
  categoryL2Id: number
  /** 商品分类内部主键 */
  categoryL3Id: number
  /** 供货模式枚举名列表，不可为空 */
  supplyModes: string[]
  /** 单次最大数量 */
  maxQuantity: number
  /** 单次最小数量 */
  minQuantity: number
}

/** 全量保存供货配置（接口 SaveScopesReqVO） */
export interface SaveScopesReqVO {
  /** 供货配置行，三元组唯一 */
  lines: ScopeReqVO[]
}

/** 供货配置（接口 SupplierSupplyScopeDO） */
export interface SupplierSupplyScopeDO {
  id?: number
  supplierId?: number
  categoryL1Id?: number
  categoryL2Id?: number
  categoryL3Id?: number
  /** 供货模式，接口为单个字符串 */
  supplyMode?: string
  maxQuantity?: number
  minQuantity?: number
  version?: number
  createdBy?: number
  createdAt?: string
  updatedBy?: number
  updatedAt?: string
}

/** 命名引用（类目等） */
export interface NamedRef {
  id?: number
  name?: string
}

/** 供货配置（表单/详情旧结构，逐步迁移） */
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

/** 开票信息视图（接口 SupplierInvoiceView） */
export interface SupplierInvoiceView {
  /** 供应商开票信息内部主键 */
  id?: number
  /** 是否已有开票行；false 时为档案预填且未落库 */
  persisted?: boolean
  supplierCode?: string
  /** 抬头类型：ENTERPRISE 企业，PERSONAL 个人 */
  titleType?: string
  invoiceTitle?: string
  socialCreditCode?: string
  phone?: string
  bankName?: string
  bankAccount?: string
  invoiceAddress?: string
  createdAt?: string
  updatedAt?: string
}

/** 开票信息保存（接口 InvoiceSaveReqVO） */
export interface InvoiceSaveReqVO {
  titleType?: string
  invoiceTitle?: string
  socialCreditCode?: string
  phone?: string
  bankName?: string
  bankAccount?: string
  invoiceAddress?: string
}

/** 开票信息（兼容旧 mock） */
export interface SupplierInvoiceVO extends SupplierInvoiceView {
  supplierId?: number
}

/** 合作商品列表项（接口 OfferListItem） */
export interface OfferListItem {
  /** 供应商报价稳定业务编号 */
  offerNo?: string
  platformSpuCode?: string
  platformSpuName?: string
  platformSkuCode?: string
  platformSkuName?: string
  categoryL1Id?: number
  categoryL1Name?: string
  categoryL2Id?: number
  categoryL2Name?: string
  categoryL3Id?: number
  categoryL3Name?: string
  /** L1 B端结算单价，CNY 分 */
  suggestPriceCents?: number
  /** 供应价模式：FIXED / REALTIME / DISCOUNT */
  priceMode?: string
  /** 草稿供应价，CNY 分；REALTIME 为空 */
  unitPriceCents?: number
  /** 折扣基点，10000=100% */
  discountBp?: number
  /** 该 Offer 供货模式 */
  offerSupplyMode?: string
  maxQuantity?: number
  minQuantity?: number
  /** 生命周期：PUBLISHED 已发布，SUSPENDED 暂停 */
  status?: string
}

/** 合作商品行（接口 DraftReqVO） */
export interface DraftReqVO {
  platformSkuCode: string
  priceMode: string
  unitPriceCents?: number
  discountBp?: number
  suggestedPriceCents?: number
  supplyMode: string
  maxQuantity?: number
  minQuantity?: number
}

/** 批量新增合作商品（接口 OfferItemsReqVO） */
export interface OfferItemsReqVO {
  items?: DraftReqVO[]
  lines?: DraftReqVO[]
}

/** 合作商品上架或下架（接口 PatchOfferReqVO） */
export interface PatchOfferReqVO {
  /** 目标状态：仅 PUBLISHED / SUSPENDED */
  status: string
}

/** 合作商品分页查询 */
export interface OfferPageParam {
  pageNo?: number
  pageSize?: number
  categoryL1Id?: number
  categoryL2Id?: number
  categoryL3Id?: number
}

/** 合作商品表单行（列表展示字段 + 草稿提交字段） */
export interface OfferFormItem extends OfferListItem {
  supplyMode?: string
  suggestedPriceCents?: number
}

/** 合作商品（表单/详情旧结构，逐步迁移） */
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

/** 供应商（列表字段对齐 GET /supply-chain/suppliers） */
export interface SupplierVO {
  id?: number
  /** 供应商永久业务编码 */
  supplierCode?: string
  /** 供应商标准名称 */
  supplierName?: string
  /** 合作状态：ACTIVE / SUSPENDED / BLACKLIST */
  status?: string
  /** 可售品类 */
  categories?: NamedRef[]
  /** 商品类型 */
  productTypes?: NamedRef[]
  /** 商品分类 */
  productCategories?: NamedRef[]
  /** 供货模式（name 为枚举名，如 API_DIRECT） */
  supplyModes?: NamedRef[]
  skuCount?: number
  /** 正式接入时间（毫秒时间戳） */
  onboardedAt?: number | string | null
  /** 最后修改时间（毫秒时间戳） */
  updatedAt?: number | string | null
  primaryContactName?: string | null
  primaryContactMobile?: string | null
  /** 供货配置（详情） */
  scopes?: SupplyScopeView[]
  scopeCount?: number
  settlementBalanceCents?: number
  deliveryRegionType?: string
  deliveryRegionAdcodes?: string[]
  aftersalesSupported?: boolean
  shippingSlaCode?: string
  shippingSlaCustom?: string
  settlementMethod?: string
  settlementCycleDays?: number
  cooperationNote?: string
  legalEntityName?: string
  creditCode?: string
  legalPersonName?: string
  legalPersonMobile?: string
  legalPersonMobileMasked?: string
  contactAddress?: string
  bankName?: string
  bankAccount?: string
  bankAccountMasked?: string
  licenseFileKey?: string
  idFrontFileKey?: string
  idBackFileKey?: string
  qualificationFileKey?: string
  licenseFileKeys?: string[]
  qualificationFileKeys?: string[]
  integrationModes?: string[]
  contacts?: SupplierContactVO[]
  capabilityTags?: string[]
  openingBalanceCents?: number

  // —— 以下为表单/详情 mock 兼容旧字段，待后续整体迁移 ——
  /** @deprecated 使用 supplierCode */
  code?: string
  /** @deprecated 使用 supplierName */
  name?: string
  shortName?: string
  category?: string[]
  productType?: string[]
  productCategory?: string[]
  supplyMode?: string[]
  deliveryAreaType?: string
  deliveryAreaId?: number
  shippingTimeliness?: string
  shippingTimelinessCustom?: string
  supportAfterSale?: boolean
  companyName?: string
  socialCreditCode?: string
  businessLicenseUrls?: string[]
  legalIdUrls?: string[]
  legalPersonMobile?: string
  settlementType?: string
  settlementCycle?: number
  integrationMethods?: string[]
  accessDate?: string
  accessTime?: string
  cooperationRemark?: string
  bankAccount?: string
  accountBalance?: number
  otherCertUrls?: string[]
  remark?: string
  supplyConfigs?: SupplierSupplyConfigVO[]
  productCount?: number
  contactName?: string
  contactMobile?: string
  updateTime?: string
  createTime?: string
}

/** 变更供应商合作状态（ChangeStatusReqVO） */
export interface ChangeStatusReqVO {
  /** 目标合作状态：ACTIVE 正常，SUSPENDED 暂停供货，BLACKLIST 黑名单 */
  targetStatus: string
}

/** 供应商分页查询参数（对齐 GET /supply-chain/suppliers） */
export interface SupplierPageParam {
  pageNo: number
  pageSize: number
  supplierName?: string
  supplierCode?: string
  status?: string[]
  /** 可售品类（后续改为字典值；当前可先用本地选项） */
  categoryL1Ids?: Array<string | number>
  supplyModes?: string[]
  updatedFrom?: string
  updatedTo?: string
  view?: string
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
