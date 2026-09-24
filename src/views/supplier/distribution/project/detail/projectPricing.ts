import type { FormulaRuleBase, FormulaRuleMode, FormulaRuleOperator } from '@/api/product'
import type {
  DistFormulaRuleReqVO,
  ProjectFormulaRuleView,
  ProjectPricingConfigView,
  ProjectProductBatchPricingReqVO
} from '@/api/supplier/distribution'

export interface ProjectFormulaForm {
  mode?: FormulaRuleMode
  base?: FormulaRuleBase
  percentage?: number
  operator?: FormulaRuleOperator
  operand?: number
}

export interface ProjectServiceFeeForm {
  percentage?: number
  operator?: FormulaRuleOperator
  operand?: number
  hideCopy?: boolean
  copy?: string
}

/** 与 PUT /projects/{projectCode}/products/pricing 的五组参数对应，打开时全部为空 */
export interface ProjectPricingFormData {
  distributionRule: ProjectFormulaForm
  salesRule: ProjectFormulaForm
  serviceFeeRule: ProjectServiceFeeForm
  distributionThresholdPercent?: number
  salesThresholdPercent?: number
  taxIncluded?: boolean
  taxRateCode: string
}

const emptyFormula = (): ProjectFormulaForm => ({
  mode: undefined,
  base: undefined,
  percentage: undefined,
  operator: undefined,
  operand: undefined
})

export const createEmptyProjectPricing = (): ProjectPricingFormData => ({
  distributionRule: emptyFormula(),
  salesRule: emptyFormula(),
  serviceFeeRule: {
    percentage: undefined,
    operator: undefined,
    operand: undefined,
    hideCopy: false,
    copy: ''
  },
  distributionThresholdPercent: undefined,
  salesThresholdPercent: undefined,
  taxIncluded: undefined,
  taxRateCode: ''
})

const FORMULA_MODES: FormulaRuleMode[] = ['DIRECT_MARKET_PRICE', 'CUSTOM']
const FORMULA_BASES: FormulaRuleBase[] = ['MARKET_PRICE', 'SUGGESTED_SALE_PRICE', 'SUPPLY_PRICE']
const FORMULA_OPERATORS: FormulaRuleOperator[] = ['ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE']

const asFormulaMode = (mode?: string): FormulaRuleMode | undefined =>
  FORMULA_MODES.find((item) => item === mode)

const asFormulaBase = (base?: string): FormulaRuleBase | undefined =>
  FORMULA_BASES.find((item) => item === base)

const asFormulaOperator = (operator?: string): FormulaRuleOperator | undefined =>
  FORMULA_OPERATORS.find((item) => item === operator)

const toFormNumber = (value?: number | null) => {
  if (value == null || Number.isNaN(Number(value))) return undefined
  return Number(value)
}

/** 仅回填未继承的分销价、利润隐藏、税务。销售价和服务费弹窗不编辑 */
const fillDistributionRule = (rule?: ProjectFormulaRuleView | null): ProjectFormulaForm => {
  const mode = asFormulaMode(rule?.mode)
  if (!mode) return emptyFormula()
  if (mode === 'DIRECT_MARKET_PRICE') {
    return { ...emptyFormula(), mode }
  }
  return {
    mode,
    base: asFormulaBase(rule?.base),
    percentage: toFormNumber(rule?.percentage),
    operator: asFormulaOperator(rule?.operator),
    operand: toFormNumber(rule?.operand)
  }
}

export const createProjectPricingFromConfig = (
  config?: ProjectPricingConfigView | null
): ProjectPricingFormData => {
  const form = createEmptyProjectPricing()
  if (!config) return form
  if (config.distributionInherited === false) {
    form.distributionRule = fillDistributionRule(config.distributionRule)
  }
  if (config.hideInherited === false) {
    form.distributionThresholdPercent = toFormNumber(config.hideRule?.distributionThresholdPercent)
    form.salesThresholdPercent = toFormNumber(config.hideRule?.salesThresholdPercent)
  }
  if (config.taxInherited === false && config.taxMetadata) {
    form.taxIncluded = config.taxMetadata.taxIncluded
    form.taxRateCode =
      config.taxMetadata.taxIncluded && config.taxMetadata.taxRateCode
        ? config.taxMetadata.taxRateCode
        : ''
  }
  return form
}

const hasFormulaInput = (rule?: ProjectFormulaForm) =>
  !!(
    rule?.mode ||
    rule?.base ||
    rule?.percentage != null ||
    rule?.operator ||
    rule?.operand != null
  )

export const isServiceFeeConfigured = (form: ProjectPricingFormData) => {
  const rule = form.serviceFeeRule
  return !!(
    rule.percentage != null ||
    rule.operator ||
    rule.operand != null ||
    rule.hideCopy ||
    rule.copy?.trim()
  )
}

export const isProjectPricingConfigured = (form?: ProjectPricingFormData) => {
  if (!form) return false
  return (
    hasFormulaInput(form.distributionRule) ||
    hasFormulaInput(form.salesRule) ||
    isServiceFeeConfigured(form) ||
    form.distributionThresholdPercent != null ||
    form.salesThresholdPercent != null ||
    form.taxIncluded != null ||
    !!form.taxRateCode
  )
}

const toOptionalNumber = (value?: number | null) => {
  if (value == null || Number.isNaN(Number(value))) return undefined
  return Number(value)
}

const buildFormulaRule = (rule: ProjectFormulaForm): DistFormulaRuleReqVO => {
  if (rule.mode === 'DIRECT_MARKET_PRICE') {
    return { mode: 'DIRECT_MARKET_PRICE' }
  }
  return {
    mode: 'CUSTOM',
    base: rule.base,
    percentage: Number(rule.percentage),
    operator: rule.operator,
    operand: rule.operand ?? 0
  }
}

/** 单个配置只覆盖分销价。销售价、服务费固定继承分销商，只传 inherited=true，不传规则 */
export const buildProjectProductPricing = (
  listingCode: string,
  form: ProjectPricingFormData
): ProjectProductBatchPricingReqVO => {
  const distributionOn = !!form.distributionRule.mode
  const distributionThreshold = toOptionalNumber(form.distributionThresholdPercent)
  const hideOn = distributionThreshold != null
  const taxOn = form.taxIncluded != null
  const payload: ProjectProductBatchPricingReqVO = {
    listingCodes: [listingCode],
    distributionInherited: !distributionOn,
    salesInherited: true,
    serviceFeeInherited: true,
    hideInherited: !hideOn,
    taxInherited: !taxOn
  }
  if (distributionOn) {
    payload.distributionRule = buildFormulaRule(form.distributionRule)
  }
  if (hideOn) {
    payload.hideRule = { distributionThresholdPercent: distributionThreshold }
  }
  if (taxOn) {
    payload.taxMetadata = { taxIncluded: form.taxIncluded }
    if (form.taxIncluded && form.taxRateCode) {
      payload.taxMetadata.taxRateCode = form.taxRateCode
    }
  }
  return payload
}
