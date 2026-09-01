<template>
  <ContentWrap>
    <div class="mb-12px flex flex-wrap items-center justify-between gap-10px">
      <div class="flex flex-wrap items-center gap-10px">
        <button
          v-for="tag in categoryTags"
          :key="tag.value"
          type="button"
          class="filter-pill"
          :class="{ 'is-active': activeTag === tag.value }"
          @click="handleTagChange(tag.value)"
        >
          {{ tag.label }}
        </button>
      </div>
      <el-button type="primary" round @click="openSelectDialog">+新增商品</el-button>
    </div>

    <el-alert class="mb-12px" type="info" :closable="false" title="三级定价体系说明">
      <div class="leading-22px">
        <div>L1 平台默认定价 → L2 分销商基础价 → L3 项目专属价（在项目管理模块配置）。</div>
        <div>结算优先级：L3 &gt; L2 &gt; L1。被项目定价覆盖的 SKU 以橙色标记。</div>
      </div>
    </el-alert>

    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="商品名称" prop="spuName" min-width="140" />
      <el-table-column label="SKU规格" prop="skuName" min-width="100" />
      <el-table-column label="类型/分类" min-width="140">
        <template #default="{ row }">
          {{ getTypeCategoryPath(row) }}
        </template>
      </el-table-column>
      <el-table-column label="销售建议价（元）" min-width="130" align="right">
        <template #default="{ row }">
          {{ formatPrice(row.suggestPrice) }}
        </template>
      </el-table-column>
      <el-table-column label="分销价规则" prop="pricingRule" min-width="150" />
      <el-table-column label="分销价（元）" min-width="110" align="right">
        <template #default="{ row }">
          <span :class="{ 'font-600 text-[var(--el-color-warning)]': row.projectPriceCovered }">
            {{ formatPrice(row.distPrice) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="项目专属价（元）" min-width="130" align="right">
        <template #default="{ row }">
          <span :class="{ 'font-600 text-[var(--el-color-warning)]': row.projectPriceCovered }">
            {{ formatPrice(row.projectPrice) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="最终结算价（元）" min-width="130" align="right">
        <template #default="{ row }">
          <span class="font-700" :class="{ 'text-[var(--el-color-warning)]': row.projectPriceCovered }">
            {{ formatPrice(row.finalPrice) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="定价来源" min-width="120">
        <template #default="{ row }">
          <el-tag v-if="row.projectPriceCovered" size="small" type="warning">
            {{ row.priceSource || '项目专属价' }}
          </el-tag>
          <span v-else>{{ row.priceSource || '分销商基础价' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="message.info('改价功能待后端接口接入')">
            改价
          </el-button>
          <el-button link type="danger" @click="handleDelete(row.id)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />

    <ProductSelectDialog
      ref="selectDialogRef"
      :distributor-id="distributorId"
      @success="getList"
    />
  </ContentWrap>
</template>

<script lang="ts" setup>
import { DistributorApi, DistributorProductVO } from '@/api/supplier/distribution'
import {
  DIST_PRODUCT_TYPE_OPTIONS,
  getCategoryLabel,
  getDistProductTypeLabel,
  getProductCategoryLabel
} from '@/views/supplier/utils/constants'
import ProductSelectDialog from './ProductSelectDialog.vue'

defineOptions({ name: 'DistributorProductList' })

const props = defineProps<{
  distributorId: number
}>()

const message = useMessage()
const loading = ref(false)
const list = ref<DistributorProductVO[]>([])
const total = ref(0)
const activeTag = ref('')
const selectDialogRef = ref<InstanceType<typeof ProductSelectDialog>>()

const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  distributorId: undefined as number | undefined,
  categoryCode: undefined as string | undefined
})

const categoryTags = [
  { value: '', label: '全部商品' },
  ...DIST_PRODUCT_TYPE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))
]

const formatPrice = (value?: number) => {
  if (value === undefined || value === null) return '-'
  return Number(value).toFixed(2)
}

const getTypeCategoryPath = (row: DistributorProductVO) => {
  const type = row.productTypeName || getDistProductTypeLabel(row.productType)
  const category =
    row.productCategoryName ||
    getProductCategoryLabel(row.productCategory) ||
    row.categoryName ||
    getCategoryLabel(row.categoryCode)
  if (type && type !== '-' && category && category !== '-') return `${type} / ${category}`
  return type !== '-' ? type : category || '-'
}

const getList = async () => {
  if (!props.distributorId) return
  loading.value = true
  queryParams.distributorId = props.distributorId
  queryParams.categoryCode = activeTag.value || undefined
  try {
    const data = await DistributorApi.getProductPage(queryParams)
    list.value = data.list || []
    total.value = data.total || 0
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleTagChange = (value: string) => {
  activeTag.value = value
  queryParams.pageNo = 1
  getList()
}

const openSelectDialog = () => {
  selectDialogRef.value?.open()
}

const handleDelete = async (id?: number) => {
  if (!id) return
  try {
    await message.delConfirm('确认移除该分销商品吗？')
    await DistributorApi.deleteProduct(id)
    message.success('移除成功')
    await getList()
  } catch {}
}

watch(
  () => props.distributorId,
  () => {
    queryParams.pageNo = 1
    getList()
  },
  { immediate: true }
)
</script>

<style scoped>
.filter-pill {
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-regular);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  padding: 8px 14px;
}

.filter-pill.is-active {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: #fff;
}
</style>
