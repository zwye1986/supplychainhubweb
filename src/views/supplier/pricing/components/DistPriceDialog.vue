<template>
  <el-dialog v-model="dialogVisible" title="分销价配置" width="680px" append-to-body>
    <el-alert
      class="mb-16px"
      type="info"
      :closable="false"
      title="分销价作为您与客户结算的价格，分销商账户余额按照此价格扣除。"
    />
    <el-form :model="form" label-width="120px">
      <el-form-item label="调价方式">
        <el-radio-group v-model="form.mode">
          <el-radio value="SUGGEST">按照分销价=销售建议价</el-radio>
          <el-radio value="CUSTOM">自定义设置</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.mode === 'CUSTOM'" label="分销价公式">
        <FormulaInput v-model="form.formula!" />
        <div class="mt-8px text-12px text-[var(--el-color-warning)]">
          乘以系数，请设置百分比大于100，否则会出现亏本情况
        </div>
      </el-form-item>
      <el-form-item label="是否含税">
        <el-select v-model="form.taxMode">
          <el-option label="含税" value="TAX_INCLUDED" />
          <el-option label="不含税" value="TAX_EXCLUDED" />
        </el-select>
      </el-form-item>
      <el-form-item label="税率">
        <el-select v-model="form.taxRate" :disabled="form.taxMode !== 'TAX_INCLUDED'">
          <el-option v-for="item in TAX_RATE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="商品展示阈值">
        <div class="flex items-center gap-8px">
          <span>利润空间低于</span>
          <el-input-number v-model="form.hideThreshold" :min="0" :max="100" :precision="0" />
          <span>% 时自动隐藏</span>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { DistPriceVO } from '@/api/pricing'
import { TAX_RATE_OPTIONS, createDistPrice } from '@/views/supplier/pricing/utils/constants'
import FormulaInput from './FormulaInput.vue'

defineOptions({ name: 'PricingDistPriceDialog' })

const message = useMessage()
const dialogVisible = ref(false)
const form = reactive(createDistPrice())
let resolveFn: ((value: DistPriceVO) => void) | null = null

const open = (data?: DistPriceVO) => {
  Object.assign(form, createDistPrice(), data || {})
  dialogVisible.value = true
  return new Promise<DistPriceVO>((resolve) => {
    resolveFn = resolve
  })
}

const submit = () => {
  if (form.mode === 'CUSTOM' && !form.formula?.percent) {
    message.warning('请填写百分比')
    return
  }
  dialogVisible.value = false
  resolveFn?.(JSON.parse(JSON.stringify(form)))
}

defineExpose({ open })
</script>
