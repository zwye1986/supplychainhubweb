<template>
  <el-drawer v-model="drawerVisible" title="商品详情" size="80%" append-to-body destroy-on-close>
    <div v-loading="loading">
      <div class="mb-16px flex items-start justify-between">
        <div class="min-w-0">
          <div class="mb-8px flex items-center gap-10px">
            <span class="truncate text-20px font-700">{{ detail.spuName || '商品详情' }}</span>
            <el-tag size="small">
              {{ getDictLabel('supply_chain_sku_status', detail.status) || '-' }}
            </el-tag>
          </div>
          <div class="text-13px text-gray-500">SPU：{{ detail.spuCode || '-' }}</div>
        </div>
        <el-button type="primary" @click="emit('edit', detail.spuCode)">编辑</el-button>
      </div>

      <el-descriptions :column="3" border class="mb-16px">
        <el-descriptions-item label="商品类型">
          <ProductType :model-value="detail.productType" :multiple="false" text />
        </el-descriptions-item>
        <el-descriptions-item label="商品分类">
          <ProductCategory :model-value="detail.primaryCategoryId" text />
        </el-descriptions-item>
        <el-descriptions-item label="品牌">{{ detail.brandName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="兑换方式">
          {{
            detail.fulfillmentTypeDisplay ||
            getDictLabel('supply_chain_fulfillment_type', detail.fulfillmentType) ||
            '-'
          }}
        </el-descriptions-item>
        <el-descriptions-item label="每人限购">{{ userLimitText }}</el-descriptions-item>
        <el-descriptions-item v-if="!isCardFulfillment" label="绑定手机号限购">
          {{ phoneBindLimitText }}
        </el-descriptions-item>
        <el-descriptions-item label="是否需要物流">
          {{ needLogistics ? '是' : '否' }}
        </el-descriptions-item>
        <el-descriptions-item :span="isCardFulfillment ? 2 : 1" label="更新时间">
          {{ updatedAtText }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="mb-8px font-600">SKU规格</div>
      <el-table :data="detail.skus || []">
        <el-table-column label="SKU名称" prop="skuName" min-width="140" />
        <el-table-column label="SKU编码" prop="skuCode" min-width="140" />
        <el-table-column label="主图" min-width="90" align="center">
          <template #default="{ row }">
            <el-image v-if="row.picUrl" :src="row.picUrl" :preview-src-list="[row.picUrl]" preview-teleported fit="cover" class="h-64px w-64px rounded" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="详情图" min-width="90" align="center">
          <template #default="{ row }">
            <el-popover v-if="skuDetailPics(row.detailPics).length" placement="right" trigger="hover" :disabled="skuDetailPics(row.detailPics).length <= 1" :width="320" :show-after="200">
              <div class="flex flex-wrap gap-8px">
                <el-image v-for="(url, i) in skuDetailPics(row.detailPics)" :key="`${url}-${i}`" :src="url" :preview-src-list="skuDetailPics(row.detailPics)" :initial-index="i" preview-teleported
                  fit="cover" class="h-72px w-72px rounded" />
              </div>
              <template #reference>
                <div class="relative inline-block cursor-pointer">
                  <el-image :src="skuDetailPics(row.detailPics)[0]" :preview-src-list="skuDetailPics(row.detailPics)" preview-teleported fit="cover" class="h-64px w-64px rounded" />
                  <span v-if="skuDetailPics(row.detailPics).length > 1" class="absolute bottom-0 right-0 rounded-tl px-4px text-12px leading-18px text-white bg-black/60">
                    {{ skuDetailPics(row.detailPics).length }}
                  </span>
                </div>
              </template>
            </el-popover>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="商品描述" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.description || '-' }}</template>
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
        <el-table-column label="总库存" min-width="100" align="right">
          <template #default="{ row }">{{ row.skuInventory ?? row.totalInventory ?? 0 }}</template>
        </el-table-column>
      </el-table>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
  import { ProductApi, SpuDetail } from '@/api/product'
  import { getDictLabel } from '@/utils/dict'
  import { formatNullableDate } from '@/utils/formatTime'
  import { formatCentsYuan } from '@/views/supplier/utils/constants'

  defineOptions({ name: 'ProductListDetail' })

  const emit = defineEmits(['edit'])
  const drawerVisible = ref(false)
  const loading = ref(false)
  const detail = ref<SpuDetail>({
    spuName: '',
    skus: []
  })

  const isCardFulfillment = computed(() => {
    const type = detail.value.fulfillmentType
    if (type == null || type === '') return false
    const code = String(type).toUpperCase()
    if (['CARD', 'CARD_SECRET', 'CARD_CODE', 'CARD_PWD', 'CARD_KEY', 'CARD_PIN', 'CDK'].includes(code)) {
      return true
    }
    const text = `${getDictLabel('supply_chain_fulfillment_type', type) || ''} ${type}`
    return /卡号|卡密/.test(text)
  })

  const needLogistics = computed(() => detail.value.deliveryType !== 'VIRTUAL')

  const userLimitText = computed(() => {
    if (!detail.value.userLimitEnabled) return '未开启'
    const period =
      getDictLabel('supply_chain_purchase_limit_period', detail.value.userLimitPeriod) || '-'
    return `${period} ${detail.value.userLimitQuantity ?? '-'} 件`
  })

  const phoneBindLimitText = computed(() => {
    if (!detail.value.phoneBindLimitEnabled) return '未开启'
    return `${detail.value.phoneBindLimitQuantity ?? '-'} 个`
  })

  const updatedAtText = computed(() => {
    const value = detail.value.updatedAt
    if (value == null || value === '') return '-'
    const date = /^\d+$/.test(String(value)) ? Number(value) : value
    return formatNullableDate(date)
  })

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

  const open = async (spuCode: string) => {
    drawerVisible.value = true
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
