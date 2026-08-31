<template>
  <ContentWrap v-loading="loading">
    <el-alert
      class="mb-16px"
      type="info"
      :closable="false"
      title="配置供应商可供货的商品范围与供货规则，新增商品时将根据此配置筛选可添加的商品。"
    />
    <div class="mb-12px">
      <el-button
        v-hasPermi="['scm:supplier:update']"
        type="primary"
        plain
        @click="addRow"
      >
        <Icon icon="ep:plus" class="mr-5px" /> 添加供货配置
      </el-button>
      <el-button
        v-hasPermi="['scm:supplier:update']"
        type="success"
        :loading="saving"
        @click="handleSave"
      >
        保 存
      </el-button>
    </div>
    <el-table :data="list" border :show-overflow-tooltip="true">
      <el-table-column label="商品分类" min-width="180">
        <template #default="{ row }">
          <el-select
            v-model="row.categoryCode"
            placeholder="请选择分类"
            filterable
            class="!w-full"
            @change="(val: string) => handleCategoryChange(row, val)"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
              :disabled="isCategoryUsed(item.value, row)"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="供货模式" min-width="140">
        <template #default="{ row }">
          <el-select v-model="row.supplyMode" placeholder="请选择供货模式" class="!w-full">
            <el-option
              v-for="item in SUPPLY_MODE_OPTIONS"
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
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" align="center">
        <template #default="{ $index }">
          <el-button link type="danger" @click="removeRow($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { SupplierApi, SupplierSupplyConfigVO } from '@/api/supplier/manage'
import {
  SUPPLIER_CAPABILITY_OPTIONS,
  SUPPLY_MODE_OPTIONS
} from '@/views/supplier/utils/constants'

defineOptions({ name: 'SupplierSupplyConfig' })

const props = defineProps<{
  supplierId: number
}>()

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const list = ref<SupplierSupplyConfigVO[]>([])

const categoryOptions = SUPPLIER_CAPABILITY_OPTIONS.map((item) => ({
  label: item.label,
  value: item.value
}))

const createEmptyRow = (): SupplierSupplyConfigVO => ({
  categoryCode: '',
  categoryName: '',
  supplyMode: undefined,
  supplyLimit: 9999999,
  minOrderQty: 1
})

const isCategoryUsed = (categoryCode: string, current: SupplierSupplyConfigVO) => {
  return list.value.some(
    (item) => item !== current && item.categoryCode && item.categoryCode === categoryCode
  )
}

const handleCategoryChange = (row: SupplierSupplyConfigVO, val: string) => {
  if (list.value.filter((item) => item.categoryCode === val).length > 1) {
    message.warning('同一供应商下品类组合不可重复')
    row.categoryCode = ''
    row.categoryName = ''
    return
  }
  row.categoryName = categoryOptions.find((item) => item.value === val)?.label || val
}

const addRow = () => {
  list.value.push(createEmptyRow())
}

const removeRow = (index: number) => {
  list.value.splice(index, 1)
}

const validateRows = () => {
  for (let i = 0; i < list.value.length; i++) {
    const row = list.value[i]
    if (!row.categoryCode || !row.supplyMode || !row.supplyLimit || !row.minOrderQty) {
      message.warning(`第 ${i + 1} 行需依次选择分类、供货模式、供货上限、最低起订量`)
      return false
    }
    if (row.supplyLimit < row.minOrderQty) {
      message.warning(`第 ${i + 1} 行供货上限不能小于最低起订量`)
      return false
    }
  }
  const codes = list.value.map((item) => item.categoryCode)
  if (new Set(codes).size !== codes.length) {
    message.warning('同一供应商 + 品类组合唯一，请检查重复配置')
    return false
  }
  return true
}

const loadData = async () => {
  if (!props.supplierId) return
  loading.value = true
  try {
    const data = await SupplierApi.getSupplyConfigList(props.supplierId)
    list.value = data?.length ? data : []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!validateRows()) return
  saving.value = true
  try {
    await SupplierApi.saveSupplyConfigs(props.supplierId, list.value)
    message.success('供货配置保存成功')
    await loadData()
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
