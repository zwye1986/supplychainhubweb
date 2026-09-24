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
      <el-table-column label="操作" width="180" align="center" fixed="right" :show-overflow-tooltip="false">
        <template #default="{ row }">
          <el-button link type="primary" @click="openAdjust(row)">配置专属价</el-button>
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

    <Dialog v-model="adjustVisible" title="配置项目专属价" width="980px" :scroll="true" max-height="70vh">
      <div class="mb-12px text-14px">
        <span class="text-gray-500">商品：</span>
        {{ adjustRow?.skuName || '-' }}
      </div>
      <div class="mb-12px text-13px text-gray-500">
        分销价会覆盖分销商配置。销售价、服务费继承分销商配置。利润隐藏、税务未填写时继续继承。
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
import { ProjectApi, ProjectListingListItem } from '@/api/supplier/distribution'
import { formatCentsYuan, getPriceSourceLabel } from '@/views/supplier/utils/constants'
import ProductSelectDialog from './ProductSelectDialog.vue'
import ProjectPricingForm from './ProjectPricingForm.vue'
import {
  buildProjectProductPricing,
  createEmptyProjectPricing,
  isProjectPricingConfigured,
  type ProjectPricingFormData
} from './projectPricing'

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
const adjustFormRef = ref<InstanceType<typeof ProjectPricingForm>>()
const adjustRow = ref<ProjectListingListItem>()
const adjustPrice = ref<ProjectPricingFormData>(createEmptyProjectPricing())

const queryParams = reactive({
  pageNo: 1,
  pageSize: 20
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

const openAdjust = (row: ProjectListingListItem) => {
  if (!row.listingCode) {
    message.error('缺少项目商品编号，无法改价')
    return
  }
  adjustRow.value = row
  adjustPrice.value = createEmptyProjectPricing()
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
    queryParams.pageNo = 1
    getList()
  },
  { immediate: true }
)
</script>
