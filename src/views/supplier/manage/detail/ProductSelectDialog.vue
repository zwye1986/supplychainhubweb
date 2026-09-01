<template>
  <Dialog v-model="dialogVisible" title="新增供应商品" width="1100px" :scroll="true" max-height="70vh">
    <el-alert
      class="mb-12px"
      type="info"
      :closable="false"
      title="从平台标品（SPU→SKU）中选择供货商品。根据供应商的供货配置筛选可售品类、商品类型、商品分类。"
    />

    <div class="mb-12px flex flex-wrap gap-8px">
      <el-check-tag
        v-for="tag in filterTags"
        :key="tag.value"
        :checked="activeTag === tag.value"
        @change="handleTagChange(tag.value)"
      >
        {{ tag.label }}
      </el-check-tag>
    </div>

    <el-row :gutter="16">
      <!-- 左侧：平台标品池 -->
      <el-col :span="14">
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
                  v-for="item in filterTags"
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
            v-loading="loading"
            :data="skuList"
            row-key="skuId"
            height="420"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="45" :reserve-selection="true" />
            <el-table-column label="SPU" prop="spuName" min-width="140" />
            <el-table-column label="SKU" prop="skuName" min-width="140" />
            <el-table-column label="编号" prop="skuCode" min-width="110" />
            <el-table-column label="分类" prop="categoryName" min-width="100" />
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

      <!-- 右侧：已选商品 -->
      <el-col :span="10">
        <ContentWrap class="!mb-0">
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
              :label="batchConfig.supplyPriceMode === SupplyPriceModeEnum.FIXED ? '供应价' : '折扣(%)'"
            >
              <el-input-number
                v-model="batchConfig.priceOrDiscount"
                :min="0"
                :precision="2"
                class="!w-full"
              />
            </el-form-item>
            <el-form-item label="供货模式">
              <el-select v-model="batchConfig.supplyMode" class="!w-full">
                <el-option
                  v-for="item in SUPPLY_MODE_OPTIONS"
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

          <div class="mb-8px text-14px font-600">已选商品（{{ selectedList.length }}）</div>
          <el-scrollbar height="280px">
            <div
              v-for="item in selectedList"
              :key="item.skuId"
              class="mb-10px border border-solid border-[var(--el-border-color)] rounded-6px p-10px"
            >
              <div class="mb-6px flex items-center justify-between">
                <span class="text-13px font-600">{{ item.spuName }} / {{ item.skuName }}</span>
                <el-button link type="danger" @click="removeSelected(item.skuId!)">移除</el-button>
              </div>
              <el-form label-width="80px" size="small">
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
                  :label="
                    item.supplyPriceMode === SupplyPriceModeEnum.FIXED ? '供应价' : '折扣(%)'
                  "
                >
                  <el-input-number
                    v-if="item.supplyPriceMode === SupplyPriceModeEnum.FIXED"
                    v-model="item.supplyPrice"
                    :min="0"
                    :precision="2"
                    class="!w-full"
                  />
                  <el-input-number
                    v-else
                    v-model="item.supplyDiscount"
                    :min="0.01"
                    :max="100"
                    :precision="2"
                    class="!w-full"
                  />
                </el-form-item>
                <el-form-item label="供货模式">
                  <el-select v-model="item.supplyMode" class="!w-full">
                    <el-option
                      v-for="opt in SUPPLY_MODE_OPTIONS"
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
              </el-form>
            </div>
            <el-empty v-if="!selectedList.length" description="请从左侧选择商品" :image-size="60" />
          </el-scrollbar>

          <el-alert
            class="mt-12px"
            type="warning"
            :closable="false"
            title="供应价模式说明：固定值 = 按设定金额供货；供货折扣 = 按标品价格 × 折扣率结算。"
          />
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
  SUPPLY_MODE_OPTIONS,
  SUPPLY_PRICE_MODE_OPTIONS,
  SupplyModeEnum,
  SupplyPriceModeEnum,
  getCategoryLabel
} from '@/views/supplier/utils/constants'

defineOptions({ name: 'SupplierProductSelectDialog' })

const props = defineProps<{
  supplierId: number
  capabilityTags?: string[]
}>()

const emit = defineEmits<{
  success: []
}>()

const message = useMessage()
const dialogVisible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const skuList = ref<PlatformSkuVO[]>([])
const total = ref(0)
const selectedList = ref<SupplierProductVO[]>([])
const activeTag = ref<string>('')
const supplyConfigs = ref<SupplierSupplyConfigVO[]>([])

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
  supplyMode: SupplyModeEnum.SPOT as number,
  supplyLimit: 9999999,
  minOrderQty: 1
})

const filterTags = computed(() => {
  const codes = [
    ...new Set(
      supplyConfigs.value.map((item) => item.categoryCode).filter((code): code is string => !!code)
    )
  ]
  const source = codes.length ? codes : props.capabilityTags || []
  return source.map((value) => ({
    value,
    label: getCategoryLabel(value)
  }))
})

const open = async () => {
  dialogVisible.value = true
  selectedList.value = []
  try {
    supplyConfigs.value = (await SupplierApi.getSupplyConfigList(props.supplierId)) || []
  } catch {
    supplyConfigs.value = []
  }
  if (!supplyConfigs.value.length) {
    message.warning('请先在供货配置中添加可供货范围')
  }
  activeTag.value = filterTags.value[0]?.value || ''
  queryParams.categoryCode = activeTag.value || undefined
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
  queryParams.categoryCode = activeTag.value || undefined
  handleQuery()
}

const handleTagChange = (value: string) => {
  activeTag.value = value
  queryParams.categoryCode = value
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
        supplyPriceMode: SupplyPriceModeEnum.FIXED,
        supplyPrice: undefined,
        supplyDiscount: undefined,
        supplyMode: SupplyModeEnum.SPOT,
        supplyLimit: 9999999,
        minOrderQty: 1
      })
    }
  })
  const selectedIds = new Set(rows.map((item) => item.skuId))
  selectedList.value = [...map.values()].filter((item) => selectedIds.has(item.skuId!))
}

const removeSelected = (skuId: number) => {
  selectedList.value = selectedList.value.filter((item) => item.skuId !== skuId)
}

const clearSelected = () => {
  selectedList.value = []
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
    } else {
      item.supplyDiscount = batchConfig.priceOrDiscount
      item.supplyPrice = undefined
    }
    item.supplyMode = batchConfig.supplyMode
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
    } else {
      const discount = item.supplyDiscount || 0
      if (discount < 0.01 || discount > 100) {
        message.warning(`SKU「${item.skuName}」供货折扣需在 0.01%~100% 之间`)
        return false
      }
    }
    if (!item.supplyMode || !item.supplyLimit || !item.minOrderQty) {
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
    await SupplierApi.createProducts(props.supplierId, selectedList.value)
    message.success('添加成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>
