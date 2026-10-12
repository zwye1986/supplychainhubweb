<template>
  <ContentWrap>
    <div class="mb-12px flex flex-wrap items-center justify-between gap-10px">
      <div class="flex flex-wrap items-center gap-10px">
        <button
          v-for="tag in categoryTags"
          :key="tag.value"
          type="button"
          class="filter-pill"
          :class="{ 'is-active': activeTag === tag.value }"
          @click="handleTagChange(tag.value)"
        >
          {{ tag.label }}
        </button>
      </div>
      <div class="flex items-center gap-10px">
        <el-button :disabled="!selectedRows.length" @click="openBatchScore">批量修改评分</el-button>
        <el-button type="primary" round @click="openSelectDialog">+新增商品</el-button>
      </div>
    </div>

    <el-alert class="mb-12px" type="info" :closable="false" title="供应价模式说明">
      <div class="leading-22px">
        <div>固定值：直接定价，供应价为固定金额。</div>
        <div>实时更新：API实时获取价格（如点餐/电影票场景）。</div>
        <div>按供货折扣：销售建议价 × 折扣率。</div>
      </div>
    </el-alert>

    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="list"
      :row-key="getRowKey"
      :stripe="true"
      :show-overflow-tooltip="true"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="48" :reserve-selection="true" />
      <el-table-column label="商品名称" prop="platformSpuName" min-width="140" />
      <el-table-column label="SKU规格" prop="platformSkuName" min-width="110" />
      <el-table-column label="SKU编号" prop="platformSkuCode" min-width="120" />
      <el-table-column label="供应商商品编码" prop="externalSkuCode" min-width="140">
        <template #default="{ row }">
          <span v-if="row.externalSkuCode">{{ row.externalSkuCode }}</span>
          <span v-else class="text-gray-400">-</span>
        </template>
      </el-table-column>
      <el-table-column label="类型/分类" min-width="180">
        <template #default="{ row }">
          <el-tag v-if="row.productType || row.productClassification" size="small" type="info">
            <ProductType
              v-if="row.productType"
              :model-value="row.productType"
              :multiple="false"
              text
            />
            <template v-if="row.productType && row.productClassification"> / </template>
            <ProductCategory
              v-if="row.productClassification"
              :model-value="row.productClassification"
              text
            />
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="销售建议价（元）" min-width="150" align="right">
        <template #default="{ row }">
          {{ formatCentsYuan(row.suggestedSalePriceCents) }}
        </template>
      </el-table-column>
      <el-table-column label="供应价模式" min-width="110">
        <template #default="{ row }">
          <el-tag size="small">
            {{ getDictLabel('supply_chain_offer_price_mode', row.priceMode) || '-' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="供应价（元）" min-width="110" align="right">
        <template #header>
          <span class="inline-flex items-center gap-4px">
            供应价（元）
            <el-tooltip content="按当前商业条款展示；已发布履约版本按冻结价执行" placement="top">
              <Icon icon="ep:question-filled" />
            </el-tooltip>
          </span>
        </template>
        <template #default="{ row }">
          {{ formatSupplyPrice(row) }}
        </template>
      </el-table-column>
      <el-table-column label="供货模式" min-width="180">
        <template #default="{ row }">
          <el-tag v-if="row.offerSupplyMode" size="small" type="success">
            {{ getDictLabel('supply_chain_supply_mode', row.offerSupplyMode) || row.offerSupplyMode }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="供货上限" prop="maxQuantity" min-width="100" align="right" />
      <el-table-column label="最低起购量" prop="minQuantity" min-width="100" align="right" />
      <el-table-column label="稳定性评分" min-width="130" align="center">
        <template #default="{ row }">
          <el-input-number
            :controls="false"
            v-model="row.stabilityScore"
            :disabled="scoreSavingKey === getScoreKey(row, 'stabilityScore')"
            placeholder="0-100"
            class="!w-100px"
            @click.stop
            @change="
              (val: number | undefined, oldVal: number | undefined) =>
                handleScoreChange(row, 'stabilityScore', val, oldVal)
            "
          />
        </template>
      </el-table-column>
      <el-table-column label="时效性评分" min-width="130" align="center">
        <template #default="{ row }">
          <el-input-number
            :controls="false"
            v-model="row.timelinessScore"
            :disabled="scoreSavingKey === getScoreKey(row, 'timelinessScore')"
            placeholder="0-100"
            class="!w-100px"
            @click.stop
            @change="
              (val: number | undefined, oldVal: number | undefined) =>
                handleScoreChange(row, 'timelinessScore', val, oldVal)
            "
          />
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="90" align="center">
        <template #default="{ row }">
          <dict-tag v-if="row.status" type="supply_chain_offer_status" :value="row.status" />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="商品履约配置" min-width="130" align="center">
        <template #default="{ row }">
          <el-tag :type="getFulfillmentStatusType(row.fulfillmentStatus)" size="small">
            {{ getFulfillmentStatusLabel(row.fulfillmentStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">改价</el-button>
          <el-button
            v-if="row.status === 'PUBLISHED'"
            link
            type="warning"
            @click="handleTakeOffShelf(row)"
            >下架</el-button
          >
          <el-tooltip
            v-if="getOnShelfActionLabel(row.status)"
            :disabled="row.canPublish !== false"
            :content="row.publishBlockedReason || '当前不满足发布条件'"
          >
            <span>
              <el-button
                link
                type="success"
                :disabled="row.canPublish === false"
                @click="handleListOnShelf(row)"
                >{{ row.status === 'PUBLISHED' ? '发布变更' : '上架' }}</el-button
              >
            </span>
          </el-tooltip>
          <el-button link type="danger" @click="handleDelete(row.offerNo)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />

    <ProductSelectDialog ref="selectDialogRef" :supplier-code="supplierCode" @success="getList" />

    <Dialog v-model="priceVisible" title="改价" width="560px">
      <el-alert class="mb-12px" type="info" :closable="false">
        仅保存待发布变更；已有生效版本继续用于定价和履约，发布变更后新价格生效。
      </el-alert>
      <el-form label-width="120px">
        <el-form-item label="商品名称">{{ priceRow?.platformSpuName || '-' }}</el-form-item>
        <el-form-item label="SKU规格">{{ priceRow?.platformSkuName || '-' }}</el-form-item>
        <el-form-item label="SKU编号">{{ priceForm.platformSkuCode || '-' }}</el-form-item>
        <el-form-item label="供应商商品编码" required>
          <el-input
            v-model="priceForm.externalSkuCode"
            maxlength="128"
            placeholder="供应商侧商品编号/ID，下单时据此定位履约商品"
            clearable
          />
        </el-form-item>
        <el-form-item label="销售建议价">{{
          formatCentsYuan(priceForm.suggestedPriceCents)
        }}</el-form-item>
        <el-form-item label="供应价模式" required>
          <el-select v-model="priceForm.priceMode" class="!w-full">
            <el-option
              v-for="item in priceModeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="priceForm.priceMode === 'FIXED'"
          label="供应价（元）"
          required
        >
          <el-input-number
            v-model="priceForm.unitPriceYuan"
            :controls="false"
            :min="0"
            :precision="2"
            placeholder="请输入供应价"
            class="!w-full"
          />
        </el-form-item>
        <el-form-item
          v-else-if="priceForm.priceMode === 'DISCOUNT'"
          label="供货折扣(%)"
          required
        >
          <el-input-number
            v-model="priceForm.discountPercent"
            :controls="false"
            :min="0.01"
            :max="100"
            :precision="2"
            placeholder="请输入折扣"
            class="!w-full"
          />
        </el-form-item>
        <el-form-item v-else label="供应价">
          <el-input model-value="API实时获取" disabled />
        </el-form-item>
        <el-form-item label="供货模式" required>
          <el-select v-model="priceForm.supplyMode" class="!w-full" placeholder="请选择供货模式">
            <el-option
              v-for="item in supplyModeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="供货上限">
          <el-input-number
            v-model="priceForm.maxQuantity"
            :controls="false"
            :min="1"
            :precision="0"
            placeholder="空则继承供货配置"
            class="!w-full"
          />
        </el-form-item>
        <el-form-item label="最低起购量">
          <el-input-number
            v-model="priceForm.minQuantity"
            :controls="false"
            :min="1"
            :precision="0"
            placeholder="空则取 1"
            class="!w-full"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="priceVisible = false">取 消</el-button>
        <el-button type="primary" :loading="priceSubmitting" @click="submitPrice">确 定</el-button>
      </template>
    </Dialog>

    <Dialog v-model="batchScoreVisible" title="批量修改评分" width="480px">
      <el-alert class="mb-12px" type="info" :closable="false">
        将覆盖已选 {{ selectedRows.length }} 个 SKU 的履约评分。未填写的项不会修改。
      </el-alert>
      <el-form
        ref="batchScoreFormRef"
        :model="batchScoreForm"
        :rules="batchScoreRules"
        label-width="120px"
      >
        <el-form-item label="稳定性评分" prop="stabilityScore">
          <el-input-number
            v-model="batchScoreForm.stabilityScore"
            :controls="false"
            placeholder="0-100，允许小数"
            class="!w-full"
          />
        </el-form-item>
        <el-form-item label="时效性评分" prop="timelinessScore">
          <el-input-number
            v-model="batchScoreForm.timelinessScore"
            :controls="false"
            placeholder="0-100，允许小数"
            class="!w-full"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchScoreVisible = false">取 消</el-button>
        <el-button type="primary" :loading="batchScoreSubmitting" @click="submitBatchScore"
          >确 定</el-button
        >
      </template>
    </Dialog>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { SupplierApi, DraftReqVO, OfferListItem, SupplyScopeView } from '@/api/supplier/manage'
import { ProductTypeApi } from '@/api/product'
import {
  bpToPercent,
  centsToYuan,
  formatCentsYuan,
  percentToBp,
  yuanToCents
} from '@/views/supplier/utils/constants'
import { getDictLabel, getStrDictOptions } from '@/utils/dict'
import type { FormInstance, FormRules } from 'element-plus'
import ProductSelectDialog from './ProductSelectDialog.vue'
import {
  getFulfillmentStatusLabel,
  getFulfillmentStatusType,
  getOnShelfActionLabel,
  validateExternalSkuCode
} from './utils/fulfillment'

defineOptions({ name: 'SupplierProductList' })

const props = defineProps<{
  supplierCode: string
}>()

const message = useMessage()
const loading = ref(false)
const list = ref<OfferListItem[]>([])
const total = ref(0)
const activeTag = ref('')
const selectDialogRef = ref<InstanceType<typeof ProductSelectDialog>>()
const tableRef = ref()
const selectedRows = ref<OfferListItem[]>([])
const scoreSavingKey = ref('')
const batchScoreVisible = ref(false)
const batchScoreSubmitting = ref(false)
const batchScoreFormRef = ref<FormInstance>()
const priceVisible = ref(false)
const priceSubmitting = ref(false)
const priceRow = ref<OfferListItem>()

const queryParams = reactive({
  pageNo: 1,
  pageSize: 20
})

const priceModeOptions = computed(() => getStrDictOptions('supply_chain_offer_price_mode'))
const supplyModeOptions = computed(() => getStrDictOptions('supply_chain_supply_mode'))

const batchScoreForm = reactive({
  stabilityScore: undefined as number | undefined,
  timelinessScore: undefined as number | undefined
})

/** 履约评分：允许小数，必须在 0-100 之间 */
const SCORE_RANGE_MESSAGE = '评分必须在0-100分之间'

const parseScore = (value?: number | string | null) => {
  if (value == null || value === '') return undefined
  const num = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isFinite(num) || num < 0 || num > 100) return undefined
  return num
}

const validateScoreField = (
  _rule: unknown,
  value: number | undefined,
  callback: (error?: Error) => void
) => {
  if (value == null) {
    callback()
    return
  }
  if (parseScore(value) == null) {
    callback(new Error(SCORE_RANGE_MESSAGE))
    return
  }
  callback()
}

const batchScoreRules: FormRules = {
  stabilityScore: [{ validator: validateScoreField, trigger: ['blur', 'change'] }],
  timelinessScore: [{ validator: validateScoreField, trigger: ['blur', 'change'] }]
}

const priceForm = reactive({
  offerNo: '',
  platformSkuCode: '',
  externalSkuCode: '',
  priceMode: 'FIXED',
  unitPriceYuan: undefined as number | undefined,
  discountPercent: undefined as number | undefined,
  suggestedPriceCents: undefined as number | null | undefined,
  supplyMode: '',
  maxQuantity: undefined as number | undefined,
  minQuantity: undefined as number | undefined
})

/** 顶部筛选：来自供货配置的商品类型 */
const categoryTags = ref<{ value: string; label: string }[]>([])

const toScopeCode = (value?: string | number | null) => {
  if (value == null || value === '') return ''
  return String(value)
}

const lastSavedScores = new Map<string, { stabilityScore?: number; timelinessScore?: number }>()

const getRowKey = (row: OfferListItem) => row.offerNo || row.platformSkuCode || ''

const getScoreKey = (row: OfferListItem, field: 'stabilityScore' | 'timelinessScore') => {
  return `${getRowKey(row)}-${field}`
}

const rememberRowScore = (row: OfferListItem) => {
  const key = getRowKey(row)
  if (!key) return
  lastSavedScores.set(key, {
    stabilityScore: row.stabilityScore,
    timelinessScore: row.timelinessScore
  })
}

const toDraftNumber = (value?: number | null) => {
  if (value == null) return undefined
  const num = Number(value)
  return Number.isFinite(num) ? num : undefined
}

const loadCategoryTags = async () => {
  if (!props.supplierCode) {
    categoryTags.value = []
    activeTag.value = ''
    return
  }
  try {
    const [data, typeList] = await Promise.all([
      SupplierApi.getSupplyScopes(props.supplierCode),
      ProductTypeApi.getTypeList()
    ])
    const typeNameMap = new Map(
      (typeList || [])
        .filter((item) => item.typeCode)
        .map((item) => [item.typeCode as string, item.typeName || (item.typeCode as string)])
    )
    const seen = new Set<string>()
    categoryTags.value = (data || []).reduce<{ value: string; label: string }[]>(
      (tags, item: SupplyScopeView) => {
        const value = toScopeCode(item.productType)
        if (!value || seen.has(value)) return tags
        seen.add(value)
        tags.push({
          value,
          label: typeNameMap.get(value) || value
        })
        return tags
      },
      []
    )
  } catch {
    categoryTags.value = []
  }
  if (!categoryTags.value.some((tag) => tag.value === activeTag.value)) {
    activeTag.value = categoryTags.value[0]?.value || ''
  }
}

/**
 * 当前商业条款投影：固定值取身份行供应价；折扣仅按正 SKU 销售建议价 HALF_UP 试算。
 * 履约版本仍按冻结价执行；不得以旧 L1/市场价补齐缺失建议价。
 * 设计见 docs/superpowers/specs/2026-10-11-supplier-offer-sale-price-alignment-design.md#5-前端展示与写入。
 */
const formatSupplyPrice = (row: OfferListItem) => {
  if (row.priceMode === 'FIXED') {
    return formatCentsYuan(row.unitPriceCents)
  }
  if (row.priceMode === 'DISCOUNT') {
    if (
      row.suggestedSalePriceCents != null &&
      row.suggestedSalePriceCents > 0 &&
      row.discountBp != null
    ) {
      return formatCentsYuan(Math.round((row.suggestedSalePriceCents * row.discountBp) / 10000))
    }
    return '-'
  }
  return '-'
}

const getList = async () => {
  if (!props.supplierCode) return
  loading.value = true
  try {
    const data = await SupplierApi.getOfferPage(props.supplierCode, {
      pageNo: queryParams.pageNo,
      pageSize: queryParams.pageSize,
      productType: activeTag.value || undefined
    })
    list.value = data?.list || []
    total.value = data?.total || 0
    lastSavedScores.clear()
    list.value.forEach(rememberRowScore)
    selectedRows.value = []
    await nextTick()
    tableRef.value?.clearSelection()
  } catch {
    list.value = []
    total.value = 0
    selectedRows.value = []
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (rows: OfferListItem[]) => {
  selectedRows.value = rows
}

const handleScoreChange = async (
  row: OfferListItem,
  field: 'stabilityScore' | 'timelinessScore',
  value?: number,
  previous?: number
) => {
  const saved = lastSavedScores.get(getRowKey(row))
  const previousValue = previous ?? saved?.[field]
  if (value === previousValue) return
  if (!row.platformSkuCode) {
    row[field] = previousValue
    message.warning('缺少平台 SKU 编号，无法保存评分')
    return
  }
  if (value == null) {
    row[field] = previousValue
    return
  }
  const score = parseScore(value)
  if (score == null) {
    row[field] = previousValue
    message.warning(SCORE_RANGE_MESSAGE)
    return
  }
  const savingKey = getScoreKey(row, field)
  scoreSavingKey.value = savingKey
  try {
    await SupplierApi.saveFulfillmentScores(props.supplierCode, {
      [field]: score,
      platformSkuCodes: [row.platformSkuCode]
    })
    rememberRowScore(row)
    message.success('评分已保存')
  } catch {
    row[field] = previousValue
  } finally {
    if (scoreSavingKey.value === savingKey) scoreSavingKey.value = ''
  }
}

const openBatchScore = async () => {
  if (!selectedRows.value.length) {
    message.warning('请先选择要修改评分的商品')
    return
  }
  batchScoreForm.stabilityScore = undefined
  batchScoreForm.timelinessScore = undefined
  batchScoreVisible.value = true
  await nextTick()
  batchScoreFormRef.value?.clearValidate()
}

const submitBatchScore = async () => {
  if (!selectedRows.value.length) {
    message.warning('请先选择要修改评分的商品')
    return
  }
  const valid = await batchScoreFormRef.value?.validate().catch(() => false)
  if (valid === false) return
  const stabilityScore = parseScore(batchScoreForm.stabilityScore)
  const timelinessScore = parseScore(batchScoreForm.timelinessScore)
  if (stabilityScore == null && timelinessScore == null) {
    message.warning('请至少填写一项评分')
    return
  }
  if (batchScoreForm.stabilityScore != null && stabilityScore == null) {
    message.warning(SCORE_RANGE_MESSAGE)
    return
  }
  if (batchScoreForm.timelinessScore != null && timelinessScore == null) {
    message.warning(SCORE_RANGE_MESSAGE)
    return
  }
  const platformSkuCodes = [
    ...new Set(
      selectedRows.value.map((row) => row.platformSkuCode).filter((code): code is string => !!code)
    )
  ]
  if (!platformSkuCodes.length) {
    message.error('选中商品缺少平台 SKU 编号，无法批量修改评分')
    return
  }
  batchScoreSubmitting.value = true
  try {
    const data = await SupplierApi.saveFulfillmentScores(props.supplierCode, {
      ...(stabilityScore != null ? { stabilityScore } : {}),
      ...(timelinessScore != null ? { timelinessScore } : {}),
      platformSkuCodes
    })
    message.success(`已更新 ${data?.updatedCount ?? platformSkuCodes.length} 个商品评分`)
    batchScoreVisible.value = false
    await getList()
  } finally {
    batchScoreSubmitting.value = false
  }
}

const handleTagChange = (value: string) => {
  if (activeTag.value === value) return
  activeTag.value = value
  queryParams.pageNo = 1
  getList()
}

const openSelectDialog = () => {
  selectDialogRef.value?.open()
}

const openEdit = (row: OfferListItem) => {
  if (!row.offerNo) {
    message.error('缺少合作商品编号，暂无法改价')
    return
  }
  if (!row.platformSkuCode) {
    message.error('缺少平台 SKU 编号，暂无法改价')
    return
  }
  priceRow.value = row
  priceForm.offerNo = row.offerNo
  priceForm.platformSkuCode = row.platformSkuCode
  priceForm.externalSkuCode = row.externalSkuCode || ''
  priceForm.priceMode = row.priceMode || 'FIXED'
  priceForm.unitPriceYuan = centsToYuan(row.unitPriceCents)
  priceForm.discountPercent = bpToPercent(row.discountBp)
  priceForm.suggestedPriceCents = row.suggestedSalePriceCents
  priceForm.supplyMode = row.offerSupplyMode || ''
  priceForm.maxQuantity = row.maxQuantity
  priceForm.minQuantity = row.minQuantity
  priceVisible.value = true
}

const submitPrice = async () => {
  if (!props.supplierCode) {
    message.error('缺少供应商编号，暂无法改价')
    return
  }
  if (!priceForm.offerNo) {
    message.error('缺少合作商品编号，暂无法改价')
    return
  }
  if (!priceForm.platformSkuCode) {
    message.warning('缺少平台 SKU 编号')
    return
  }
  if (!priceForm.priceMode) {
    message.warning('请选择供应价模式')
    return
  }
  if (!priceForm.supplyMode) {
    message.warning('请选择供货模式')
    return
  }
  const externalSkuCodeError = validateExternalSkuCode(priceForm.externalSkuCode)
  if (externalSkuCodeError) {
    message.warning(externalSkuCodeError)
    return
  }
  const payload: DraftReqVO = {
    platformSkuCode: priceForm.platformSkuCode,
    priceMode: priceForm.priceMode,
    supplyMode: priceForm.supplyMode,
    externalSkuCode: priceForm.externalSkuCode.trim()
  }
  if (priceForm.priceMode === 'FIXED') {
    const unitPriceCents = yuanToCents(priceForm.unitPriceYuan)
    if (!unitPriceCents || unitPriceCents <= 0) {
      message.warning('固定值模式下供应价必须大于 0')
      return
    }
    payload.unitPriceCents = unitPriceCents
  } else if (priceForm.priceMode === 'DISCOUNT') {
    if (priceForm.suggestedPriceCents == null || priceForm.suggestedPriceCents <= 0) {
      message.warning('折扣模式要求SKU销售建议价大于0，请先在商品中心配置')
      return
    }
    const percent = priceForm.discountPercent || 0
    if (percent < 0.01 || percent > 100) {
      message.warning('供货折扣需在 0.01%~100% 之间')
      return
    }
    const discountBp = percentToBp(percent)
    if (discountBp != null) payload.discountBp = discountBp
  }
  const suggestedPriceCents = toDraftNumber(priceForm.suggestedPriceCents)
  if (suggestedPriceCents != null) payload.suggestedPriceCents = suggestedPriceCents
  const maxQuantity = toDraftNumber(priceForm.maxQuantity)
  if (maxQuantity != null && maxQuantity > 0) payload.maxQuantity = maxQuantity
  const minQuantity = toDraftNumber(priceForm.minQuantity)
  if (minQuantity != null && minQuantity > 0) payload.minQuantity = minQuantity
  if (payload.maxQuantity && payload.minQuantity && payload.maxQuantity < payload.minQuantity) {
    message.warning('供货上限不能小于最低起购量')
    return
  }
  priceSubmitting.value = true
  try {
    await SupplierApi.updateOffer(props.supplierCode, priceForm.offerNo, payload)
    message.success('待发布变更已保存')
    priceVisible.value = false
    await getList()
  } finally {
    priceSubmitting.value = false
  }
}

const handleDelete = async (offerNo?: string) => {
  if (!offerNo) return
  try {
    await message.delConfirm('确认移除该合作商品吗？')
    await SupplierApi.deleteOffer(props.supplierCode, offerNo)
    message.success('移除成功')
    await getList()
  } catch {}
}

/**
 * Offer上下架独立于平台商品，已上架行保留下架与发布变更两种操作。
 * 后端请求错误沿用axios统一提示，组件不重复toast。
 * 设计见 docs/superpowers/specs/2026-10-11-supplier-offer-lifecycle-design.md#33-闭环三连接器切换后保留发布变更操作。
 */
const handleTakeOffShelf = async (row: OfferListItem) => {
  if (!row.offerNo || row.status !== 'PUBLISHED') return
  try {
    await message.confirm(
      `确认下架「${row.platformSkuName || row.platformSkuCode}」？下架后停止用于新交易。`
    )
    await SupplierApi.patchOffer(props.supplierCode, row.offerNo, {
      status: 'SUSPENDED'
    })
    message.success('下架成功')
    await getList()
  } catch {}
}

const handleListOnShelf = async (row: OfferListItem) => {
  if (!row.offerNo || !getOnShelfActionLabel(row.status) || row.canPublish === false) return
  const label = row.status === 'PUBLISHED' ? '发布变更' : '上架'
  try {
    await message.confirm(
      `确认${label}「${row.platformSkuName || row.platformSkuCode}」？将发布为可履约供给版本。`
    )
    await SupplierApi.listOfferOnShelf(props.supplierCode, row.offerNo)
    message.success(`${label}成功`)
    await getList()
  } catch {}
}

const reload = async () => {
  queryParams.pageNo = 1
  await loadCategoryTags()
  await getList()
}

watch(
  () => props.supplierCode,
  () => reload(),
  { immediate: true }
)

defineExpose({ reload })
</script>

<style scoped>
.filter-pill {
  display: inline-flex;
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
</style>
