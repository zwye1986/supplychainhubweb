<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="920px" append-to-body destroy-on-close>
    <PricingForm ref="pricingFormRef" :loading="detailLoading" />
    <template #footer>
      <div class="flex justify-center gap-12px">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading || detailLoading" :disabled="detailLoading" @click="submit">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { PlatformSkuBatchPricingReqVO, ProductApi } from '@/api/product'
import PricingForm from './PricingForm.vue'

defineOptions({ name: 'ProductPriceDialog' })

const message = useMessage()
const emit = defineEmits(['success'])
const dialogVisible = ref(false)
const formLoading = ref(false)
const detailLoading = ref(false)
const pricingFormRef = ref<InstanceType<typeof PricingForm>>()
const skuCodes = ref<string[]>([])
const isBatch = ref(false)
const dialogTitle = computed(() => (isBatch.value ? '批量定价' : '定价'))

const isPriced = (detail?: { pricingStatus?: string; currentVersionId?: number; versionNo?: number; distributionRule?: { mode?: string } }) => {
  if (!detail) return false
  if (detail.pricingStatus === 'UNPRICED') return false
  return !!(detail.currentVersionId || detail.versionNo || detail.distributionRule?.mode)
}

const open = async (codes: string[], batch = false) => {
  skuCodes.value = [...new Set(codes.filter(Boolean))]
  isBatch.value = batch
  dialogVisible.value = true
  await nextTick()
  pricingFormRef.value?.reset()
  if (batch || !skuCodes.value[0]) {
    nextTick(() => pricingFormRef.value?.clearValidate())
    return
  }
  detailLoading.value = true
  try {
    const detail = await ProductApi.getSkuPricing(skuCodes.value[0])
    if (isPriced(detail)) pricingFormRef.value?.applyDetail(detail)
  } finally {
    detailLoading.value = false
    nextTick(() => pricingFormRef.value?.clearValidate())
  }
}

/**
 * 单条与批量均提交五组完整默认配置；税务只作结算展示，不含税仍携带 NON_TAXABLE。
 * 表单负责税务归一化，本层完整转发，不能再按 taxIncluded 过滤编码。
 * 设计见后端 docs/superpowers/specs/2026-09-15-generic-batch-pricing-design.md#6-管理端接口。
 */
const submit = async () => {
  await pricingFormRef.value?.validate()
  if (!skuCodes.value.length) {
    message.warning('请选择需要定价的商品 SKU')
    return
  }
  const values = pricingFormRef.value?.getValues()
  if (!values) return
  const payload: PlatformSkuBatchPricingReqVO = {
    platformSkuCodes: skuCodes.value,
    distributionRule: values.distributionRule,
    salesRule: values.salesRule,
    serviceFeeRule: values.serviceFeeRule,
    taxIncluded: values.taxIncluded,
    taxRateCode: values.taxRateCode
  }
  if (values.distributionHideThresholdPercent != null) {
    payload.distributionHideThresholdPercent = values.distributionHideThresholdPercent
  }
  if (values.salesHideThresholdPercent != null) {
    payload.salesHideThresholdPercent = values.salesHideThresholdPercent
  }

  formLoading.value = true
  try {
    await ProductApi.batchSkuPricing(payload)
    message.success('定价已保存')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
