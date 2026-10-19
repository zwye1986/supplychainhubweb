import type { SuggestedSalePriceRule } from '@/api/product'
import { getDictLabel } from '@/utils/dict'
import { formatCentsYuan } from '@/utils/money'

const formatSuggestFormula = (rule?: SuggestedSalePriceRule | null) => {
  if (!rule?.mode) return '-'
  if (['EQUAL_MARKET_PRICE', 'MARKET', 'DIRECT_MARKET_PRICE'].includes(rule.mode)) return '市场价'
  if (rule.mode === 'FIXED') {
    return rule.fixedPriceCents == null ? '-' : `${formatCentsYuan(rule.fixedPriceCents)}元`
  }
  if (rule.mode !== 'CUSTOM' || rule.percentage == null || !rule.operator) return '-'
  const base =
    rule.base === 'SUGGESTED_SALE_PRICE'
      ? '销售建议价'
      : rule.base === 'SUPPLY_PRICE'
        ? '供应价'
        : '市场价'
  const operators: Record<string, string> = { ADD: '+', SUBTRACT: '-', MULTIPLY: '*', DIVIDE: '/' }
  const operator =
    operators[rule.operator] ||
    getDictLabel('supply_chain_suggested_sale_price_operator', rule.operator) ||
    rule.operator
  return `${base}*${rule.percentage}%${operator}${rule.operand ?? 0}元`
}

/** 展示规则及后端计算结果，金额由分转元，不在前端重新计算建议价。 */
export const formatSuggestedSalePrice = (sku: {
  suggestedSalePriceRule?: SuggestedSalePriceRule | null
  suggestedSalePrice?: number | null
  suggestedSalePriceCents?: number | null
}) => {
  const formula = formatSuggestFormula(sku.suggestedSalePriceRule)
  const cents = sku.suggestedSalePrice ?? sku.suggestedSalePriceCents
  const amount = formatCentsYuan(cents)
  if (formula === '-') return amount
  return cents == null ? formula : `${formula}=${amount}`
}
