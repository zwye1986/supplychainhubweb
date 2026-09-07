<template>
  <Dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑供应商品' : '新增供应商品'"
    :width="isEdit ? '640px' : '1200px'"
    :scroll="true"
    max-height="70vh"
  >
    <el-alert
      class="mb-12px"
      type="info"
      :closable="false"
      :title="
        isEdit
          ? '编辑当前合作商品的供应价模式、供货模式与供货规则。'
          : '从平台标品（SPU→SKU）中选择供货商品。根据供应商的供货配置筛选可售品类、商品类型、商品分类。'
      "
    />

    <el-row :gutter="16">
      <el-col v-if="!isEdit" :span="16">
        <ContentWrap class="!mb-0">
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
              <el-select
                v-model="queryParams.categoryCode"
                placeholder="全部分类"
                clearable
                class="!w-140px"
              >
                <el-option
                  v-for="item in categoryTags"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
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
            row-key="skuId"
            height="420"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="45" :reserve-selection="true" />
            <el-table-column label="商品名称(SPU)" prop="spuName" min-width="140" />
            <el-table-column label="SKU规格" prop="skuName" min-width="120" />
            <el-table-column label="类型分类" min-width="140">
              <template #default="{ row }">
                {{ getSkuTypeCategoryPath(row) }}
              </template>
            </el-table-column>
            <el-table-column label="销售建议价(元)" min-width="120" align="right">
              <template #default="{ row }">
                {{ row.marketPrice != null ? Number(row.marketPrice).toFixed(2) : '-' }}
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

      <el-col :span="isEdit ? 24 : 8">
        <ContentWrap class="right-panel !mb-0">
          <div class="right-panel__scroll" :class="{ 'is-edit': isEdit }">
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

            <template v-if="!isEdit">
              <div class="mb-10px text-14px font-600">批量配置</div>
              <el-form label-width="90px" size="small" class="mb-10px">
                <el-form-item label="供应价模式">
                  <el-select v-model="batchConfig.priceMode" class="!w-full">
                    <el-option
                      v-for="item in OFFER_PRICE_MODE_OPTIONS"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item
                  v-if="batchConfig.priceMode === OfferPriceModeEnum.FIXED"
                  label="供应价"
                >
                  <el-input-number
                    v-model="batchConfig.priceOrDiscount"
                    :min="0"
                    :precision="2"
                    class="!w-full"
                  />
                </el-form-item>
                <el-form-item
                  v-else-if="batchConfig.priceMode === OfferPriceModeEnum.DISCOUNT"
                  label="折扣(%)"
                >
                  <el-input-number
                    v-model="batchConfig.priceOrDiscount"
                    :min="0.01"
                    :max="100"
                    :precision="2"
                    class="!w-full"
                  />
                </el-form-item>
                <el-form-item label="供货模式">
                  <el-select v-model="batchConfig.supplyMode" class="!w-full">
                    <el-option
                      v-for="item in offerSupplyModeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="供货上限">
                  <el-input-number
                    v-model="batchConfig.maxQuantity"
                    :min="1"
                    :precision="0"
                    class="!w-full"
                  />
                </el-form-item>
                <el-form-item label="最低起购量">
                  <el-input-number
                    v-model="batchConfig.minQuantity"
                    :min="1"
                    :precision="0"
                    class="!w-full"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button @click="clearSelected">清空</el-button>
                  <el-button type="primary" @click="applyBatch">应用</el-button>
                </el-form-item>
              </el-form>
            </template>

            <div class="mb-8px text-14px font-600">
              {{ isEdit ? '商品配置' : `已选商品（${selectedList.length}）` }}
            </div>
            <div
              v-for="item in selectedList"
              :key="item.platformSkuCode"
              class="mb-10px border border-solid border-[var(--el-border-color)] rounded-6px p-10px"
            >
              <div class="mb-6px flex items-center justify-between">
                <span class="text-13px font-600">
                  {{ item.platformSpuName }} / {{ item.platformSkuName }}
                </span>
                <el-button
                  v-if="!isEdit"
                  link
                  type="danger"
                  @click="removeSelected(item.platformSkuCode!)"
                >
                  移除
                </el-button>
              </div>
              <el-form :label-width="isEdit ? '100px' : '80px'" size="small">
                <el-form-item label="供应价模式">
                  <el-select v-model="item.priceMode" class="!w-full">
                    <el-option
                      v-for="opt in OFFER_PRICE_MODE_OPTIONS"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item
                  v-if="item.priceMode === OfferPriceModeEnum.FIXED"
                  label="供应价"
                >
                  <el-input-number
                    :model-value="centsToYuan(item.unitPriceCents)"
                    :min="0"
                    :precision="2"
                    class="!w-full"
                    @update:model-value="(val: number | undefined) => (item.unitPriceCents = yuanToCents(val))"
                  />
                </el-form-item>
                <el-form-item
                  v-else-if="item.priceMode === OfferPriceModeEnum.DISCOUNT"
                  label="折扣(%)"
                >
                  <el-input-number
                    :model-value="bpToPercent(item.discountBp)"
                    :min="0.01"
                    :max="100"
                    :precision="2"
                    class="!w-full"
                    @update:model-value="(val: number | undefined) => (item.discountBp = percentToBp(val))"
                  />
                </el-form-item>
                <el-form-item label="供货模式">
                  <el-select v-model="item.supplyMode" class="!w-full">
                    <el-option
                      v-for="opt in offerSupplyModeOptions"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="供货上限">
                  <el-input-number
                    v-model="item.maxQuantity"
                    :min="1"
                    :precision="0"
                    class="!w-full"
                  />
                </el-form-item>
                <el-form-item label="最低起购量">
                  <el-input-number
                    v-model="item.minQuantity"
                    :min="1"
                    :precision="0"
                    class="!w-full"
                  />
                </el-form-item>
                <el-form-item v-if="isEdit" label="状态">
                  <el-radio-group v-model="item.status">
                    <el-radio
                      v-for="opt in OFFER_STATUS_OPTIONS"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-form>
            </div>
            <el-empty
              v-if="!selectedList.length"
              description="请从左侧选择商品"
              :image-size="60"
            />
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
  SupplierApi,
  DraftReqVO,
  OfferFormItem,
  OfferListItem,
  PlatformSkuVO
} from '@/api/supplier/manage'
import {
  OFFER_PRICE_MODE_OPTIONS,
  OFFER_STATUS_OPTIONS,
  OfferPriceModeEnum,
  OfferStatusEnum,
  SUPPLIER_PRODUCT_FILTER_TAGS,
  SUPPLIER_SUPPLY_MODE_OPTIONS,
  bpToPercent,
  centsToYuan,
  getProductCategoryLabel,
  getProductTypeLabel,
  percentToBp,
  yuanToCents
} from '@/views/supplier/utils/constants'

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
const dialogType = ref<'create' | 'update'>('create')
const skuList = ref<PlatformSkuVO[]>([])
const total = ref(0)
const selectedList = ref<OfferFormItem[]>([])
const skuTableRef = ref()
const originalStatus = ref<string | undefined>(undefined)
const hasSupplyScope = ref(false)

const isEdit = computed(() => dialogType.value === 'update')

const offerSupplyModeOptions = SUPPLIER_SUPPLY_MODE_OPTIONS.filter((item) =>
  ['API_DIRECT', 'H5_DIRECT', 'DROP_SHIPPING', 'BATCH', 'PICKUP'].includes(item.value)
)

const getSkuTypeCategoryPath = (row: PlatformSkuVO) => {
  const typeName = row.productType ? getProductTypeLabel(row.productType) : ''
  const categoryName = row.productCategory ? getProductCategoryLabel(row.productCategory) : ''
  if (typeName && typeName !== '-' && categoryName && categoryName !== '-') {
    return `${typeName} / ${categoryName}`
  }
  return typeName && typeName !== '-'
    ? typeName
    : categoryName && categoryName !== '-'
      ? categoryName
      : '-'
}

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: undefined as string | undefined,
  categoryCode: undefined as string | undefined
})

const batchConfig = reactive({
  priceMode: OfferPriceModeEnum.FIXED as string,
  priceOrDiscount: 0,
  supplyMode: 'DROP_SHIPPING',
  maxQuantity: 9999999,
  minQuantity: 1
})

const categoryTags = SUPPLIER_PRODUCT_FILTER_TAGS

const loadSupplyScopes = async () => {
  try {
    const data = await SupplierApi.getSupplyScopes(props.supplierCode)
    hasSupplyScope.value = Array.isArray(data) && data.length > 0
  } catch {
    hasSupplyScope.value = false
  }
}

/** 打开弹窗：create 新增 / update 编辑回填 */
const open = async (type: 'create' | 'update' = 'create', row?: OfferListItem) => {
  dialogType.value = type
  dialogVisible.value = true
  selectedList.value = []
  originalStatus.value = undefined
  await loadSupplyScopes()
  if (!hasSupplyScope.value && type === 'create') {
    message.warning('请先在供货配置中添加可供货范围')
  }

  if (type === 'update' && row) {
    originalStatus.value = row.status
    selectedList.value = [
      {
        ...row,
        supplyMode: row.offerSupplyMode,
        suggestedPriceCents: row.suggestPriceCents,
        status: row.status || OfferStatusEnum.PUBLISHED
      }
    ]
    return
  }

  queryParams.keyword = undefined
  queryParams.categoryCode = undefined
  await getSkuList()
}
defineExpose({ open })

const getSkuList = async () => {
  loading.value = true
  try {
    const data = await SupplierApi.getPlatformSkuPage(queryParams)
    skuList.value = data.list || []
    total.value = data.total || 0
  } catch {
    skuList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getSkuList()
}

const resetQuery = () => {
  queryParams.keyword = undefined
  queryParams.categoryCode = undefined
  handleQuery()
}

const handleSelectionChange = (rows: PlatformSkuVO[]) => {
  const map = new Map(selectedList.value.map((item) => [item.platformSkuCode, item]))
  rows.forEach((row) => {
    const skuCode = row.skuCode
    if (!skuCode || map.has(skuCode)) return
    map.set(skuCode, {
      platformSkuCode: skuCode,
      platformSpuName: row.spuName,
      platformSkuName: row.skuName,
      suggestPriceCents: yuanToCents(row.marketPrice),
      suggestedPriceCents: yuanToCents(row.marketPrice),
      priceMode: OfferPriceModeEnum.FIXED,
      supplyMode: 'DROP_SHIPPING',
      maxQuantity: 9999999,
      minQuantity: 1,
      status: OfferStatusEnum.PUBLISHED
    })
  })
  const selectedCodes = new Set(rows.map((item) => item.skuCode).filter(Boolean))
  selectedList.value = [...map.values()].filter((item) => selectedCodes.has(item.platformSkuCode!))
}

const removeSelected = (platformSkuCode: string) => {
  selectedList.value = selectedList.value.filter((item) => item.platformSkuCode !== platformSkuCode)
}

const clearSelected = async () => {
  if (!selectedList.value.length) {
    message.warning('当前没有已选商品')
    return
  }
  try {
    await message.confirm(`确认清空已选的 ${selectedList.value.length} 个商品吗？`, '清空确认')
    selectedList.value = []
    skuTableRef.value?.clearSelection()
    message.success('已清空')
  } catch {}
}

const applyBatch = () => {
  if (!selectedList.value.length) {
    message.warning('请先选择商品')
    return
  }
  selectedList.value.forEach((item) => {
    item.priceMode = batchConfig.priceMode
    if (batchConfig.priceMode === OfferPriceModeEnum.FIXED) {
      item.unitPriceCents = yuanToCents(batchConfig.priceOrDiscount)
      item.discountBp = undefined
    } else if (batchConfig.priceMode === OfferPriceModeEnum.DISCOUNT) {
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

const toDraftReq = (item: OfferFormItem): DraftReqVO => ({
  platformSkuCode: item.platformSkuCode || '',
  priceMode: item.priceMode || '',
  unitPriceCents:
    item.priceMode === OfferPriceModeEnum.FIXED ? item.unitPriceCents : undefined,
  discountBp: item.priceMode === OfferPriceModeEnum.DISCOUNT ? item.discountBp : undefined,
  suggestedPriceCents: item.suggestedPriceCents ?? item.suggestPriceCents,
  supplyMode: item.supplyMode || item.offerSupplyMode || '',
  maxQuantity: item.maxQuantity,
  minQuantity: item.minQuantity
})

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
    if (!item.priceMode) {
      message.warning(`SKU「${skuName}」请选择供应价模式`)
      return false
    }
    if (item.priceMode === OfferPriceModeEnum.FIXED) {
      if (!item.unitPriceCents || item.unitPriceCents <= 0) {
        message.warning(`SKU「${skuName}」固定值模式下供应价必须大于 0`)
        return false
      }
    } else if (item.priceMode === OfferPriceModeEnum.DISCOUNT) {
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
    if (isEdit.value) {
      const row = selectedList.value[0]
      if (!row.offerNo) {
        message.error('缺少合作商品编号，暂无法保存')
        return
      }
      await SupplierApi.updateOffer(props.supplierCode, row.offerNo, toDraftReq(row))
      if (row.status && row.status !== originalStatus.value) {
        await SupplierApi.patchOffer(props.supplierCode, row.offerNo, { status: row.status })
      }
      message.success('保存成功')
    } else {
      await SupplierApi.createOffers(props.supplierCode, {
        items: selectedList.value.map(toDraftReq)
      })
      message.success('添加成功')
    }
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
</style>
