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
      <el-table-column label="商品名称" prop="platformSpuName" min-width="140" />
      <el-table-column label="SKU规格" prop="platformSkuName" min-width="110" />
      <el-table-column label="SKU编号" prop="platformSkuCode" min-width="120" />
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
          {{ formatCentsYuan(row.suggestPriceCents) }}
        </template>
      </el-table-column>
      <el-table-column label="供应价模式" min-width="110">
        <template #default="{ row }">
          <el-tag size="small">{{ getOfferPriceModeLabel(row.priceMode) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="供应价（元）" min-width="110" align="right">
        <template #default="{ row }">
          {{ formatSupplyPrice(row) }}
        </template>
      </el-table-column>
      <el-table-column label="供货模式" min-width="180">
        <template #default="{ row }">
          <el-tag v-if="row.offerSupplyMode" size="small" type="success">
            {{ getSupplyModeLabel(row.offerSupplyMode) }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="供货上限" prop="maxQuantity" min-width="100" align="right" />
      <el-table-column label="最低起购量" prop="minQuantity" min-width="100" align="right" />
      <el-table-column label="状态" min-width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="getOfferStatusType(row.status)" size="small">
            {{ getOfferStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button
            v-if="row.status === OfferStatusEnum.PUBLISHED"
            link
            type="warning"
            @click="handlePatchStatus(row, OfferStatusEnum.SUSPENDED)"
          >
            下架
          </el-button>
          <el-button
            v-else-if="row.status === OfferStatusEnum.SUSPENDED"
            link
            type="success"
            @click="handlePatchStatus(row, OfferStatusEnum.PUBLISHED)"
          >
            上架
          </el-button>
          <el-button link type="danger" @click="handleDelete(row.offerNo)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />

    <ProductSelectDialog ref="selectDialogRef" :supplier-code="supplierCode" @success="getList" />
  </ContentWrap>
</template>

<script lang="ts" setup>
import { SupplierApi, OfferListItem } from '@/api/supplier/manage'
import {
  OfferPriceModeEnum,
  OfferStatusEnum,
  SUPPLIER_PRODUCT_FILTER_TAGS,
  formatCentsYuan,
  getOfferPriceModeLabel,
  getOfferStatusLabel,
  getOfferStatusType,
  getSupplyModeLabel
} from '@/views/supplier/utils/constants'
import ProductSelectDialog from './ProductSelectDialog.vue'

defineOptions({ name: 'SupplierProductList' })

const props = defineProps<{
  supplierCode: string
}>()

const message = useMessage()
const loading = ref(false)
const list = ref<OfferListItem[]>([])
const total = ref(0)
const activeTag = ref('equity')
const selectDialogRef = ref<InstanceType<typeof ProductSelectDialog>>()

const queryParams = reactive({
  pageNo: 1,
  pageSize: 20
})

/** 顶部筛选：固定展示可售品类胶囊标签 */
const categoryTags = SUPPLIER_PRODUCT_FILTER_TAGS

const getTypeCategoryPath = (row: OfferListItem) => {
  const typeName = row.categoryL2Name
  const categoryName = row.categoryL3Name
  if (typeName && categoryName) return `${typeName} / ${categoryName}`
  return typeName || categoryName || ''
}

/** 供应价展示：固定值取供应价；折扣取建议价×折扣基点；实时更新为 - */
const formatSupplyPrice = (row: OfferListItem) => {
  if (row.priceMode === OfferPriceModeEnum.FIXED) {
    return formatCentsYuan(row.unitPriceCents)
  }
  if (row.priceMode === OfferPriceModeEnum.DISCOUNT) {
    if (row.suggestPriceCents != null && row.discountBp != null) {
      return formatCentsYuan(Math.round((row.suggestPriceCents * row.discountBp) / 10000))
    }
    return '-'
  }
  return '-'
}

const getList = async () => {
  if (!props.supplierCode) return
  loading.value = true
  try {
    const data = await SupplierApi.getOfferPage(props.supplierCode, {
      pageNo: queryParams.pageNo,
      pageSize: queryParams.pageSize
    })
    list.value = data?.list || []
    total.value = data?.total || 0
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
  selectDialogRef.value?.open('create')
}

const openEdit = (row: OfferListItem) => {
  selectDialogRef.value?.open('update', row)
}

const handleDelete = async (offerNo?: string) => {
  if (!offerNo) return
  try {
    await message.delConfirm('确认移除该合作商品吗？')
    await SupplierApi.deleteOffer(props.supplierCode, offerNo)
    message.success('移除成功')
    await getList()
  } catch {}
}

const handlePatchStatus = async (row: OfferListItem, status: string) => {
  if (!row.offerNo) return
  const actionText = status === OfferStatusEnum.SUSPENDED ? '下架' : '上架'
  try {
    await message.confirm(`确认${actionText}该合作商品吗？`, `${actionText}确认`)
    await SupplierApi.patchOffer(props.supplierCode, row.offerNo, { status })
    message.success(`${actionText}成功`)
    await getList()
  } catch {}
}

watch(
  () => props.supplierCode,
  async () => {
    queryParams.pageNo = 1
    activeTag.value = categoryTags[0]?.value || 'equity'
    await getList()
  },
  { immediate: true }
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
