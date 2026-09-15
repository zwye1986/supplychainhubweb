<template>
  <div class="flex flex-wrap items-center gap-8px">
    <template v-if="withBase">
      <el-select v-model="model.base" class="!w-140px">
        <el-option label="市场价" value="MARKET" />
        <el-option label="销售建议价" value="SUGGEST" />
        <el-option label="供应价" value="SUPPLY" />
      </el-select>
      <span>*</span>
    </template>
    <template v-else>
      <span>{{ prefix }}*</span>
    </template>
    <el-input-number v-model="model.percent" :min="0" :precision="2" />
    <span>%</span>
    <el-select v-model="model.op" class="!w-80px">
      <el-option label="+" value="+" />
      <el-option label="-" value="-" />
      <el-option label="*" value="*" />
      <el-option label="/" value="/" />
    </el-select>
    <el-input-number v-model="model.amount" :min="0" :precision="2" />
    <span>元</span>
  </div>
</template>

<script lang="ts" setup>
import type { FormulaVO, ServiceFeeVO } from '@/api/pricing'

defineOptions({ name: 'PricingFormulaInput' })

defineProps({
  withBase: { type: Boolean, default: true },
  prefix: { type: String, default: '订单金额' }
})

const model = defineModel<FormulaVO | ServiceFeeVO>({ required: true })
</script>
