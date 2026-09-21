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
            v-model="row.sellableCategory"
            placeholder="请选择可售品类"
            filterable
            clearable
            class="!w-full"
            @change="() => handleSellableCategoryChange(row)"
          >
            <el-option
              v-for="dict in getStrDictOptions('supply_chain_sellable_category')"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="商品类型" min-width="140">
        <template #default="{ row }">
          <ProductType
            v-model="row.productType"
            :multiple="false"
            filterable
            class="!w-full"
            :disabled="!row.sellableCategory"
            @change="() => handleProductTypeChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="商品分类" min-width="150">
        <template #default="{ row }">
          <ProductCategory
            v-model="row.productClassification"
            class="!w-full"
            :disabled="!row.productType"
            @change="() => handleProductClassificationChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="供货模式" min-width="200">
        <template #default="{ row }">
          <el-select
            v-model="row.supplyModes"
            placeholder="请选择供货模式"
            multiple
            collapse-tags
            collapse-tags-tooltip
            class="!w-full"
            :disabled="!row.productClassification"
          >
            <el-option
              v-for="dict in getStrDictOptions('supply_chain_supply_mode')"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="供货上限" min-width="140">
        <template #default="{ row }">
          <el-input-number
            :controls="false"
            v-model="row.maxQuantity"
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
            :controls="false"
            v-model="row.minQuantity"
            :min="1"
            :precision="0"
            class="!w-full"
            controls-position="right"
            :disabled="!row.maxQuantity"
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
import {
  SupplierApi,
  ScopeReqVO,
  SupplierSupplyScopeDO,
  SupplyScopeView
} from '@/api/supplier/manage'
import { getStrDictOptions } from '@/utils/dict'

defineOptions({ name: 'SupplierSupplyConfig' })

const props = defineProps<{
  supplierCode: string
}>()

const emit = defineEmits<{
  success: []
}>()

const message = useMessage()
const loading = ref(false)
const saving = ref(false)

/** 表格行：保存字段 + 查询带回的名称 */
type SupplyScopeRow = Partial<
  Pick<ScopeReqVO, 'sellableCategory' | 'productType' | 'productClassification'>
> &
  Omit<ScopeReqVO, 'sellableCategory' | 'productType' | 'productClassification'> &
  Pick<SupplyScopeView, 'id'>

const list = ref<SupplyScopeRow[]>([])

const DEFAULT_MAX_QUANTITY = 9999999
const DEFAULT_MIN_QUANTITY = 1

const toScopeCode = (value?: string | number | null) => {
  if (value == null || value === '') return undefined
  return String(value)
}

const createEmptyRow = (): SupplyScopeRow => ({
  sellableCategory: undefined,
  productType: undefined,
  productClassification: undefined,
  supplyModes: [],
  maxQuantity: DEFAULT_MAX_QUANTITY,
  minQuantity: DEFAULT_MIN_QUANTITY
})

const hasSupplyMode = (row: SupplyScopeRow) => {
  return Array.isArray(row.supplyModes) && row.supplyModes.length > 0
}

/** 同一供应商下品类组合：可售品类 + 商品类型 + 商品分类 */
const getComboKey = (row: SupplyScopeRow) => {
  return [row.sellableCategory ?? '', row.productType ?? '', row.productClassification ?? ''].join('|')
}

const isComboDuplicated = (current: SupplyScopeRow) => {
  if (!current.sellableCategory || !current.productType || !current.productClassification) return false
  const key = getComboKey(current)
  return list.value.some((item) => item !== current && getComboKey(item) === key)
}

const alertConflict = async () => {
  await message.alert('同一供应商下品类组合不可重复，请检查冲突配置')
}

const handleSellableCategoryChange = (row: SupplyScopeRow) => {
  row.productType = undefined
  row.productClassification = undefined
  row.supplyModes = []
}

const handleProductTypeChange = (row: SupplyScopeRow) => {
  row.productClassification = undefined
  row.supplyModes = []
}

const handleProductClassificationChange = async (row: SupplyScopeRow) => {
  row.supplyModes = []
  if (isComboDuplicated(row)) {
    await alertConflict()
    row.productClassification = undefined
  }
}

const addRow = () => {
  list.value.push(createEmptyRow())
}

const removeRow = (index: number) => {
  list.value.splice(index, 1)
}

const parseSupplyModes = (item: SupplierSupplyScopeDO & SupplyScopeView) => {
  if (Array.isArray(item.supplyModes)) return item.supplyModes.map(String).filter(Boolean)
  const rawMode = item.supplyMode as unknown
  if (Array.isArray(rawMode)) return rawMode.map(String).filter(Boolean)
  if (typeof rawMode !== 'string' || !rawMode.trim()) return []
  const text = rawMode.trim()
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean)
    } catch {
      // 非 JSON 数组时按分隔符拆分
    }
  }
  return text
    .split(/[,，]/)
    .map((mode) => mode.trim())
    .filter(Boolean)
}

const normalizeRow = (item: SupplierSupplyScopeDO & SupplyScopeView): SupplyScopeRow => ({
  ...createEmptyRow(),
  id: item.id,
  sellableCategory: toScopeCode(item.sellableCategory ?? item.categoryL1Id),
  productType: toScopeCode(item.productType ?? item.categoryL2Id),
  productClassification: toScopeCode(item.productClassification ?? item.categoryL3Id),
  supplyModes: parseSupplyModes(item),
  maxQuantity: item.maxQuantity ?? DEFAULT_MAX_QUANTITY,
  minQuantity: item.minQuantity ?? DEFAULT_MIN_QUANTITY
})

const validateRows = async () => {
  for (let i = 0; i < list.value.length; i++) {
    const row = list.value[i]
    const rowNo = i + 1
    if (!row.sellableCategory) {
      message.warning(`第 ${rowNo} 行请先选择可售品类`)
      return false
    }
    if (!row.productType) {
      message.warning(`第 ${rowNo} 行需依次选择商品类型`)
      return false
    }
    if (!row.productClassification) {
      message.warning(`第 ${rowNo} 行需依次选择商品分类`)
      return false
    }
    if (!hasSupplyMode(row)) {
      message.warning(`第 ${rowNo} 行需依次选择供货模式`)
      return false
    }
    if (!row.maxQuantity) {
      message.warning(`第 ${rowNo} 行需填写供货上限`)
      return false
    }
    if (!row.minQuantity) {
      message.warning(`第 ${rowNo} 行需填写最低起订量`)
      return false
    }
    if (row.maxQuantity < row.minQuantity) {
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
  if (!props.supplierCode) return
  loading.value = true
  try {
    const data = await SupplierApi.getSupplyScopes(props.supplierCode)
    const rows = Array.isArray(data) ? data : []
    list.value = rows.map((item) => normalizeRow(item))
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

const toScopeLine = (row: SupplyScopeRow): ScopeReqVO => ({
  sellableCategory: row.sellableCategory || '',
  productType: row.productType || '',
  productClassification: row.productClassification || '',
  supplyModes: row.supplyModes || [],
  maxQuantity: row.maxQuantity ?? 0,
  minQuantity: row.minQuantity ?? 0
})

const handleSave = async () => {
  if (!(await validateRows())) return
  if (!props.supplierCode) {
    message.error('缺少供应商编号，暂无法保存供货配置')
    return
  }
  saving.value = true
  try {
    await SupplierApi.saveSupplyScopes(props.supplierCode, {
      lines: list.value.map(toScopeLine)
    })
    message.success('供货配置保存成功')
    await loadData()
    emit('success')
  } finally {
    saving.value = false
  }
}

watch(
  () => props.supplierCode,
  () => loadData(),
  { immediate: true }
)

defineExpose({ list, loadData })
</script>
