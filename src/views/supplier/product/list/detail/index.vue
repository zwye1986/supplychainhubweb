<template>
  <el-drawer v-model="drawerVisible" title="商品详情" size="80%" append-to-body destroy-on-close>
    <div v-loading="loading">
      <div class="mb-16px flex items-start justify-between">
        <div class="min-w-0">
          <div class="mb-8px flex items-center gap-10px">
            <span class="truncate text-20px font-700">{{ detail.spuName || '商品详情' }}</span>
            <el-tag size="small">
              {{ getDictLabel('supply_chain_product_status', detail.status) || '-' }}
            </el-tag>
          </div>
          <div class="text-13px text-gray-500">SPU：{{ detail.spuCode || '-' }}</div>
        </div>
        <el-button type="primary" @click="emit('edit', detail.spuCode)">编辑</el-button>
      </div>

      <el-descriptions :column="3" border class="mb-16px">
        <el-descriptions-item label="商品类型">
          {{ getDictLabel('supply_chain_product_type', detail.productType) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="商品分类">
          {{ getDictLabel('supply_chain_product_classification', detail.productClassification) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="品牌">{{ detail.brandName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="配送方式">
          {{
            detail.deliveryType === 'VIRTUAL'
              ? '无需物流'
              : getDictLabel('supply_chain_delivery_type', detail.deliveryType) || '-'
          }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detail.updatedAt || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="mb-8px font-600">SKU规格</div>
      <el-table :data="detail.skus || []">
        <el-table-column label="SKU名称" prop="skuName" min-width="140" />
        <el-table-column label="SKU编码" prop="skuCode" min-width="140" />
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
                ? `${getDictLabel('supply_chain_limit_period', row.userLimitPeriod) || '-'} ${row.userLimitQuantity} 件`
                : '未开启'
            }}
          </template>
        </el-table-column>
        <el-table-column label="每个订单限购" min-width="160">
          <template #default="{ row }">
            {{
              row.phoneBindLimitEnabled ? `${row.phoneBindLimitQuantity} 件` : '未开启'
            }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ProductApi, SpuDetail } from '@/api/product'
import { getDictLabel } from '@/utils/dict'
import { formatCentsYuan } from '@/views/supplier/utils/constants'

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
