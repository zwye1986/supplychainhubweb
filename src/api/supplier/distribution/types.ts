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
  /** 可售品类枚举名 */
  sellableCategories?: string[]
  categoryL1Ids?: Array<string | number>
  /** 商品类型，接口 typeCode */
  productTypes?: string[]
  /** 期初余额，单位 CNY 分，仅创建可写（空视为 0）；编辑再带会拒绝 */
  openingBalanceCents?: number
}

/** 批量暂停或恢复（BuyerBatchStatusReqVO） */
export interface BatchStatusReqVO {
  /** 采购商永久业务编码列表 */
  buyerCodes: string[]
  /** 管理状态，仅 ACTIVE / SUSPENDED */
  status: string
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
  /** 创建允许 DRAFT / ACTIVE，空视为草稿；编辑可通过 PUT 整档替换修改状态 */
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

/** 项目综合定价公式回显（ProjectFormulaRuleView） */
export interface ProjectFormulaRuleView {
  /** DIRECT_MARKET_PRICE 直接等于市场价；CUSTOM 自定义公式 */
  mode?: string
  /** MARKET_PRICE / SUGGESTED_SALE_PRICE / SUPPLY_PRICE */
  base?: string
  percentage?: number
  /** ADD / SUBTRACT / MULTIPLY / DIVIDE */
  operator?: string
  operand?: number
}

/** 当前项目综合定价版本（ProjectPricingConfigView） */
export interface ProjectPricingConfigView {
  distributionInherited?: boolean
  distributionRule?: ProjectFormulaRuleView | null
  salesInherited?: boolean
  salesRule?: ProjectFormulaRuleView | null
  serviceFeeInherited?: boolean
  serviceFeeRule?: {
    percentage?: number
    operator?: string
    operand?: number
    hideCopy?: boolean
    copy?: string
  } | null
  hideInherited?: boolean
  hideRule?: {
    distributionThresholdPercent?: number | null
    salesThresholdPercent?: number | null
  } | null
  taxInherited?: boolean
  taxMetadata?: {
    taxIncluded?: boolean
    taxRateCode?: string
    taxRateLabel?: string | null
  } | null
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
  /** 平台 SKU 销售建议价，单位 CNY 分 */
  suggestedSalePriceCents?: number
  /** 项目旧调价模式的 B 端平台基价，单位 CNY 分 */
  platformBasePriceCents?: number
  /** 当前有效分销价，优先通用版本，单位 CNY 分 */
  distPriceCents?: number
  /** 当前版本为 L3 时的冻结单价，单位 CNY 分 */
  projectPriceCents?: number
  /** 当前冻结版本单价，单位 CNY 分 */
  finalPriceCents?: number
  /** 冻结版本结算层级：L1 / L2 / L3 */
  priceSource?: string
  /** 当前版本 settlement_price_level 是否 L3 */
  projectPriceCovered?: boolean
  /** 当前项目综合定价版本；无当前版本时为空 */
  projectPricingConfig?: ProjectPricingConfigView | null
}

/** 从分销商品发布到项目（单行）。pricing 省略则继承分销商定价；传入时同事务保存项目覆盖。 */
export interface ProjectProductItemReqVO {
  platformSkuCode: string
  /** L3 调价方式：FOLLOW_L2 / EQUAL_L1 / CUSTOM，默认 FOLLOW_L2 */
  l3AdjustMode?: string
  /** CUSTOM 时的整数百分比，100 等于项目调价所用的平台基价 */
  percent?: number
  /** CUSTOM 时加减的 CNY 分 */
  amountCents?: number
  /** 项目五组定价覆盖；distributionInherited=false 时形成项目专属价 */
  pricing?: BuyerProductCreatePricingReqVO
}

/** 从分销商品批量发布到项目 */
export interface AddProjectProductsReqVO {
  items: ProjectProductItemReqVO[]
}

/** 改项目商品 L3 覆盖（PatchProjectListingReqVO）。pricing 省略且 l3AdjustMode=FOLLOW_L2 表示不配置专属价 */
export interface PatchProjectListingReqVO {
  l3AdjustMode?: string
  percent?: number
  amountCents?: number
  pricing?: BuyerProductCreatePricingReqVO
}

/** 项目利润隐藏阈值。hideInherited=false 时提交 */
export interface ProjectHideRuleReqVO {
  /** 分销区利润隐藏阈值百分数，0 到 100，最多 2 位小数 */
  distributionThresholdPercent?: number
  /** 销售区利润隐藏阈值百分数，0 到 100，最多 2 位小数 */
  salesThresholdPercent?: number
}

/** 项目税务。taxInherited=false 时 taxIncluded 与 taxRateCode 需同时提交 */
export interface ProjectTaxMetadataReqVO {
  taxIncluded?: boolean
  /** system 动态字典 supply_chain_tax_rate 的启用值 */
  taxRateCode?: string
}

/**
 * 批量保存项目综合定价（PUT /projects/{projectCode}/products/pricing）
 * 五组配置可分别继承分销商；未配置的组传 inherited=true 且不带规则。
 */
export interface ProjectProductBatchPricingReqVO {
  /** 当前项目下的项目商品编码列表 */
  listingCodes: string[]
  /** true 时继承分销商分销价；false 时必须提交 distributionRule */
  distributionInherited: boolean
  distributionRule?: DistFormulaRuleReqVO
  /** true 时继承分销商销售价；false 时必须提交 salesRule */
  salesInherited: boolean
  salesRule?: DistFormulaRuleReqVO
  /** true 时继承分销商服务费；false 时必须提交 serviceFeeRule */
  serviceFeeInherited: boolean
  serviceFeeRule?: DistServiceFeeRuleReqVO
  /** true 时继承分销商利润隐藏阈值；false 时必须提交 hideRule */
  hideInherited: boolean
  hideRule?: ProjectHideRuleReqVO
  /** true 时继承分销商税务；false 时须同时提交 taxIncluded 与 taxRateCode */
  taxInherited: boolean
  taxMetadata?: ProjectTaxMetadataReqVO
}

/** 分销商品列表项（GET /buyers/{buyerCode}/products） */
export interface BuyerProductListItem {
  /** 分销商品稳定业务编码 */
  buyerProductCode?: string
  platformSkuCode?: string
  skuName?: string
  spuCode?: string
  spuName?: string
  coverUrl?: string
  categoryPath?: string
  /** 市场价，单位 CNY 分 */
  marketPriceCents?: number
  marketPrice?: number
  /** 建议结算价，当前 L1，单位 CNY 分 */
  suggestPriceCents?: number
  /** 平台 SKU 销售建议价，单位 CNY 分 */
  suggestedSalePriceCents?: number
  /** 项目旧调价模式的 B 端平台基价，单位 CNY 分 */
  platformBasePriceCents?: number
  /** 定价规则文案：模板 / 等于L1 / 自定义公式 */
  pricingRule?: string
  /** 是否含税 */
  taxIncluded?: boolean
  /** 有效 L2，单位 CNY 分 */
  distPriceCents?: number
  /** 不含税分销价，单位 CNY 分 */
  distPriceExclusiveCents?: number
  distPriceExclusive?: number
  taxRateCode?: string
  taxRate?: number
  taxRateDisplay?: string
  /** 税额，单位 CNY 分 */
  taxAmountCents?: number
  taxAmount?: number
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
  /** 可售品类封闭枚举名 */
  sellableCategory?: string
  /** 动态商品类型编码 */
  productType?: string
  /** 商品分类封闭枚举名 */
  productClassification?: string
}

/** 分销商品分页查询 */
export interface BuyerProductPageParam {
  pageNo?: number
  pageSize?: number
  /** 动态商品类型编码，可多选；重复键 productType=A&productType=B */
  productType?: string | string[]
  /** 项目新增商品选品时排除该项目已加入且未移除的商品 */
  projectCode?: string
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

/** 分销价 / 销售价公式（FormulaRuleReqVO） */
export interface DistFormulaRuleReqVO {
  /** DIRECT_MARKET_PRICE 直接等于市场价，CUSTOM 自定义 */
  mode: string
  /** MARKET_PRICE / SUGGESTED_SALE_PRICE / SUPPLY_PRICE；CUSTOM 必填 */
  base?: string
  /** 大于 0 且最多 2 位小数 */
  percentage?: number
  /** ADD / SUBTRACT / MULTIPLY / DIVIDE；CUSTOM 必填 */
  operator?: string
  /** 加减单位元最多 2 位；乘除为系数最多 4 位；不得为负 */
  operand?: number
}

/** 服务费覆盖规则（ServiceFeeRuleReqVO） */
export interface DistServiceFeeRuleReqVO {
  percentage?: number
  operator: string
  operand?: number
  hideCopy?: boolean
  copy?: string
}

/**
 * 分销商通用定价（新增行内 pricing / PUT /products/pricing 共用字段）
 * 省略则继承商品默认定价；覆盖时与关联同一事务。
 */
export interface BuyerProductCreatePricingReqVO {
  /** true 时继承商品默认分销价 */
  distributionInherited?: boolean
  distributionRule?: DistFormulaRuleReqVO
  /** true 时继承商品默认销售价 */
  salesInherited?: boolean
  salesRule?: DistFormulaRuleReqVO
  /** true 时继承商品默认服务费 */
  serviceFeeInherited?: boolean
  serviceFeeRule?: DistServiceFeeRuleReqVO
  /** true 时继承商品默认利润隐藏阈值 */
  hideInherited?: boolean
  /** 分销区利润隐藏阈值百分数，0 到 100，最多 2 位小数 */
  distributionHideThresholdPercent?: number
  /** 销售区利润隐藏阈值百分数，0 到 100，最多 2 位小数 */
  salesHideThresholdPercent?: number
  /** true 时继承商品默认税务且不得携带税务字段 */
  taxInherited?: boolean
  /** 是否含税；覆盖时须与 taxRateCode 同时提交 */
  taxIncluded?: boolean
  taxRateCode?: string
}

/** 新增分销商品（单行）。pricing 省略则只关联并继承默认定价 */
export interface BuyerProductItemReqVO {
  platformSkuCode: string
  /** FOLLOW_TEMPLATE（默认，继承 L1）/ EQUAL_L1 / CUSTOM */
  l2AdjustMode?: string
  /** CUSTOM 时的整数百分比，100 等于当前 L1 结算分 */
  percent?: number
  /** CUSTOM 时在百分比结果上加减的 CNY 分，可为负 */
  amountCents?: number
  /** 利润空间低于该百分比时 C 端隐藏，0～100 整数；省略则落空 */
  displayThresholdPercent?: number
  pricing?: BuyerProductCreatePricingReqVO
}

/** 从标品批量关联分销商品 */
export interface AddBuyerProductsReqVO {
  items: BuyerProductItemReqVO[]
}

/** 分销商 SKU 通用批量定价（PUT /buyers/{buyerCode}/products/pricing） */
export interface BuyerProductBatchPricingReqVO extends BuyerProductCreatePricingReqVO {
  buyerProductCodes: string[]
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

/** 命名引用（类目 / 商品类型等） */
export interface NamedRef {
  id?: string | number
  name?: string
}

/** 商品类型：详情现为 { id, name }，兼容旧 string[] */
export type ProductTypeRef = string | NamedRef

export const toProductTypeCodes = (values?: ProductTypeRef[] | null): string[] => {
  if (!values?.length) return []
  return [
    ...new Set(
      values
        .map((item) => {
          if (item == null) return ''
          if (typeof item === 'string' || typeof item === 'number') return String(item).trim()
          return String(item.id ?? '').trim()
        })
        .filter(Boolean)
    )
  ]
}

export const toProductTypeItems = (
  values?: ProductTypeRef[] | null
): Array<{ id: string; name: string }> => {
  if (!values?.length) return []
  const items: Array<{ id: string; name: string }> = []
  const seen = new Set<string>()
  values.forEach((item) => {
    if (item == null) return
    if (typeof item === 'string' || typeof item === 'number') {
      const id = String(item).trim()
      if (!id || seen.has(id)) return
      seen.add(id)
      items.push({ id, name: id })
      return
    }
    const id = String(item.id ?? '').trim()
    const name = String(item.name ?? id).trim()
    const key = id || name
    if (!key || seen.has(key)) return
    seen.add(key)
    items.push({ id: key, name: name || id })
  })
  return items
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
  /** 分销品类，字典 supply_chain_sellable_category */
  sellableCategories?: string[]
  /** 可售品类（列表） */
  categories?: NamedRef[]
  /** 可售品类（详情） */
  categoryL1s?: NamedRef[]
  /** 商品类型，详情现为 { id, name }，兼容旧 typeCode 数组 */
  productTypes?: ProductTypeRef[]
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
  /** 商品类型，详情现为 { id, name } */
  productTypes?: ProductTypeRef[]
  sellableCategories?: string[]
  categoryL1Ids?: Array<string | number>
  categoryL1s?: NamedRef[]
  categoryL2s?: NamedRef[]
  contacts?: DistributorContactVO[]
  primaryContactName?: string | null
  primaryContactMobile?: string | null
  /** 采购商账本余额，单位 CNY 分，只读 */
  accountBalanceCents?: number
}

/** 分销商列表项（GET /supply-chain/buyers → BuyerListItem，组织树嵌套） */
export interface BuyerListItem {
  id?: number
  buyerCode?: string
  buyerName?: string
  /** 组织等级：1一级 2二级 3三级 */
  distributionLevel?: number
  /** ACTIVE / SUSPENDED / BLACKLIST */
  status?: string
  /** 最后修改时间，Asia/Shanghai */
  updatedAt?: string
  /** 本级及可见下级可售品类并集 */
  sellableCategories?: string[]
  /** 本级及可见下级商品类型并集 */
  productTypes?: string[]
  /** 本级及可见下级合作模式并集 */
  cooperationModes?: string[]
  /** 本级及可见下级未归档项目数合计 */
  projectCount?: number
  /** 本级及可见下级有效分销商品数合计 */
  skuCount?: number
  /** 合作时间，取档案合作开始时间；未填或年份不晚于1970时回落创建时间 */
  cooperationTime?: string
  primaryContactName?: string | null
  primaryContactMobile?: string | null
  /** 直属下级。一级包含二级，二级包含三级，三级为空列表 */
  children?: BuyerListItem[]
}

/** 分销商下级（GET /buyers/{buyerCode}/children → BuyerChildItem） */
export interface BuyerChildItem {
  buyerCode?: string
  buyerName?: string
  /** 组织等级：1一级 2二级 3三级 */
  distributionLevel?: number
  cooperationModes?: string[]
  /** 未归档关联项目数 */
  projectCount?: number
  /** ACTIVE / SUSPENDED / BLACKLIST */
  status?: string
  /** 创建时间，Asia/Shanghai */
  createdAt?: string
}

/** 分销商分页查询参数（GET /supply-chain/buyers） */
export interface DistributorPageParam {
  pageNo?: number
  pageSize?: number
  /** 采购商标准名称，模糊 */
  buyerName?: string
  /** 采购商永久业务编码 */
  buyerCode?: string
  /** 组织等级，可多选：1 / 2 / 3 */
  distributionLevels?: number[]
  /** 合作模式枚举名，可多选 */
  cooperationModes?: string[]
  /** 可售品类枚举名，可多选 */
  sellableCategories?: string[]
  /** 管理状态枚举名，可多选：ACTIVE / SUSPENDED / BLACKLIST */
  status?: string[]
  /** 最后修改时间起，Asia/Shanghai */
  updatedFrom?: string
  /** 最后修改时间止，Asia/Shanghai */
  updatedTo?: string
  /** simple 名称下拉；parent-options 上级下拉 */
  view?: string
  /** 上级下拉排除的分销商编码及其子孙 */
  excludeBuyerCode?: string
  /** 上级下拉目标等级：2 只要一级，3 只要二级 */
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
