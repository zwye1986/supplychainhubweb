<template>
  <Dialog
    v-model="dialogVisible"
    title="新增分销商品"
    width="1600px"
    :scroll="true"
    max-height="78vh"
  >
    <el-alert class="mb-12px" type="info" :closable="false">
      <template #title>
        <div
          >为已勾选的 SKU 配置项目专属价。填入项目价后，该 SKU
          在此项目中按项目价结算；不填则按基础分销价结算。</div
        >
        <div>支持批量调价：按分销价=销售价或公式批量设置项目价。</div>
      </template>
    </el-alert>

    <el-row :gutter="16">
      <el-col :span="12">
        <ContentWrap class="!mb-0">
          <div v-if="categoryTags.length > 1" class="mb-12px flex flex-wrap items-center gap-10px">
            <button
              v-for="tag in categoryTags"
              :key="tag.value || 'all'"
              type="button"
              class="filter-pill"
              :class="{ 'is-active': activeTag === tag.value }"
              @click="handleTagChange(tag.value)"
            >
              {{ tag.label }}
            </button>
          </div>
          <el-form :inline="true" class="-mb-10px" @submit.prevent>
            <el-form-item label="商品">
              <el-input
                v-model="queryParams.keyword"
                placeholder="名称/编号"
                clearable
                class="!w-160px"
                @keyup.enter="handleQuery"
              />
            </el-form-item>
            <el-form-item label="商品分类">
              <ProductCategory
                v-model="queryParams.categoryCode"
                node-key="categoryCode"
                placeholder="请选择"
                class="!w-160px"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleQuery">搜索</el-button>
              <el-button @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
          <el-table
            ref="tableRef"
            v-loading="loading"
            :data="skuList"
            row-key="platformSkuCode"
            border
            height="420"
            :span-method="spanMethod"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="45" :reserve-selection="true" />
            <el-table-column label="商品名称(SPU)" min-width="150">
              <template #default="{ row }">
                <div>{{ row.spuName || '-' }}</div>
                <div class="text-12px text-gray-500">{{ row.spuCode || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="SKU规格" min-width="110">
              <template #default="{ row }">{{ row.skuName || '-' }}</template>
            </el-table-column>
            <el-table-column label="类型/分类" min-width="150">
              <template #default="{ row }">{{ getTypeCategoryLabel(row) }}</template>
            </el-table-column>
            <el-table-column label="市场价（元）" min-width="100" align="right">
              <template #default="{ row }">
                {{ formatCentsYuan(row.marketPriceCents ?? row.marketPrice) }}
              </template>
            </el-table-column>
            <el-table-column label="基础分销价(元)" min-width="120" align="right">
              <template #default="{ row }">
                {{ formatCentsYuan(row.distPriceCents) }}
              </template>
            </el-table-column>
          </el-table>
          <Pagination
            v-model:page="queryParams.pageNo"
            v-model:limit="queryParams.pageSize"
            :total="total"
            :page-sizes="[10, 20]"
            @pagination="getSkuList"
          />
        </ContentWrap>
      </el-col>

      <el-col :span="12">
        <ContentWrap class="right-panel !mb-0">
          <div class="right-panel__scroll">
            <div class="mb-12px text-14px font-600">
              已选商品
              <span class="text-[var(--el-color-primary)]">{{ selectedList.length }}</span>
            </div>

            <div class="batch-config">
              <div class="batch-config__title">
                批量配置项目专属价
                <span class="batch-config__hint">对已选数据一键应用以下设置，可不填</span>
              </div>
              <DistributionPriceForm
                ref="batchFormRef"
                v-model="batchPrice"
                optional
                price-label="项目专属价"
                :sale-price-tip="DEFAULT_SALE_PRICE_TIP"
              />
              <div class="batch-config__actions">
                <el-button @click="clearBatchPrice">清空</el-button>
                <el-button type="primary" @click="applyBatchPrice">应用</el-button>
              </div>
            </div>

            <div
              v-for="group in selectedGroups"
              :key="group.spuCode || group.spuName"
              class="selected-spu mb-12px"
            >
              <div class="selected-spu__header">
                <span class="truncate font-600">{{ group.spuName }}</span>
                <span class="selected-spu__count">{{ group.items.length }}个SKU</span>
              </div>
              <div v-for="item in group.items" :key="item.platformSkuCode" class="selected-sku">
                <div class="selected-sku__header">
                  <span class="selected-sku__name" :title="item.skuName || item.platformSkuCode">
                    {{ item.skuName || item.platformSkuCode }}
                  </span>
                  <el-button link type="danger" @click="removeSelected(item.platformSkuCode)">
                    移除
                  </el-button>
                </div>
                <div class="selected-sku__price-title">项目专属价</div>
                <DistributionPriceForm
                  :ref="(el) => setSkuFormRef(item.platformSkuCode, el)"
                  v-model="item.price"
                  optional
                  price-label="项目专属价"
                  :sale-price-tip="formatSuggestTip(item)"
                />
              </div>
            </div>
            <el-empty v-if="!selectedList.length" description="请从左侧选择商品" :image-size="60" />
          </div>
        </ContentWrap>
      </el-col>
    </el-row>

    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确 定</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import {
  AddProjectProductsReqVO,
  BuyerProductListItem,
  DistributorApi,
  ProjectApi,
  ProjectProductItemReqVO,
  type BuyerProductCreatePricingReqVO,
  type DistFormulaRuleReqVO
} from '@/api/supplier/distribution'
import {
  buildCatalogSaveMessage,
  isCatalogSaveUncertainError
} from '@/views/supplier/distribution/utils/catalogSaveResult'
import { ProductCategoryApi, type ProductCategoryVO } from '@/api/product'
import { formatCentsYuan } from '@/views/supplier/utils/constants'
import DistributionPriceForm from '@/views/supplier/distribution/distributor/detail/DistributionPriceForm.vue'
import {
  createEmptyDistPrice,
  isDistPriceConfigured,
  type DistPriceFormData
} from '@/views/supplier/distribution/distributor/detail/distributionPrice'

defineOptions({ name: 'ProjectProductSelectDialog' })

const DEFAULT_SALE_PRICE_TIP = '销售建议价=市场价*0.5%+0元'

type SelectSkuRow = BuyerProductListItem & { _rowspan?: number }

interface SelectedProjectProduct extends BuyerProductListItem {
  price: DistPriceFormData
}

const props = defineProps<{
  projectCode: string
  buyerCode?: string
  productTypeItems?: Array<{ id: string; name: string }>
}>()

const emit = defineEmits<{
  success: []
}>()

const message = useMessage()
const dialogVisible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const skuList = ref<SelectSkuRow[]>([])
const activeTag = ref('')
const categoryNameMap = ref<Record<string, string>>({})
const total = ref(0)
const selectedList = ref<SelectedProjectProduct[]>([])
const tableRef = ref()
const batchFormRef = ref<InstanceType<typeof DistributionPriceForm>>()
const skuFormRefs = new Map<string, InstanceType<typeof DistributionPriceForm>>()
const batchPrice = ref<DistPriceFormData>(createEmptyDistPrice())

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: '',
  categoryCode: undefined as string | undefined
})

const productTypeCodes = computed(() => [
  ...new Set(
    (props.productTypeItems || []).map((item) => String(item.id || '').trim()).filter(Boolean)
  )
])

const categoryTags = computed(() => [
  { value: '', label: '全部商品' },
  ...(props.productTypeItems || []).map((item) => ({
    value: item.id,
    label: item.name || item.id
  }))
])

const queryProductTypes = computed(() => {
  if (activeTag.value) return [activeTag.value]
  return productTypeCodes.value.length ? productTypeCodes.value : undefined
})

const clonePrice = (src: DistPriceFormData): DistPriceFormData => ({
  distributionRule: { ...src.distributionRule },
  taxIncluded: src.taxIncluded,
  taxRateCode: src.taxRateCode,
  distributionHideThresholdPercent: src.distributionHideThresholdPercent
})

const setSkuFormRef = (skuCode: string | undefined, el: unknown) => {
  if (!skuCode) return
  if (el) skuFormRefs.set(skuCode, el as InstanceType<typeof DistributionPriceForm>)
  else skuFormRefs.delete(skuCode)
}

const formatSuggestTip = (item: SelectedProjectProduct) => {
  const cents = item.suggestedSalePriceCents
  if (cents == null) return DEFAULT_SALE_PRICE_TIP
  const price = formatCentsYuan(cents)
  return price === '-' ? DEFAULT_SALE_PRICE_TIP : `销售建议价=${price}元`
}

const collectCategoryNames = (nodes: ProductCategoryVO[] = [], map: Record<string, string>) => {
  nodes.forEach((node) => {
    if (node.categoryName) {
      if (node.categoryCode) map[node.categoryCode] = node.categoryName
      if (node.id != null) map[String(node.id)] = node.categoryName
    }
    if (node.children?.length) collectCategoryNames(node.children, map)
  })
}

const loadCategoryNames = async () => {
  if (Object.keys(categoryNameMap.value).length) return
  const tree = await ProductCategoryApi.getCategoryList()
  const map: Record<string, string> = {}
  collectCategoryNames(tree || [], map)
  categoryNameMap.value = map
}

const getTypeCategoryLabel = (row: BuyerProductListItem) => {
  const typeName =
    props.productTypeItems?.find((item) => item.id === row.productType)?.name || row.productType
  const classification = row.productClassification
  const categoryName = classification ? categoryNameMap.value[classification] || classification : ''
  return [typeName, categoryName].filter(Boolean).join('/') || '-'
}

const attachSpuRowspan = (items: BuyerProductListItem[] = []): SelectSkuRow[] => {
  const rows: SelectSkuRow[] = items.map((item) => ({ ...item, _rowspan: 0 }))
  let index = 0
  while (index < rows.length) {
    const spuCode = rows[index].spuCode
    let count = 1
    if (spuCode) {
      while (index + count < rows.length && rows[index + count].spuCode === spuCode) count++
    }
    rows[index]._rowspan = count
    index += count
  }
  return rows
}

const spanMethod = ({ row, columnIndex }: { row: SelectSkuRow; columnIndex: number }) => {
  if (columnIndex !== 1 || row._rowspan == null) return
  return row._rowspan ? { rowspan: row._rowspan, colspan: 1 } : { rowspan: 0, colspan: 0 }
}

const open = async () => {
  if (!props.buyerCode) {
    message.warning('当前项目未关联分销商，无法选择分销商品')
    return
  }
  dialogVisible.value = true
  selectedList.value = []
  activeTag.value = ''
  queryParams.pageNo = 1
  queryParams.keyword = ''
  queryParams.categoryCode = undefined
  batchPrice.value = createEmptyDistPrice()
  skuFormRefs.clear()
  await nextTick()
  batchFormRef.value?.clearValidate()
  tableRef.value?.clearSelection?.()
  await Promise.all([getSkuList(), loadCategoryNames().catch(() => undefined)])
}
defineExpose({ open })

const getSkuList = async () => {
  if (!props.buyerCode) return
  loading.value = true
  try {
    const data = await DistributorApi.getBuyerProductPage(props.buyerCode, {
      pageNo: queryParams.pageNo,
      pageSize: queryParams.pageSize,
      projectCode: props.projectCode,
      productType: queryProductTypes.value,
      keyword: queryParams.keyword,
      categoryCode: queryParams.categoryCode
    })
    skuList.value = attachSpuRowspan(data.list || [])
    total.value = data.total || 0
  } catch {
    skuList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleTagChange = (value: string) => {
  if (activeTag.value === value) return
  activeTag.value = value
  queryParams.pageNo = 1
  getSkuList()
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getSkuList()
}

const resetQuery = () => {
  queryParams.keyword = ''
  queryParams.categoryCode = undefined
  queryParams.pageNo = 1
  getSkuList()
}

const selectedGroups = computed(() => {
  const groups: { spuCode: string; spuName: string; items: SelectedProjectProduct[] }[] = []
  const indexMap = new Map<string, number>()
  selectedList.value.forEach((item) => {
    const key = item.spuCode || item.spuName || item.platformSkuCode || ''
    const existing = indexMap.get(key)
    if (existing == null) {
      indexMap.set(key, groups.length)
      groups.push({
        spuCode: item.spuCode || '',
        spuName: item.spuName || '-',
        items: [item]
      })
      return
    }
    groups[existing].items.push(item)
  })
  return groups
})

const handleSelectionChange = (rows: BuyerProductListItem[]) => {
  const map = new Map(selectedList.value.map((item) => [item.platformSkuCode, item]))
  rows.forEach((row) => {
    if (!row.platformSkuCode || map.has(row.platformSkuCode)) return
    map.set(row.platformSkuCode, {
      ...row,
      price: clonePrice(batchPrice.value)
    })
  })
  const selectedCodes = new Set(rows.map((item) => item.platformSkuCode).filter(Boolean))
  selectedList.value = [...map.values()].filter((item) => selectedCodes.has(item.platformSkuCode))
}

const removeSelected = (platformSkuCode?: string) => {
  if (!platformSkuCode) return
  selectedList.value = selectedList.value.filter((item) => item.platformSkuCode !== platformSkuCode)
  const row = skuList.value.find((item) => item.platformSkuCode === platformSkuCode)
  if (row) tableRef.value?.toggleRowSelection?.(row, false)
}

const toOptionalNumber = (value?: number | null) => {
  if (value == null || Number.isNaN(Number(value))) return undefined
  return Number(value)
}

const buildFormulaRule = (rule: DistPriceFormData['distributionRule']): DistFormulaRuleReqVO => {
  if (rule.mode === 'DIRECT_MARKET_PRICE') {
    return { mode: 'DIRECT_MARKET_PRICE' }
  }
  return {
    mode: 'CUSTOM',
    base: rule.base,
    percentage: Number(rule.percentage),
    operator: rule.operator,
    operand: rule.operand ?? 0
  }
}

const buildPricing = (price: DistPriceFormData): BuyerProductCreatePricingReqVO => {
  const hidePercent = toOptionalNumber(price.distributionHideThresholdPercent)
  const payload: BuyerProductCreatePricingReqVO = {
    distributionInherited: false,
    distributionRule: buildFormulaRule(price.distributionRule),
    salesInherited: true,
    serviceFeeInherited: true,
    hideInherited: hidePercent == null,
    taxInherited: false,
    taxIncluded: price.taxIncluded
  }
  if (hidePercent != null) {
    payload.distributionHideThresholdPercent = hidePercent
  }
  if (price.taxIncluded && price.taxRateCode) {
    payload.taxRateCode = price.taxRateCode
  }
  return payload
}

const clearBatchPrice = () => {
  batchPrice.value = createEmptyDistPrice()
  nextTick(() => batchFormRef.value?.clearValidate())
}

const applyBatchPrice = async () => {
  if (!selectedList.value.length) {
    message.warning('请先选择商品')
    return
  }
  if (isDistPriceConfigured(batchPrice.value)) {
    await batchFormRef.value?.validate()
  }
  const next = clonePrice(batchPrice.value)
  selectedList.value.forEach((item) => {
    item.price = clonePrice(next)
  })
  await nextTick()
  selectedList.value.forEach((item) => {
    skuFormRefs.get(item.platformSkuCode || '')?.clearValidate()
  })
  message.success(isDistPriceConfigured(next) ? '已应用到已选商品' : '已清空已选商品的项目专属价')
}

const handleSubmit = async () => {
  if (!selectedList.value.length) {
    message.warning('请至少选择一个SKU')
    return
  }
  if (!props.projectCode) {
    message.error('缺少项目编号，无法发布商品')
    return
  }
  await nextTick()
  for (const item of selectedList.value) {
    if (!isDistPriceConfigured(item.price)) continue
    const form = item.platformSkuCode ? skuFormRefs.get(item.platformSkuCode) : undefined
    if (!form) {
      message.error(`请完善 ${item.skuName || item.platformSkuCode} 的项目专属价`)
      return
    }
    await form.validate()
  }
  submitting.value = true
  try {
    const items: ProjectProductItemReqVO[] = selectedList.value.map((item) => {
      const row: ProjectProductItemReqVO = {
        platformSkuCode: item.platformSkuCode || ''
      }
      if (isDistPriceConfigured(item.price)) {
        row.pricing = buildPricing(item.price)
      }
      return row
    })
    const payload: AddProjectProductsReqVO = { items }
    const saveResult = await ProjectApi.createProducts(props.projectCode, payload)
    const hint = buildCatalogSaveMessage(saveResult)
    message[hint.type](hint.content)
    dialogVisible.value = false
    emit('success')
  } catch (error) {
    if (isCatalogSaveUncertainError(error)) {
      const hint = buildCatalogSaveMessage()
      message[hint.type](hint.content)
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.right-panel__scroll {
  max-height: 640px;
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 4px;
}

.batch-config {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

.batch-config__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
}

.batch-config__hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 400;
}

.batch-config__actions {
  display: flex;
  gap: 8px;
}

.selected-spu {
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}

.selected-spu__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
}

.selected-spu__count {
  flex: none;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.selected-sku {
  padding: 10px 12px 4px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.selected-sku__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.selected-sku__name {
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-sku__price-title {
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 600;
}

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
