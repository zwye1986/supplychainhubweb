<template>
  <ContentWrap>
    <div class="mb-12px flex flex-wrap items-center justify-between gap-10px">
      <div class="flex flex-wrap items-center gap-10px">
        <button v-for="tag in categoryTags" :key="tag.value" type="button" class="filter-pill" :class="{ 'is-active': activeTag === tag.value }" @click="handleTagChange(tag.value)">
          {{ tag.label }}
        </button>
      </div>
      <el-button type="primary" round @click="openSelectDialog">+新增商品</el-button>
    </div>

    <el-table v-loading="loading" :data="list" row-key="buyerProductCode" border :span-method="spanMethod" :show-overflow-tooltip="true">
      <el-table-column label="商品名称(SPU)" min-width="180">
        <template #default="{ row }">
          <div class="font-600">{{ row.spuName || '-' }}</div>
          <div class="text-12px text-gray-500">{{ row.spuCode || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="SKU规格" min-width="100">
        <template #default="{ row }">{{ row.skuName || '-' }}</template>
      </el-table-column>
      <el-table-column label="类型/分类" min-width="160">
        <template #default="{ row }">
          {{ getProductTypeLabel(row) }}
        </template>
      </el-table-column>
      <el-table-column label="市场价（元）" min-width="110" align="right">
        <template #default="{ row }">
          {{ formatCentsYuan(getMarketPriceCents(row)) }}
        </template>
      </el-table-column>
      <el-table-column label="分销价规则" min-width="180">
        <template #default="{ row }">
          {{ row.pricingRule || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="是否含税" min-width="90">
        <template #default="{ row }">
          {{ getTaxIncludedLabel(row) }}
        </template>
      </el-table-column>
      <el-table-column label="分销价(元)" min-width="110" align="right">
        <template #default="{ row }">
          {{ formatCentsYuan(row.distPriceCents) }}
        </template>
      </el-table-column>
      <el-table-column label="税率" min-width="90">
        <template #default="{ row }">
          {{ getTaxRateLabel(row) }}
        </template>
      </el-table-column>
      <el-table-column label="税额(元)" min-width="100" align="right">
        <template #default="{ row }">
          {{ getTaxAmountLabel(row) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openAdjust(row)">改价</el-button>
          <el-button link type="danger" @click="handleDelete(row)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />

    <ProductSelectDialog ref="selectDialogRef" :buyer-code="buyerCode" :product-type-items="productTypeItems" @success="getList" />

    <Dialog v-model="adjustVisible" title="改价" width="720px">
      <div class="mb-12px text-14px">
        <span class="text-gray-500">商品：</span>
        {{ [adjustRow?.spuName, adjustRow?.skuName].filter(Boolean).join(' / ') || '-' }}
      </div>
      <div v-if="adjustRow?.pricingRule" class="mb-12px text-13px text-gray-500">
        当前规则：{{ adjustRow.pricingRule }}
      </div>
      <DistributionPriceForm ref="adjustFormRef" v-model="adjustPrice" :sale-price-tip="adjustSalePriceTip" />
      <template #footer>
        <el-button @click="adjustVisible = false">取 消</el-button>
        <el-button type="primary" :loading="adjustSaving" @click="submitAdjust">确 定</el-button>
      </template>
    </Dialog>
  </ContentWrap>
</template>

<script lang="ts" setup>
  import {
    BuyerProductListItem,
    DistributorApi,
    type BuyerProductBatchPricingReqVO,
    type DistFormulaRuleReqVO
  } from '@/api/supplier/distribution'
  import { DICT_TYPE, getDictLabel } from '@/utils/dict'
  import { formatCentsYuan } from '@/views/supplier/utils/constants'
  import DistributionPriceForm, { type DistPriceFormData } from './DistributionPriceForm.vue'
  import ProductSelectDialog from './ProductSelectDialog.vue'

  type BuyerProductTableRow = BuyerProductListItem & { _rowspan?: number }

  defineOptions({ name: 'DistributorProductList' })

  const props = defineProps<{
    buyerCode: string
    productTypeItems?: Array<{ id: string; name: string }>
  }>()

  const message = useMessage()
  const loading = ref(false)
  const list = ref<BuyerProductTableRow[]>([])
  const total = ref(0)
  const activeTag = ref('')
  const selectDialogRef = ref<InstanceType<typeof ProductSelectDialog>>()
  const adjustVisible = ref(false)
  const adjustSaving = ref(false)
  const adjustFormRef = ref<InstanceType<typeof DistributionPriceForm>>()
  const adjustRow = ref<BuyerProductListItem>()
  const DEFAULT_SALE_PRICE_TIP = '销售建议价=市场价*0.5%+0元'

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

  const adjustPrice = ref<DistPriceFormData>(createPriceConfig())

  const adjustSalePriceTip = computed(() => {
    const cents = adjustRow.value?.suggestPriceCents
    if (cents == null) return DEFAULT_SALE_PRICE_TIP
    const price = formatCentsYuan(cents)
    return price === '-' ? DEFAULT_SALE_PRICE_TIP : `销售建议价=${price}元`
  })

  const queryParams = reactive({
    pageNo: 1,
    pageSize: 20
  })

  const productTypeCodes = computed(() => [
    ...new Set(
      (props.productTypeItems || []).map((item) => String(item.id || '').trim()).filter(Boolean)
    )
  ])

  const categoryTags = computed(() => [
    { value: '', label: '全部商品' },
    ...(props.productTypeItems || []).map((item) => ({
      value: item.id,
      label: item.name || item.id
    }))
  ])

  const queryProductTypes = computed(() =>
    activeTag.value ? [activeTag.value] : productTypeCodes.value
  )

  const getProductTypeLabel = (row: BuyerProductListItem) => {
    const typeName =
      props.productTypeItems?.find((item) => item.id === row.productType)?.name || row.productType
    return [typeName, row.productClassification].filter(Boolean).join(' / ') || '-'
  }

  const getMarketPriceCents = (row: BuyerProductListItem) => row.marketPriceCents ?? row.marketPrice

  const getTaxAmountCents = (row: BuyerProductListItem) => row.taxAmountCents ?? row.taxAmount

  const getExclusiveDistPriceCents = (row: BuyerProductListItem) => {
    const exclusive = row.distPriceExclusiveCents ?? row.distPriceExclusive
    if (exclusive != null) return exclusive
    if (row.taxIncluded === false) return row.distPriceCents
    const taxAmount = getTaxAmountCents(row)
    if (row.distPriceCents != null && taxAmount != null) return row.distPriceCents - taxAmount
    return undefined
  }

  const getTaxIncludedLabel = (row: BuyerProductListItem) => {
    if (row.taxIncluded === true) return '含税'
    if (row.taxIncluded === false) return '不含税'
    return '-'
  }

  const getTaxRateLabel = (row: BuyerProductListItem) => {
    if (row.taxIncluded === false) return '—'
    if (row.taxRateDisplay) return row.taxRateDisplay
    if (row.taxRateCode) {
      return getDictLabel(DICT_TYPE.SUPPLY_CHAIN_TAX_RATE, row.taxRateCode) || row.taxRateCode
    }
    if (row.taxRate === 0) return '不征税'
    if (row.taxRate != null) return `${row.taxRate}%`
    return '—'
  }

  const getTaxAmountLabel = (row: BuyerProductListItem) => {
    if (row.taxIncluded === false) return '—'
    return formatCentsYuan(getTaxAmountCents(row))
  }

  const attachSpuRowspan = (items: BuyerProductListItem[] = []): BuyerProductTableRow[] => {
    const rows: BuyerProductTableRow[] = items.map((item) => ({ ...item, _rowspan: 0 }))
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

  const spanMethod = ({ row, columnIndex }: { row: BuyerProductTableRow; columnIndex: number }) => {
    if (columnIndex !== 0 || row._rowspan == null) return
    return row._rowspan ? { rowspan: row._rowspan, colspan: 1 } : { rowspan: 0, colspan: 0 }
  }

  const inferPriceFromRow = (row: BuyerProductListItem): DistPriceFormData => {
    const price = createPriceConfig()
    if (row.displayThresholdPercent != null) {
      price.distributionHideThresholdPercent = row.displayThresholdPercent
    }
    if (row.taxIncluded != null) {
      price.taxIncluded = row.taxIncluded
    }
    price.taxRateCode = row.taxIncluded === false ? '' : row.taxRateCode || ''
    const text = row.pricingRule || ''
    if (text.includes('市场价') && (text.includes('=') || text.includes('等于'))) {
      price.distributionRule.mode = 'DIRECT_MARKET_PRICE'
      return price
    }
    const percentMatch = text.match(/×\s*([\d.]+)\s*%/)
    if (percentMatch) {
      price.distributionRule.mode = 'CUSTOM'
      price.distributionRule.base = text.includes('供应')
        ? 'SUPPLY_PRICE'
        : text.includes('市场')
        ? 'MARKET_PRICE'
        : 'SUGGESTED_SALE_PRICE'
      price.distributionRule.percentage = Number(percentMatch[1])
      const amountMatch = text.match(/([+-])\s*([\d.]+)/)
      if (amountMatch) {
        price.distributionRule.operator = amountMatch[1] === '-' ? 'SUBTRACT' : 'ADD'
        price.distributionRule.operand = Number(amountMatch[2])
      } else {
        price.distributionRule.operator = 'ADD'
        price.distributionRule.operand = 0
      }
      return price
    }
    if (text.includes('等于L1') || text.includes('等于 L1') || text.includes('销售建议价')) {
      price.distributionRule.mode = 'CUSTOM'
      price.distributionRule.base = 'SUGGESTED_SALE_PRICE'
      price.distributionRule.percentage = 100
      price.distributionRule.operator = 'ADD'
      price.distributionRule.operand = 0
    }
    return price
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

  const buildPricingPayload = (
    buyerProductCode: string,
    price: DistPriceFormData
  ): BuyerProductBatchPricingReqVO => {
    const hidePercent = toOptionalNumber(price.distributionHideThresholdPercent)
    const payload: BuyerProductBatchPricingReqVO = {
      buyerProductCodes: [buyerProductCode],
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
    if (price.taxIncluded) {
      payload.taxRateCode = price.taxRateCode
    }
    return payload
  }

  const getList = async () => {
    if (!props.buyerCode) return
    loading.value = true
    try {
      const data = await DistributorApi.getBuyerProductPage(props.buyerCode, {
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
    activeTag.value = value
    queryParams.pageNo = 1
    getList()
  }

  const openSelectDialog = () => {
    selectDialogRef.value?.open()
  }

  const openAdjust = (row: BuyerProductListItem) => {
    if (!row.buyerProductCode) {
      message.error('缺少分销商品编号，无法改价')
      return
    }
    adjustRow.value = row
    adjustPrice.value = inferPriceFromRow(row)
    adjustVisible.value = true
    nextTick(() => adjustFormRef.value?.clearValidate())
  }

  const submitAdjust = async () => {
    const buyerProductCode = adjustRow.value?.buyerProductCode
    if (!props.buyerCode || !buyerProductCode) {
      message.error('缺少分销商品编号，无法改价')
      return
    }
    await adjustFormRef.value?.validate()
    adjustSaving.value = true
    try {
      await DistributorApi.saveBuyerProductPricing(
        props.buyerCode,
        buildPricingPayload(buyerProductCode, adjustPrice.value)
      )
      message.success('改价成功')
      adjustVisible.value = false
      await getList()
    } finally {
      adjustSaving.value = false
    }
  }

  const handleDelete = async (row: BuyerProductListItem) => {
    if (!props.buyerCode || !row.buyerProductCode) {
      message.error('缺少分销商品编号，无法移除')
      return
    }
    try {
      await message.delConfirm('确认移除该分销商品吗？已发布项目中的 listing 不会被删除。')
      await DistributorApi.deleteBuyerProduct(props.buyerCode, row.buyerProductCode)
      message.success('移除成功')
      await getList()
    } catch {}
  }

  watch(
    () => [props.buyerCode, productTypeCodes.value.join(',')] as const,
    () => {
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
