<template>
  <el-form ref="formRef" :model="model" :rules="formRules" label-width="110px" size="default">
    <div class="mb-12px text-16px font-600">分销价</div>
    <el-form-item label="调价方式" prop="distributionRule.mode">
      <el-radio-group v-model="model.distributionRule.mode">
        <el-radio value="DIRECT_MARKET_PRICE">按照分销价=市场价</el-radio>
        <el-radio value="CUSTOM">自定义设置</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item v-if="model.distributionRule.mode === 'CUSTOM'" label="分销价" prop="distributionRule">
      <FormulaRuleInput v-model="distributionRuleModel" />
    </el-form-item>
    <el-form-item label="利润隐藏">
      <div class="flex flex-wrap items-center gap-8px">
        <span>总利润空间低于</span>
        <el-input-number
          v-model="model.distributionThresholdPercent"
          :controls="false"
          :min="0"
          :max="100"
          :precision="2"
          class="!w-90px"
        />
        <span>% 用户端自动隐藏该商品</span>
      </div>
    </el-form-item>

    <el-divider class="!my-12px" />

    <div class="mb-12px text-16px font-600">税务</div>
    <el-form-item label="是否含税" prop="taxIncluded">
      <el-select v-model="model.taxIncluded" class="!w-160px" placeholder="请选择" clearable @change="onTaxIncludedChange">
        <el-option label="含税" :value="true" />
        <el-option label="不含税" :value="false" />
      </el-select>
    </el-form-item>
    <el-form-item label="税率" prop="taxRateCode">
      <el-select
        v-model="model.taxRateCode"
        class="!w-160px"
        placeholder="请选择"
        clearable
        :disabled="model.taxIncluded !== true"
      >
        <el-option v-for="dict in taxRateOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import type { FormulaRuleReqVO } from '@/api/product'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import FormulaRuleInput from '@/views/supplier/product/list/components/FormulaRuleInput.vue'
import { type ProjectFormulaForm, type ProjectPricingFormData } from './projectPricing'

defineOptions({ name: 'ProjectPricingForm' })

const model = defineModel<ProjectPricingFormData>({ required: true })
const formRef = ref()
const taxRateOptions = computed(() => getStrDictOptions(DICT_TYPE.SUPPLY_CHAIN_TAX_RATE))

const toFormulaModel = (rule: ProjectFormulaForm): FormulaRuleReqVO => ({
  mode: 'CUSTOM',
  base: rule.base,
  percentage: rule.percentage,
  operator: rule.operator,
  operand: rule.operand
})

const distributionRuleModel = computed<FormulaRuleReqVO>({
  get: () => toFormulaModel(model.value.distributionRule),
  set: (value) => {
    model.value.distributionRule = { ...model.value.distributionRule, ...value, mode: 'CUSTOM' }
  }
})

const validateCustomRule = (label: string) => ({
  validator: (_rule: unknown, value: ProjectFormulaForm, callback: (error?: Error) => void) => {
    if (!value?.mode) {
      callback()
      return
    }
    if (value.mode !== 'CUSTOM') {
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
  taxRateCode: [
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (model.value.taxIncluded === true && !value) {
          callback(new Error('请选择税率'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}))

const onTaxIncludedChange = (value: boolean | undefined) => {
  if (value !== true) model.value.taxRateCode = ''
  nextTick(() => formRef.value?.validateField('taxRateCode'))
}

const validate = async () => {
  await formRef.value?.validate()
}

const clearValidate = () => {
  formRef.value?.clearValidate()
}

defineExpose({ validate, clearValidate })
</script>
