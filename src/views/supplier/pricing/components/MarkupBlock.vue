<template>
  <div class="mb-16px rounded border p-16px">
    <div class="mb-12px flex items-center justify-between">
      <span class="font-600">{{ title }}</span>
      <el-button v-if="removable" link type="danger" @click="$emit('remove')">删除</el-button>
    </div>
    <el-form-item v-if="!national" label="选择区域">
      <el-select v-model="model.cities" multiple filterable placeholder="请选择城市">
        <el-option
          v-for="item in CITY_OPTIONS"
          :key="item.value"
          :label="item.label"
          :value="item.value"
          :disabled="disabledCities.includes(item.value)"
        />
      </el-select>
    </el-form-item>
    <el-form-item v-else label="选择区域">
      <el-input model-value="全国" disabled />
    </el-form-item>
    <el-form-item label="调价方式">
      <el-radio-group v-model="model.mode">
        <el-radio value="MARKET">使用市场价</el-radio>
        <el-radio value="CUSTOM">自定义设置</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item v-if="model.mode === 'CUSTOM'" label="调价规则">
      <FormulaInput v-model="model.formula!" />
    </el-form-item>
    <el-form-item v-if="showServiceFee" label="服务费">
      <FormulaInput v-model="model.serviceFee!" :with-base="false" />
    </el-form-item>
  </div>
</template>

<script lang="ts" setup>
import type { RegionMarkupVO } from '@/api/pricing'
import { CITY_OPTIONS } from '@/views/supplier/pricing/utils/constants'
import FormulaInput from './FormulaInput.vue'

defineOptions({ name: 'PricingMarkupBlock' })

defineProps({
  title: { type: String, default: '加价配置' },
  national: { type: Boolean, default: false },
  removable: { type: Boolean, default: false },
  showServiceFee: { type: Boolean, default: true },
  disabledCities: { type: Array as PropType<string[]>, default: () => [] }
})
defineEmits(['remove'])
const model = defineModel<RegionMarkupVO>({ required: true })
</script>
