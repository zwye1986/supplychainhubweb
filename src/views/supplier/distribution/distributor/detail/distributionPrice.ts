import type { FormulaRuleBase, FormulaRuleMode, FormulaRuleOperator } from '@/api/product'

import { PRICING_TAX_RATE_CODES } from '@/api/product/types'
import { BUYER_PRICING_STATUSES } from '@/api/supplier/distribution/types'
import type {
  BuyerPricingConfigView,
  BuyerProductListItem,
  BuyerProductBatchPricingReqVO,
  DistFormulaRuleReqVO,
  DistServiceFeeRuleReqVO
} from '@/api/supplier/distribution'

export interface DistPriceFormData {
  /** 仅编辑模式使用；共享新增选品仍按已有创建语义提交。 */
  distributionInherited?: boolean
  hideInherited?: boolean
  taxInherited?: boolean
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

const FORMULA_MODES = { DIRECT: 'DIRECT_MARKET_PRICE', CUSTOM: 'CUSTOM' } as const
const FORMULA_BASES = ['MARKET_PRICE', 'SUGGESTED_SALE_PRICE', 'SUPPLY_PRICE'] as const
const FORMULA_OPERATORS = ['ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE'] as const
const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)
const isString = (value: unknown) => typeof value === 'string'
const isBoolean = (value: unknown) => typeof value === 'boolean'
const validNullableFields = (value: unknown, fields: Record<string, (field: unknown) => boolean>) =>
  isObject(value) &&
  Object.entries(fields).every(([key, validate]) => value[key] == null || validate(value[key]))
const validFormulaShape = (value: unknown) =>
  validNullableFields(value, {
    mode: (field) => Object.values(FORMULA_MODES).some((mode) => mode === field),
    base: (field) => FORMULA_BASES.some((base) => base === field),
    percentage: isNumber,
    operator: (field) => FORMULA_OPERATORS.some((operator) => operator === field),
    operand: isNumber
  })
const validServiceFeeShape = (value: unknown) =>
  isObject(value) &&
  typeof value.hideCopy === 'boolean' &&
  validNullableFields(value, {
    percentage: isNumber,
    operator: (field) => FORMULA_OPERATORS.some((operator) => operator === field),
    operand: isNumber,
    copy: isString
  })
const validHideShape = (value: unknown) =>
  validNullableFields(value, {
    distributionThresholdPercent: isNumber,
    salesThresholdPercent: isNumber
  })
const validTaxShape = (value: unknown) =>
  validNullableFields(value, {
    taxIncluded: isBoolean,
    taxRateCode: isString,
    taxRateLabel: isString
  })
/** 按实际 JSON 数值的规范十进制表示计位，避免浮点乘法误差或容差放行超精度值。
 * 设计：docs/superpowers/specs/2026-09-15-generic-batch-pricing-design.md#2-公式与精度。
 */
const isDecimal = (value: unknown, digits: number) => {
  if (!isNumber(value)) return false
  const [coefficient, exponent = '0'] = value.toString().split('e')
  return Math.max(0, (coefficient.split('.')[1]?.length ?? 0) - Number(exponent)) <= digits
}
const validCalculation = (rule: Record<string, unknown>) =>
  isDecimal(rule.percentage, 2) &&
  (rule.percentage as number) > 0 &&
  FORMULA_OPERATORS.some((operator) => operator === rule.operator) &&
  isDecimal(rule.operand, rule.operator === 'ADD' || rule.operator === 'SUBTRACT' ? 2 : 4) &&
  (rule.operand as number) >= 0 &&
  (rule.operator !== 'DIVIDE' || rule.operand !== 0)
const validFormula = (rule: unknown) =>
  isObject(rule) &&
  (rule.mode === FORMULA_MODES.DIRECT ||
    (rule.mode === FORMULA_MODES.CUSTOM &&
      FORMULA_BASES.some((base) => base === rule.base) &&
      validCalculation(rule)))
const validThreshold = (value: unknown) =>
  value == null || (isDecimal(value, 2) && (value as number) >= 0 && (value as number) <= 100)
const validTax = (tax: unknown) =>
  isObject(tax) &&
  typeof tax.taxIncluded === 'boolean' &&
  typeof tax.taxRateCode === 'string' &&
  tax.taxRateCode.trim().length > 0 &&
  (tax.taxIncluded || tax.taxRateCode === PRICING_TAX_RATE_CODES.NON_TAXABLE)

/**
 * 保存前必须持有完整五组原始配置，未编辑组不可用当前有效配置或空值替换。
 * 继承组原始规则允许未使用的可空字段，但非空对象仍须符合字段类型；覆盖组须完整有效。
 * 服务费显示文案时必须提供非空文案；隐藏双空值为合法覆盖。
 * 设计：docs/superpowers/specs/2026-09-15-generic-batch-pricing-design.md#63-分销商品原始配置回显与无损编辑2026-10-14-修复。
 */
export const isValidBuyerPricingConfig = (value: unknown): value is BuyerPricingConfigView => {
  if (!isObject(value)) return false
  for (const group of ['distribution', 'sales', 'serviceFee', 'hide', 'tax']) {
    if (typeof value[`${group}Inherited`] !== 'boolean') return false
  }
  // 继承只忽略计算规则，不允许将损坏的响应结构当成可保存的原始配置。
  const shapes = [
    [value.distributionRule, validFormulaShape],
    [value.salesRule, validFormulaShape],
    [value.serviceFeeRule, validServiceFeeShape],
    [value.hideRule, validHideShape],
    [value.taxMetadata, validTaxShape]
  ] as const
  if (shapes.some(([rule, validate]) => rule != null && !validate(rule))) return false
  if (!value.distributionInherited && !validFormula(value.distributionRule)) return false
  if (!value.salesInherited && !validFormula(value.salesRule)) return false
  if (
    !value.serviceFeeInherited &&
    (!isObject(value.serviceFeeRule) ||
      !validCalculation(value.serviceFeeRule) ||
      (value.serviceFeeRule.hideCopy === false &&
        (typeof value.serviceFeeRule.copy !== 'string' || !value.serviceFeeRule.copy.trim())))
  )
    return false
  if (
    !value.hideInherited &&
    (!isObject(value.hideRule) ||
      !validThreshold(value.hideRule.distributionThresholdPercent) ||
      !validThreshold(value.hideRule.salesThresholdPercent))
  )
    return false
  return value.taxInherited === true || validTax(value.taxMetadata)
}

export interface BuyerPricingEditSnapshot {
  currentPricingVersionId: number | string | null
  config: BuyerPricingConfigView
  initializing: boolean
}

/**
 * 仅已确认无当前版本的 UNPRICED 可初始化；旧服务缺字段或破损快照必须拒绝编辑。
 * 大版本编号只验证十进制表示，不转换为 Number，避免超过安全整数后丢失精度。
 * 设计：docs/superpowers/specs/2026-09-15-generic-batch-pricing-design.md#63-分销商品原始配置回显与无损编辑2026-10-14-修复。
 */
export const readBuyerPricingEditSnapshot = (
  row: BuyerProductListItem
): BuyerPricingEditSnapshot | null => {
  if (!Object.values(BUYER_PRICING_STATUSES).some((status) => status === row.pricingStatus))
    return null
  if (
    row.currentPricingVersionId === null &&
    row.pricingStatus === BUYER_PRICING_STATUSES.UNPRICED &&
    row.buyerPricingConfig === null
  ) {
    return {
      currentPricingVersionId: null,
      initializing: true,
      config: {
        distributionInherited: true,
        distributionRule: null,
        salesInherited: true,
        salesRule: null,
        serviceFeeInherited: true,
        serviceFeeRule: null,
        hideInherited: true,
        hideRule: null,
        taxInherited: true,
        taxMetadata: null
      }
    }
  }
  const id = row.currentPricingVersionId
  const validId =
    typeof id === 'string'
      ? /^[1-9]\d*$/.test(id)
      : typeof id === 'number' && Number.isSafeInteger(id) && id > 0
  if (!validId || !isValidBuyerPricingConfig(row.buyerPricingConfig)) return null
  return {
    currentPricingVersionId: id as number | string,
    initializing: false,
    config: JSON.parse(JSON.stringify(row.buyerPricingConfig))
  }
}

/** 从原始结构回填编辑表单，不解析价格展示文案，不消费旧兼容阈值。
 * 设计：docs/superpowers/specs/2026-09-15-generic-batch-pricing-design.md#63-分销商品原始配置回显与无损编辑2026-10-14-修复。
 */
export const createBuyerPricingEditForm = (
  snapshot: BuyerPricingEditSnapshot
): DistPriceFormData => {
  const raw = snapshot.config
  const rule = raw.distributionRule
  return {
    distributionInherited: raw.distributionInherited,
    distributionRule: {
      mode: rule?.mode ?? undefined,
      base: rule?.base ?? undefined,
      percentage: rule?.percentage ?? undefined,
      operator: rule?.operator ?? undefined,
      operand: rule?.operand ?? undefined
    },
    hideInherited: raw.hideInherited,
    distributionHideThresholdPercent: raw.hideRule?.distributionThresholdPercent ?? undefined,
    taxInherited: raw.taxInherited,
    taxIncluded: raw.taxMetadata?.taxIncluded ?? undefined,
    taxRateCode: raw.taxMetadata?.taxRateCode ?? ''
  }
}

/**
 * 仅替换表单可见的三组，销售价、服务费和销售区阈值从打开时的原始快照保留。
 * 空分销隐藏值不能改变继承标记；不含税覆盖始终携带稳定税率编码。
 * 设计：docs/superpowers/specs/2026-09-15-generic-batch-pricing-design.md#63-分销商品原始配置回显与无损编辑2026-10-14-修复。
 */
export const buildBuyerPricingEditPayload = (
  buyerProductCode: string,
  price: DistPriceFormData,
  snapshot: BuyerPricingEditSnapshot
): BuyerProductBatchPricingReqVO => {
  const raw = snapshot.config
  const next = {
    ...raw,
    distributionInherited: price.distributionInherited,
    distributionRule: price.distributionRule,
    hideInherited: price.hideInherited,
    hideRule: {
      distributionThresholdPercent: price.distributionHideThresholdPercent ?? null,
      salesThresholdPercent: raw.hideRule?.salesThresholdPercent ?? null
    },
    taxInherited: price.taxInherited,
    taxMetadata: {
      taxIncluded: price.taxIncluded,
      taxRateCode:
        price.taxIncluded === false ? PRICING_TAX_RATE_CODES.NON_TAXABLE : price.taxRateCode
    }
  }
  if (!isValidBuyerPricingConfig(next)) throw new Error('定价配置不完整，请重新读取并检查表单')
  const payload: BuyerProductBatchPricingReqVO = {
    buyerProductCodes: [buyerProductCode],
    distributionInherited: next.distributionInherited,
    salesInherited: raw.salesInherited,
    serviceFeeInherited: raw.serviceFeeInherited,
    hideInherited: next.hideInherited,
    taxInherited: next.taxInherited
  }
  if (!next.distributionInherited)
    payload.distributionRule = price.distributionRule as DistFormulaRuleReqVO
  if (raw.salesRule && validFormula(raw.salesRule))
    payload.salesRule = raw.salesRule as DistFormulaRuleReqVO
  if (raw.serviceFeeRule && validCalculation(raw.serviceFeeRule)) {
    payload.serviceFeeRule = raw.serviceFeeRule as DistServiceFeeRuleReqVO
  }
  if (!next.hideInherited) {
    if (next.hideRule.distributionThresholdPercent != null) {
      payload.distributionHideThresholdPercent = next.hideRule.distributionThresholdPercent
    }
    if (next.hideRule.salesThresholdPercent != null)
      payload.salesHideThresholdPercent = next.hideRule.salesThresholdPercent
  }
  if (!next.taxInherited) {
    payload.taxIncluded = next.taxMetadata.taxIncluded
    payload.taxRateCode = next.taxMetadata.taxRateCode
  }
  return payload
}
