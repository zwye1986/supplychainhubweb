<template>
  <div class="flex flex-wrap items-center gap-8px">
    <el-select
      :model-value="model.base"
      class="!w-140px"
      placeholder="请选择"
      @update:model-value="patch({ base: $event })"
    >
      <el-option v-for="item in FORMULA_BASE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <span class="text-[var(--el-color-danger)]">*</span>
    <el-input-number
      :model-value="model.percentage"
      :controls="false"
      :min="0.01"
      :precision="2"
      class="!w-90px"
      @update:model-value="patch({ percentage: $event })"
    />
    <span>%</span>
    <el-select
      :model-value="model.operator"
      class="!w-80px"
      placeholder="请选择"
      @update:model-value="patch({ operator: $event })"
    >
      <el-option v-for="item in FORMULA_OPERATOR_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <el-input-number
      :model-value="model.operand"
      :controls="false"
      :min="0"
      :precision="operandPrecision"
      class="!w-100px"
      @update:model-value="patch({ operand: $event })"
    />
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

  /** 整对象回写，避免父级 computed 返回副本时改字段不生效 */
  const patch = (partial: Partial<FormulaRuleReqVO>) => {
    model.value = { ...model.value, ...partial }
  }

  const operandPrecision = computed(() =>
    model.value.operator === 'MULTIPLY' || model.value.operator === 'DIVIDE' ? 4 : 2
  )
</script>
