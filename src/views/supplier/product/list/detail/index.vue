<template>
  <el-drawer v-model="drawerVisible" title="商品详情" size="90%" append-to-body destroy-on-close>
    <div v-loading="loading" class="product-detail">
      <section class="detail-section">
        <h3 class="section-title">基本信息</h3>
        <dl class="basic-info">
          <div class="info-item">
            <dt>商品名称（SPU）：</dt>
            <dd>{{ detail.spuName || '-' }}</dd>
          </div>
          <div class="info-item">
            <dt>SPU编号：</dt>
            <dd>{{ detail.spuCode || '-' }}</dd>
          </div>
          <div class="info-item">
            <dt>商品类型：</dt>
            <dd><ProductType :model-value="detail.productType" :multiple="false" text /></dd>
          </div>
          <div class="info-item">
            <dt>商品分类：</dt>
            <dd><ProductCategory :model-value="detail.primaryCategoryId" text /></dd>
          </div>
          <div class="info-item">
            <dt>品牌：</dt>
            <dd>{{ detail.brandName || '-' }}</dd>
          </div>
          <div class="info-item">
            <dt>商品状态：</dt>
            <dd>{{ getDictLabel('supply_chain_sku_status', detail.status) || '-' }}</dd>
          </div>
        </dl>
      </section>

      <section class="detail-section">
        <h3 class="section-title">SKU规格管理</h3>
        <el-table :data="skuRows" class="sku-table">
          <el-table-column label="SKU主图" min-width="100" align="center">
            <template #default="{ row }">
              <el-image
                v-if="row.picUrl"
                :src="row.picUrl"
                :preview-src-list="[row.picUrl]"
                preview-teleported
                fit="cover"
                class="sku-image"
              />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="SKU详情图" min-width="170" align="center">
            <template #default="{ row }">
              <div v-if="row.detailPicUrls.length" class="sku-detail-pics">
                <el-image
                  v-for="(url, index) in row.detailPicUrls"
                  :key="`${url}-${index}`"
                  :src="url"
                  :preview-src-list="row.detailPicUrls"
                  :initial-index="index"
                  preview-teleported
                  fit="cover"
                  class="sku-image"
                />
              </div>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="商品描述" min-width="140" align="center">
            <template #default="{ row }">{{ row.description || '-' }}</template>
          </el-table-column>
          <el-table-column label="SKU名称" prop="skuName" min-width="120" align="center" />
          <el-table-column label="SKU编码" prop="skuCode" min-width="130" align="center" />
          <el-table-column label="市场价（元）" min-width="110" align="center">
            <template #default="{ row }">{{ formatCentsYuan(row.marketPrice) }}</template>
          </el-table-column>
          <el-table-column label="销售建议价（元）" min-width="240" align="center">
            <template #default="{ row }">
              <div>{{ formatSuggestedSalePrice(row) }}</div>
              <div v-if="formatSuggestedSalePriceHistory(row)" class="text-12px text-gray-500">
                {{ formatSuggestedSalePriceHistory(row) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="供应价（元）" min-width="120" align="center">
            <template #default="{ row }">
              {{ row.supplyPrice == null ? '暂无有效供货价' : formatCentsYuan(row.supplyPrice) }}
            </template>
          </el-table-column>
          <el-table-column label="税率" min-width="110" align="center">
            <template #default="{ row }">{{ row.taxRateDisplay || '—' }}</template>
          </el-table-column>
          <el-table-column label="税额(元)" min-width="100" align="center">
            <template #default="{ row }">{{ formatCentsYuan(row.taxAmount) }}</template>
          </el-table-column>
          <el-table-column label="供应商" min-width="180" align="center" show-overflow-tooltip>
            <template #default="{ row }">{{ formatSuppliers(row.suppliers) }}</template>
          </el-table-column>
          <el-table-column label="总库存" min-width="100" align="center">
            <template #default="{ row }">{{
              row.totalInventory ?? row.skuInventory ?? 0
            }}</template>
          </el-table-column>
          <template #empty><el-empty description="暂无SKU规格" /></template>
        </el-table>
      </section>

      <section class="detail-section">
        <h3 class="section-title">配送设置</h3>
        <div class="delivery-info">
          <span>配送方式：</span>
          <el-checkbox :model-value="detail.deliveryType === 'VIRTUAL'" disabled
            >无需物流</el-checkbox
          >
        </div>
      </section>
    </div>
    <template #footer>
      <div class="flex justify-center pb-12px">
        <el-button
          type="primary"
          :disabled="loading || !detail.spuCode"
          @click="emit('edit', detail.spuCode)"
        >
          编辑
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ProductApi } from '@/api/product'
import type { SpuDetail, SupplierSimpleInfo } from '@/api/product'
import { getDictLabel } from '@/utils/dict'
import { formatCentsYuan } from '@/utils/money'
import {
  formatSuggestedSalePrice,
  formatSuggestedSalePriceHistory
} from '../utils/suggested-sale-price'

defineOptions({ name: 'ProductListDetail' })

const emit = defineEmits(['edit'])
const drawerVisible = ref(false)
const loading = ref(false)
const detail = ref<SpuDetail>({
  spuName: '',
  skus: []
})

const formatSuppliers = (suppliers?: SupplierSimpleInfo[]) => {
  if (!suppliers?.length) return '—'
  return (
    suppliers
      .map((item) => item.supplierName || item.supplierCode)
      .filter(Boolean)
      .join('、') || '—'
  )
}

const skuDetailPics = (pics?: string[] | string) => {
  if (Array.isArray(pics)) return pics.filter(Boolean)
  if (typeof pics === 'string' && pics) {
    try {
      const parsed = JSON.parse(pics)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
    } catch {
      return pics
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean)
    }
  }
  return []
}

const skuRows = computed(() =>
  (detail.value.skus || []).map((sku) => ({
    ...sku,
    detailPicUrls: skuDetailPics(sku.detailPics)
  }))
)

const open = async (spuCode: string) => {
  drawerVisible.value = true
  detail.value = { spuName: '', skus: [] }
  loading.value = true
  try {
    detail.value = await ProductApi.getProduct(spuCode)
  } finally {
    loading.value = false
  }
}

const reload = async (spuCode?: string) => {
  const code = spuCode || detail.value.spuCode
  if (!drawerVisible.value || !code) return
  await open(code)
}

defineExpose({ open, reload })
</script>

<style lang="scss" scoped>
.product-detail {
  padding: 4px 16px 16px;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.detail-section + .detail-section {
  margin-top: 40px;
}

.section-title {
  margin: 0 0 24px;
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
}

.basic-info {
  display: grid;
  max-width: 1000px;
  margin: 32px 0 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px 32px;
}

.info-item {
  display: flex;
  min-width: 0;
  line-height: 24px;

  dt {
    width: 140px;
    flex-shrink: 0;
    text-align: right;
  }

  dd {
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
  }
}

.sku-table {
  width: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;

  :deep(th.el-table__cell) {
    height: 44px;
    font-weight: 400;
    color: var(--el-text-color-primary);
    background-color: var(--el-fill-color-light);
  }

  :deep(td.el-table__cell) {
    padding: 20px 0;
  }

  :deep(.cell) {
    overflow-wrap: anywhere;
  }
}

.sku-image {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  vertical-align: middle;
  border: 1px solid var(--el-border-color-lighter);
}

.sku-detail-pics {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.delivery-info {
  display: flex;
  align-items: center;
  padding-left: 24px;
  gap: 8px;

  :deep(.el-checkbox.is-disabled .el-checkbox__label) {
    color: var(--el-text-color-primary);
  }
}

@media (width <= 768px) {
  .product-detail {
    padding-right: 0;
    padding-left: 0;
  }

  .basic-info {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .info-item dt {
    width: 130px;
  }
}
</style>
