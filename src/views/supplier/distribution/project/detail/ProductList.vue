<template>
  <ContentWrap>
    <div class="mb-12px flex flex-wrap items-center justify-between gap-10px">
      <el-alert class="!mb-0 flex-1" type="info" :closable="false" title="项目专属价说明">
        <div class="leading-22px">
          <div>L1 平台默认定价 → L2 分销商基础价 → L3 项目专属价。结算优先级：L3 &gt; L2 &gt; L1。</div>
          <div>若不配置项目专属价，则按关联分销商的分销价结算。已配置专属价的 SKU 以橙色标记。</div>
        </div>
      </el-alert>
      <el-button type="primary" round @click="openSelectDialog">+新增商品</el-button>
    </div>

    <div v-if="categoryTags.length > 1" class="mb-12px flex flex-wrap items-center gap-10px">
      <button v-for="tag in categoryTags" :key="tag.value || 'all'" type="button" class="filter-pill" :class="{ 'is-active': activeTag === tag.value }" @click="handleTagChange(tag.value)">
        {{ tag.label }}
      </button>
    </div>

    <el-table v-loading="loading" :data="list" row-key="listingCode" border :span-method="spanMethod" :show-overflow-tooltip="true">
      <el-table-column label="商品名称(SPU)" min-width="160">
        <template #default="{ row }">
          <div class="font-600">{{ row.spuName || '-' }}</div>
          <div class="text-12px text-gray-500">{{ row.spuCode || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="SKU规格" min-width="100">
        <template #default="{ row }">{{ row.skuName || '-' }}</template>
      </el-table-column>
      <el-table-column label="类型/分类" min-width="160">
        <template #default="{ row }">{{ getProductTypeLabel(row) }}</template>
      </el-table-column>
      <el-table-column label="市场价（元）" min-width="110" align="right">
        <template #default="{ row }">
          {{ formatCentsYuan(getMarketPriceCents(row)) }}
        </template>
      </el-table-column>
      <el-table-column label="基础分销价(元)" min-width="130" align="right">
        <template #default="{ row }">
          <span :class="{ 'font-600 text-[var(--el-color-success)]': isBasePriceActive(row) }">
            {{ formatCentsYuan(row.distPriceCents) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="项目专属价规则" min-width="220">
        <template #default="{ row }">
          {{ formatProjectPriceRule(row) }}
        </template>
      </el-table-column>
      <el-table-column label="是否含税" min-width="90">
        <template #default="{ row }">{{ getTaxIncludedLabel(row) }}</template>
      </el-table-column>
      <el-table-column label="项目专属价（元）" min-width="130" align="right">
        <template #default="{ row }">
          <span :class="{ 'font-600 text-[var(--el-color-warning)]': hasProjectPrice(row) }">
            {{ formatProjectPrice(row.projectPriceCents, row) }}
          </span>
        </template>
      </el-table-column>
      <!-- <el-table-column label="不含税项目价（元）" min-width="140" align="right">
        <template #default="{ row }">
          {{ formatProjectPrice(getExclusiveProjectPriceCents(row), row) }}
        </template>
      </el-table-column> -->
      <el-table-column label="税率" min-width="90">
        <template #default="{ row }">{{ getTaxRateLabel(row) }}</template>
      </el-table-column>
      <!-- <el-table-column label="税额(元)" min-width="100" align="right">
        <template #default="{ row }">{{ getTaxAmountLabel(row) }}</template>
      </el-table-column> -->
      <el-table-column label="最终结算价（元）" min-width="130" align="right">
        <template #default="{ row }">
          <span class="font-700" :class="{ 'text-[var(--el-color-warning)]': hasProjectPrice(row) }">
            {{ formatCentsYuan(row.finalPriceCents) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center" fixed="right" :show-overflow-tooltip="false">
        <template #default="{ row }">
          <el-button link type="primary" @click="openAdjust(row)">配置专属价</el-button>
          <el-button link type="danger" @click="handleDelete(row)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />

    <ProductSelectDialog
      ref="selectDialogRef"
      :project-code="projectCode"
      :buyer-code="buyerCode"
      :product-type-items="productTypeItems"
      @success="handleProductChange"
    />

    <Dialog v-model="adjustVisible" title="配置项目专属价" width="980px" :scroll="true" max-height="70vh">
      <div class="mb-12px text-14px">
        <span class="text-gray-500">商品：</span>
        {{ adjustRow?.skuName || '-' }}
      </div>
      <div class="mb-12px text-13px text-gray-500">
        分销价会覆盖分销商配置。利润隐藏、税务未填写时继续继承。
      </div>
      <ProjectPricingForm ref="adjustFormRef" v-model="adjustPrice" />
      <template #footer>
        <el-button @click="adjustVisible = false">取 消</el-button>
        <el-button type="primary" :loading="adjustSaving" @click="submitAdjust">确 定</el-button>
      </template>
    </Dialog>
  </ContentWrap>
</template>

<script lang="ts" setup>
  import {
    ProjectApi,
    ProjectListingListItem,
    type ProjectFormulaRuleView
  } from '@/api/supplier/distribution'
  import { DICT_TYPE, getDictLabel } from '@/utils/dict'
  import { formatCentsYuan } from '@/views/supplier/utils/constants'
  import ProductSelectDialog from './ProductSelectDialog.vue'
  import ProjectPricingForm from './ProjectPricingForm.vue'
  import {
    buildProjectProductPricing,
    createEmptyProjectPricing,
    createProjectPricingFromConfig,
    isProjectPricingConfigured,
    type ProjectPricingFormData
  } from './projectPricing'

  type ProjectProductTableRow = ProjectListingListItem & { _rowspan?: number }

  defineOptions({ name: 'ProjectProductList' })

  const props = defineProps<{
    projectCode: string
    buyerCode?: string
    productTypeItems?: Array<{ id: string; name: string }>
  }>()

  const emit = defineEmits<{
    success: []
  }>()

  const message = useMessage()
  const loading = ref(false)
  const list = ref<ProjectProductTableRow[]>([])
  const total = ref(0)
  const selectDialogRef = ref<InstanceType<typeof ProductSelectDialog>>()
  const adjustVisible = ref(false)
  const adjustSaving = ref(false)
  const adjustFormRef = ref<InstanceType<typeof ProjectPricingForm>>()
  const adjustRow = ref<ProjectListingListItem>()
  const adjustPrice = ref<ProjectPricingFormData>(createEmptyProjectPricing())

  const queryParams = reactive({
    pageNo: 1,
    pageSize: 20
  })

  const activeTag = ref('')

  const categoryTags = computed(() => [
    { value: '', label: '全部商品' },
    ...(props.productTypeItems || []).map((item) => ({
      value: item.id,
      label: item.name || item.id
    }))
  ])

  const queryProductTypes = computed(() => (activeTag.value ? [activeTag.value] : undefined))

  const PRICE_BASE_LABEL: Record<string, string> = {
    MARKET_PRICE: '市场价',
    SUGGESTED_SALE_PRICE: '销售建议价',
    SUPPLY_PRICE: '供应价'
  }

  const OPERATOR_SYMBOL: Record<string, string> = {
    ADD: '+',
    SUBTRACT: '-',
    MULTIPLY: '*',
    DIVIDE: '/'
  }

  const hasProjectPrice = (row: ProjectListingListItem) =>
    row.projectPriceCovered === true || row.projectPriceCents != null

  const isBasePriceActive = (row: ProjectListingListItem) =>
    !hasProjectPrice(row) && row.distPriceCents != null

  const getProductTypeLabel = (row: ProjectListingListItem) => {
    const typeName =
      row.productTypeName ||
      props.productTypeItems?.find((item) => item.id === row.productType)?.name ||
      row.productType
    const categoryName =
      row.productClassificationName || row.categoryName || row.productClassification
    return [typeName, categoryName].filter(Boolean).join('/') || '-'
  }

  const getMarketPriceCents = (row: ProjectListingListItem) => row.marketPriceCents ?? row.marketPrice

  const getTaxIncluded = (row: ProjectListingListItem) => {
    if (!hasProjectPrice(row)) return undefined
    if (row.taxIncluded != null) return row.taxIncluded
    return row.projectPricingConfig?.taxMetadata?.taxIncluded
  }

  const getTaxAmountCents = (row: ProjectListingListItem) => row.taxAmountCents ?? row.taxAmount

  const getExclusiveProjectPriceCents = (row: ProjectListingListItem) => {
    if (!hasProjectPrice(row)) return undefined
    const exclusive = row.projectPriceExclusiveCents ?? row.projectPriceExclusive
    if (exclusive != null) return exclusive
    const taxIncluded = getTaxIncluded(row)
    if (taxIncluded === false) return row.projectPriceCents
    const taxAmount = getTaxAmountCents(row)
    if (row.projectPriceCents != null && taxAmount != null) return row.projectPriceCents - taxAmount
    if (taxIncluded === true && (row.taxRate === 0 || row.taxRateDisplay === '不征税')) {
      return row.projectPriceCents
    }
    return undefined
  }

  const formatProjectPrice = (cents: number | undefined, row: ProjectListingListItem) => {
    if (!hasProjectPrice(row)) return '—'
    return formatCentsYuan(cents)
  }

  const getTaxIncludedLabel = (row: ProjectListingListItem) => {
    const taxIncluded = getTaxIncluded(row)
    if (taxIncluded === true) return '含税'
    if (taxIncluded === false) return '不含税'
    return '—'
  }

  const getTaxRateLabel = (row: ProjectListingListItem) => {
    if (getTaxIncluded(row) !== true) return '—'
    if (row.taxRateDisplay) return row.taxRateDisplay
    const rateLabel = row.projectPricingConfig?.taxMetadata?.taxRateLabel
    if (rateLabel) return rateLabel
    if (row.taxRateCode) {
      return getDictLabel(DICT_TYPE.SUPPLY_CHAIN_TAX_RATE, row.taxRateCode) || row.taxRateCode
    }
    const rateCode = row.projectPricingConfig?.taxMetadata?.taxRateCode
    if (rateCode) return getDictLabel(DICT_TYPE.SUPPLY_CHAIN_TAX_RATE, rateCode) || rateCode
    if (row.taxRate === 0) return '不征税'
    if (row.taxRate != null) return `${row.taxRate}%`
    return '—'
  }

  const getTaxAmountLabel = (row: ProjectListingListItem) => {
    if (getTaxIncluded(row) !== true) return '—'
    return formatCentsYuan(getTaxAmountCents(row))
  }

  const formatProjectPriceRule = (row: ProjectListingListItem) => {
    const rule = row.projectPricingConfig?.distributionRule
    if (rule?.mode) return formatDistributionRule(rule)
    return row.pricingRule || '-'
  }

  const formatDistributionRule = (rule: ProjectFormulaRuleView) => {
    if (rule.mode === 'DIRECT_MARKET_PRICE') return '分销价=市场价'
    const base = PRICE_BASE_LABEL[rule.base || ''] || '销售建议价'
    const percentage = rule.percentage
    const operand = rule.operand
    const symbol = OPERATOR_SYMBOL[rule.operator || ''] || '+'
    const isPlainBase =
      (percentage == null || Number(percentage) === 100) &&
      (operand == null || Number(operand) === 0) &&
      (symbol === '+' || !rule.operator)
    if (isPlainBase) return `分销价=${base}`
    const percentText = percentage == null ? '' : `*${percentage}%`
    const operandText =
      operand == null
        ? ''
        : symbol === '*' || symbol === '/'
        ? `${symbol}${operand}`
        : `${symbol}${operand}元`
    return `分销价=${base}${percentText}${operandText}`
  }

  const attachSpuRowspan = (items: ProjectListingListItem[] = []): ProjectProductTableRow[] => {
    const rows: ProjectProductTableRow[] = items.map((item) => ({ ...item, _rowspan: 0 }))
    let index = 0
    while (index < rows.length) {
      const spuCode = rows[index].spuCode
      let count = 1
      if (spuCode) {
        while (index + count < rows.length && rows[index + count].spuCode === spuCode) {
          count++
        }
      }
      rows[index]._rowspan = count
      index += count
    }
    return rows
  }

  const spanMethod = ({ row, columnIndex }: { row: ProjectProductTableRow; columnIndex: number }) => {
    if (columnIndex !== 0 || row._rowspan == null) return
    return row._rowspan ? { rowspan: row._rowspan, colspan: 1 } : { rowspan: 0, colspan: 0 }
  }

  const getList = async () => {
    if (!props.projectCode) return
    loading.value = true
    try {
      const data = await ProjectApi.getProductPage(props.projectCode, {
        pageNo: queryParams.pageNo,
        pageSize: queryParams.pageSize,
        productType: queryProductTypes.value
      })
      list.value = attachSpuRowspan(data?.list || [])
      total.value = data?.total || 0
    } catch {
      list.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  const handleTagChange = (value: string) => {
    if (activeTag.value === value) return
    activeTag.value = value
    queryParams.pageNo = 1
    getList()
  }

  const openSelectDialog = () => {
    if (!props.buyerCode) {
      message.warning('当前项目未关联分销商，无法新增商品')
      return
    }
    selectDialogRef.value?.open()
  }

  const handleProductChange = async () => {
    await getList()
    emit('success')
  }

  const openAdjust = (row: ProjectListingListItem) => {
    if (!row.listingCode) {
      message.error('缺少项目商品编号，无法改价')
      return
    }
    adjustRow.value = row
    adjustPrice.value = createProjectPricingFromConfig(row.projectPricingConfig)
    adjustVisible.value = true
    nextTick(() => adjustFormRef.value?.clearValidate())
  }

  const submitAdjust = async () => {
    const listingCode = adjustRow.value?.listingCode
    if (!props.projectCode || !listingCode) {
      message.error('缺少项目商品编号，无法改价')
      return
    }
    const configured = isProjectPricingConfigured(adjustPrice.value)
    if (configured) {
      await adjustFormRef.value?.validate()
    }
    const payload = buildProjectProductPricing(listingCode, adjustPrice.value)
    adjustSaving.value = true
    try {
      await ProjectApi.saveProductPricing(props.projectCode, payload)
      message.success(configured ? '项目专属价已保存' : '未配置项目专属价，将按分销商分销价结算')
      adjustVisible.value = false
      await handleProductChange()
    } finally {
      adjustSaving.value = false
    }
  }

  const handleDelete = async (row: ProjectListingListItem) => {
    if (!props.projectCode || !row.listingCode) {
      message.error('缺少项目商品编号，无法移除')
      return
    }
    try {
      await message.delConfirm('确认移除该项目商品吗？历史冻结版本会保留。')
      await ProjectApi.deleteProduct(props.projectCode, row.listingCode)
      message.success('移除成功')
      await handleProductChange()
    } catch {}
  }

  watch(
    () => props.projectCode,
    () => {
      activeTag.value = ''
      queryParams.pageNo = 1
      getList()
    },
    { immediate: true }
  )
</script>

<style scoped>
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
