<template>
  <ContentWrap v-loading="loading">
    <el-alert
      type="info"
      :closable="false"
      title="配置供应商可供货的商品范围与供货规则，新增商品时将根据此配置筛选可添加的商品。"
    />
    <el-table class="mt-12px" :data="list" border :show-overflow-tooltip="true">
      <el-table-column label="可售品类" min-width="150">
        <template #default="{ row }">
          <el-select
            v-model="row.categoryCode"
            placeholder="请选择可售品类"
            filterable
            clearable
            class="!w-full"
            @change="(val: string) => handleCategoryChange(row, val)"
          >
            <el-option
              v-for="item in SUPPLIER_CATEGORY_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="商品类型" min-width="140">
        <template #default="{ row }">
          <el-select
            v-model="row.productType"
            placeholder="请选择商品类型"
            filterable
            clearable
            class="!w-full"
            :disabled="!row.categoryCode"
            @change="(val: string) => handleProductTypeChange(row, val)"
          >
            <el-option
              v-for="item in SUPPLIER_PRODUCT_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="商品分类" min-width="150">
        <template #default="{ row }">
          <el-select
            v-model="row.productCategory"
            placeholder="请选择商品分类"
            filterable
            clearable
            class="!w-full"
            :disabled="!row.productType"
            @change="(val: string) => handleProductCategoryChange(row, val)"
          >
            <el-option
              v-for="item in SUPPLIER_PRODUCT_CATEGORY_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="供货模式" min-width="200">
        <template #default="{ row }">
          <el-select
            v-model="row.supplyMode"
            placeholder="请选择供货模式"
            multiple
            collapse-tags
            collapse-tags-tooltip
            class="!w-full"
            :disabled="!row.productCategory"
          >
            <el-option
              v-for="item in SUPPLIER_SUPPLY_MODE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="供货上限" min-width="140">
        <template #default="{ row }">
          <el-input-number
            v-model="row.supplyLimit"
            :min="1"
            :precision="0"
            class="!w-full"
            controls-position="right"
            :disabled="!hasSupplyMode(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="最低起订量" min-width="140">
        <template #default="{ row }">
          <el-input-number
            v-model="row.minOrderQty"
            :min="1"
            :precision="0"
            class="!w-full"
            controls-position="right"
            :disabled="!row.supplyLimit"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" align="center" fixed="right">
        <template #default="{ $index }">
          <el-button link type="danger" @click="removeRow($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="mt-12px">
      <el-button type="primary" plain @click="addRow">
        <Icon icon="ep:plus" class="mr-5px" /> 添加供货配置
      </el-button>
      <el-button type="success" :loading="saving" @click="handleSave">保 存</el-button>
    </div>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { SupplierApi, SupplierSupplyConfigVO } from '@/api/supplier/manage'
import {
  SUPPLIER_CATEGORY_OPTIONS,
  SUPPLIER_PRODUCT_CATEGORY_OPTIONS,
  SUPPLIER_PRODUCT_TYPE_OPTIONS,
  SUPPLIER_SUPPLY_MODE_OPTIONS,
  getCategoryLabel,
  getProductCategoryLabel,
  getProductTypeLabel
} from '@/views/supplier/utils/constants'

defineOptions({ name: 'SupplierSupplyConfig' })

const props = defineProps<{
  supplierId: number
}>()

const emit = defineEmits<{
  success: []
}>()

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const list = ref<SupplierSupplyConfigVO[]>([])

const DEFAULT_SUPPLY_LIMIT = 9999999
const DEFAULT_MIN_ORDER_QTY = 1

const createEmptyRow = (): SupplierSupplyConfigVO => ({
  categoryCode: '',
  categoryName: '',
  productType: '',
  productTypeName: '',
  productCategory: '',
  productCategoryName: '',
  supplyMode: [],
  supplyLimit: DEFAULT_SUPPLY_LIMIT,
  minOrderQty: DEFAULT_MIN_ORDER_QTY
})

const hasSupplyMode = (row: SupplierSupplyConfigVO) => {
  return Array.isArray(row.supplyMode) && row.supplyMode.length > 0
}

/** 同一供应商下品类组合：可售品类 + 商品类型 + 商品分类 */
const getComboKey = (row: SupplierSupplyConfigVO) => {
  return [row.categoryCode || '', row.productType || '', row.productCategory || ''].join('|')
}

const isComboDuplicated = (current: SupplierSupplyConfigVO) => {
  if (!current.categoryCode || !current.productType || !current.productCategory) return false
  const key = getComboKey(current)
  return list.value.some((item) => item !== current && getComboKey(item) === key)
}

const alertConflict = async () => {
  await message.alert('同一供应商下品类组合不可重复，请检查冲突配置')
}

const handleCategoryChange = (row: SupplierSupplyConfigVO, val: string) => {
  row.categoryName = val ? getCategoryLabel(val) : ''
  row.productType = ''
  row.productTypeName = ''
  row.productCategory = ''
  row.productCategoryName = ''
  row.supplyMode = []
}

const handleProductTypeChange = (row: SupplierSupplyConfigVO, val: string) => {
  row.productTypeName = val ? getProductTypeLabel(val) : ''
  row.productCategory = ''
  row.productCategoryName = ''
  row.supplyMode = []
}

const handleProductCategoryChange = async (row: SupplierSupplyConfigVO, val: string) => {
  row.productCategoryName = val ? getProductCategoryLabel(val) : ''
  row.supplyMode = []
  if (isComboDuplicated(row)) {
    await alertConflict()
    row.productCategory = ''
    row.productCategoryName = ''
  }
}

const addRow = () => {
  list.value.push(createEmptyRow())
}

const removeRow = (index: number) => {
  list.value.splice(index, 1)
}

const normalizeRow = (item: SupplierSupplyConfigVO): SupplierSupplyConfigVO => {
  const rawMode = item.supplyMode as unknown
  let supplyMode: string[] = []
  if (Array.isArray(rawMode)) {
    supplyMode = rawMode.map(String)
  } else if (typeof rawMode === 'string' && rawMode) {
    supplyMode = [rawMode]
  }
  return {
    ...createEmptyRow(),
    ...item,
    categoryName: item.categoryName || (item.categoryCode ? getCategoryLabel(item.categoryCode) : ''),
    productTypeName:
      item.productTypeName || (item.productType ? getProductTypeLabel(item.productType) : ''),
    productCategoryName:
      item.productCategoryName ||
      (item.productCategory ? getProductCategoryLabel(item.productCategory) : ''),
    supplyMode,
    supplyLimit: item.supplyLimit ?? DEFAULT_SUPPLY_LIMIT,
    minOrderQty: item.minOrderQty ?? DEFAULT_MIN_ORDER_QTY
  }
}

const validateRows = async () => {
  for (let i = 0; i < list.value.length; i++) {
    const row = list.value[i]
    const rowNo = i + 1
    if (!row.categoryCode) {
      message.warning(`第 ${rowNo} 行请先选择可售品类`)
      return false
    }
    if (!row.productType) {
      message.warning(`第 ${rowNo} 行需依次选择商品类型`)
      return false
    }
    if (!row.productCategory) {
      message.warning(`第 ${rowNo} 行需依次选择商品分类`)
      return false
    }
    if (!hasSupplyMode(row)) {
      message.warning(`第 ${rowNo} 行需依次选择供货模式`)
      return false
    }
    if (!row.supplyLimit) {
      message.warning(`第 ${rowNo} 行需填写供货上限`)
      return false
    }
    if (!row.minOrderQty) {
      message.warning(`第 ${rowNo} 行需填写最低起订量`)
      return false
    }
    if (row.supplyLimit < row.minOrderQty) {
      message.warning(`第 ${rowNo} 行供货上限不能小于最低起订量`)
      return false
    }
  }
  const keys = list.value.map((item) => getComboKey(item))
  if (new Set(keys).size !== keys.length) {
    await alertConflict()
    return false
  }
  return true
}

const loadData = async () => {
  if (!props.supplierId) return
  loading.value = true
  try {
    const data = await SupplierApi.getSupplyConfigList(props.supplierId)
    list.value = (data || []).map((item) => normalizeRow(item))
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!(await validateRows())) return
  saving.value = true
  try {
    await SupplierApi.saveSupplyConfigs(props.supplierId, list.value)
    message.success('供货配置保存成功')
    await loadData()
    emit('success')
  } finally {
    saving.value = false
  }
}

watch(
  () => props.supplierId,
  () => loadData(),
  { immediate: true }
)

defineExpose({ list, loadData })
</script>
