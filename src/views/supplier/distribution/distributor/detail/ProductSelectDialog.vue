<template>
  <Dialog
    v-model="dialogVisible"
    title="新增分销商品"
    width="1600px"
    :scroll="true"
    max-height="78vh"
  >
    <el-alert
      class="mb-12px"
      type="info"
      :closable="false"
      title="从平台标品（SPU→SKU）中选择商品关联至该分销商。根据分销商已配置的商品类型筛选。"
    />

    <el-row :gutter="16">
      <el-col :span="12">
        <ContentWrap class="!mb-0">
          <div class="filter-pill-wrap mb-12px">
            <button
              v-show="tabOverflow"
              type="button"
              class="filter-pill-arrow"
              :disabled="!canScrollLeft"
              @click="scrollTabs(-1)"
            >
              <Icon icon="ep:arrow-left" />
            </button>
            <div
              ref="tabScrollRef"
              class="filter-pill-scroll"
              @scroll="updateTabScroll"
              @wheel.prevent="onTabWheel"
            >
              <button
                v-for="tag in categoryTabs"
                :key="tag.value"
                type="button"
                class="filter-pill"
                :class="{ 'is-active': queryParams.tabCode === tag.value }"
                @click="handleTabChange(tag.value)"
              >
                {{ tag.label }}
              </button>
            </div>
            <button
              v-show="tabOverflow"
              type="button"
              class="filter-pill-arrow"
              :disabled="!canScrollRight"
              @click="scrollTabs(1)"
            >
              <Icon icon="ep:arrow-right" />
            </button>
          </div>
          <el-form :inline="true" :model="queryParams" class="-mb-10px">
            <el-form-item label="名称/编号">
              <el-input
                v-model="queryParams.keyword"
                placeholder="按名称/编号搜索"
                clearable
                class="!w-180px"
                @keyup.enter="handleQuery"
              />
            </el-form-item>
            <el-form-item label="商品分类">
              <ProductCategory
                v-model="queryParams.categoryId"
                node-key="id"
                placeholder="请选择"
                class="!w-140px"
              />
            </el-form-item>
            <el-form-item>
              <el-button @click="handleQuery">搜索</el-button>
              <el-button @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table
            ref="skuTableRef"
            v-loading="loading"
            :data="skuList"
            :span-method="spanMethod"
            border
            row-key="_rowKey"
            height="420"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="45" :reserve-selection="true" />
            <el-table-column label="商品名称(SPU)" min-width="160">
              <template #default="{ row }">
                <div>{{ row.spuName || '-' }}</div>
                <div class="text-12px text-gray-500">{{ row.spuCode || '-' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="SKU规格" min-width="120">
              <template #default="{ row }">{{ row.skuName || '-' }}</template>
            </el-table-column>
            <el-table-column label="类型/分类" min-width="160">
              <template #default="{ row }">
                {{ getSkuTypeCategoryPath(row) }}
              </template>
            </el-table-column>
            <el-table-column label="市场价（元）" min-width="110" align="right">
              <template #default="{ row }">
                {{ formatCentsYuan(row.marketPrice) }}
              </template>
            </el-table-column>
            <el-table-column label="供应价（元）" min-width="110" align="right">
              <template #default="{ row }">
                {{ formatCentsYuan(row.supplyPrice) }}
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
                批量配置分销价
                <span class="batch-config__hint">对已选数据一键应用一下设置</span>
              </div>
              <DistributionPriceForm
                ref="batchFormRef"
                v-model="batchPrice"
                :sale-price-tip="batchSalePriceTip"
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
                  <span
                    class="selected-sku__name"
                    :title="item.platformSkuName || item.platformSkuCode"
                  >
                    {{ item.platformSkuName || item.platformSkuCode }}
                  </span>
                  <el-button link type="danger" @click="removeSelected(item.platformSkuCode)">
                    移除
                  </el-button>
                </div>
                <div class="selected-sku__price-title">分销价</div>
                <DistributionPriceForm
                  :ref="(el) => setSkuFormRef(item.platformSkuCode, el)"
                  v-model="item.price"
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
  ProductApi,
  ProductManagementSkuItem,
  ProductManagementSpuItem,
  ProductTypeApi,
  PRODUCT_STATUS,
  type ProductTypeVO,
  type SuggestedSalePriceRule
} from '@/api/product'
import {
  DistributorApi,
  type AddBuyerProductsReqVO,
  type BuyerProductCreatePricingReqVO,
  type DistFormulaRuleReqVO
} from '@/api/supplier/distribution'
import {
  buildCatalogSaveMessage,
  isCatalogSaveUncertainError
} from '@/views/supplier/distribution/utils/catalogSaveResult'
import { formatCentsYuan } from '@/views/supplier/utils/constants'
import DistributionPriceForm from './DistributionPriceForm.vue'
import type { DistPriceFormData } from './distributionPrice'

defineOptions({ name: 'DistributorProductSelectDialog' })

const props = defineProps<{
  buyerCode: string
  productTypes?: string[]
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
const total = ref(0)
const selectedList = ref<SelectedSkuItem[]>([])
const skuTableRef = ref()
const batchFormRef = ref<InstanceType<typeof DistributionPriceForm>>()
const skuFormRefs = new Map<string, InstanceType<typeof DistributionPriceForm>>()
const typeList = ref<ProductTypeVO[]>([])
const DEFAULT_SALE_PRICE_TIP = '销售建议价=市场价*0.5%+0元'

type SelectSkuRow = {
  _rowKey: string
  _rowspan: number
  spuCode?: string
  spuName?: string
  skuCode?: string
  skuName?: string
  productType?: string
  productTypeName?: string
  primaryCategoryName?: string
  marketPrice?: number
  supplyPrice?: number
  suggestedSalePriceRule?: SuggestedSalePriceRule
}

type SelectedSkuItem = {
  platformSkuCode: string
  platformSkuName?: string
  platformSpuCode?: string
  platformSpuName?: string
  suggestedSalePriceRule?: SuggestedSalePriceRule
  price: DistPriceFormData
}

const createPriceConfig = (): DistPriceFormData => ({
  distributionRule: {
    mode: 'CUSTOM',
    base: 'SUGGESTED_SALE_PRICE',
    percentage: undefined,
    operator: 'MULTIPLY',
    operand: undefined
  },
  taxIncluded: true,
  taxRateCode: '',
  distributionHideThresholdPercent: undefined
})

const clonePriceConfig = (src: DistPriceFormData): DistPriceFormData => ({
  distributionRule: { ...src.distributionRule },
  taxIncluded: src.taxIncluded,
  taxRateCode: src.taxRateCode,
  distributionHideThresholdPercent: src.distributionHideThresholdPercent
})

const batchPrice = ref<DistPriceFormData>(createPriceConfig())
const batchSalePriceTip = DEFAULT_SALE_PRICE_TIP

const setSkuFormRef = (skuCode: string, el: unknown) => {
  if (el) skuFormRefs.set(skuCode, el as InstanceType<typeof DistributionPriceForm>)
  else skuFormRefs.delete(skuCode)
}

const formatSuggestTip = (item: SelectedSkuItem) => {
  const rule = item.suggestedSalePriceRule
  if (!rule?.mode) return DEFAULT_SALE_PRICE_TIP
  if (rule.mode === 'MARKET' || rule.mode === 'DIRECT_MARKET_PRICE') {
    return '销售建议价=市场价'
  }
  if (rule.mode === 'FIXED') {
    const price = formatCentsYuan(rule.fixedPriceCents)
    return price === '-' ? DEFAULT_SALE_PRICE_TIP : `销售建议价=${price}元`
  }
  const baseLabel = rule.base === 'SUPPLY_PRICE' ? '供应价' : '市场价'
  const operator =
    rule.operator === 'ADD'
      ? '+'
      : rule.operator === 'SUBTRACT'
        ? '-'
        : rule.operator === 'DIVIDE'
          ? '/'
          : '*'
  return `销售建议价=${baseLabel}*${rule.percentage ?? 0}%${operator}${rule.operand ?? 0}元`
}

const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  tabCode: 'ALL',
  keyword: undefined as string | undefined,
  categoryId: undefined as number | undefined
})

const allowedTypeCodes = computed(() => {
  const fromItems = (props.productTypeItems || [])
    .map((item) => String(item.id || '').trim())
    .filter(Boolean)
  if (fromItems.length) return [...new Set(fromItems)]
  return [...new Set((props.productTypes || []).map((item) => String(item).trim()).filter(Boolean))]
})

const categoryTabs = computed(() => {
  const tabs = [{ value: 'ALL', label: '全部商品' }]
  if (props.productTypeItems?.length) {
    props.productTypeItems.forEach((item) => {
      const value = String(item.id || '').trim()
      if (!value) return
      tabs.push({ value, label: item.name || value })
    })
    return tabs
  }
  const source = allowedTypeCodes.value.length
    ? typeList.value.filter(
        (item) => item.typeCode && allowedTypeCodes.value.includes(item.typeCode)
      )
    : typeList.value
  source.forEach((item) => {
    if (!item.typeCode) return
    tabs.push({ value: item.typeCode, label: item.typeName || item.typeCode })
  })
  if (allowedTypeCodes.value.length) {
    allowedTypeCodes.value.forEach((code) => {
      if (tabs.some((tab) => tab.value === code)) return
      tabs.push({ value: code, label: code })
    })
  }
  return tabs
})

const tabScrollRef = ref<HTMLElement>()
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const tabOverflow = computed(() => canScrollLeft.value || canScrollRight.value)

const getSkuTypeCategoryPath = (row: SelectSkuRow) => {
  const typeName = row.productTypeName || ''
  const categoryName = row.primaryCategoryName || ''
  if (typeName && categoryName) return `${typeName}/${categoryName}`
  return typeName || categoryName || '-'
}

const updateTabScroll = () => {
  const el = tabScrollRef.value
  if (!el) {
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }
  canScrollLeft.value = el.scrollLeft > 2
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
}

const scrollTabs = (direction: -1 | 1) => {
  tabScrollRef.value?.scrollBy({ left: direction * 200, behavior: 'smooth' })
}

const scrollActiveTabIntoView = async () => {
  await nextTick()
  const wrap = tabScrollRef.value
  const active = wrap?.querySelector('.filter-pill.is-active') as HTMLElement | null
  if (!wrap || !active) return
  const wrapRect = wrap.getBoundingClientRect()
  const activeRect = active.getBoundingClientRect()
  const padding = 24
  if (activeRect.right > wrapRect.right - padding) {
    wrap.scrollBy({ left: activeRect.right - wrapRect.right + 80, behavior: 'smooth' })
    return
  }
  if (activeRect.left < wrapRect.left + padding) {
    wrap.scrollBy({ left: activeRect.left - wrapRect.left - 80, behavior: 'smooth' })
  }
}

const onTabWheel = (event: WheelEvent) => {
  const el = tabScrollRef.value
  if (!el) return
  el.scrollLeft += event.deltaY || event.deltaX
  updateTabScroll()
}

const open = async () => {
  dialogVisible.value = true
  selectedList.value = []
  queryParams.keyword = undefined
  queryParams.categoryId = undefined
  queryParams.tabCode = 'ALL'
  queryParams.pageNo = 1
  queryParams.pageSize = 20
  if (!typeList.value.length) {
    typeList.value = await ProductTypeApi.getTypeList()
  }
  batchPrice.value = createPriceConfig()
  await nextTick()
  batchFormRef.value?.clearValidate()
  skuFormRefs.clear()
  skuTableRef.value?.clearSelection?.()
  await getSkuList()
  await nextTick()
  updateTabScroll()
}
defineExpose({ open })

const flattenProductPage = (spus: ProductManagementSpuItem[]): SelectSkuRow[] => {
  const rows: SelectSkuRow[] = []
  spus.forEach((spu) => {
    const skus = spu.skus?.length ? spu.skus : ([{}] as ProductManagementSkuItem[])
    skus.forEach((sku, index) => {
      rows.push({
        _rowKey: `${spu.spuCode || ''}-${sku.skuCode || index}`,
        _rowspan: index === 0 ? skus.length : 0,
        spuCode: spu.spuCode,
        spuName: spu.spuName,
        skuCode: sku.skuCode,
        skuName: sku.skuName,
        productType: spu.productType,
        productTypeName: spu.productTypeName,
        primaryCategoryName: spu.primaryCategoryName,
        marketPrice: sku.marketPrice,
        supplyPrice: sku.supplyPrice,
        suggestedSalePriceRule: sku.suggestedSalePriceRule
      })
    })
  })
  return rows
}

const spanMethod = ({ row, columnIndex }: { row: SelectSkuRow; columnIndex: number }) => {
  if (columnIndex !== 1) return
  return row._rowspan ? { rowspan: row._rowspan, colspan: 1 } : { rowspan: 0, colspan: 0 }
}

const getSkuList = async () => {
  loading.value = true
  try {
    const data = await ProductApi.getProductPage({
      pageNo: queryParams.pageNo,
      pageSize: queryParams.pageSize,
      keyword: queryParams.keyword,
      categoryId: queryParams.categoryId,
      tabCode: queryParams.tabCode === 'ALL' ? undefined : queryParams.tabCode,
      status: PRODUCT_STATUS.ON_SHELF,
      buyerCode: props.buyerCode
    })
    skuList.value = flattenProductPage(data?.list || [])
    total.value = data?.total || 0
  } catch {
    skuList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleTabChange = (tabCode: string) => {
  if (queryParams.tabCode === tabCode) return
  queryParams.tabCode = tabCode
  scrollActiveTabIntoView()
  handleQuery()
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getSkuList()
}

const resetQuery = () => {
  queryParams.keyword = undefined
  queryParams.categoryId = undefined
  queryParams.tabCode = 'ALL'
  handleQuery()
}

const selectedGroups = computed(() => {
  const groups: { spuCode: string; spuName: string; items: SelectedSkuItem[] }[] = []
  const indexMap = new Map<string, number>()
  selectedList.value.forEach((item) => {
    const key = item.platformSpuCode || item.platformSpuName || item.platformSkuCode || ''
    const existing = indexMap.get(key)
    if (existing == null) {
      indexMap.set(key, groups.length)
      groups.push({
        spuCode: item.platformSpuCode || '',
        spuName: item.platformSpuName || '-',
        items: [item]
      })
      return
    }
    groups[existing].items.push(item)
  })
  return groups
})

const handleSelectionChange = (rows: SelectSkuRow[]) => {
  const map = new Map(selectedList.value.map((item) => [item.platformSkuCode, item]))
  rows.forEach((row) => {
    const skuCode = row.skuCode
    if (!skuCode || map.has(skuCode)) return
    map.set(skuCode, {
      platformSkuCode: skuCode,
      platformSpuCode: row.spuCode,
      platformSpuName: row.spuName,
      platformSkuName: row.skuName,
      suggestedSalePriceRule: row.suggestedSalePriceRule,
      price: clonePriceConfig(batchPrice.value)
    })
  })
  const selectedCodes = new Set(rows.map((item) => item.skuCode).filter(Boolean))
  selectedList.value = [...map.values()].filter((item) => selectedCodes.has(item.platformSkuCode))
}

const removeSelected = (skuCode: string) => {
  selectedList.value = selectedList.value.filter((item) => item.platformSkuCode !== skuCode)
  const selection = skuTableRef.value?.getSelectionRows?.() || []
  const row = selection.find((item: SelectSkuRow) => item.skuCode === skuCode)
  if (row) skuTableRef.value?.toggleRowSelection(row, false)
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

const buildCreatePricing = (price: DistPriceFormData): BuyerProductCreatePricingReqVO => {
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
  batchPrice.value = createPriceConfig()
  nextTick(() => batchFormRef.value?.clearValidate())
}

const applyBatchPrice = async () => {
  if (!selectedList.value.length) {
    message.warning('请先选择商品')
    return
  }
  await batchFormRef.value?.validate()
  const next = clonePriceConfig(batchPrice.value)
  selectedList.value.forEach((item) => {
    item.price = clonePriceConfig(next)
  })
  await nextTick()
  selectedList.value.forEach((item) => {
    skuFormRefs.get(item.platformSkuCode)?.clearValidate()
  })
  message.success('已应用到已选商品')
}

const handleSubmit = async () => {
  if (!selectedList.value.length) {
    message.warning('请至少选择一个SKU')
    return
  }
  if (!props.buyerCode) {
    message.error('缺少分销商编号，暂无法保存分销商品')
    return
  }
  await nextTick()
  for (const item of selectedList.value) {
    const form = skuFormRefs.get(item.platformSkuCode)
    if (!form) {
      message.error(`请完善 ${item.platformSkuName || item.platformSkuCode} 的分销价`)
      return
    }
    await form.validate()
  }
  submitting.value = true
  try {
    const createPayload: AddBuyerProductsReqVO = {
      items: selectedList.value.map((item) => ({
        platformSkuCode: item.platformSkuCode,
        pricing: buildCreatePricing(item.price)
      }))
    }
    const saveResult = await DistributorApi.createBuyerProducts(props.buyerCode, createPayload)
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

.filter-pill-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-pill-scroll {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-wrap: nowrap;
  gap: 10px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.filter-pill-scroll::-webkit-scrollbar {
  display: none;
}

.filter-pill-arrow {
  display: flex;
  flex: none;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-color-primary-light-5);
  border-radius: 50%;
  background: #fff;
  color: var(--el-color-primary);
  cursor: pointer;
}

.filter-pill-arrow:hover:not(:disabled) {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.filter-pill-arrow:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.filter-pill {
  display: inline-flex;
  flex: none;
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
  white-space: nowrap;
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
</style>
