<template>
  <Dialog v-model="dialogVisible" title="新增分销商品" width="1200px" :scroll="true" max-height="70vh">
    <div class="mb-12px flex items-center justify-between">
      <el-alert
        class="!mb-0 flex-1"
        type="info"
        :closable="false"
        title="从平台标品（SPU→SKU）中选择商品关联至该分销商。"
      />
      <el-tag class="ml-12px" type="primary" size="large">已选商品 {{ selectedList.length }}</el-tag>
    </div>

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
      <el-col :span="13">
        <ContentWrap class="!mb-0">
          <el-form :inline="true" :model="queryParams" class="-mb-10px">
            <el-form-item label="名称/编号">
              <el-input
                v-model="queryParams.keyword"
                placeholder="按商品名称或SPU编号搜索"
                clearable
                class="!w-200px"
                @keyup.enter="handleQuery"
              />
            </el-form-item>
            <el-form-item>
              <el-button @click="handleQuery">搜索</el-button>
              <el-button @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table
            ref="tableRef"
            v-loading="loading"
            :data="skuList"
            row-key="skuId"
            height="420"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="45" :reserve-selection="true" />
            <el-table-column label="SPU" prop="spuName" min-width="130" />
            <el-table-column label="SKU" prop="skuName" min-width="100" />
            <el-table-column label="编号" prop="skuCode" min-width="110" />
            <el-table-column label="分类" prop="categoryName" min-width="90" />
            <el-table-column label="建议价" prop="marketPrice" min-width="90" align="right" />
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

      <el-col :span="11">
        <ContentWrap class="!mb-0">
          <div class="mb-10px text-14px font-600">批量配置</div>
          <el-alert
            class="mb-10px"
            type="warning"
            :closable="false"
            title="乘以系数，请设置百分比大于100，否则会出现亏本情况。单品牌利润空间=（商品分销价-供应价）/供应价×100%。"
          />
          <el-form label-width="100px" size="small" class="mb-10px">
            <el-form-item label="调价方式">
              <el-radio-group v-model="batchConfig.adjustMode">
                <el-radio
                  v-for="item in DIST_PRICE_ADJUST_MODE_OPTIONS"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item
              v-if="batchConfig.adjustMode === DistPriceAdjustModeEnum.CUSTOM"
              label="分销价公式"
            >
              <div class="flex w-full items-center gap-6px">
                <span class="whitespace-nowrap text-12px">销售建议价</span>
                <el-input-number
                  v-model="batchConfig.adjustPercent"
                  :min="1"
                  :precision="0"
                  class="!w-90px"
                />
                <span>%</span>
                <span>×</span>
                <el-input-number
                  v-model="batchConfig.adjustAmount"
                  :min="0"
                  :precision="2"
                  class="!w-90px"
                />
                <span>元</span>
              </div>
            </el-form-item>
            <el-form-item label="商品展示阈值">
              <div class="flex w-full items-center gap-6px">
                <span class="whitespace-nowrap text-12px">利润空间低于</span>
                <el-input-number
                  v-model="batchConfig.displayThreshold"
                  :min="0"
                  :max="100"
                  :precision="0"
                  class="!w-100px"
                />
                <span>% 时自动隐藏</span>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button @click="clearSelected">清空</el-button>
              <el-button type="primary" @click="applyBatch">应用</el-button>
            </el-form-item>
          </el-form>

          <div class="mb-8px text-14px font-600">已选商品（{{ selectedList.length }}）</div>
          <el-scrollbar height="240px">
            <div
              v-for="item in selectedList"
              :key="item.skuId"
              class="mb-10px rounded-6px border border-solid border-[var(--el-border-color)] p-10px"
            >
              <div class="mb-6px flex items-center justify-between">
                <span class="text-13px font-600">{{ item.spuName }} / {{ item.skuName }}</span>
                <el-button link type="danger" @click="removeSelected(item.skuId!)">移除</el-button>
              </div>
              <div class="mb-6px text-12px text-gray-500">
                销售建议价：¥{{ formatPrice(item.suggestPrice) }} ｜ 供应价：¥{{
                  formatPrice(item.supplyPrice)
                }}
              </div>
              <el-form label-width="90px" size="small">
                <el-form-item label="调价方式">
                  <el-radio-group v-model="item.adjustMode" @change="() => syncDistPrice(item)">
                    <el-radio
                      v-for="opt in DIST_PRICE_ADJUST_MODE_OPTIONS"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item
                  v-if="item.adjustMode === DistPriceAdjustModeEnum.CUSTOM"
                  label="公式"
                >
                  <div class="flex w-full items-center gap-4px">
                    <el-input-number
                      v-model="item.adjustPercent"
                      :min="1"
                      :precision="0"
                      class="!w-80px"
                      @change="() => syncDistPrice(item)"
                    />
                    <span>%</span>
                    <el-input-number
                      v-model="item.adjustAmount"
                      :min="0"
                      :precision="2"
                      class="!w-80px"
                      @change="() => syncDistPrice(item)"
                    />
                    <span>元</span>
                  </div>
                </el-form-item>
                <el-form-item label="分销价">
                  <el-input-number
                    v-model="item.distPrice"
                    :min="0"
                    :precision="2"
                    class="!w-full"
                    @change="() => syncFinalPrice(item)"
                  />
                </el-form-item>
                <el-form-item label="展示阈值">
                  <el-input-number
                    v-model="item.displayThreshold"
                    :min="0"
                    :max="100"
                    :precision="0"
                    class="!w-full"
                  />
                </el-form-item>
              </el-form>
            </div>
            <el-empty v-if="!selectedList.length" description="请从左侧选择商品" :image-size="60" />
          </el-scrollbar>
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
  DistPlatformSkuVO,
  DistributorApi,
  DistributorProductVO
} from '@/api/supplier/distribution'
import {
  DIST_PRICE_ADJUST_MODE_OPTIONS,
  DIST_PRODUCT_TYPE_OPTIONS,
  DistPriceAdjustModeEnum
} from '@/views/supplier/utils/constants'

defineOptions({ name: 'DistributorProductSelectDialog' })

const props = defineProps<{
  distributorId: number
}>()

const emit = defineEmits<{
  success: []
}>()

const message = useMessage()
const dialogVisible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const skuList = ref<DistPlatformSkuVO[]>([])
const total = ref(0)
const selectedList = ref<DistributorProductVO[]>([])
const activeTag = ref('')
const tableRef = ref()

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: undefined as string | undefined,
  categoryCode: undefined as string | undefined
})

const batchConfig = reactive({
  adjustMode: DistPriceAdjustModeEnum.SUGGEST as number,
  adjustPercent: 120,
  adjustAmount: 0,
  displayThreshold: 20
})

const filterTags = [
  { value: '', label: '全部商品' },
  ...DIST_PRODUCT_TYPE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))
]

const formatPrice = (value?: number) => {
  if (value === undefined || value === null) return '-'
  return Number(value).toFixed(2)
}

const calcDistPrice = (item: DistributorProductVO) => {
  const suggest = item.suggestPrice || 0
  if (item.adjustMode === DistPriceAdjustModeEnum.SUGGEST) {
    return Number(suggest.toFixed(2))
  }
  const percent = item.adjustPercent || 100
  const amount = item.adjustAmount || 0
  // 自定义：销售建议价 * percent% ，再叠加金额（金额为附加项）
  return Number(((suggest * percent) / 100 + amount).toFixed(2))
}

const buildPricingRule = (item: DistributorProductVO) => {
  if (item.adjustMode === DistPriceAdjustModeEnum.SUGGEST) return '按分销价=销售建议价'
  const percent = item.adjustPercent ?? 100
  const amount = item.adjustAmount ?? 0
  return amount
    ? `销售建议价 × ${percent}% + ${amount}`
    : `销售建议价 × ${percent}%`
}

const syncDistPrice = (item: DistributorProductVO) => {
  item.distPrice = calcDistPrice(item)
  item.pricingRule = buildPricingRule(item)
  syncFinalPrice(item)
}

const syncFinalPrice = (item: DistributorProductVO) => {
  item.finalPrice = item.projectPrice ?? item.distPrice
  item.priceSource = item.projectPriceCovered ? '项目专属价' : '分销商基础价'
}

const open = async () => {
  dialogVisible.value = true
  selectedList.value = []
  activeTag.value = ''
  queryParams.categoryCode = undefined
  queryParams.keyword = undefined
  queryParams.pageNo = 1
  nextTick(() => tableRef.value?.clearSelection?.())
  await getSkuList()
}
defineExpose({ open })

const getSkuList = async () => {
  loading.value = true
  try {
    const data = await DistributorApi.getPlatformSkuPage(queryParams)
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
  // 快捷筛选按商品类型；平台标品 mock 用 categoryCode 近似过滤
  queryParams.categoryCode = value || undefined
  handleQuery()
}

const handleSelectionChange = (rows: DistPlatformSkuVO[]) => {
  const map = new Map(selectedList.value.map((item) => [item.skuId, item]))
  rows.forEach((row) => {
    if (!map.has(row.skuId)) {
      const item: DistributorProductVO = {
        spuId: row.spuId,
        spuName: row.spuName,
        skuId: row.skuId,
        skuName: row.skuName,
        skuCode: row.skuCode,
        categoryCode: row.categoryCode,
        categoryName: row.categoryName,
        productType: row.productType,
        productCategory: row.productCategory,
        suggestPrice: row.marketPrice,
        supplyPrice: row.supplyPrice,
        adjustMode: DistPriceAdjustModeEnum.SUGGEST,
        adjustPercent: 120,
        adjustAmount: 0,
        displayThreshold: 20,
        projectPriceCovered: false,
        projectNames: []
      }
      syncDistPrice(item)
      map.set(row.skuId, item)
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
  tableRef.value?.clearSelection?.()
}

const applyBatch = () => {
  if (!selectedList.value.length) {
    message.warning('请先选择商品')
    return
  }
  if (
    batchConfig.adjustMode === DistPriceAdjustModeEnum.CUSTOM &&
    (batchConfig.adjustPercent || 0) <= 100
  ) {
    message.warning('自定义模式下百分比 ≤ 100 可能出现亏本')
  }
  selectedList.value.forEach((item) => {
    item.adjustMode = batchConfig.adjustMode
    item.displayThreshold = batchConfig.displayThreshold
    if (batchConfig.adjustMode === DistPriceAdjustModeEnum.CUSTOM) {
      item.adjustPercent = batchConfig.adjustPercent
      item.adjustAmount = batchConfig.adjustAmount
    }
    syncDistPrice(item)
  })
  message.success('批量配置已应用')
}

const validateSelected = async () => {
  if (!selectedList.value.length) {
    message.warning('请至少选择一个SKU')
    return false
  }
  for (const item of selectedList.value) {
    if (
      item.displayThreshold == null ||
      item.displayThreshold < 0 ||
      item.displayThreshold > 100 ||
      !Number.isInteger(item.displayThreshold)
    ) {
      message.warning(`SKU「${item.skuName}」利润空间阈值需为 0-100 的整数`)
      return false
    }
    if (item.adjustMode === DistPriceAdjustModeEnum.CUSTOM) {
      if (!item.adjustPercent || item.adjustPercent <= 0) {
        message.warning(`SKU「${item.skuName}」请设置有效百分比`)
        return false
      }
      if (item.adjustPercent <= 100) {
        try {
          await message.confirm(
            `SKU「${item.skuName}」自定义百分比 ≤ 100，可能出现亏本，是否继续？`,
            '亏本风险提示'
          )
        } catch {
          return false
        }
      }
    }
    if (!item.distPrice || item.distPrice <= 0) {
      message.warning(`SKU「${item.skuName}」分销价必须大于 0`)
      return false
    }
  }
  return true
}

const handleSubmit = async () => {
  if (!(await validateSelected())) return
  submitting.value = true
  try {
    await DistributorApi.createProducts(props.distributorId, selectedList.value)
    message.success('添加成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>
