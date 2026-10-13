<template>
  <el-dialog
    v-model="dialogVisible"
    title="履约能力评分"
    width="820px"
    append-to-body
    destroy-on-close
  >
    <div v-loading="loading">
      <div class="mb-16px">
        <div class="mb-6px flex flex-wrap items-center gap-8px">
          <span class="text-16px font-600">{{ detail.spuName || rowMeta.spuName || '-' }}</span>
          <el-tag v-if="productTypeLabel" size="small" type="info">{{ productTypeLabel }}</el-tag>
        </div>
        <div class="text-13px text-gray-500">
          {{ detail.skuCode || rowMeta.skuCode || '-' }}
          {{ detail.skuName || rowMeta.skuName || '' }}
        </div>
      </div>

      <div class="mb-10px text-14px font-600">供应商履约能力明细</div>
      <el-table :data="items" border empty-text="暂无合作供应商">
        <el-table-column label="供应商" min-width="220">
          <template #default="{ row }">
            {{ [row.supplierCode, row.supplierName].filter(Boolean).join('-') || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="稳定性" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-8px">
              <el-input-number
                v-model="row.stabilityScore"
                :min="0"
                :max="100"
                :precision="0"
                :controls="false"
                class="!w-100px"
              />
              <span class="text-13px text-gray-500">分 (0-100分)</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="时效性" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-8px">
              <el-input-number
                v-model="row.timelinessScore"
                :min="0"
                :max="100"
                :precision="0"
                :controls="false"
                class="!w-100px"
              />
              <span class="text-13px text-gray-500">分 (0-100分)</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <div class="flex justify-center gap-12px">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving || loading" :disabled="loading" @click="submit">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import {
  ProductApi,
  type SkuFulfillmentScoreItem,
  type SkuFulfillmentScoreView
} from '@/api/product'

defineOptions({ name: 'ProductFulfillmentScoreDialog' })

const message = useMessage()
const emit = defineEmits<{ success: [] }>()

const dialogVisible = ref(false)
const loading = ref(false)
const saving = ref(false)
const detail = ref<SkuFulfillmentScoreView>({})
const items = ref<SkuFulfillmentScoreItem[]>([])
const rowMeta = ref<{
  skuCode?: string
  skuName?: string
  spuName?: string
  productTypeName?: string
}>({})

const productTypeLabel = computed(() => rowMeta.value.productTypeName || '')

const normalizeScore = (value?: number | null) => {
  if (value == null || Number.isNaN(Number(value))) return 80
  return Math.min(100, Math.max(0, Math.round(Number(value))))
}

const open = async (payload: {
  skuCode: string
  skuName?: string
  spuName?: string
  productTypeName?: string
}) => {
  if (!payload.skuCode) {
    message.warning('缺少 SKU 编码，无法查看履约能力')
    return
  }
  rowMeta.value = { ...payload }
  detail.value = {}
  items.value = []
  dialogVisible.value = true
  loading.value = true
  try {
    const data = await ProductApi.getSkuFulfillmentScores(payload.skuCode)
    detail.value = data || {}
    items.value = (data?.items || []).map((item) => ({
      ...item,
      stabilityScore: normalizeScore(item.stabilityScore),
      timelinessScore: normalizeScore(item.timelinessScore)
    }))
  } finally {
    loading.value = false
  }
}

const submit = async () => {
  const skuCode = detail.value.skuCode || rowMeta.value.skuCode
  if (!skuCode) {
    message.error('缺少 SKU 编码，无法保存')
    return
  }
  if (!items.value.length) {
    dialogVisible.value = false
    return
  }
  for (const item of items.value) {
    if (!item.supplierCode) {
      message.error('存在缺少供应商编码的评分行')
      return
    }
    if (item.stabilityScore == null || item.timelinessScore == null) {
      message.warning('请完整填写稳定性与时效性评分')
      return
    }
  }
  saving.value = true
  try {
    await ProductApi.saveSkuFulfillmentScores(skuCode, {
      items: items.value.map((item) => ({
        supplierCode: item.supplierCode || '',
        stabilityScore: normalizeScore(item.stabilityScore),
        timelinessScore: normalizeScore(item.timelinessScore)
      }))
    })
    message.success('履约能力评分已保存')
    dialogVisible.value = false
    emit('success')
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>
