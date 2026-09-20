<template>
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      class="-mb-15px search-form"
      :model="queryParams"
      :inline="true"
      label-width="96px"
    >
      <el-form-item label="项目名称" prop="projectName">
        <el-select
          v-model="queryParams.projectName"
          placeholder="请选择/搜索项目名称"
          filterable
          allow-create
          default-first-option
          clearable
          :reserve-keyword="false"
        >
          <el-option
            v-for="item in nameOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="项目编号" prop="projectCode">
        <el-select
          v-model="queryParams.projectCode"
          placeholder="请选择/搜索编号"
          filterable
          allow-create
          default-first-option
          clearable
          :reserve-keyword="false"
        >
          <el-option
            v-for="item in codeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="项目状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择状态"
          multiple
          clearable
          collapse-tags
          collapse-tags-tooltip
        >
          <el-option
            v-for="item in PROJECT_STATUS_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="关联分销商" prop="buyerCode">
        <el-select
          v-model="queryParams.buyerCode"
          placeholder="请选择分销商"
          filterable
          clearable
        >
          <el-option
            v-for="item in buyerOptions"
            :key="item.buyerCode"
            :label="item.buyerName"
            :value="item.buyerCode"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="项目类型" prop="projectType">
        <el-select
          v-model="queryParams.projectType"
          placeholder="请选择类型"
          multiple
          clearable
          collapse-tags
          collapse-tags-tooltip
        >
          <el-option
            v-for="item in PROJECT_TYPE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="项目周期">
        <el-date-picker
          v-model="periodRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" /> 搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" /> 重置
        </el-button>
        <el-button type="primary" plain @click="openForm()">
          <Icon icon="ep:plus" class="mr-5px" /> 创建项目
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap v-loading="loading">
    <el-empty v-if="!loading && !list.length" description="暂无项目" />
    <el-row v-else :gutter="16">
      <el-col
        v-for="item in list"
        :key="item.projectCode || item.id"
        :xs="24"
        :sm="12"
        :lg="8"
        class="mb-16px"
      >
        <el-card shadow="hover" class="h-full project-card">
          <div class="mb-10px flex items-start justify-between gap-8px">
            <el-link
              class="min-w-0 truncate text-16px font-600"
              :underline="false"
              type="primary"
              @click="openDetail(item.projectCode)"
            >
              {{ item.projectName }}
            </el-link>
            <el-tag :type="getProjectStatusType(item.status)" size="small">
              {{ getProjectStatusLabel(item.status) }}
            </el-tag>
          </div>
          <div class="mb-6px text-13px text-gray-500">编号：{{ item.projectCode || '-' }}</div>
          <div class="mb-6px text-13px text-gray-500">
            周期：{{ item.startDate || '-' }} ~ {{ item.endDate || '-' }}
          </div>
          <div class="mb-6px text-13px">
            商品数（SKU）：<span class="font-600">{{ item.skuCount ?? 0 }}</span>
          </div>
          <div class="mb-6px text-13px">
            项目定价覆盖（SKU）：
            <span class="font-600 text-[var(--el-color-warning)]">
              {{ item.projectPriceSkuCount ?? 0 }}
            </span>
          </div>
          <div class="mb-6px text-13px">关联分销商：{{ item.buyerName || '-' }}</div>
          <div class="mb-12px text-13px">
            结算方：{{ getSettlementPartyTypeLabel(item.settlementPartyType) }}
          </div>
          <div class="flex items-center gap-8px">
            <el-button link type="primary" @click="openDetail(item.projectCode)">查看详情</el-button>
            <el-button link type="primary" @click="openForm(item.projectCode)">编辑</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      :page-sizes="[12, 24, 48]"
      @pagination="getList"
    />
  </ContentWrap>

  <ProjectFormDialog
    v-model="formVisible"
    :project-code="formProjectCode"
    :mode="formMode"
    @success="handleFormSuccess"
  />
  <ProjectDetailDrawer
    ref="detailRef"
    v-model="detailVisible"
    :project-code="detailProjectCode"
    @success="getList"
    @edit="openForm"
  />
</template>

<script lang="ts" setup>
import { DistributorApi, ProjectApi, ProjectVO } from '@/api/supplier/distribution'
import {
  PROJECT_STATUS_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  getProjectStatusLabel,
  getProjectStatusType,
  getSettlementPartyTypeLabel
} from '@/views/supplier/utils/constants'
import ProjectFormDialog from './form/index.vue'
import ProjectDetailDrawer from './detail/index.vue'

defineOptions({ name: 'SupplierDistributionProject' })

const route = useRoute()
const message = useMessage()

const loading = ref(true)
const list = ref<ProjectVO[]>([])
const total = ref(0)
const queryFormRef = ref()
const nameOptions = ref<{ value: string; label: string }[]>([])
const codeOptions = ref<{ value: string; label: string }[]>([])
const buyerOptions = ref<{ buyerCode: string; buyerName: string }[]>([])
const formVisible = ref(false)
const formProjectCode = ref<string | undefined>(undefined)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const detailVisible = ref(false)
const detailProjectCode = ref<string | undefined>(undefined)
const detailRef = ref()
const queryParams = reactive({
  pageNo: 1,
  pageSize: 12,
  projectName: undefined as string | undefined,
  projectCode: undefined as string | undefined,
  status: [] as string[],
  buyerCode: undefined as string | undefined,
  projectType: [] as string[],
  periodFrom: undefined as string | undefined,
  periodTo: undefined as string | undefined
})

const periodRange = computed<string[]>({
  get: () =>
    queryParams.periodFrom && queryParams.periodTo
      ? [queryParams.periodFrom, queryParams.periodTo]
      : [],
  set: (val) => {
    queryParams.periodFrom = val?.[0]
    queryParams.periodTo = val?.[1]
  }
})

const getList = async () => {
  loading.value = true
  try {
    const data = await ProjectApi.getProjectPage({ ...queryParams })
    list.value = Array.isArray(data?.list) ? data.list : []
    total.value = Number(data?.total) || 0
  } catch (error: any) {
    list.value = []
    total.value = 0
    message.error(error?.message || '加载项目列表失败')
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value?.resetFields()
  queryParams.periodFrom = undefined
  queryParams.periodTo = undefined
  handleQuery()
}

const openForm = (projectCode?: string) => {
  formProjectCode.value = projectCode
  formMode.value = projectCode ? 'edit' : 'create'
  formVisible.value = true
}

const openDetail = (projectCode?: string) => {
  if (!projectCode) return
  if (detailVisible.value && detailProjectCode.value === projectCode) return
  detailProjectCode.value = projectCode
  detailVisible.value = true
}

const handleFormSuccess = () => {
  getList()
  getFilterOptions()
  if (detailVisible.value) {
    detailRef.value?.reload?.()
  }
}

const getFilterOptions = async () => {
  try {
    const [names, codes, buyers] = await Promise.all([
      ProjectApi.getProjectNameList(),
      ProjectApi.getProjectCodeList(),
      DistributorApi.getDistributorNameList()
    ])
    nameOptions.value = names || []
    codeOptions.value = codes || []
    buyerOptions.value = (buyers || [])
      .map((item: any) => ({
        buyerCode: item.code || item.buyerCode || '',
        buyerName: item.label || item.value || item.buyerName || ''
      }))
      .filter((item) => item.buyerCode)
  } catch {
    nameOptions.value = []
    codeOptions.value = []
    buyerOptions.value = []
  }
}

const resolveRouteProjectCode = () => {
  const projectCode = route.query.projectCode || route.query.id
  return projectCode ? String(projectCode) : ''
}

watch(
  () => [route.query.projectCode, route.query.id] as const,
  () => {
    const projectCode = resolveRouteProjectCode()
    if (projectCode) openDetail(projectCode)
  },
  { immediate: true }
)

const loadPage = () => {
  getList()
  getFilterOptions()
}

onMounted(loadPage)
onActivated(loadPage)
onDeactivated(() => {
  detailVisible.value = false
  formVisible.value = false
})
</script>
