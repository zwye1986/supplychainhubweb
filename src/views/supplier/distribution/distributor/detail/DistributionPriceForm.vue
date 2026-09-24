<template>
  <el-form
    ref="formRef"
    :model="model"
    :rules="formRules"
    :label-width="labelWidth"
    :size="size"
  >
    <el-form-item label="调价方式" prop="distributionRule.mode" :required="!optional">
      <el-radio-group v-model="model.distributionRule.mode">
        <el-radio value="DIRECT_MARKET_PRICE">按照{{ priceLabel }}=市场价</el-radio>
        <el-radio value="CUSTOM">自定义设置</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item v-if="model.distributionRule.mode === 'CUSTOM'" :label="priceLabel" prop="distributionRule">
      <div>
        <FormulaRuleInput v-model="customRuleModel" />
        <div v-if="salePriceTip && model.distributionRule.base === 'SUGGESTED_SALE_PRICE'" class="mt-6px text-12px text-[var(--el-color-danger)]">
          {{ salePriceTip }}
        </div>
      </div>
    </el-form-item>
    <el-form-item label="是否含税" prop="taxIncluded" :required="!optional">
      <el-select v-model="model.taxIncluded" class="!w-160px" placeholder="请选择" @change="onTaxIncludedChange">
        <el-option label="含税" :value="true" />
        <el-option label="不含税" :value="false" />
      </el-select>
    </el-form-item>
    <el-form-item label="税率" prop="taxRateCode" :required="model.taxIncluded">
      <el-select
        v-model="model.taxRateCode"
        class="!w-160px"
        placeholder="请选择"
        clearable
        :disabled="!model.taxIncluded"
      >
        <el-option v-for="dict in taxRateOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
      </el-select>
    </el-form-item>
    <el-form-item>
      <div class="flex flex-wrap items-center gap-8px">
        <span>商品展示：总利润空间低于</span>
        <el-input-number
          v-model="model.distributionHideThresholdPercent"
          :controls="false"
          :min="0"
          :max="100"
          :precision="2"
          class="!w-90px"
        />
        <span>% 用户端自动隐藏该商品</span>
      </div>
      <div class="mt-8px w-full rounded-4px bg-[#fff7e6] px-12px py-8px text-12px text-[#d46b08]">
        提示：单品利润空间=（商品{{ priceLabel }}-供应价）/供应价*100%
      </div>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import type { FormulaRuleReqVO } from '@/api/product'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import FormulaRuleInput from '@/views/supplier/product/list/components/FormulaRuleInput.vue'
import { isDistPriceConfigured, type DistPriceFormData } from './distributionPrice'

defineOptions({ name: 'DistributorDistributionPriceForm' })

const props = withDefaults(
  defineProps<{
    salePriceTip?: string
    labelWidth?: string
    size?: 'large' | 'default' | 'small'
    /** 项目专属价可整表留空 */
    optional?: boolean
    priceLabel?: string
  }>(),
  {
    salePriceTip: '',
    labelWidth: '90px',
    size: 'small',
    optional: false,
    priceLabel: '分销价'
  }
)

const model = defineModel<DistPriceFormData>({ required: true })
const formRef = ref()
const customRuleModel = computed<FormulaRuleReqVO>({
  get() {
    const rule = model.value.distributionRule
    return {
      mode: 'CUSTOM',
      base: rule.base,
      percentage: rule.percentage,
      operator: rule.operator,
      operand: rule.operand
    }
  },
  set(value) {
    model.value.distributionRule = {
      ...model.value.distributionRule,
      ...value,
      mode: 'CUSTOM'
    }
  }
})
const taxRateOptions = computed(() => getStrDictOptions(DICT_TYPE.SUPPLY_CHAIN_TAX_RATE))

const configured = () => isDistPriceConfigured(model.value)

const validateMode = {
  validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
    if (props.optional && !configured()) {
      callback()
      return
    }
    if (!value) {
      callback(new Error(`请选择${props.priceLabel}调价方式`))
      return
    }
    callback()
  },
  trigger: 'change'
}

const validateCustomRule = {
  validator: (_rule: any, value: DistPriceFormData['distributionRule'], callback: (error?: Error) => void) => {
    if (props.optional && !configured()) {
      callback()
      return
    }
    if (!value || value.mode !== 'CUSTOM') {
      callback()
      return
    }
    if (!value.base) {
      callback(new Error(`请选择${props.priceLabel}计价基数`))
      return
    }
    if (value.percentage == null || value.percentage <= 0) {
      callback(new Error(`请填写大于 0 的${props.priceLabel}百分比`))
      return
    }
    if (!value.operator) {
      callback(new Error('请选择分销价运算方式'))
      return
    }
    if (value.operand != null && value.operand < 0) {
      callback(new Error('分销价金额或系数不得为负'))
      return
    }
    callback()
  },
  trigger: ['change', 'blur']
}

const formRules = computed(() => ({
  'distributionRule.mode': [validateMode],
  distributionRule: [validateCustomRule],
  taxIncluded: [
    {
      validator: (_rule: any, value: boolean | undefined, callback: (error?: Error) => void) => {
        if (props.optional && !configured()) {
          callback()
          return
        }
        if (value == null) {
          callback(new Error('请选择是否含税'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  taxRateCode: [
    {
      validator: (_rule: any, value: string, callback: (error?: Error) => void) => {
        if (props.optional && !configured()) {
          callback()
          return
        }
        if (model.value.taxIncluded && !value) {
          callback(new Error('请选择税率'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}))

const onTaxIncludedChange = (value: boolean) => {
  if (!value) model.value.taxRateCode = ''
  nextTick(() => formRef.value?.validateField('taxRateCode'))
}

const validate = async () => {
  await formRef.value?.validate()
}

const clearValidate = () => {
  formRef.value?.clearValidate()
}

defineExpose({ validate, clearValidate, isConfigured: configured })
</script>
