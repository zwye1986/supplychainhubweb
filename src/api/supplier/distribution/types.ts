/** 联系人 */
export interface DistributorContactVO {
  id?: number
  name: string
  mobile: string
  email?: string
}

/** 新增分销商请求体（BuyerSaveReqVO） */
export interface BuyerSaveReqVO {
  buyerName: string
  contacts?: DistributorContactVO[]
  /** 上级分销商编码，一级为空 */
  parentBuyerCode?: string
  /** 组织等级，字典 supply_chain_distribution_level */
  distributionLevel?: string
  /** ENTERPRISE / PERSONAL / PLATFORM */
  distributorType?: string
  supplyPreference?: string
  settlementMethod?: string
  settlementCycleDays?: number
  cooperationModes?: string[]
  /** API / H5 / MANUAL */
  integrationModes?: string[]
  /** 合作开始时间，Asia/Shanghai */
  cooperationStartedAt?: string
  cooperationNote?: string
  legalEntityName?: string
  creditCode?: string
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
  categoryL1Ids?: Array<string | number>
  categoryL2Ids?: Array<string | number>
  /** 期初余额，单位 CNY 分，仅创建可写（空视为 0）；编辑再带会拒绝 */
  openingBalanceCents?: number
}

/** 批量暂停或恢复（BatchStatusReqVO） */
export interface BatchStatusReqVO {
  /** 文档字段名为 supplierCodes，值为分销商 buyerCode */
  supplierCodes: string[]
  /** 合作状态，优先于 targetStatus：仅 ACTIVE / SUSPENDED */
  status?: string
  /** 兼容字段，status 为空时使用 */
  targetStatus?: string
}

/** 开票信息视图（GET/PUT /buyers/{buyerCode}/invoice） */
export interface BuyerInvoiceView {
  /** 分销商开票信息内部主键 */
  id?: number
  /** 是否已有开票行；false 时为档案预填且未落库 */
  persisted?: boolean
  buyerCode?: string
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

/** 开票信息保存（InvoiceSaveReqVO） */
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
export interface DistributorInvoiceVO extends BuyerInvoiceView {
  distributorId?: number
}

/** 项目详情 / 列表项（GET /supply-chain/projects、GET /projects/{projectCode}） */
export interface ProjectDetail {
  /** 采购项目内部主键，只读 */
  id?: number
  /** 采购项目全局永久编码 */
  projectCode?: string
  /** 采购项目名称 */
  projectName?: string
  /** 项目状态：DRAFT / ACTIVE */
  status?: string
  /** 采购商永久业务编码 */
  buyerCode?: string
  /** 采购商标准名称 */
  buyerName?: string
  /** 项目类型封闭枚举 */
  projectType?: string
  /** 项目开始日 */
  startDate?: string
  /** 项目结束日 */
  endDate?: string
  /** 结算方，本期仅 DISTRIBUTOR */
  settlementPartyType?: string
  /** 项目说明 */
  description?: string
  /** 目录模式：MANAGED 中台管理，INDEPENDENT 项目独立 */
  catalogMode?: string
  /** 未移除项目商品数量 */
  skuCount?: number
  /** 当前 listing 中 settlement_price_level=L3 的数量 */
  projectPriceSkuCount?: number
}

/** 项目（项目管理 / 分销商关联项目共用） */
export type ProjectVO = ProjectDetail

/** 分销商详情-关联项目卡片，与项目主体同一结构 */
export type DistributorProjectVO = ProjectDetail

/** 新增 / 保存项目（ProjectSaveReqVO） */
export interface ProjectSaveReqVO {
  projectName: string
  buyerCode: string
  projectType?: string
  startDate?: string
  endDate?: string
  settlementPartyType?: string
  description?: string
  /** 创建时允许 DRAFT 或 ACTIVE，空视为草稿 */
  status?: string
}

/** 项目分页查询参数（GET /supply-chain/projects） */
export interface ProjectPageParam {
  pageNo: number
  pageSize: number
  projectName?: string
  projectCode?: string
  /** 项目状态枚举名，可多选 */
  status?: string[]
  buyerCode?: string
  /** 项目类型封闭枚举，可多选 */
  projectType?: string[]
  periodFrom?: string
  periodTo?: string
  /** simple 为名称下拉 {projectCode,projectName}[] */
  view?: string
}

/** 项目商品列表项（GET /projects/{projectCode}/products） */
export interface ProjectListingListItem {
  /** 项目商品稳定业务编码 */
  listingCode?: string
  /** 平台 SKU 编码 */
  platformSkuCode?: string
  skuName?: string
  /** 建议结算价，当前 L1，单位 CNY 分 */
  suggestPriceCents?: number
  /** 当前有效 L2，单位 CNY 分 */
  distPriceCents?: number
  /** 当前版本为 L3 时的冻结单价，单位 CNY 分 */
  projectPriceCents?: number
  /** 当前冻结版本单价，单位 CNY 分 */
  finalPriceCents?: number
  /** 冻结版本结算层级：L1 / L2 / L3 */
  priceSource?: string
  /** 当前版本 settlement_price_level 是否 L3 */
  projectPriceCovered?: boolean
}

/** 从分销商品发布到项目（单行） */
export interface ProjectProductItemReqVO {
  platformSkuCode: string
  /** L3 调价方式：FOLLOW_L2 / EQUAL_L1 / CUSTOM，默认 FOLLOW_L2 */
  l3AdjustMode?: string
  /** CUSTOM 时的整数百分比，100 等于 L1 */
  percent?: number
  /** CUSTOM 时加减的 CNY 分 */
  amountCents?: number
}

/** 从分销商品批量发布到项目 */
export interface AddProjectProductsReqVO {
  items: ProjectProductItemReqVO[]
}

/** 改项目商品 L3 覆盖（PatchProjectListingReqVO） */
export interface PatchProjectListingReqVO {
  l3AdjustMode: string
  percent?: number
  amountCents?: number
}

/** 分销商品列表项（GET /buyers/{buyerCode}/products） */
export interface BuyerProductListItem {
  /** 分销商品稳定业务编码 */
  buyerProductCode?: string
  platformSkuCode?: string
  skuName?: string
  spuCode?: string
  spuName?: string
  categoryPath?: string
  /** 建议结算价，当前 L1，单位 CNY 分 */
  suggestPriceCents?: number
  /** 定价规则文案：模板 / 等于L1 / 自定义公式 */
  pricingRule?: string
  /** 有效 L2，单位 CNY 分 */
  distPriceCents?: number
  /** 恰有一个未移除项目 listing 时的当前版本单价，单位 CNY 分 */
  projectPriceCents?: number
  /** 按 L3>L2>L1 解析的有效 B 端结算价，单位 CNY 分 */
  finalPriceCents?: number
  /** 价格来源层级：L1 / L2 / L3 */
  priceSource?: string
  /** 是否被多个项目 L3 覆盖 */
  projectPriceCovered?: boolean
  projectNames?: string[]
  /** 利润空间低于该百分比时 C 端隐藏，本批不消费 */
  displayThresholdPercent?: number
}

/** 分销商品分页查询 */
export interface BuyerProductPageParam {
  pageNo?: number
  pageSize?: number
}

/** 改分销商品 L2 覆盖（PatchBuyerProductReqVO） */
export interface PatchBuyerProductReqVO {
  /** L2 调价方式：FOLLOW_TEMPLATE / EQUAL_L1 / CUSTOM */
  l2AdjustMode: string
  /** CUSTOM 时的整数百分比，100 等于 L1 */
  percent?: number
  /** CUSTOM 时加减的 CNY 分 */
  amountCents?: number
  /** 利润空间低于该百分比时 C 端隐藏，本批不消费 */
  displayThresholdPercent?: number
}

/** 分销商品（SKU 级，三级定价，mock / 项目选品兼容） */
export interface DistributorProductVO {
  id?: number
  distributorId?: number
  spuId?: number
  spuName?: string
  skuId?: number
  skuName?: string
  skuCode?: string
  categoryCode?: string
  categoryName?: string
  productType?: string
  productTypeName?: string
  productCategory?: string
  productCategoryName?: string
  /** 销售建议价 / L1 平台默认定价（元） */
  suggestPrice?: number
  /** 供应价（元），用于利润空间计算 */
  supplyPrice?: number
  /** 分销价规则文案 */
  pricingRule?: string
  /** L2 分销价（元） */
  distPrice?: number
  /** L3 项目专属价（元） */
  projectPrice?: number
  /** 最终结算价（元） */
  finalPrice?: number
  /** 定价来源文案，如「项目专属价」「分销商基础价」 */
  priceSource?: string
  /** 调价方式：1按分销价=销售建议价 / 2自定义设置 */
  adjustMode?: number
  /** 自定义公式百分比部分 */
  adjustPercent?: number
  /** 自定义公式金额部分 */
  adjustAmount?: number
  /** 商品展示阈值（利润空间低于该值隐藏） */
  displayThreshold?: number
  /** 是否被项目专属价覆盖 */
  projectPriceCovered?: boolean
  projectNames?: string[]
  status?: number
  createTime?: string
}

/** 项目分销商品（SKU 级，项目专属价） */
export interface ProjectProductVO extends DistributorProductVO {
  projectId?: number
}

/** 命名引用（类目等） */
export interface NamedRef {
  id?: number
  name?: string
}

/** 分销商（列表字段对齐 GET /supply-chain/buyers） */
export interface DistributorVO {
  id?: number
  /** 采购商永久业务编码 */
  buyerCode?: string
  /** 采购商标准名称 */
  buyerName?: string
  /** 合作状态：ACTIVE / SUSPENDED / BLACKLIST */
  status?: string
  /** 组织等级：1 / 2 / 3 */
  distributionLevel?: number
  /** 合作模式枚举名 */
  cooperationModes?: string[]
  /** 可售品类（列表） */
  categories?: NamedRef[]
  /** 可售品类（详情） */
  categoryL1s?: NamedRef[]
  /** 商品类型（列表） */
  productTypes?: NamedRef[]
  /** 商品类型（详情） */
  categoryL2s?: NamedRef[]
  skuCount?: number
  projectCount?: number
  childCount?: number
  /** 合作时间 */
  cooperationTime?: string
  /** 最后修改时间 */
  updatedAt?: number | string | null
  primaryContactName?: string | null
  primaryContactMobile?: string | null

  // —— 以下为表单/详情 mock 兼容旧字段，待后续整体迁移 ——
  /** @deprecated 使用 buyerCode */
  code?: string
  /** @deprecated 使用 buyerName */
  name?: string
  shortName?: string
  /** @deprecated 使用 distributionLevel */
  level?: number
  /** 上级分销商 ID */
  parentId?: number
  parentName?: string
  /** @deprecated 使用 cooperationModes */
  cooperationMode?: string[]
  /** 上级分销商编码 */
  parentBuyerCode?: string
  parentBuyerName?: string
  /** 分销商类型：ENTERPRISE / PERSONAL / PLATFORM */
  distributorType?: string
  /** @deprecated 使用 categories / categoryL1Ids */
  category?: string[]
  categoryL1Ids?: Array<string | number>
  /** @deprecated 使用 productTypes / categoryL2Ids */
  productType?: string[]
  categoryL2Ids?: Array<string | number>
  supplyPreference?: string
  companyName?: string
  legalEntityName?: string
  socialCreditCode?: string
  creditCode?: string
  businessLicenseUrls?: string[]
  licenseFileKeys?: string[]
  licenseFileKey?: string
  legalPersonName?: string
  legalIdUrls?: string[]
  idFrontFileKey?: string
  idBackFileKey?: string
  legalPersonMobile?: string
  /** 法人手机号（详情脱敏） */
  legalPersonMobileMasked?: string
  contactAddress?: string
  settlementType?: string
  settlementMethod?: string
  settlementCycle?: number
  settlementCycleDays?: number
  integrationMethods?: string[]
  integrationModes?: string[]
  cooperationStartDate?: string
  cooperationStartedAt?: string
  cooperationRemark?: string
  cooperationNote?: string
  bankName?: string
  bankAccount?: string
  /** 开户账号（详情脱敏） */
  bankAccountMasked?: string
  accountBalance?: number
  /** 采购商账本余额，单位 CNY 分，只读 */
  accountBalanceCents?: number
  openingBalanceCents?: number
  qualificationFileKeys?: string[]
  qualificationFileKey?: string
  otherCertUrls?: string[]
  remark?: string
  contacts?: DistributorContactVO[]
  contactName?: string
  contactMobile?: string
  /** @deprecated 使用 updatedAt */
  updateTime?: string
  createTime?: string
}

/** 分销商详情（GET /supply-chain/buyers/{buyerCode}） */
export interface BuyerDetail {
  id?: number
  buyerCode?: string
  buyerName?: string
  status?: string
  parentBuyerCode?: string
  distributionLevel?: number
  distributorType?: string
  supplyPreference?: string
  settlementMethod?: string
  settlementCycleDays?: number
  cooperationStartedAt?: string
  cooperationNote?: string
  legalEntityName?: string
  creditCode?: string
  legalPersonName?: string
  legalPersonMobileMasked?: string
  contactAddress?: string
  bankName?: string
  bankAccountMasked?: string
  licenseFileKeys?: string[]
  qualificationFileKeys?: string[]
  integrationModes?: string[]
  cooperationModes?: string[]
  categoryL1s?: NamedRef[]
  categoryL2s?: NamedRef[]
  contacts?: DistributorContactVO[]
  primaryContactName?: string | null
  primaryContactMobile?: string | null
  /** 采购商账本余额，单位 CNY 分，只读 */
  accountBalanceCents?: number
}

/** 分销商分页查询参数（对齐 GET /supply-chain/buyers） */
export interface DistributorPageParam {
  pageNo: number
  pageSize: number
  buyerName?: string
  buyerCode?: string
  /** 组织等级，可多选：1 / 2 / 3 */
  distributionLevels?: number[]
  /** 合作模式枚举名，可多选 */
  cooperationModes?: string[]
  /** 可售品类内部主键，可多选 */
  categoryL1Ids?: Array<string | number>
  /** 管理状态枚举名：ACTIVE / SUSPENDED / BLACKLIST */
  status?: string[]
  updatedFrom?: string
  updatedTo?: string
  /** simple 名称下拉；parent-options 上级下拉 */
  view?: string
  excludeBuyerCode?: string
  forLevel?: number
}

/** 标品 SKU（新增分销商品弹窗） */
export interface DistPlatformSkuVO {
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
  supplyPrice?: number
}
