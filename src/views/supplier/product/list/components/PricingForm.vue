<template>
  <el-form
    ref="formRef"
    v-loading="loading"
    :model="formData"
    :rules="formRules"
    :label-width="labelWidth"
    :size="size"
  >
    <div class="mb-16px flex items-center gap-8px">
      <span class="text-16px font-600">分销价</span>
      <span class="rounded-4px bg-[#fff7e6] px-8px py-2px text-12px text-[#d46b08]">
        作为您与客户结算的价格，分销商账户余额按此价格扣除；
      </span>
    </div>
    <el-form-item label="调价方式" prop="distributionRule.mode" required>
      <el-radio-group v-model="formData.distributionRule.mode">
        <el-radio value="DIRECT_MARKET_PRICE">按照分销价=市场价</el-radio>
        <el-radio value="CUSTOM">自定义设置</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item v-if="formData.distributionRule.mode === 'CUSTOM'" label="分销价" prop="distributionRule">
      <FormulaRuleInput v-model="formData.distributionRule" />
    </el-form-item>
    <el-form-item label="是否含税" prop="taxIncluded" required>
      <el-select v-model="formData.taxIncluded" class="!w-160px" placeholder="请选择" @change="onTaxIncludedChange">
        <el-option label="含税" :value="true" />
        <el-option label="不含税" :value="false" />
      </el-select>
    </el-form-item>
    <el-form-item label="税率" prop="taxRateCode" :required="formData.taxIncluded">
      <el-select
        v-model="formData.taxRateCode"
        class="!w-160px"
        placeholder="请选择"
        clearable
        :disabled="!formData.taxIncluded"
      >
        <el-option v-for="dict in taxRateOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
      </el-select>
    </el-form-item>
    <el-form-item>
      <div class="flex flex-wrap items-center gap-8px">
        <span>商品展示：总利润空间低于</span>
        <el-input-number
          v-model="formData.distributionHideThresholdPercent"
          :controls="false"
          :min="0"
          :max="100"
          :precision="2"
          class="!w-90px"
        />
        <span>% 用户端自动隐藏该商品</span>
      </div>
      <div class="mt-8px w-full rounded-4px bg-[#fff7e6] px-12px py-8px text-12px text-[#d46b08]">
        提示：单品利润空间=（商品分销价-供应价）/供应价*100%
      </div>
    </el-form-item>

    <el-divider class="!my-16px" />

    <div class="mb-16px flex items-center gap-8px">
      <span class="text-16px font-600">销售价</span>
      <span class="rounded-4px bg-[#fff7e6] px-8px py-2px text-12px text-[#d46b08]">商城对用户的价格</span>
    </div>
    <el-form-item label="调价方式" prop="salesRule.mode" required>
      <el-radio-group v-model="formData.salesRule.mode">
        <el-radio value="DIRECT_MARKET_PRICE">按照销售价=市场价</el-radio>
        <el-radio value="CUSTOM">自定义设置</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item v-if="formData.salesRule.mode === 'CUSTOM'" label="销售价" prop="salesRule">
      <FormulaRuleInput v-model="formData.salesRule" />
    </el-form-item>
    <el-form-item>
      <div class="flex flex-wrap items-center gap-8px">
        <span>商品展示：总利润空间低于</span>
        <el-input-number
          v-model="formData.salesHideThresholdPercent"
          :controls="false"
          :min="0"
          :max="100"
          :precision="2"
          class="!w-90px"
        />
        <span>% 用户端自动隐藏该商品</span>
      </div>
      <div class="mt-8px w-full rounded-4px bg-[#fff7e6] px-12px py-8px text-12px text-[#d46b08]">
        提示：单品利润空间=（商品分销价-供应价）/供应价*100%
      </div>
    </el-form-item>
    <el-form-item label="服务费" prop="serviceFeeRule" required>
      <div class="flex flex-wrap items-center gap-8px">
        <el-select model-value="ORDER_AMOUNT" disabled class="!w-140px">
          <el-option label="订单金额" value="ORDER_AMOUNT" />
        </el-select>
        <span class="text-[var(--el-color-danger)]">*</span>
        <el-input-number
          v-model="formData.serviceFeeRule.percentage"
          :controls="false"
          :min="0.01"
          :precision="2"
          class="!w-90px"
          @change="() => formRef?.validateField('serviceFeeRule')"
        />
        <span>%</span>
        <el-select
          v-model="formData.serviceFeeRule.operator"
          class="!w-80px"
          placeholder="请选择"
          @change="() => formRef?.validateField('serviceFeeRule')"
        >
          <el-option
            v-for="item in formulaOperatorOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-input-number
          v-model="formData.serviceFeeRule.operand"
          :controls="false"
          :min="0"
          :precision="serviceFeeOperandPrecision"
          class="!w-100px"
          @change="() => formRef?.validateField('serviceFeeRule')"
        />
        <span>元</span>
      </div>
    </el-form-item>
    <el-form-item label="服务费文案" prop="serviceFeeRule.copy" required>
      <div class="flex flex-wrap items-center gap-12px">
        <el-input
          v-model="formData.serviceFeeRule.copy"
          class="!w-280px"
          maxlength="100"
          placeholder="配送、服务及其他费用："
        />
        <el-checkbox v-model="formData.serviceFeeRule.hideCopy" @change="onHideCopyChange">
          不显示服务文案
        </el-checkbox>
      </div>
      <div class="mt-8px w-full rounded-4px bg-[#fff7e6] px-12px py-8px text-12px text-[#d46b08]">
        提示：配置文案时，请注意增加冒号，若选择不显示服务费文案，用户在支付时，可能会出现价格不对等，请谨慎开通
      </div>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import {
  FormulaRuleBase,
  FormulaRuleOperator,
  FormulaRuleReqVO,
  PlatformPricingDetail,
  PRICING_TAX_RATE_CODES,
  ServiceFeeRuleReqVO
} from '@/api/product'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import FormulaRuleInput from './FormulaRuleInput.vue'

defineOptions({ name: 'ProductPricingForm' })

withDefaults(
  defineProps<{
    loading?: boolean
    labelWidth?: string
    size?: 'large' | 'default' | 'small'
  }>(),
  {
    loading: false,
    labelWidth: '100px',
    size: 'default'
  }
)

interface FormulaRuleForm extends FormulaRuleReqVO {
  percentage?: number
  operator?: FormulaRuleOperator
  operand?: number
}

interface ServiceFeeRuleForm extends Partial<ServiceFeeRuleReqVO> {
  operator?: FormulaRuleOperator
  copy?: string
}

interface PricingFormValues {
  distributionRule: FormulaRuleReqVO
  salesRule: FormulaRuleReqVO
  serviceFeeRule: ServiceFeeRuleReqVO
  taxIncluded: boolean
  /** 完整税务组的编码；不含税时也输出 NON_TAXABLE，禁止按下拉框禁用状态省略字段。 */
  taxRateCode: string
  distributionHideThresholdPercent?: number
  salesHideThresholdPercent?: number
}

const FALLBACK_OPERATOR_OPTIONS = [
  { label: '+', value: 'ADD' },
  { label: '-', value: 'SUBTRACT' },
  { label: '*', value: 'MULTIPLY' },
  { label: '/', value: 'DIVIDE' }
]

const formulaOperatorOptions = FALLBACK_OPERATOR_OPTIONS
const taxRateOptions = computed(() => getStrDictOptions(DICT_TYPE.SUPPLY_CHAIN_TAX_RATE))

const formRef = ref()

const createFormulaRule = (base: FormulaRuleBase): FormulaRuleForm => ({
  mode: 'CUSTOM',
  base,
  percentage: undefined,
  operator: 'MULTIPLY',
  operand: undefined
})

const createFormData = () => ({
  distributionRule: createFormulaRule('SUGGESTED_SALE_PRICE'),
  salesRule: createFormulaRule('MARKET_PRICE'),
  serviceFeeRule: {
    percentage: undefined as number | undefined,
    operator: 'MULTIPLY' as FormulaRuleOperator | undefined,
    operand: undefined as number | undefined,
    hideCopy: false,
    copy: '配送、服务及其他费用：'
  } as ServiceFeeRuleForm,
  distributionHideThresholdPercent: undefined as number | undefined,
  salesHideThresholdPercent: undefined as number | undefined,
  taxIncluded: true as boolean,
  taxRateCode: ''
})

const formData = reactive(createFormData())

const validateCustomRule = (label: string) => ({
  validator: (_rule: any, value: FormulaRuleForm, callback: (error?: Error) => void) => {
    if (!value || value.mode !== 'CUSTOM') {
      callback()
      return
    }
    if (!value.base) {
      callback(new Error(`请选择${label}计价基数`))
      return
    }
    if (value.percentage == null || value.percentage <= 0) {
      callback(new Error(`请填写大于 0 的${label}百分比`))
      return
    }
    if (!value.operator) {
      callback(new Error(`请选择${label}运算方式`))
      return
    }
    if (value.operand != null && value.operand < 0) {
      callback(new Error(`${label}金额或系数不得为负`))
      return
    }
    callback()
  },
  trigger: ['change', 'blur']
})

const formRules = computed(() => ({
  'distributionRule.mode': [{ required: true, message: '请选择分销价调价方式', trigger: 'change' }],
  distributionRule: [validateCustomRule('分销价')],
  taxIncluded: [{ required: true, message: '请选择是否含税', trigger: 'change' }],
  taxRateCode: [
    {
      validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
        if (formData.taxIncluded && !value) {
          callback(new Error('请选择税率'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  'salesRule.mode': [{ required: true, message: '请选择销售价调价方式', trigger: 'change' }],
  salesRule: [validateCustomRule('销售价')],
  serviceFeeRule: [
    {
      validator: (_rule: any, value: ServiceFeeRuleForm, callback: (error?: Error) => void) => {
        if (value?.percentage == null || value.percentage <= 0) {
          callback(new Error('请填写大于 0 的服务费百分比'))
          return
        }
        if (!value.operator) {
          callback(new Error('请选择服务费运算方式'))
          return
        }
        if (value.operand != null && value.operand < 0) {
          callback(new Error('服务费金额或系数不得为负'))
          return
        }
        callback()
      },
      trigger: ['change', 'blur']
    }
  ],
  'serviceFeeRule.copy': [
    {
      validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
        if (!formData.serviceFeeRule.hideCopy && !value?.trim()) {
          callback(new Error('请填写服务费文案'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}))

const serviceFeeOperandPrecision = computed(() =>
  formData.serviceFeeRule.operator === 'MULTIPLY' || formData.serviceFeeRule.operator === 'DIVIDE'
    ? 4
    : 2
)

const toOptionalNumber = (value?: number | null) => {
  if (value == null || Number.isNaN(Number(value))) return undefined
  return Number(value)
}

const buildFormulaRule = (rule: FormulaRuleForm): FormulaRuleReqVO => {
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

const fillFormulaRule = (
  rule: FormulaRuleReqVO | undefined,
  fallbackBase: FormulaRuleBase
): FormulaRuleForm => {
  if (!rule?.mode) return createFormulaRule(fallbackBase)
  if (rule.mode === 'DIRECT_MARKET_PRICE') {
    return {
      mode: 'DIRECT_MARKET_PRICE',
      base: fallbackBase,
      percentage: undefined,
      operator: 'MULTIPLY',
      operand: undefined
    }
  }
  return {
    mode: 'CUSTOM',
    base: rule.base || fallbackBase,
    percentage: toOptionalNumber(rule.percentage),
    operator: rule.operator || 'MULTIPLY',
    operand: toOptionalNumber(rule.operand)
  }
}

const applyDetail = (detail: PlatformPricingDetail) => {
  Object.assign(formData.distributionRule, fillFormulaRule(detail.distributionRule, 'SUGGESTED_SALE_PRICE'))
  Object.assign(formData.salesRule, fillFormulaRule(detail.salesRule, 'MARKET_PRICE'))
  Object.assign(formData.serviceFeeRule, {
    percentage: toOptionalNumber(detail.serviceFeeRule?.percentage),
    operator: detail.serviceFeeRule?.operator || undefined,
    operand: toOptionalNumber(detail.serviceFeeRule?.operand),
    hideCopy: !!detail.serviceFeeRule?.hideCopy,
    copy: detail.serviceFeeRule?.copy || '配送、服务及其他费用：'
  })
  formData.distributionHideThresholdPercent = toOptionalNumber(
    detail.hideRule?.distributionThresholdPercent
  )
  formData.salesHideThresholdPercent = toOptionalNumber(detail.hideRule?.salesThresholdPercent)
  formData.taxIncluded = detail.taxMetadata?.taxIncluded !== false
  formData.taxRateCode = formData.taxIncluded ? detail.taxMetadata?.taxRateCode || '' : ''
}

const reset = () => {
  Object.assign(formData, createFormData())
}

const clearValidate = () => {
  formRef.value?.clearValidate()
}

const validate = async () => {
  await formRef.value?.validate()
}

/**
 * 生成商品默认层完整配置。税务组没有上游可继承，不含税时自动补“不征税”编码；
 * 含税缺编码仍由表单校验拒绝，不猜测税率。下拉框禁用只影响交互，不改变 HTTP 必填契约。
 * 设计见后端 docs/superpowers/specs/2026-09-15-generic-batch-pricing-design.md#4-税务展示属性。
 */
const getValues = (): PricingFormValues => {
  const values: PricingFormValues = {
    distributionRule: buildFormulaRule(formData.distributionRule),
    salesRule: buildFormulaRule(formData.salesRule),
    serviceFeeRule: {
      percentage: Number(formData.serviceFeeRule.percentage),
      operator: formData.serviceFeeRule.operator!,
      operand: formData.serviceFeeRule.operand ?? 0,
      hideCopy: !!formData.serviceFeeRule.hideCopy,
      copy: formData.serviceFeeRule.hideCopy
        ? formData.serviceFeeRule.copy || undefined
        : formData.serviceFeeRule.copy
    },
    taxIncluded: formData.taxIncluded,
    taxRateCode: formData.taxIncluded ? formData.taxRateCode : PRICING_TAX_RATE_CODES.NON_TAXABLE
  }
  const distributionHide = toOptionalNumber(formData.distributionHideThresholdPercent)
  const salesHide = toOptionalNumber(formData.salesHideThresholdPercent)
  if (distributionHide != null) values.distributionHideThresholdPercent = distributionHide
  if (salesHide != null) values.salesHideThresholdPercent = salesHide
  return values
}

const onTaxIncludedChange = (value: boolean) => {
  if (!value) formData.taxRateCode = ''
  nextTick(() => formRef.value?.validateField('taxRateCode'))
}

const onHideCopyChange = () => {
  formRef.value?.validateField('serviceFeeRule.copy')
}

defineExpose({ validate, reset, applyDetail, clearValidate, getValues })
</script>
