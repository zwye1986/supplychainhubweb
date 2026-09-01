/** 联系人 */
export interface DistributorContactVO {
  id?: number
  name: string
  mobile: string
  email?: string
}

/** 开票信息 */
export interface DistributorInvoiceVO {
  id?: number
  distributorId?: number
  titleType: number
  invoiceTitle?: string
  socialCreditCode?: string
  phone?: string
  bankName?: string
  bankAccount?: string
  invoiceAddress?: string
}

/** 项目（项目管理 / 分销商关联项目共用） */
export interface ProjectVO {
  id?: number
  distributorId?: number
  distributorName?: string
  name: string
  code?: string
  status?: number
  /** 项目类型：welfare / benefit / campaign / subsidy / group */
  projectType?: string
  startDate?: string
  endDate?: string
  skuCount?: number
  projectPriceSkuCount?: number
  /** 结算方展示文案 */
  settlementParty?: string
  /** 结算方类型：distributor 关联分销商 / platform 平台结算 */
  settlementPartyType?: string
  description?: string
  createTime?: string
  updateTime?: string
}

/** 分销商详情-关联项目卡片，与项目主体同一结构 */
export type DistributorProjectVO = ProjectVO

/** 项目分页查询参数 */
export interface ProjectPageParam {
  pageNo: number
  pageSize: number
  name?: string
  code?: string
  status?: number[]
  distributorId?: number
  projectType?: string[]
  period?: string[]
}

/** 分销商品（SKU 级，三级定价） */
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

/** 分销商 */
export interface DistributorVO {
  id?: number
  code?: string
  name: string
  shortName?: string
  status?: number
  /** 分销等级：1/2/3 */
  level?: number
  /** 上级分销商 ID */
  parentId?: number
  parentName?: string
  /** 合作模式（可多选）：direct / agent / channel */
  cooperationMode?: string[]
  /** 分销商类型：enterprise / personal / platform */
  distributorType?: string
  /** 分销品类 */
  category?: string[]
  /** 商品类型 */
  productType?: string[]
  /** 供货择优倾向：stable / price / comprehensive */
  supplyPreference?: string
  companyName?: string
  socialCreditCode?: string
  businessLicenseUrls?: string[]
  legalPersonName?: string
  legalIdUrls?: string[]
  legalPersonMobile?: string
  contactAddress?: string
  settlementType?: string
  settlementCycle?: number
  integrationMethods?: string[]
  /** 合作开始日期 YYYY-MM-DD */
  cooperationStartDate?: string
  /** 列表兼容：合作时间展示 */
  cooperationTime?: string
  cooperationRemark?: string
  bankName?: string
  bankAccount?: string
  accountBalance?: number
  otherCertUrls?: string[]
  remark?: string
  contacts?: DistributorContactVO[]
  projectCount?: number
  skuCount?: number
  childCount?: number
  contactName?: string
  contactMobile?: string
  updateTime?: string
  createTime?: string
}

/** 分销商分页查询参数 */
export interface DistributorPageParam {
  pageNo: number
  pageSize: number
  name?: string
  code?: string
  level?: number[]
  cooperationMode?: string[]
  category?: string[]
  status?: number[]
  updateTime?: string[]
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
