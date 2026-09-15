<template>
  <el-drawer v-model="drawerVisible" title="商品详情" size="80%" append-to-body destroy-on-close>
    <div v-loading="loading">
      <div class="mb-16px flex items-start justify-between">
        <div class="min-w-0">
          <div class="mb-8px flex items-center gap-10px">
            <span class="truncate text-20px font-700">{{ detail.spuName || '商品详情' }}</span>
            <el-tag :type="getProductStatusType(detail.status)" size="small">
              {{ getProductStatusLabel(detail.status) }}
            </el-tag>
          </div>
          <div class="text-13px text-gray-500">SPU：{{ detail.spuCode || '-' }}</div>
        </div>
        <el-button type="primary" @click="emit('edit', detail.spuCode)">编辑</el-button>
      </div>

      <el-descriptions :column="3" border class="mb-16px">
        <el-descriptions-item label="商品类型">
          {{ getDictLabel(PRODUCT_TYPE_DICT, detail.productType) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="可售品类">
          {{ getDictLabel(SELLABLE_CATEGORY_DICT, detail.sellableCategory) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="商品分类">
          {{ getDictLabel(PRODUCT_CLASSIFICATION_DICT, detail.productClassification) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="主分类">{{ detail.primaryCategoryName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="品牌">{{ detail.brandName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="配送方式">
          {{ getDeliveryTypeLabel(detail.deliveryType) }}
        </el-descriptions-item>
        <el-descriptions-item label="起购量">{{ detail.minQuantity ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="限购量">{{ detail.maxQuantity ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detail.updatedAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="使用说明" :span="3">
          {{ detail.useInstruction || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="mb-8px font-600">SKU规格</div>
      <el-table :data="detail.skus || []">
        <el-table-column label="SKU名称" prop="skuName" min-width="140" />
        <el-table-column label="SKU编码" prop="skuCode" min-width="140" />
        <el-table-column label="履约方式" min-width="110">
          <template #default="{ row }">{{ getFulfillmentTypeLabel(row.fulfillmentType) }}</template>
        </el-table-column>
        <el-table-column label="面值" min-width="100" align="right">
          <template #default="{ row }">{{ formatCentsYuan(row.faceValue) }}</template>
        </el-table-column>
        <el-table-column label="市场价" min-width="100" align="right">
          <template #default="{ row }">{{ formatCentsYuan(row.marketPrice) }}</template>
        </el-table-column>
        <el-table-column label="销售建议价" min-width="110" align="right">
          <template #default="{ row }">{{ formatCentsYuan(row.suggestedSalePrice) }}</template>
        </el-table-column>
        <el-table-column label="每人限购" min-width="140">
          <template #default="{ row }">
            {{
              row.userLimitEnabled
                ? `${getLimitPeriodLabel(row.userLimitPeriod)} ${row.userLimitQuantity} 件`
                : '未开启'
            }}
          </template>
        </el-table-column>
        <el-table-column label="订单限购" min-width="90">
          <template #default="{ row }">{{ row.orderLimitEnabled ? '开启' : '未开启' }}</template>
        </el-table-column>
      </el-table>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ProductApi, SpuDetail } from '@/api/product'
import { getDictLabel } from '@/utils/dict'
import { formatCentsYuan } from '@/views/supplier/utils/constants'
import {
  PRODUCT_CLASSIFICATION_DICT,
  PRODUCT_TYPE_DICT,
  SELLABLE_CATEGORY_DICT,
  getDeliveryTypeLabel,
  getFulfillmentTypeLabel,
  getLimitPeriodLabel,
  getProductStatusLabel,
  getProductStatusType
} from '@/views/supplier/product/utils/constants'

defineOptions({ name: 'ProductListDetail' })

const emit = defineEmits(['edit'])
const drawerVisible = ref(false)
const loading = ref(false)
const detail = ref<SpuDetail>({
  spuName: '',
  skus: []
})

const open = async (spuCode: string) => {
  drawerVisible.value = true
  loading.value = true
  try {
    detail.value = await ProductApi.getProduct(spuCode)
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>
