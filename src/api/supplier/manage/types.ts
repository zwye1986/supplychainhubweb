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
  sellableCategory?: string
  productType?: string
  productClassification?: string
  /** 主类目内部主键 */
  categoryId?: number
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
  /** 供货配置主键；已有行编辑必传，新行为空 */
  id?: number
  /** 可售品类枚举名 */
  sellableCategory: string
  /** 动态商品类型编码 */
  productType: string
  /** 商品分类：字典枚举名或类目 categoryCode */
  productClassification: string
  /** 供货模式枚举名列表，不可为空 */
  supplyModes: string[]
  /** 供货上限 */
  maxQuantity: number
  /** 允许最低起订量，预留字段 */
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
  sellableCategory?: string
  productType?: string
  productClassification?: string
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

/** 命名引用（类目等）；列表也可能直接返回业务编码字符串 */
export interface NamedRef {
  id?: string | number
  name?: string
}

/** 列表字段：{ id, name }[] 或业务编码 string[] */
export type NamedRefOrCode = string | number | NamedRef

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
  /** 平台SPU永久业务编码 */
  platformSpuCode?: string
  /** 平台SPU标准名称 */
  platformSpuName?: string
  /** 平台SKU永久业务编码 */
  platformSkuCode?: string
  /** 平台SKU标准名称 */
  platformSkuName?: string
  /** 可售品类封闭枚举名 */
  sellableCategory?: string
  /** 动态商品类型编码 */
  productType?: string
  /** 商品分类封闭枚举名 */
  productClassification?: string
  /** L1 B端结算单价，CNY 分，允许0 */
  suggestPriceCents?: number
  /** 建议零售价/销售建议价，单位为分 */
  suggestedSalePriceCents?: number | null
  /** 供应价模式：FIXED固定值，REALTIME实时，DISCOUNT折扣 */
  priceMode?: string
  /** 草稿供应价，CNY分；REALTIME为空 */
  unitPriceCents?: number
  /** 折扣基点，10000=100% */
  discountBp?: number
  /** 该 Offer 供货模式 */
  offerSupplyMode?: string
  /** 草稿供货上限 */
  maxQuantity?: number
  /** 草稿最低起购量 */
  minQuantity?: number
  /** 稳定性评分，人工录入，0-100 */
  stabilityScore?: number
  /** 时效性评分，人工录入，0-100 */
  timelinessScore?: number
  /** 是否含税 */
  taxIncluded?: boolean
  /** 税率编码 */
  taxRateCode?: string
  /** 生命周期：PUBLISHED已发布，SUSPENDED暂停 */
  status?: string
  /** 供应商侧商品编码（f1 身份行 external_sku_code），上架时冻结进版本行 */
  externalSkuCode?: string
  /** 当前已发布履约版本ID；为空表示尚未配置履约 */
  currentVersionId?: number | null
  /** Offer 聚合乐观锁版本号，上架须回传作为 expectedOfferVersion */
  offerVersion?: number
  /** i-b 履约就绪度三态：NOT_CONFIGURED未发布版本，STALE待发布变更，READY配置一致 */
  fulfillmentStatus?: string
  /** 是否满足上架/发布变更前置条件，后端正式接口做最终校验 */
  canPublish?: boolean
  /** 不可发布时的中文阻断原因；可发布时为空 */
  publishBlockedReason?: string | null
}

/** 合作商品行（接口 DraftReqVO） */
export interface DraftReqVO {
  /** 平台 SKU 永久业务编码 */
  platformSkuCode: string
  /** 供应价模式：FIXED固定值，REALTIME实时，DISCOUNT折扣 */
  priceMode: string
  /** 草稿供应价，CNY 分；REALTIME 为空 */
  unitPriceCents?: number
  /** 折扣基点，10000=100% */
  discountBp?: number
  /** 历史兼容提示价，CNY 分；非权威基数，服务端折扣准入读取 SKU 销售建议价 */
  suggestedPriceCents?: number
  /** 该 Offer 供货模式 */
  supplyMode: string
  /** 草稿供货上限，空则继承供货配置 */
  maxQuantity?: number
  /** 草稿最低起购量，空则取 1，不继承供货配置预留字段 */
  minQuantity?: number
  /** 供应商外部商品编码（f1），选合作商品时录入，下单时据此定位履约商品 */
  externalSkuCode: string
}

/** 履约能力评分保存（接口 FulfillmentScoreSaveReqVO） */
export interface FulfillmentScoreSaveReqVO {
  /** 稳定性评分，人工录入，0-100 */
  stabilityScore?: number
  /** 时效性评分，人工录入，0-100 */
  timelinessScore?: number
  /** 平台SKU永久业务编码列表；省略则覆盖该供应商全部未退役 Offer */
  platformSkuCodes?: string[]
}

/** 履约能力评分更新结果 */
export interface ScoreUpdateResult {
  /** 本次更新的未退役 Offer 行数 */
  updatedCount?: number
}

/** 批量新增合作商品（接口 OfferItemsReqVO，items 优先，兼容 lines） */
export interface OfferItemsReqVO {
  /** 合作商品行，优先于 lines */
  items?: DraftReqVO[]
  /** 兼容 batch-draft 的 lines */
  lines?: DraftReqVO[]
}

/** 合作商品上架或下架（接口 PatchOfferReqVO） */
export interface PatchOfferReqVO {
  /** 目标状态：仅 PUBLISHED / SUSPENDED */
  status: string
}

/** 上架即发布（B1）请求体：前端只传可选 validTo，其余服务端派生（接口 ListOnShelfReqVO） */
export interface ListOnShelfReqVO {
  /** 履约版本失效时间（UTC）；空＝长期有效（k1）。须晚于 validFrom（=上架时刻） */
  validTo?: string
}

/** 上架即发布结果（接口 PublishResult） */
export interface OfferPublishResult {
  /** 合作商品稳定业务编号 */
  offerNo?: string
  /** 新发布的履约版本ID */
  offerVersionId?: number
  /** 履约版本序号 */
  offerVersionNo?: number
  /** Offer 聚合乐观锁版本号 */
  aggregateVersion?: number
}

/** 合作商品分页查询 */
export interface OfferPageParam {
  pageNo?: number
  pageSize?: number
  sellableCategory?: string
  productType?: string
  productClassification?: string
}

/** 合作商品表单行（列表展示字段 + 草稿提交字段） */
export interface OfferFormItem extends OfferListItem {
  supplyMode?: string
  /** SKU 销售建议价的兼容提交提示，非服务端权威基数 */
  suggestedPriceCents?: number | null
  taxIncluded?: boolean
  taxRateCode?: string
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
  /** 可售品类；封闭枚举，name 可用字典 supply_chain_sellable_category 解析 */
  sellableCategories?: NamedRefOrCode[]
  /** @deprecated 使用 sellableCategories */
  categories?: NamedRefOrCode[]
  /** 商品类型；动态配置，name 来自商品类型接口 */
  productTypes?: NamedRefOrCode[]
  /** 商品分类；动态配置，name 来自分类树接口 */
  productCategories?: NamedRefOrCode[]
  /** @deprecated 同 productCategories，部分接口字段名 */
  productClassifications?: NamedRefOrCode[]
  /** 供货模式（name 为枚举名，如 API_DIRECT） */
  supplyModes?: NamedRefOrCode[]
  skuCount?: number
  /** 正式接入时间 */
  onboardAt?: number | string | null
  /** @deprecated 使用 onboardAt */
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
  /** 指定配送区域（省/市/区对象，展示用 name） */
  deliveryRegions?: NamedRef[]
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
