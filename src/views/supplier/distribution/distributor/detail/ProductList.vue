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
      <el-button type="primary" round @click="openSelectDialog">+新增商品</el-button>
    </div>

    <el-alert class="mb-12px" type="info" :closable="false" title="三级定价体系说明">
      <div class="leading-22px">
        <div>L1 平台默认定价 → L2 分销商基础价 → L3 项目专属价（在项目管理模块配置）。</div>
        <div>结算优先级：L3 &gt; L2 &gt; L1。被多个项目定价覆盖的 SKU 以橙色标记。</div>
      </div>
    </el-alert>

    <el-table
      v-loading="loading"
      :data="list"
      row-key="buyerProductCode"
      :stripe="true"
      :show-overflow-tooltip="true"
    >
      <el-table-column label="商品名称" prop="spuName" min-width="140" />
      <el-table-column label="SKU规格" prop="skuName" min-width="100" />
      <el-table-column label="SKU编号" prop="platformSkuCode" min-width="120" />
      <el-table-column label="类型/分类" min-width="160">
        <template #default="{ row }">
          {{ row.categoryPath || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="销售建议价（元）" min-width="130" align="right">
        <template #default="{ row }">
          {{ formatCentsYuan(row.suggestPriceCents) }}
        </template>
      </el-table-column>
      <el-table-column label="分销价规则" prop="pricingRule" min-width="150">
        <template #default="{ row }">
          {{ row.pricingRule || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="分销价（元）" min-width="110" align="right">
        <template #default="{ row }">
          <span :class="{ 'font-600 text-[var(--el-color-warning)]': row.projectPriceCovered }">
            {{ formatCentsYuan(row.distPriceCents) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="项目专属价（元）" min-width="130" align="right">
        <template #default="{ row }">
          <span :class="{ 'font-600 text-[var(--el-color-warning)]': row.projectPriceCovered }">
            {{ formatCentsYuan(row.projectPriceCents) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="最终结算价（元）" min-width="130" align="right">
        <template #default="{ row }">
          <span class="font-700" :class="{ 'text-[var(--el-color-warning)]': row.projectPriceCovered }">
            {{ formatCentsYuan(row.finalPriceCents) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="定价来源" min-width="140">
        <template #default="{ row }">
          <el-tag v-if="row.projectPriceCovered" size="small" type="warning">
            {{ getPriceSourceLabel(row.priceSource) }}
          </el-tag>
          <span v-else>{{ getPriceSourceLabel(row.priceSource) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openAdjust(row)">改价</el-button>
          <el-button link type="danger" @click="handleDelete(row)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />

    <ProductSelectDialog
      ref="selectDialogRef"
      :distributor-id="distributorId"
      @success="getList"
    />

    <Dialog v-model="adjustVisible" title="改价" width="560px">
      <el-alert class="mb-12px" type="info" :closable="false">
        <div class="leading-22px">
          <div>跟随模板：清除手工 L2 覆盖，改回模板价。</div>
          <div>等于 L1 / 自定义公式：当前商品必须已有 L1 建议价。</div>
          <div>自定义公式：销售建议价 × 百分比 + 金额；百分比 100 等于 L1。</div>
        </div>
      </el-alert>
      <el-form
        ref="adjustFormRef"
        :model="adjustForm"
        :rules="adjustRules"
        label-width="120px"
      >
        <el-form-item label="商品">
          {{ [adjustRow?.spuName, adjustRow?.skuName].filter(Boolean).join(' / ') || '-' }}
        </el-form-item>
        <el-form-item label="销售建议价">
          {{ formatCentsYuan(adjustRow?.suggestPriceCents) }}
        </el-form-item>
        <el-form-item label="当前规则">
          {{ adjustRow?.pricingRule || '-' }}
        </el-form-item>
        <el-form-item label="调价方式" prop="l2AdjustMode">
          <el-radio-group v-model="adjustForm.l2AdjustMode" @change="handleAdjustModeChange">
            <el-radio
              v-for="item in DIST_L2_ADJUST_MODE_OPTIONS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="adjustForm.l2AdjustMode === DistL2AdjustModeEnum.CUSTOM"
          label="分销价公式"
          required
        >
          <div class="flex w-full flex-wrap items-center gap-6px">
            <span class="whitespace-nowrap text-12px">销售建议价</span>
            <el-form-item prop="percent" class="!mb-0">
              <el-input-number v-model="adjustForm.percent" :min="1" :precision="0" class="!w-110px" />
            </el-form-item>
            <span>%</span>
            <span>+</span>
            <el-form-item prop="amountYuan" class="!mb-0">
              <el-input-number v-model="adjustForm.amountYuan" :precision="2" class="!w-110px" />
            </el-form-item>
            <span>元</span>
          </div>
        </el-form-item>
        <el-form-item label="预估 L2">
          {{ previewL2Text }}
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustVisible = false">取 消</el-button>
        <el-button type="primary" :loading="adjustSaving" @click="submitAdjust">确 定</el-button>
      </template>
    </Dialog>
  </ContentWrap>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import {
  BuyerProductListItem,
  DistributorApi,
  PatchBuyerProductReqVO
} from '@/api/supplier/distribution'
import {
  DIST_L2_ADJUST_MODE_OPTIONS,
  DIST_PRODUCT_TYPE_OPTIONS,
  DistL2AdjustModeEnum,
  formatCentsYuan,
  yuanToCents
} from '@/views/supplier/utils/constants'
import ProductSelectDialog from './ProductSelectDialog.vue'

defineOptions({ name: 'DistributorProductList' })

const props = defineProps<{
  buyerCode: string
  distributorId?: number
}>()

const message = useMessage()
const loading = ref(false)
const list = ref<BuyerProductListItem[]>([])
const total = ref(0)
const activeTag = ref('')
const selectDialogRef = ref<InstanceType<typeof ProductSelectDialog>>()
const adjustVisible = ref(false)
const adjustSaving = ref(false)
const adjustFormRef = ref<FormInstance>()
const adjustRow = ref<BuyerProductListItem>()
const adjustForm = reactive({
  l2AdjustMode: DistL2AdjustModeEnum.FOLLOW_TEMPLATE as string,
  percent: 100 as number | undefined,
  amountYuan: 0 as number | undefined
})

const queryParams = reactive({
  pageNo: 1,
  pageSize: 20
})

const categoryTags = [
  { value: '', label: '全部商品' },
  ...DIST_PRODUCT_TYPE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))
]

const PRICE_SOURCE_LABEL: Record<string, string> = {
  L1: '平台默认定价',
  L2: '分销商基础价',
  L3: '项目专属价'
}

const getPriceSourceLabel = (value?: string) => {
  if (!value) return '-'
  return PRICE_SOURCE_LABEL[value] || value
}

const inferL2AdjustMode = (pricingRule?: string) => {
  const text = pricingRule || ''
  if (text.includes('自定义') || /×\s*\d+\s*%/.test(text)) return DistL2AdjustModeEnum.CUSTOM
  if (text.includes('等于L1') || text.includes('等于 L1')) return DistL2AdjustModeEnum.EQUAL_L1
  return DistL2AdjustModeEnum.FOLLOW_TEMPLATE
}

const parseCustomFormula = (pricingRule?: string) => {
  const percentMatch = pricingRule?.match(/×\s*(\d+)\s*%/)
  const amountMatch = pricingRule?.match(/([+-])\s*([\d.]+)/)
  const amountYuan = amountMatch
    ? Number(amountMatch[2]) * (amountMatch[1] === '-' ? -1 : 1)
    : 0
  return {
    percent: percentMatch ? Number(percentMatch[1]) : 100,
    amountYuan
  }
}

const previewL2Text = computed(() => {
  const suggest = adjustRow.value?.suggestPriceCents
  if (adjustForm.l2AdjustMode === DistL2AdjustModeEnum.FOLLOW_TEMPLATE) return '-'
  if (suggest == null) return '-'
  if (adjustForm.l2AdjustMode === DistL2AdjustModeEnum.EQUAL_L1) {
    return formatCentsYuan(suggest)
  }
  const percent = Number(adjustForm.percent)
  if (!percent) return '-'
  const amountCents = yuanToCents(adjustForm.amountYuan) ?? 0
  return formatCentsYuan(Math.round((suggest * percent) / 100) + amountCents)
})

const adjustRules = computed<FormRules>(() => {
  const isCustom = adjustForm.l2AdjustMode === DistL2AdjustModeEnum.CUSTOM
  return {
    l2AdjustMode: [{ required: true, message: '请选择调价方式', trigger: 'change' }],
    percent: isCustom
      ? [{ required: true, message: '请输入百分比', trigger: 'change' }]
      : [],
    amountYuan: []
  }
})

const getList = async () => {
  if (!props.buyerCode) return
  loading.value = true
  try {
    const data = await DistributorApi.getBuyerProductPage(props.buyerCode, {
      pageNo: queryParams.pageNo,
      pageSize: queryParams.pageSize
    })
    list.value = data?.list || []
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

const handleAdjustModeChange = () => {
  if (adjustForm.l2AdjustMode === DistL2AdjustModeEnum.CUSTOM) {
    if (adjustForm.percent == null) adjustForm.percent = 100
    if (adjustForm.amountYuan == null) adjustForm.amountYuan = 0
  }
  nextTick(() => adjustFormRef.value?.clearValidate())
}

const openAdjust = (row: BuyerProductListItem) => {
  if (!row.buyerProductCode) {
    message.error('缺少分销商品编号，无法改价')
    return
  }
  adjustRow.value = row
  const mode = inferL2AdjustMode(row.pricingRule)
  const formula = parseCustomFormula(row.pricingRule)
  adjustForm.l2AdjustMode = mode
  adjustForm.percent = mode === DistL2AdjustModeEnum.CUSTOM ? formula.percent : 100
  adjustForm.amountYuan = mode === DistL2AdjustModeEnum.CUSTOM ? formula.amountYuan : 0
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
  const needL1 =
    adjustForm.l2AdjustMode === DistL2AdjustModeEnum.EQUAL_L1 ||
    adjustForm.l2AdjustMode === DistL2AdjustModeEnum.CUSTOM
  if (needL1 && adjustRow.value?.suggestPriceCents == null) {
    message.error('当前商品没有 L1 建议价，无法按等于 L1 或自定义公式改价')
    return
  }
  const payload: PatchBuyerProductReqVO = {
    l2AdjustMode: adjustForm.l2AdjustMode
  }
  if (adjustForm.l2AdjustMode === DistL2AdjustModeEnum.CUSTOM) {
    payload.percent = adjustForm.percent
    payload.amountCents = yuanToCents(adjustForm.amountYuan) ?? 0
  }
  adjustSaving.value = true
  try {
    await DistributorApi.patchBuyerProduct(props.buyerCode, buyerProductCode, payload)
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
  () => props.buyerCode,
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
