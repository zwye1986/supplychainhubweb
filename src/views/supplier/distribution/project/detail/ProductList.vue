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

    <el-table
      v-loading="loading"
      :data="list"
      row-key="listingCode"
      :stripe="true"
      :show-overflow-tooltip="true"
    >
      <el-table-column label="SKU名称" prop="skuName" min-width="140" />
      <el-table-column label="平台SKU编码" prop="platformSkuCode" min-width="140" />
      <el-table-column label="销售建议价（元）" min-width="130" align="right">
        <template #default="{ row }">
          {{ formatCentsYuan(row.suggestedSalePriceCents) }}
        </template>
      </el-table-column>
      <el-table-column label="分销商基础价（元）" min-width="140" align="right">
        <template #default="{ row }">
          {{ formatCentsYuan(row.distPriceCents) }}
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
      <el-table-column label="定价来源" min-width="120">
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
      :project-code="projectCode"
      :buyer-code="buyerCode"
      @success="handleProductChange"
    />

    <Dialog v-model="adjustVisible" title="改价" width="560px">
      <el-alert class="mb-12px" type="info" :closable="false">
        <div class="leading-22px">
          <div>沿用分销商基础价：不写 L3，跟随当前有效 L2。</div>
          <div>等于平台默认分销价 / 自定义公式：会发新版本。金额单位按元录入，提交时转为分。</div>
          <div>自定义公式：平台默认分销价 × 百分比 + 金额；百分比 100 等于平台基价。</div>
        </div>
      </el-alert>
      <el-form ref="adjustFormRef" :model="adjustForm" :rules="adjustRules" label-width="120px">
        <el-form-item label="商品">
          {{ adjustRow?.skuName || '-' }}
        </el-form-item>
        <el-form-item label="销售建议价">
          {{ formatCentsYuan(adjustRow?.suggestedSalePriceCents) }}
        </el-form-item>
        <el-form-item label="平台默认分销价">
          {{ formatCentsYuan(adjustRow?.platformBasePriceCents) }}
        </el-form-item>
        <el-form-item label="当前分销价">
          {{ formatCentsYuan(adjustRow?.distPriceCents) }}
        </el-form-item>
        <el-form-item label="调价方式" prop="l3AdjustMode">
          <el-radio-group v-model="adjustForm.l3AdjustMode" @change="handleAdjustModeChange">
            <el-radio
              v-for="item in PROJECT_L3_ADJUST_MODE_OPTIONS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="adjustForm.l3AdjustMode === ProjectL3AdjustModeEnum.CUSTOM"
          label="项目价公式"
          required
        >
          <div class="flex w-full flex-wrap items-center gap-6px">
            <span class="whitespace-nowrap text-12px">平台默认分销价</span>
            <el-form-item prop="percent" class="!mb-0">
              <el-input-number :controls="false" v-model="adjustForm.percent" :min="1" :precision="0" class="!w-110px" />
            </el-form-item>
            <span>%</span>
            <span>+</span>
            <el-form-item prop="amountYuan" class="!mb-0">
              <el-input-number :controls="false" v-model="adjustForm.amountYuan" :precision="2" class="!w-110px" />
            </el-form-item>
            <span>元</span>
          </div>
        </el-form-item>
        <el-form-item label="预估 L3">
          {{ previewL3Text }}
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
  PatchProjectListingReqVO,
  ProjectApi,
  ProjectListingListItem
} from '@/api/supplier/distribution'
import {
  PROJECT_L3_ADJUST_MODE_OPTIONS,
  ProjectL3AdjustModeEnum,
  formatCentsYuan,
  getPriceSourceLabel,
  yuanToCents
} from '@/views/supplier/utils/constants'
import ProductSelectDialog from './ProductSelectDialog.vue'

defineOptions({ name: 'ProjectProductList' })

const props = defineProps<{
  projectCode: string
  buyerCode?: string
}>()

const emit = defineEmits<{
  success: []
}>()

const message = useMessage()
const loading = ref(false)
const list = ref<ProjectListingListItem[]>([])
const total = ref(0)
const selectDialogRef = ref<InstanceType<typeof ProductSelectDialog>>()
const adjustVisible = ref(false)
const adjustSaving = ref(false)
const adjustFormRef = ref<FormInstance>()
const adjustRow = ref<ProjectListingListItem>()
const adjustForm = reactive({
  l3AdjustMode: ProjectL3AdjustModeEnum.FOLLOW_L2 as string,
  percent: 100 as number | undefined,
  amountYuan: 0 as number | undefined
})

const queryParams = reactive({
  pageNo: 1,
  pageSize: 20
})

const inferL3AdjustMode = (row: ProjectListingListItem) => {
  if (!row.projectPriceCovered) return ProjectL3AdjustModeEnum.FOLLOW_L2
  if (
    row.platformBasePriceCents != null &&
    row.projectPriceCents != null &&
    row.projectPriceCents === row.platformBasePriceCents
  ) {
    return ProjectL3AdjustModeEnum.EQUAL_L1
  }
  return ProjectL3AdjustModeEnum.CUSTOM
}

const previewL3Text = computed(() => {
  const suggest = adjustRow.value?.platformBasePriceCents
  if (adjustForm.l3AdjustMode === ProjectL3AdjustModeEnum.FOLLOW_L2) {
    return formatCentsYuan(adjustRow.value?.distPriceCents)
  }
  if (suggest == null) return '-'
  if (adjustForm.l3AdjustMode === ProjectL3AdjustModeEnum.EQUAL_L1) {
    return formatCentsYuan(suggest)
  }
  const percent = Number(adjustForm.percent)
  if (!percent) return '-'
  const amountCents = yuanToCents(adjustForm.amountYuan) ?? 0
  return formatCentsYuan(Math.round((suggest * percent) / 100) + amountCents)
})

const adjustRules = computed<FormRules>(() => {
  const isCustom = adjustForm.l3AdjustMode === ProjectL3AdjustModeEnum.CUSTOM
  return {
    l3AdjustMode: [{ required: true, message: '请选择调价方式', trigger: 'change' }],
    percent: isCustom ? [{ required: true, message: '请输入百分比', trigger: 'change' }] : [],
    amountYuan: []
  }
})

const getList = async () => {
  if (!props.projectCode) return
  loading.value = true
  try {
    const data = await ProjectApi.getProductPage(props.projectCode, {
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

const handleAdjustModeChange = () => {
  if (adjustForm.l3AdjustMode === ProjectL3AdjustModeEnum.CUSTOM) {
    if (adjustForm.percent == null) adjustForm.percent = 100
    if (adjustForm.amountYuan == null) adjustForm.amountYuan = 0
  }
  nextTick(() => adjustFormRef.value?.clearValidate())
}

const openAdjust = (row: ProjectListingListItem) => {
  if (!row.listingCode) {
    message.error('缺少项目商品编号，无法改价')
    return
  }
  adjustRow.value = row
  const mode = inferL3AdjustMode(row)
  adjustForm.l3AdjustMode = mode
  if (mode === ProjectL3AdjustModeEnum.CUSTOM && row.platformBasePriceCents != null) {
    const diffCents =
      (row.projectPriceCents ?? row.platformBasePriceCents) - row.platformBasePriceCents
    adjustForm.percent = 100
    adjustForm.amountYuan = Number((diffCents / 100).toFixed(2))
  } else {
    adjustForm.percent = 100
    adjustForm.amountYuan = 0
  }
  adjustVisible.value = true
  nextTick(() => adjustFormRef.value?.clearValidate())
}

const submitAdjust = async () => {
  const listingCode = adjustRow.value?.listingCode
  if (!props.projectCode || !listingCode) {
    message.error('缺少项目商品编号，无法改价')
    return
  }
  await adjustFormRef.value?.validate()
  const needL1 =
    adjustForm.l3AdjustMode === ProjectL3AdjustModeEnum.EQUAL_L1 ||
    adjustForm.l3AdjustMode === ProjectL3AdjustModeEnum.CUSTOM
  if (needL1 && adjustRow.value?.platformBasePriceCents == null) {
    message.error('当前商品没有平台默认分销价，无法按等于平台价或自定义公式改价')
    return
  }
  const payload: PatchProjectListingReqVO = {
    l3AdjustMode: adjustForm.l3AdjustMode
  }
  if (adjustForm.l3AdjustMode === ProjectL3AdjustModeEnum.CUSTOM) {
    payload.percent = adjustForm.percent
    payload.amountCents = yuanToCents(adjustForm.amountYuan) ?? 0
  }
  adjustSaving.value = true
  try {
    await ProjectApi.patchProduct(props.projectCode, listingCode, payload)
    message.success('改价成功')
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
    queryParams.pageNo = 1
    getList()
  },
  { immediate: true }
)
</script>
