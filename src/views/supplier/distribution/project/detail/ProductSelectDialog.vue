<template>
  <Dialog v-model="dialogVisible" title="新增分销商品" width="1200px" :scroll="true" max-height="70vh">
    <div class="mb-12px flex items-center justify-between">
      <el-alert
        class="!mb-0 flex-1"
        type="info"
        :closable="false"
        title="只能选择该项目所属分销商的未移除分销商品。默认沿用分销商基础价（FOLLOW_L2）。"
      />
      <el-tag class="ml-12px" type="primary" size="large">已选商品 {{ selectedList.length }}</el-tag>
    </div>

    <el-row :gutter="16">
      <el-col :span="13">
        <ContentWrap class="!mb-0">
          <el-table
            ref="tableRef"
            v-loading="loading"
            :data="skuList"
            row-key="platformSkuCode"
            height="420"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="45" :reserve-selection="true" />
            <el-table-column label="SKU名称" prop="skuName" min-width="140" />
            <el-table-column label="平台SKU编码" prop="platformSkuCode" min-width="140" />
            <el-table-column label="销售建议价" min-width="110" align="right">
              <template #default="{ row }">
                {{ formatCentsYuan(row.suggestPriceCents) }}
              </template>
            </el-table-column>
            <el-table-column label="分销商基础价" min-width="120" align="right">
              <template #default="{ row }">
                {{ formatCentsYuan(row.distPriceCents) }}
              </template>
            </el-table-column>
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
            title="自定义公式为销售建议价 × 百分比 + 金额。百分比 100 等于 L1；百分比 ≤ 100 可能亏本。"
          />
          <el-form label-width="100px" size="small" class="mb-10px">
            <el-form-item label="调价方式">
              <el-radio-group v-model="batchConfig.l3AdjustMode">
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
              v-if="batchConfig.l3AdjustMode === ProjectL3AdjustModeEnum.CUSTOM"
              label="项目价公式"
            >
              <div class="flex w-full items-center gap-6px">
                <span class="whitespace-nowrap text-12px">销售建议价</span>
                <el-input-number
                  :controls="false"
                  v-model="batchConfig.percent"
                  :min="1"
                  :precision="0"
                  class="!w-90px"
                />
                <span>%</span>
                <span>+</span>
                <el-input-number
                  :controls="false"
                  v-model="batchConfig.amountYuan"
                  :precision="2"
                  class="!w-90px"
                />
                <span>元</span>
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
              :key="item.platformSkuCode"
              class="mb-10px rounded-6px border border-solid border-[var(--el-border-color)] p-10px"
            >
              <div class="mb-6px flex items-center justify-between">
                <span class="text-13px font-600">{{ item.skuName }}</span>
                <el-button link type="danger" @click="removeSelected(item.platformSkuCode)">
                  移除
                </el-button>
              </div>
              <div class="mb-6px text-12px text-gray-500">
                {{ item.platformSkuCode }} ｜ 建议价：{{ formatCentsYuan(item.suggestPriceCents) }} ｜
                分销价：{{ formatCentsYuan(item.distPriceCents) }}
              </div>
              <el-form label-width="90px" size="small">
                <el-form-item label="调价方式">
                  <el-radio-group v-model="item.l3AdjustMode">
                    <el-radio
                      v-for="opt in PROJECT_L3_ADJUST_MODE_OPTIONS"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item
                  v-if="item.l3AdjustMode === ProjectL3AdjustModeEnum.CUSTOM"
                  label="公式"
                >
                  <div class="flex w-full items-center gap-4px">
                    <el-input-number
                      :controls="false"
                      v-model="item.percent"
                      :min="1"
                      :precision="0"
                      class="!w-80px"
                    />
                    <span>%</span>
                    <el-input-number :controls="false" v-model="item.amountYuan" :precision="2" class="!w-80px" />
                    <span>元</span>
                  </div>
                </el-form-item>
                <el-form-item label="预估项目价">
                  {{ previewItemPrice(item) }}
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
  AddProjectProductsReqVO,
  BuyerProductListItem,
  DistributorApi,
  ProjectApi,
  ProjectProductItemReqVO
} from '@/api/supplier/distribution'
import {
  PROJECT_L3_ADJUST_MODE_OPTIONS,
  ProjectL3AdjustModeEnum,
  formatCentsYuan,
  yuanToCents
} from '@/views/supplier/utils/constants'

defineOptions({ name: 'ProjectProductSelectDialog' })

interface SelectedProjectProduct extends BuyerProductListItem {
  l3AdjustMode: string
  percent?: number
  amountYuan?: number
}

const props = defineProps<{
  projectCode: string
  buyerCode?: string
}>()

const emit = defineEmits<{
  success: []
}>()

const message = useMessage()
const dialogVisible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const skuList = ref<BuyerProductListItem[]>([])
const total = ref(0)
const selectedList = ref<SelectedProjectProduct[]>([])
const tableRef = ref()

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10
})

const batchConfig = reactive({
  l3AdjustMode: ProjectL3AdjustModeEnum.FOLLOW_L2 as string,
  percent: 120,
  amountYuan: 0
})

const createSelected = (row: BuyerProductListItem): SelectedProjectProduct => ({
  ...row,
  l3AdjustMode: ProjectL3AdjustModeEnum.FOLLOW_L2,
  percent: 120,
  amountYuan: 0
})

const previewItemPrice = (item: SelectedProjectProduct) => {
  if (item.l3AdjustMode === ProjectL3AdjustModeEnum.FOLLOW_L2) {
    return formatCentsYuan(item.distPriceCents)
  }
  if (item.suggestPriceCents == null) return '-'
  if (item.l3AdjustMode === ProjectL3AdjustModeEnum.EQUAL_L1) {
    return formatCentsYuan(item.suggestPriceCents)
  }
  const percent = Number(item.percent)
  if (!percent) return '-'
  const amountCents = yuanToCents(item.amountYuan) ?? 0
  return formatCentsYuan(Math.round((item.suggestPriceCents * percent) / 100) + amountCents)
}

const open = async () => {
  if (!props.buyerCode) {
    message.warning('当前项目未关联分销商，无法选择分销商品')
    return
  }
  dialogVisible.value = true
  selectedList.value = []
  queryParams.pageNo = 1
  nextTick(() => tableRef.value?.clearSelection?.())
  await getSkuList()
}
defineExpose({ open })

const getSkuList = async () => {
  if (!props.buyerCode) return
  loading.value = true
  try {
    const data = await DistributorApi.getBuyerProductPage(props.buyerCode, {
      pageNo: queryParams.pageNo,
      pageSize: queryParams.pageSize
    })
    skuList.value = data.list || []
    total.value = data.total || 0
  } catch {
    skuList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (rows: BuyerProductListItem[]) => {
  const map = new Map(selectedList.value.map((item) => [item.platformSkuCode, item]))
  rows.forEach((row) => {
    if (row.platformSkuCode && !map.has(row.platformSkuCode)) {
      map.set(row.platformSkuCode, createSelected(row))
    }
  })
  const selectedCodes = new Set(rows.map((item) => item.platformSkuCode).filter(Boolean))
  selectedList.value = [...map.values()].filter((item) => selectedCodes.has(item.platformSkuCode))
}

const removeSelected = (platformSkuCode?: string) => {
  if (!platformSkuCode) return
  selectedList.value = selectedList.value.filter((item) => item.platformSkuCode !== platformSkuCode)
  const row = skuList.value.find((item) => item.platformSkuCode === platformSkuCode)
  if (row) tableRef.value?.toggleRowSelection?.(row, false)
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
    batchConfig.l3AdjustMode === ProjectL3AdjustModeEnum.CUSTOM &&
    (batchConfig.percent || 0) <= 100
  ) {
    message.warning('自定义模式下百分比 ≤ 100 可能出现亏本')
  }
  selectedList.value.forEach((item) => {
    item.l3AdjustMode = batchConfig.l3AdjustMode
    if (batchConfig.l3AdjustMode === ProjectL3AdjustModeEnum.CUSTOM) {
      item.percent = batchConfig.percent
      item.amountYuan = batchConfig.amountYuan
    }
  })
  message.success('批量配置已应用')
}

const validateSelected = async () => {
  if (!selectedList.value.length) {
    message.warning('请至少选择一个SKU')
    return false
  }
  for (const item of selectedList.value) {
    if (!item.platformSkuCode) {
      message.warning('存在缺少平台SKU编码的商品，无法发布')
      return false
    }
    if (item.l3AdjustMode === ProjectL3AdjustModeEnum.CUSTOM) {
      if (!item.percent || item.percent <= 0) {
        message.warning(`SKU「${item.skuName}」请设置有效百分比`)
        return false
      }
      if (item.percent <= 100) {
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
  }
  return true
}

const handleSubmit = async () => {
  if (!(await validateSelected())) return
  if (!props.projectCode) {
    message.error('缺少项目编号，无法发布商品')
    return
  }
  submitting.value = true
  try {
    const items: ProjectProductItemReqVO[] = selectedList.value.map((item) => {
      const row: ProjectProductItemReqVO = {
        platformSkuCode: item.platformSkuCode || '',
        l3AdjustMode: item.l3AdjustMode || ProjectL3AdjustModeEnum.FOLLOW_L2
      }
      if (row.l3AdjustMode === ProjectL3AdjustModeEnum.CUSTOM) {
        row.percent = item.percent
        row.amountCents = yuanToCents(item.amountYuan) ?? 0
      }
      return row
    })
    const payload: AddProjectProductsReqVO = { items }
    await ProjectApi.createProducts(props.projectCode, payload)
    message.success('添加成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>
