import type { FormulaRuleBase, FormulaRuleMode, FormulaRuleOperator } from '@/api/product'

export interface DistPriceFormData {
  distributionRule: {
    mode?: FormulaRuleMode
    percentage?: number
    operator?: FormulaRuleOperator
    operand?: number
    base?: FormulaRuleBase
  }
  taxIncluded?: boolean
  taxRateCode: string
  distributionHideThresholdPercent?: number
}

export const createEmptyDistPrice = (): DistPriceFormData => ({
  distributionRule: {
    mode: undefined,
    base: undefined,
    percentage: undefined,
    operator: undefined,
    operand: undefined
  },
  taxIncluded: undefined,
  taxRateCode: '',
  distributionHideThresholdPercent: undefined
})

export const isDistPriceConfigured = (price?: DistPriceFormData) => {
  if (!price) return false
  const rule = price.distributionRule
  return !!(
    rule?.mode ||
    rule?.base ||
    rule?.percentage != null ||
    rule?.operator ||
    rule?.operand != null ||
    price.taxIncluded != null ||
    price.taxRateCode ||
    price.distributionHideThresholdPercent != null
  )
}
