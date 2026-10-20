import type { SuggestedSalePriceRule, SuggestedSalePriceView } from '@/api/product'
import { getDictLabel } from '@/utils/dict'
import { formatCentsYuan } from '@/utils/money'
import { formatDate } from '@/utils/formatTime'

const formatSuggestFormula = (rule?: SuggestedSalePriceRule | null) => {
  if (!rule?.mode) return '-'
  if (['EQUAL_MARKET_PRICE', 'MARKET', 'DIRECT_MARKET_PRICE'].includes(rule.mode)) return '市场价'
  if (rule.mode === 'FIXED') {
    return rule.fixedPriceCents == null ? '-' : `${formatCentsYuan(rule.fixedPriceCents)}元`
  }
  if (rule.mode !== 'CUSTOM' || rule.percentage == null || !rule.operator) return '-'
  const base =
    getDictLabel('supply_chain_suggested_sale_price_base', rule.base) ||
    (rule.base === 'SUGGESTED_SALE_PRICE'
      ? '销售建议价'
      : rule.base === 'SUPPLY_PRICE'
        ? '供应价'
        : '市场价')
  const operators: Record<string, string> = { ADD: '+', SUBTRACT: '-', MULTIPLY: '*', DIVIDE: '/' }
  const operator =
    operators[rule.operator] ||
    getDictLabel('supply_chain_suggested_sale_price_operator', rule.operator) ||
    rule.operator
  return `${base}*${rule.percentage}%${operator}${rule.operand ?? 0}元`
}

/**
 * 当前有效金额仅使用服务端结果；不可用状态即使夹带旧字段也不能展示成现价。
 * 显式 null 不回退兼容字段，避免把技术默认 0 或历史金额显示为有效建议价。
 * 设计见后端 docs/superpowers/specs/2026-10-19-suggested-sale-price-supply-base-design.md#7-前端与接口。
 */
export const formatSuggestedSalePrice = (sku: SuggestedSalePriceView) => {
  const formula = formatSuggestFormula(sku.suggestedSalePriceRule)
  const status = sku.suggestedSalePriceStatus
  if (status === 'DEPENDENCY_MISSING' || status === 'CALCULATION_FAILED') {
    const message =
      status === 'DEPENDENCY_MISSING' ? '待计算：暂无有效供应价' : '计算失败：请检查定价规则'
    return formula === '-' ? message : `${formula}；${message}`
  }
  const cents =
    sku.suggestedSalePrice !== undefined ? sku.suggestedSalePrice : sku.suggestedSalePriceCents
  const amount = formatCentsYuan(cents)
  if (formula === '-') return amount
  return cents == null ? formula : `${formula}=${amount}`
}

/** 历史参考独立呈现，不能拼入当前公式或作为当前价格。 */
export const formatSuggestedSalePriceHistory = (sku: SuggestedSalePriceView) => {
  if (sku.lastValidSuggestedSalePrice == null || sku.suggestedSalePriceStatus === 'READY') return ''
  const calculatedAt =
    sku.lastValidSuggestedSalePriceCalculatedAt == null
      ? ''
      : formatDate(sku.lastValidSuggestedSalePriceCalculatedAt)
  return `历史参考：${formatCentsYuan(sku.lastValidSuggestedSalePrice)}元${calculatedAt ? `（${calculatedAt}）` : ''}`
}
