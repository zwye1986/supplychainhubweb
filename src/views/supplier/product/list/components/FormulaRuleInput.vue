<template>
  <div class="flex flex-wrap items-center gap-8px">
    <el-select v-model="model.base" class="!w-140px" placeholder="请选择">
      <el-option v-for="item in FORMULA_BASE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <span class="text-[var(--el-color-danger)]">*</span>
    <el-input-number v-model="model.percentage" :controls="false" :min="0.01" :precision="2" class="!w-90px" />
    <span>%</span>
    <span class="text-[var(--el-color-danger)]">*</span>
    <el-select v-model="model.operator" class="!w-80px" placeholder="请选择">
      <el-option v-for="item in FORMULA_OPERATOR_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <el-input-number v-model="model.operand" :controls="false" :min="0" :precision="operandPrecision" class="!w-100px" />
    <span>元</span>
    <span v-if="model.operator === 'MULTIPLY'" class="text-12px text-[var(--el-color-warning)]">
      乘以系数，请设置百分比大于100，否则会出现亏本情况
    </span>
  </div>
</template>

<script lang="ts" setup>
  import type { FormulaRuleReqVO } from '@/api/product'

  defineOptions({ name: 'ProductFormulaRuleInput' })

  const FORMULA_BASE_OPTIONS = [
    { label: '市场价', value: 'MARKET_PRICE' },
    { label: '销售建议价', value: 'SUGGESTED_SALE_PRICE' },
    { label: '供应价', value: 'SUPPLY_PRICE' }
  ]

  const FORMULA_OPERATOR_OPTIONS = [
    { label: '+', value: 'ADD' },
    { label: '-', value: 'SUBTRACT' },
    { label: '*', value: 'MULTIPLY' },
    { label: '/', value: 'DIVIDE' }
  ]

  const model = defineModel<FormulaRuleReqVO>({ required: true })

  const operandPrecision = computed(() =>
    model.value.operator === 'MULTIPLY' || model.value.operator === 'DIVIDE' ? 4 : 2
  )
</script>
