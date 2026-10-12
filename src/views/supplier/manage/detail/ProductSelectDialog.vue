<template>
  <Dialog
    v-model="dialogVisible"
    title="新增供应商品"
    width="1600px"
    :scroll="true"
    max-height="70vh"
  >
    <el-alert
      class="mb-12px"
      type="info"
      :closable="false"
      title="从平台标品（SPU→SKU）中选择供货商品。根据供应商的供货配置筛选可售品类、商品类型、商品分类。"
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
            <el-table-column label="市场价（元）" min-width="120" align="right">
              <template #default="{ row }">
                {{ formatCentsYuan(row.marketPrice) }}
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
            <div class="price-mode-tip mb-12px">
              <div class="price-mode-tip__title">
                <Icon icon="ep:info-filled" class="mr-4px" />
                供应价模式说明
              </div>
              <ul class="price-mode-tip__list">
                <li>
                  <span class="price-mode-tip__label">固定值</span>
                  <span>直接填入固定供应价。</span>
                </li>
                <li>
                  <span class="price-mode-tip__label">实时更新</span>
                  <span>按供应商 API 实时返回价格（点餐/电影票）。</span>
                </li>
                <li>
                  <span class="price-mode-tip__label">按供货折扣</span>
                  <span>按销售建议价 × 折扣率计算供应价。</span>
                </li>
              </ul>
            </div>

            <div class="batch-config">
              <div class="batch-config__title">
                <span>批量配置</span>
                <span class="batch-config__hint">对已选数据一键应用一下设置</span>
              </div>
              <div class="batch-config__row">
                <el-select v-model="batchConfig.priceMode" size="small" class="!w-130px">
                  <template #label="{ label, value }">
                    {{ label || getDictLabel('supply_chain_offer_price_mode', value) || value }}
                  </template>
                  <el-option
                    v-for="item in priceModeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <el-input-number
                  v-if="batchConfig.priceMode === 'FIXED'"
                  :controls="false"
                  v-model="batchConfig.priceOrDiscount"
                  :min="0"
                  :precision="2"
                  placeholder="供应价"
                  size="small"
                  class="!w-130px"
                />
                <el-input-number
                  v-else-if="batchConfig.priceMode === 'DISCOUNT'"
                  :controls="false"
                  v-model="batchConfig.priceOrDiscount"
                  :min="0.01"
                  :max="100"
                  :precision="2"
                  placeholder="折扣(%)"
                  size="small"
                  class="!w-130px"
                />
                <el-select v-model="batchConfig.supplyMode" size="small" class="!w-120px">
                  <el-option
                    v-for="item in supplyModeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <el-input-number
                  :controls="false"
                  v-model="batchConfig.maxQuantity"
                  :min="1"
                  :precision="0"
                  size="small"
                  class="!w-110px"
                />
                <el-input-number
                  :controls="false"
                  v-model="batchConfig.minQuantity"
                  :min="1"
                  :precision="0"
                  size="small"
                  class="!w-90px"
                />
              </div>
              <div class="batch-config__actions">
                <el-button size="small" @click="resetBatchConfig">清空</el-button>
                <el-button size="small" type="primary" @click="applyBatch">应用</el-button>
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
                <div class="sku-field sku-field--name">
                  <span
                    class="selected-sku__name"
                    :title="item.platformSkuName || item.platformSkuCode"
                  >
                    {{ item.platformSkuName || item.platformSkuCode }}
                  </span>
                </div>
                <div class="sku-field">
                  <el-input
                    v-model="item.externalSkuCode"
                    size="small"
                    maxlength="128"
                    placeholder="供应商商品编码"
                    clearable
                    class="sku-control !w-150px"
                  />
                </div>
                <div class="sku-field">
                  <el-select v-model="item.priceMode" size="small" class="sku-control !w-110px">
                    <template #label="{ label, value }">
                      {{ label || getDictLabel('supply_chain_offer_price_mode', value) || value }}
                    </template>
                    <el-option
                      v-for="opt in priceModeOptions"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </div>
                <div class="sku-field">
                  <el-input
                    v-if="item.priceMode === 'REALTIME'"
                    model-value="API实时获取"
                    disabled
                    size="small"
                    class="sku-control !w-120px"
                  />
                  <el-input-number
                    v-else-if="item.priceMode === 'FIXED'"
                    :controls="false"
                    :model-value="centsToYuan(item.unitPriceCents)"
                    :min="0"
                    :precision="2"
                    placeholder="供应价"
                    size="small"
                    class="sku-control !w-110px"
                    @update:model-value="
                      (val: number | undefined) => (item.unitPriceCents = yuanToCents(val))
                    "
                  />
                  <el-input-number
                    v-else
                    :controls="false"
                    :model-value="bpToPercent(item.discountBp)"
                    :min="0.01"
                    :max="100"
                    :precision="2"
                    placeholder="折扣(%)"
                    size="small"
                    class="sku-control !w-110px"
                    @update:model-value="
                      (val: number | undefined) => (item.discountBp = percentToBp(val))
                    "
                  />
                </div>
                <div class="sku-field">
                  <el-select
                    v-model="item.taxIncluded"
                    size="small"
                    class="sku-control !w-90px"
                    @change="() => onItemTaxIncludedChange(item)"
                  >
                    <el-option label="含税" :value="true" />
                    <el-option label="不含税" :value="false" />
                  </el-select>
                </div>
                <div class="sku-field">
                  <el-select
                    v-model="item.taxRateCode"
                    size="small"
                    class="sku-control !w-100px"
                    placeholder="税率"
                    clearable
                    :disabled="!item.taxIncluded"
                  >
                    <el-option
                      v-for="dict in taxRateOptions"
                      :key="dict.value"
                      :label="dict.label"
                      :value="dict.value"
                    />
                  </el-select>
                </div>
                <div class="sku-field">
                  <el-select v-model="item.supplyMode" size="small" class="sku-control !w-110px">
                    <el-option
                      v-for="opt in supplyModeOptions"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </div>
                <div class="sku-field">
                  <el-input-number
                    :controls="false"
                    v-model="item.maxQuantity"
                    :min="1"
                    :precision="0"
                    placeholder="供货上限"
                    size="small"
                    class="sku-control !w-100px"
                  />
                </div>
                <div class="sku-field">
                  <el-input-number
                    :controls="false"
                    v-model="item.minQuantity"
                    :min="1"
                    :precision="0"
                    placeholder="最低起购量"
                    size="small"
                    class="sku-control !w-80px"
                  />
                </div>
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
  type ProductTypeVO
} from '@/api/product'
import { SupplierApi, DraftReqVO, OfferFormItem, SupplyScopeView } from '@/api/supplier/manage'
import {
  bpToPercent,
  centsToYuan,
  formatCentsYuan,
  percentToBp,
  yuanToCents
} from '@/utils/money'
import { DICT_TYPE, getDictLabel, getStrDictOptions } from '@/utils/dict'
import { validateExternalSkuCode } from './utils/fulfillment'

defineOptions({ name: 'SupplierProductSelectDialog' })

const props = defineProps<{
  supplierCode: string
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
const selectedList = ref<OfferFormItem[]>([])
const skuTableRef = ref()
const hasSupplyScope = ref(false)
const supplyScopes = ref<SupplyScopeView[]>([])

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
  /** 建议零售价/销售建议价，单位为分 */
  suggestedSalePrice?: number | null
}

const priceModeOptions = computed(() => getStrDictOptions('supply_chain_offer_price_mode'))
const supplyModeOptions = computed(() => getStrDictOptions('supply_chain_supply_mode'))

const getDefaultPriceMode = () => priceModeOptions.value[0]?.value || 'FIXED'
const getDefaultSupplyMode = () => supplyModeOptions.value[0]?.value || ''

const getSkuTypeCategoryPath = (row: SelectSkuRow) => {
  const typeName = row.productTypeName || ''
  const categoryName = row.primaryCategoryName || ''
  if (typeName && categoryName) return `${typeName}/${categoryName}`
  return typeName || categoryName || '-'
}

const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  tabCode: 'ALL',
  keyword: undefined as string | undefined,
  categoryId: undefined as number | undefined
})

const typeList = ref<ProductTypeVO[]>([])
const categoryTabs = computed(() => {
  const seen = new Set<string>()
  const tabs = [{ value: 'ALL', label: '全部商品' }]
  supplyScopes.value.forEach((item) => {
    const value = item.productType
    if (!value || seen.has(value)) return
    seen.add(value)
    const typeName = typeList.value.find((type) => type.typeCode === value)?.typeName
    tabs.push({ value, label: typeName || value })
  })
  return tabs
})
const tabScrollRef = ref<HTMLElement>()
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const tabOverflow = computed(() => canScrollLeft.value || canScrollRight.value)

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

const getDefaultBatchConfig = () => ({
  priceMode: getDefaultPriceMode(),
  priceOrDiscount: 0,
  supplyMode: getDefaultSupplyMode(),
  maxQuantity: 9999999,
  minQuantity: 1
})

const batchConfig = reactive(getDefaultBatchConfig())

const taxRateOptions = computed(() => getStrDictOptions(DICT_TYPE.SUPPLY_CHAIN_TAX_RATE))

const onItemTaxIncludedChange = (item: OfferFormItem) => {
  if (!item.taxIncluded) item.taxRateCode = undefined
}

const toScopeCategoryId = (value?: number | string | null) => {
  const id = Number(value)
  return Number.isFinite(id) && id > 0 ? id : undefined
}

const getScopeCategoryIds = (tabCode?: string) => {
  const scopes =
    tabCode && tabCode !== 'ALL'
      ? supplyScopes.value.filter((item) => item.productType === tabCode)
      : supplyScopes.value
  return [
    ...new Set(
      scopes
        .map((item) => toScopeCategoryId(item.categoryId))
        .filter((id): id is number => id != null)
    )
  ]
}

const loadSupplyScopes = async () => {
  try {
    const data = await SupplierApi.getSupplyScopes(props.supplierCode)
    supplyScopes.value = Array.isArray(data) ? data : []
    hasSupplyScope.value = supplyScopes.value.length > 0
  } catch {
    hasSupplyScope.value = false
    supplyScopes.value = []
  }
}

/** 打开弹窗 */
const open = async () => {
  dialogVisible.value = true
  selectedList.value = []
  await loadSupplyScopes()
  Object.assign(batchConfig, getDefaultBatchConfig())
  if (!hasSupplyScope.value) {
    message.warning('请先在供货配置中添加可供货范围')
  }

  queryParams.keyword = undefined
  queryParams.categoryId = undefined
  queryParams.tabCode = 'ALL'
  queryParams.pageNo = 1
  queryParams.pageSize = 20
  if (!typeList.value.length) {
    typeList.value = await ProductTypeApi.getTypeList()
  }
  await getSkuList()
  await nextTick()
  updateTabScroll()
}
defineExpose({ open })

/**
 * 选品投影分别保留市场价与 SKU 销售建议价，后者只作兼容提交提示；批量模式切换不能改写它。
 * 服务端仍读取自身 SKU 快照做最终折扣准入，页面校验不能替代服务端校验。
 * 设计见 docs/superpowers/specs/2026-10-11-supplier-offer-sale-price-alignment-design.md#5-前端展示与写入。
 */
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
        suggestedSalePrice: sku.suggestedSalePrice
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
    const scopeCategoryIds = getScopeCategoryIds(queryParams.tabCode)
    const categoryId =
      queryParams.categoryId ?? (scopeCategoryIds.length ? scopeCategoryIds.join(',') : undefined)
    const data = await ProductApi.getProductPage({
      pageNo: queryParams.pageNo,
      pageSize: queryParams.pageSize,
      keyword: queryParams.keyword,
      categoryId,
      tabCode: queryParams.tabCode === 'ALL' ? undefined : queryParams.tabCode,
      status: PRODUCT_STATUS.ON_SHELF,
      excludeAddedSupplierOffers: true,
      supplierCode: props.supplierCode
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
  const groups: { spuCode: string; spuName: string; items: OfferFormItem[] }[] = []
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
      productType: row.productType,
      externalSkuCode: '',
      // 仅保留 SKU 建议价作为兼容提示，禁止市场价或旧 L1 兜底；详见定价口径修复设计 §5。
      suggestedPriceCents: row.suggestedSalePrice,
      priceMode: getDefaultPriceMode(),
      supplyMode: getDefaultSupplyMode(),
      maxQuantity: 9999999,
      minQuantity: 1,
      taxIncluded: false,
      taxRateCode: undefined,
      status: 'PUBLISHED'
    })
  })
  const selectedCodes = new Set(rows.map((item) => item.skuCode).filter(Boolean))
  selectedList.value = [...map.values()].filter((item) => selectedCodes.has(item.platformSkuCode!))
}

const resetBatchConfig = () => {
  const defaults = getDefaultBatchConfig()
  Object.assign(batchConfig, defaults)
  selectedList.value.forEach((item) => {
    item.priceMode = defaults.priceMode
    item.unitPriceCents = yuanToCents(defaults.priceOrDiscount)
    item.discountBp = undefined
    item.supplyMode = defaults.supplyMode
    item.maxQuantity = defaults.maxQuantity
    item.minQuantity = defaults.minQuantity
  })
}

const applyBatch = () => {
  if (!selectedList.value.length) {
    message.warning('请先选择商品')
    return
  }
  selectedList.value.forEach((item) => {
    item.priceMode = batchConfig.priceMode
    if (batchConfig.priceMode === 'FIXED') {
      item.unitPriceCents = yuanToCents(batchConfig.priceOrDiscount)
      item.discountBp = undefined
    } else if (batchConfig.priceMode === 'DISCOUNT') {
      item.discountBp = percentToBp(batchConfig.priceOrDiscount)
      item.unitPriceCents = undefined
    } else {
      item.unitPriceCents = undefined
      item.discountBp = undefined
    }
    item.supplyMode = batchConfig.supplyMode
    item.maxQuantity = batchConfig.maxQuantity
    item.minQuantity = batchConfig.minQuantity
  })
  message.success('批量配置已应用')
}

const toDraftNumber = (value?: number | null) => {
  if (value == null) return undefined
  const num = Number(value)
  return Number.isFinite(num) ? num : undefined
}

const toDraftReq = (item: OfferFormItem): DraftReqVO => {
  const priceMode = item.priceMode || ''
  const payload: DraftReqVO = {
    platformSkuCode: item.platformSkuCode || '',
    priceMode,
    supplyMode: item.supplyMode || item.offerSupplyMode || '',
    externalSkuCode: (item.externalSkuCode || '').trim()
  }
  if (priceMode === 'FIXED') {
    const unitPriceCents = toDraftNumber(item.unitPriceCents)
    if (unitPriceCents != null) payload.unitPriceCents = unitPriceCents
  }
  if (priceMode === 'DISCOUNT') {
    const discountBp = toDraftNumber(item.discountBp)
    if (discountBp != null) payload.discountBp = discountBp
  }
  const suggestedPriceCents = toDraftNumber(item.suggestedPriceCents)
  if (suggestedPriceCents != null) payload.suggestedPriceCents = suggestedPriceCents
  const maxQuantity = toDraftNumber(item.maxQuantity)
  if (maxQuantity != null && maxQuantity > 0) payload.maxQuantity = maxQuantity
  const minQuantity = toDraftNumber(item.minQuantity)
  if (minQuantity != null && minQuantity > 0) payload.minQuantity = minQuantity
  return payload
}

const validateSelected = () => {
  if (!selectedList.value.length) {
    message.warning('请至少选择一个SKU')
    return false
  }
  for (const item of selectedList.value) {
    const skuName = item.platformSkuName || item.platformSkuCode || 'SKU'
    if (!item.platformSkuCode) {
      message.warning(`请完整填写平台 SKU 编码`)
      return false
    }
    const externalSkuCodeError = validateExternalSkuCode(item.externalSkuCode)
    if (externalSkuCodeError) {
      message.warning(`SKU「${skuName}」${externalSkuCodeError}`)
      return false
    }
    if (!item.priceMode) {
      message.warning(`SKU「${skuName}」请选择供应价模式`)
      return false
    }
    if (item.priceMode === 'FIXED') {
      if (!item.unitPriceCents || item.unitPriceCents <= 0) {
        message.warning(`SKU「${skuName}」固定值模式下供应价必须大于 0`)
        return false
      }
    } else if (item.priceMode === 'DISCOUNT') {
      if (item.suggestedPriceCents == null || item.suggestedPriceCents <= 0) {
        message.warning(`SKU「${skuName}」折扣模式要求SKU销售建议价大于0，请先在商品中心配置`)
        return false
      }
      const percent = bpToPercent(item.discountBp) || 0
      if (percent < 0.01 || percent > 100) {
        message.warning(`SKU「${skuName}」供货折扣需在 0.01%~100% 之间`)
        return false
      }
    }
    if (!item.supplyMode && !item.offerSupplyMode) {
      message.warning(`SKU「${skuName}」请选择供货模式`)
      return false
    }
    if (item.taxIncluded && !item.taxRateCode) {
      message.warning(`SKU「${skuName}」含税时请选择税率`)
      return false
    }
    if (item.maxQuantity && item.minQuantity && item.maxQuantity < item.minQuantity) {
      message.warning(`SKU「${skuName}」供货上限不能小于最低起购量`)
      return false
    }
  }
  return true
}

const handleSubmit = async () => {
  if (!validateSelected()) return
  if (!props.supplierCode) {
    message.error('缺少供应商编号，暂无法保存合作商品')
    return
  }
  submitting.value = true
  try {
    await SupplierApi.createOffers(props.supplierCode, {
      items: selectedList.value.map(toDraftReq)
    })
    message.success('添加成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.right-panel__scroll {
  max-height: 560px;
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 4px;
}

.right-panel__scroll.is-edit {
  max-height: none;
  overflow: visible;
}

.price-mode-tip {
  padding: 10px 12px;
  border: 1px solid var(--el-color-warning-light-5);
  border-radius: 8px;
  background: linear-gradient(
    135deg,
    var(--el-color-warning-light-9) 0%,
    var(--el-fill-color-blank) 100%
  );
}

.price-mode-tip__title {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: var(--el-color-warning-dark-2);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}

.price-mode-tip__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.price-mode-tip__list li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-top: 6px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.5;
}

.price-mode-tip__list li:first-child {
  margin-top: 0;
}

.price-mode-tip__label {
  flex: none;
  min-width: 72px;
  padding: 0 6px;
  border-radius: 4px;
  background: var(--el-color-warning-light-7);
  color: var(--el-color-warning-dark-2);
  font-weight: 600;
  text-align: center;
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

.batch-config__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.batch-config__actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
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
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  overflow-x: auto;
  border-top: 1px solid var(--el-border-color-lighter);
}

.sku-field {
  display: contents;
}

.selected-sku.is-edit {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
  padding: 16px 20px;
  overflow: visible;
}

.selected-sku.is-edit .sku-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.selected-sku.is-edit .sku-field--name {
  grid-column: 1 / -1;
}

.selected-sku.is-edit .sku-field__label {
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.4;
}

.selected-sku.is-edit .sku-field__hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.selected-sku.is-edit .sku-control {
  width: 100% !important;
}

.selected-sku.is-edit :deep(.el-input-number) {
  width: 100%;
}

.selected-sku__name {
  flex: none;
  max-width: 96px;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-sku.is-edit .selected-sku__name {
  max-width: none;
  overflow: visible;
  font-size: 16px;
  text-overflow: unset;
  white-space: normal;
}
</style>
