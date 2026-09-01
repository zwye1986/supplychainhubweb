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

    <el-alert class="mb-12px" type="info" :closable="false" title="供应价模式说明">
      <div class="leading-22px">
        <div>固定值：直接定价，供应价为固定金额。</div>
        <div>实时更新：API实时获取价格（如点餐/电影票场景）。</div>
        <div>按供货折扣：销售建议价 × 折扣率。</div>
      </div>
    </el-alert>

    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="商品名称" prop="spuName" min-width="140" />
      <el-table-column label="SKU规格" prop="skuName" min-width="110" />
      <el-table-column label="SKU编号" prop="skuCode" min-width="120" />
      <el-table-column label="类型/分类" min-width="160">
        <template #default="{ row }">
          <div class="flex flex-wrap gap-4px">
            <el-tag v-if="getTypeCategoryPath(row)" size="small" type="info">
              {{ getTypeCategoryPath(row) }}
            </el-tag>
            <span v-else>-</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="销售建议价（元）" min-width="150" align="right">
        <template #default="{ row }">
          {{ formatPrice(row.suggestPrice) }}
        </template>
      </el-table-column>
      <el-table-column label="供应价模式" min-width="110">
        <template #default="{ row }">
          <el-tag size="small">{{ getSupplyPriceModeLabel(row.supplyPriceMode) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="供应价（元）" min-width="110" align="right">
        <template #default="{ row }">
          {{ formatSupplyPrice(row) }}
        </template>
      </el-table-column>
      <el-table-column label="供货模式" min-width="180">
        <template #default="{ row }">
          <div class="flex flex-wrap gap-4px">
            <el-tag
              v-for="mode in normalizeSupplyModes(row.supplyMode)"
              :key="mode"
              size="small"
              type="success"
            >
              {{ getSupplyModeLabel(mode) }}
            </el-tag>
            <span v-if="!normalizeSupplyModes(row.supplyMode).length">-</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="供货上限" prop="supplyLimit" min-width="100" align="right" />
      <el-table-column label="最低起购量" prop="minOrderQty" min-width="100" align="right" />
      <el-table-column label="状态" min-width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="getProductShelfStatusType(row.status)" size="small">
            {{ getProductShelfStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
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
      :supplier-id="supplierId"
      :supply-configs="resolvedConfigs"
      @success="getList"
    />
  </ContentWrap>
</template>

<script lang="ts" setup>
import { SupplierApi, SupplierProductVO, SupplierSupplyConfigVO } from '@/api/supplier/manage'
import {
  SUPPLIER_PRODUCT_FILTER_TAGS,
  SupplyPriceModeEnum,
  getCategoryLabel,
  getProductCategoryLabel,
  getProductShelfStatusLabel,
  getProductShelfStatusType,
  getProductTypeLabel,
  getSupplyModeLabel,
  getSupplyPriceModeLabel,
  normalizeSupplyModes
} from '@/views/supplier/utils/constants'
import ProductSelectDialog from './ProductSelectDialog.vue'

defineOptions({ name: 'SupplierProductList' })

const props = defineProps<{
  supplierId: number
  supplyConfigs?: SupplierSupplyConfigVO[]
  capabilityTags?: string[]
}>()

const message = useMessage()
const loading = ref(false)
const list = ref<SupplierProductVO[]>([])
const total = ref(0)
const activeTag = ref('equity')
const fetchedConfigs = ref<SupplierSupplyConfigVO[]>([])
const selectDialogRef = ref<InstanceType<typeof ProductSelectDialog>>()

const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  supplierId: undefined as number | undefined,
  categoryCode: undefined as string | undefined
})

const resolvedConfigs = computed<SupplierSupplyConfigVO[]>(() => {
  if (props.supplyConfigs && props.supplyConfigs.length) return props.supplyConfigs
  if (fetchedConfigs.value.length) return fetchedConfigs.value
  return (props.capabilityTags || []).map((code) => ({
    categoryCode: code,
    categoryName: getCategoryLabel(code)
  }))
})

/** 顶部筛选：固定展示可售品类胶囊标签 */
const categoryTags = SUPPLIER_PRODUCT_FILTER_TAGS

const getTypeCategoryPath = (row: SupplierProductVO) => {
  const typeName = row.productTypeName || getProductTypeLabel(row.productType)
  const categoryName = row.productCategoryName || getProductCategoryLabel(row.productCategory)
  if (typeName !== '-' && categoryName !== '-') return `${typeName} / ${categoryName}`
  if (typeName !== '-') return typeName
  if (categoryName !== '-') return categoryName
  return ''
}

const formatPrice = (value?: number) => {
  if (value === undefined || value === null) return '-'
  return Number(value).toFixed(2)
}

/** 供应价展示：固定值取供应价；折扣取建议价×折扣；实时更新为 - */
const formatSupplyPrice = (row: SupplierProductVO) => {
  if (row.supplyPriceMode === SupplyPriceModeEnum.FIXED) {
    return formatPrice(row.supplyPrice)
  }
  if (row.supplyPriceMode === SupplyPriceModeEnum.DISCOUNT) {
    if (row.suggestPrice != null && row.supplyDiscount != null) {
      return ((Number(row.suggestPrice) * Number(row.supplyDiscount)) / 100).toFixed(2)
    }
    return '-'
  }
  return '-'
}

const getList = async () => {
  if (!props.supplierId) return
  loading.value = true
  queryParams.supplierId = props.supplierId
  queryParams.categoryCode = activeTag.value || undefined
  try {
    const data = await SupplierApi.getProductPage(queryParams)
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
  if (!resolvedConfigs.value.length) {
    message.warning('请先在供货配置中添加可供货范围')
    return
  }
  selectDialogRef.value?.open('create')
}

const openEdit = (row: SupplierProductVO) => {
  selectDialogRef.value?.open('update', row)
}

const handleDelete = async (id?: number) => {
  if (!id) return
  try {
    await message.delConfirm('确认移除该合作商品吗？')
    await SupplierApi.deleteProduct(id)
    message.success('移除成功')
    await getList()
  } catch {}
}

const loadConfigs = async () => {
  if (!props.supplierId) return
  if (props.supplyConfigs && props.supplyConfigs.length) {
    fetchedConfigs.value = props.supplyConfigs
    return
  }
  try {
    fetchedConfigs.value = (await SupplierApi.getSupplyConfigList(props.supplierId)) || []
  } catch {
    fetchedConfigs.value = []
  }
}

watch(
  () => [props.supplierId, props.supplyConfigs] as const,
  async () => {
    queryParams.pageNo = 1
    await loadConfigs()
    activeTag.value = categoryTags[0]?.value || 'equity'
    await getList()
  },
  { immediate: true, deep: true }
)
</script>

<style scoped>
.filter-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 18px;
  border: 1px solid var(--el-color-primary-light-5);
  border-radius: 999px;
  background: #fff;
  color: var(--el-color-primary);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.filter-pill:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.filter-pill.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
  font-weight: 500;
}
</style>
