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
      <!-- 左侧：平台标品池（仅新增） -->
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

      <!-- 右侧：已选 / 编辑商品（整块滚动） -->
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
                  <el-select v-model="batchConfig.supplyPriceMode" class="!w-full">
                    <el-option
                      v-for="item in SUPPLY_PRICE_MODE_OPTIONS"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item
                  v-if="batchConfig.supplyPriceMode === SupplyPriceModeEnum.FIXED"
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
                  v-else-if="batchConfig.supplyPriceMode === SupplyPriceModeEnum.DISCOUNT"
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
                  <el-select
                    v-model="batchConfig.supplyMode"
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    class="!w-full"
                  >
                    <el-option
                      v-for="item in SUPPLIER_SUPPLY_MODE_OPTIONS"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="供货上限">
                  <el-input-number
                    v-model="batchConfig.supplyLimit"
                    :min="1"
                    :precision="0"
                    class="!w-full"
                  />
                </el-form-item>
                <el-form-item label="最低起购量">
                  <el-input-number
                    v-model="batchConfig.minOrderQty"
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
              :key="item.skuId"
              class="mb-10px border border-solid border-[var(--el-border-color)] rounded-6px p-10px"
            >
              <div class="mb-6px flex items-center justify-between">
                <span class="text-13px font-600">{{ item.spuName }} / {{ item.skuName }}</span>
                <el-button
                  v-if="!isEdit"
                  link
                  type="danger"
                  @click="removeSelected(item.skuId!)"
                >
                  移除
                </el-button>
              </div>
              <el-form :label-width="isEdit ? '100px' : '80px'" size="small">
                <el-form-item label="供应价模式">
                  <el-select v-model="item.supplyPriceMode" class="!w-full">
                    <el-option
                      v-for="opt in SUPPLY_PRICE_MODE_OPTIONS"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item
                  v-if="item.supplyPriceMode === SupplyPriceModeEnum.FIXED"
                  label="供应价"
                >
                  <el-input-number
                    v-model="item.supplyPrice"
                    :min="0"
                    :precision="2"
                    class="!w-full"
                  />
                </el-form-item>
                <el-form-item
                  v-else-if="item.supplyPriceMode === SupplyPriceModeEnum.DISCOUNT"
                  label="折扣(%)"
                >
                  <el-input-number
                    v-model="item.supplyDiscount"
                    :min="0.01"
                    :max="100"
                    :precision="2"
                    class="!w-full"
                  />
                </el-form-item>
                <el-form-item label="供货模式">
                  <el-select
                    v-model="item.supplyMode"
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    class="!w-full"
                  >
                    <el-option
                      v-for="opt in SUPPLIER_SUPPLY_MODE_OPTIONS"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="供货上限">
                  <el-input-number
                    v-model="item.supplyLimit"
                    :min="1"
                    :precision="0"
                    class="!w-full"
                  />
                </el-form-item>
                <el-form-item label="最低起购量">
                  <el-input-number
                    v-model="item.minOrderQty"
                    :min="1"
                    :precision="0"
                    class="!w-full"
                  />
                </el-form-item>
                <el-form-item v-if="isEdit" label="状态">
                  <el-radio-group v-model="item.status">
                    <el-radio
                      v-for="opt in PRODUCT_SHELF_STATUS_OPTIONS"
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
import { SupplierApi, PlatformSkuVO, SupplierProductVO, SupplierSupplyConfigVO } from '@/api/supplier/manage'
import {
  PRODUCT_SHELF_STATUS_OPTIONS,
  ProductShelfStatusEnum,
  SUPPLIER_PRODUCT_FILTER_TAGS,
  SUPPLIER_SUPPLY_MODE_OPTIONS,
  SUPPLY_PRICE_MODE_OPTIONS,
  SupplyPriceModeEnum,
  getProductCategoryLabel,
  getProductTypeLabel,
  normalizeSupplyModes
} from '@/views/supplier/utils/constants'

defineOptions({ name: 'SupplierProductSelectDialog' })

const props = defineProps<{
  supplierId: number
  supplyConfigs?: SupplierSupplyConfigVO[]
  capabilityTags?: string[]
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
const selectedList = ref<SupplierProductVO[]>([])
const supplyConfigs = ref<SupplierSupplyConfigVO[]>([])
const skuTableRef = ref()

const isEdit = computed(() => dialogType.value === 'update')

const getSkuTypeCategoryPath = (row: PlatformSkuVO) => {
  const typeName = row.productType ? getProductTypeLabel(row.productType) : ''
  const categoryName = row.productCategory ? getProductCategoryLabel(row.productCategory) : ''
  if (typeName && typeName !== '-' && categoryName && categoryName !== '-') {
    return `${typeName} / ${categoryName}`
  }
  return typeName && typeName !== '-' ? typeName : categoryName && categoryName !== '-' ? categoryName : '-'
}

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: undefined as string | undefined,
  categoryCode: undefined as string | undefined,
  supplierId: undefined as number | undefined
})

const batchConfig = reactive({
  supplyPriceMode: SupplyPriceModeEnum.FIXED as number,
  priceOrDiscount: 0,
  supplyMode: ['dropshipping'] as string[],
  supplyLimit: 9999999,
  minOrderQty: 1
})

/** 搜索区商品分类下拉：与列表页筛选标签一致 */
const categoryTags = SUPPLIER_PRODUCT_FILTER_TAGS

const loadSupplyConfigs = async () => {
  try {
    supplyConfigs.value = props.supplyConfigs?.length
      ? props.supplyConfigs
      : (await SupplierApi.getSupplyConfigList(props.supplierId)) || []
  } catch {
    supplyConfigs.value = props.supplyConfigs || []
  }
}

/** 打开弹窗：create 新增 / update 编辑回填 */
const open = async (type: 'create' | 'update' = 'create', row?: SupplierProductVO) => {
  dialogType.value = type
  dialogVisible.value = true
  selectedList.value = []
  await loadSupplyConfigs()
  if (!supplyConfigs.value.length && type === 'create') {
    message.warning('请先在供货配置中添加可供货范围')
  }

  if (type === 'update' && row) {
    selectedList.value = [
      {
        ...row,
        supplyMode: normalizeSupplyModes(row.supplyMode),
        status: row.status ?? ProductShelfStatusEnum.ON
      }
    ]
    return
  }

  queryParams.keyword = undefined
  queryParams.categoryCode = undefined
  queryParams.supplierId = props.supplierId
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
  const map = new Map(selectedList.value.map((item) => [item.skuId, item]))
  rows.forEach((row) => {
    if (!map.has(row.skuId)) {
      map.set(row.skuId, {
        spuId: row.spuId,
        spuName: row.spuName,
        skuId: row.skuId,
        skuName: row.skuName,
        skuCode: row.skuCode,
        categoryCode: row.categoryCode,
        categoryName: row.categoryName,
        productType: row.productType,
        productTypeName: row.productType ? getProductTypeLabel(row.productType) : undefined,
        productCategory: row.productCategory,
        productCategoryName: row.productCategory
          ? getProductCategoryLabel(row.productCategory)
          : undefined,
        suggestPrice: row.marketPrice,
        supplyPriceMode: SupplyPriceModeEnum.FIXED,
        supplyPrice: undefined,
        supplyDiscount: undefined,
        supplyMode: ['dropshipping'],
        supplyLimit: 9999999,
        minOrderQty: 1,
        status: ProductShelfStatusEnum.ON
      })
    }
  })
  const selectedIds = new Set(rows.map((item) => item.skuId))
  selectedList.value = [...map.values()].filter((item) => selectedIds.has(item.skuId!))
}

const removeSelected = (skuId: number) => {
  selectedList.value = selectedList.value.filter((item) => item.skuId !== skuId)
}

const clearSelected = async () => {
  if (!selectedList.value.length) {
    message.warning('当前没有已选商品')
    return
  }
  try {
    await message.confirm(
      `确认清空已选的 ${selectedList.value.length} 个商品吗？`,
      '清空确认'
    )
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
    item.supplyPriceMode = batchConfig.supplyPriceMode
    if (batchConfig.supplyPriceMode === SupplyPriceModeEnum.FIXED) {
      item.supplyPrice = batchConfig.priceOrDiscount
      item.supplyDiscount = undefined
    } else if (batchConfig.supplyPriceMode === SupplyPriceModeEnum.DISCOUNT) {
      item.supplyDiscount = batchConfig.priceOrDiscount
      item.supplyPrice = undefined
    } else {
      item.supplyPrice = undefined
      item.supplyDiscount = undefined
    }
    item.supplyMode = [...batchConfig.supplyMode]
    item.supplyLimit = batchConfig.supplyLimit
    item.minOrderQty = batchConfig.minOrderQty
  })
  message.success('批量配置已应用')
}

const validateSelected = () => {
  if (!selectedList.value.length) {
    message.warning('请至少选择一个SKU')
    return false
  }
  for (const item of selectedList.value) {
    if (item.supplyPriceMode === SupplyPriceModeEnum.FIXED) {
      if (!item.supplyPrice || item.supplyPrice <= 0) {
        message.warning(`SKU「${item.skuName}」固定值模式下供应价必须大于 0`)
        return false
      }
    } else if (item.supplyPriceMode === SupplyPriceModeEnum.DISCOUNT) {
      const discount = item.supplyDiscount || 0
      if (discount < 0.01 || discount > 100) {
        message.warning(`SKU「${item.skuName}」供货折扣需在 0.01%~100% 之间`)
        return false
      }
    }
    if (!item.supplyMode?.length || !item.supplyLimit || !item.minOrderQty) {
      message.warning(`SKU「${item.skuName}」请完整配置供货参数`)
      return false
    }
    if ((item.supplyLimit || 0) < (item.minOrderQty || 0)) {
      message.warning(`SKU「${item.skuName}」供货上限不能小于最低起购量`)
      return false
    }
  }
  return true
}

const handleSubmit = async () => {
  if (!validateSelected()) return
  submitting.value = true
  try {
    if (isEdit.value) {
      const row = selectedList.value[0]
      await SupplierApi.updateProduct({
        ...row,
        supplyPrice:
          row.supplyPriceMode === SupplyPriceModeEnum.FIXED ? row.supplyPrice : undefined,
        supplyDiscount:
          row.supplyPriceMode === SupplyPriceModeEnum.DISCOUNT ? row.supplyDiscount : undefined
      })
      message.success('保存成功')
    } else {
      await SupplierApi.createProducts(props.supplierId, selectedList.value)
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
