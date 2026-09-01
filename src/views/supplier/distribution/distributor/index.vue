<template>
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      class="-mb-15px search-form"
      :model="queryParams"
      :inline="true"
      label-width="96px"
    >
      <el-form-item label="分销商名称" prop="name">
        <el-select
          v-model="queryParams.name"
          placeholder="请选择/搜索分销商名称"
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
      <el-form-item label="分销商编号" prop="code">
        <el-select
          v-model="queryParams.code"
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
      <el-form-item label="等级" prop="level">
        <el-select
          v-model="queryParams.level"
          placeholder="请选择等级"
          multiple
          clearable
          collapse-tags
          collapse-tags-tooltip
        >
          <el-option
            v-for="item in DISTRIBUTION_LEVEL_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="合作模式" prop="cooperationMode">
        <el-select
          v-model="queryParams.cooperationMode"
          placeholder="请选择合作模式"
          multiple
          clearable
          collapse-tags
          collapse-tags-tooltip
        >
          <el-option
            v-for="item in COOPERATION_MODE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="分销品类" prop="category">
        <el-select
          v-model="queryParams.category"
          placeholder="请选择分销品类"
          multiple
          clearable
          collapse-tags
          collapse-tags-tooltip
        >
          <el-option
            v-for="item in DIST_CATEGORY_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="合作状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择状态"
          multiple
          clearable
          collapse-tags
          collapse-tags-tooltip
        >
          <el-option
            v-for="item in DISTRIBUTOR_STATUS_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="更新时间" prop="updateTime">
        <el-date-picker
          v-model="queryParams.updateTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="datetimerange"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
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
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="warning"
          plain
          :disabled="selectedList.length === 0"
          @click="handleBatchStatusChange(DistributorStatusEnum.PAUSED)"
        >
          <Icon icon="ep:video-pause" class="mr-5px" /> 批量暂停
        </el-button>
        <el-button
          type="success"
          plain
          :disabled="selectedList.length === 0"
          @click="handleBatchStatusChange(DistributorStatusEnum.NORMAL)"
        >
          <Icon icon="ep:video-play" class="mr-5px" /> 批量恢复
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="48" />
      <el-table-column label="分销商名称" align="center" prop="name" min-width="160">
        <template #default="{ row }">
          <el-link :underline="false" type="primary" @click="openDetail(row.id)">
            {{ row.name }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="分销商编号" align="center" prop="code" min-width="110" />
      <el-table-column label="等级" align="center" prop="level" min-width="110">
        <template #default="{ row }">
          <el-tag size="small" type="primary">
            {{ getDistributionLevelLabel(row.level) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="合作模式" align="center" prop="cooperationMode" min-width="160">
        <template #default="{ row }">
          <el-tag
            v-for="mode in row.cooperationMode || []"
            :key="mode"
            class="m-2px"
            size="small"
          >
            {{ getCooperationModeLabel(mode) }}
          </el-tag>
          <span v-if="!row.cooperationMode?.length">-</span>
        </template>
      </el-table-column>
      <el-table-column label="关联项目" align="center" prop="projectCount" min-width="100" />
      <el-table-column label="分销品类" align="center" prop="category" min-width="160">
        <template #default="{ row }">
          <el-tag
            v-for="tag in row.category || []"
            :key="tag"
            class="m-2px"
            size="small"
            type="info"
          >
            {{ getDistCategoryLabel(tag) }}
          </el-tag>
          <span v-if="!row.category?.length">-</span>
        </template>
      </el-table-column>
      <el-table-column label="商品类型" align="center" prop="productType" min-width="160">
        <template #default="{ row }">
          <el-tag
            v-for="tag in row.productType || []"
            :key="tag"
            class="m-2px"
            size="small"
            type="success"
          >
            {{ getDistProductTypeLabel(tag) }}
          </el-tag>
          <span v-if="!row.productType?.length">-</span>
        </template>
      </el-table-column>
      <el-table-column label="分销SKU商品数" align="center" prop="skuCount" min-width="130" />
      <el-table-column label="合作状态" align="center" prop="status" min-width="110">
        <template #default="{ row }">
          <el-tag :type="getDistributorStatusType(row.status)" size="small">
            {{ getDistributorStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="合作时间"
        align="center"
        prop="cooperationTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column
        label="更新时间"
        align="center"
        prop="updateTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="操作" align="center" fixed="right" width="280">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">详情</el-button>
          <el-button link type="primary" @click="openForm(row.id)">编辑</el-button>
          <el-button
            v-if="row.status === DistributorStatusEnum.NORMAL"
            link
            type="warning"
            @click="handleStatusChange(row, DistributorStatusEnum.PAUSED)"
          >
            暂停
          </el-button>
          <el-button
            v-if="row.status === DistributorStatusEnum.PAUSED"
            link
            type="success"
            @click="handleStatusChange(row, DistributorStatusEnum.NORMAL)"
          >
            恢复
          </el-button>
          <el-button
            v-if="row.status !== DistributorStatusEnum.BLACKLIST"
            link
            type="danger"
            @click="handleStatusChange(row, DistributorStatusEnum.BLACKLIST)"
          >
            移入黑名单
          </el-button>
          <el-button
            v-if="row.status === DistributorStatusEnum.BLACKLIST"
            link
            type="success"
            @click="handleStatusChange(row, DistributorStatusEnum.NORMAL)"
          >
            移出黑名单
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <DistributorFormDialog
    v-model="formVisible"
    :id="formId"
    :mode="formMode"
    @success="handleFormSuccess"
  />
  <DistributorDetailDrawer
    ref="detailRef"
    v-model="detailVisible"
    :id="detailId"
    @success="getList"
    @edit="openForm"
    @open-detail="openDetail"
  />
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import { DistributorApi, DistributorVO } from '@/api/supplier/distribution'
import DistributorFormDialog from './form/index.vue'
import DistributorDetailDrawer from './detail/index.vue'
import {
  COOPERATION_MODE_OPTIONS,
  DIST_CATEGORY_OPTIONS,
  DISTRIBUTION_LEVEL_OPTIONS,
  DISTRIBUTOR_STATUS_OPTIONS,
  DistributorStatusEnum,
  getCooperationModeLabel,
  getDistCategoryLabel,
  getDistProductTypeLabel,
  getDistributionLevelLabel,
  getDistributorStatusLabel,
  getDistributorStatusType
} from '@/views/supplier/utils/constants'

defineOptions({ name: 'SupplierDistributor' })

const message = useMessage()

const loading = ref(true)
const list = ref<DistributorVO[]>([])
const total = ref(0)
const queryFormRef = ref()
const selectedList = ref<DistributorVO[]>([])
const nameOptions = ref<{ value: string; label: string }[]>([])
const codeOptions = ref<{ value: string; label: string }[]>([])
const formVisible = ref(false)
const formId = ref<number | undefined>(undefined)
const formMode = ref<'create' | 'edit' | 'view'>('create')
const detailVisible = ref(false)
const detailId = ref<number | undefined>(undefined)
const detailRef = ref()
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  name: undefined as string | undefined,
  code: undefined as string | undefined,
  level: [] as number[],
  cooperationMode: [] as string[],
  category: [] as string[],
  status: [] as number[],
  updateTime: [] as string[]
})

const getList = async () => {
  loading.value = true
  try {
    const data = await DistributorApi.getDistributorPage({ ...queryParams })
    list.value = Array.isArray(data?.list) ? data.list : []
    total.value = Number(data?.total) || 0
  } catch (error: any) {
    list.value = []
    total.value = 0
    message.error(error?.message || '加载分销商列表失败')
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
  handleQuery()
}

const openForm = (id?: number) => {
  formId.value = id
  formMode.value = id ? 'edit' : 'create'
  formVisible.value = true
}

const openDetail = (id?: number) => {
  if (!id) return
  detailId.value = id
  detailVisible.value = true
}

const handleFormSuccess = () => {
  getList()
  getFilterOptions()
  if (detailVisible.value) {
    detailRef.value?.reload?.()
  }
}

const getStatusActionText = (row: DistributorVO, targetStatus: number) => {
  if (targetStatus === DistributorStatusEnum.PAUSED) return '暂停分销'
  if (targetStatus === DistributorStatusEnum.BLACKLIST) return '移入黑名单'
  if (row.status === DistributorStatusEnum.BLACKLIST) return '移出黑名单'
  return '恢复合作'
}

const handleStatusChange = async (row: DistributorVO, status: number) => {
  const actionText = getStatusActionText(row, status)
  try {
    await message.confirm(`确认将分销商「${row.name}」${actionText}吗？`, `${actionText}确认`)
    await DistributorApi.updateDistributorStatus(row.id!, status)
    message.success(`${actionText}成功`)
    await getList()
  } catch {}
}

const handleSelectionChange = (rows: DistributorVO[]) => {
  selectedList.value = rows
}

const handleBatchStatusChange = async (status: number) => {
  if (selectedList.value.length === 0) return
  const actionText = status === DistributorStatusEnum.PAUSED ? '暂停分销' : '恢复合作'
  const names = selectedList.value.map((v) => v.name).join('、')
  try {
    await message.confirm(
      `确认将选中的 ${selectedList.value.length} 家分销商（${names}）${actionText}吗？`,
      `批量${actionText}确认`
    )
    await Promise.all(
      selectedList.value.map((row) => DistributorApi.updateDistributorStatus(row.id!, status))
    )
    message.success(`批量${actionText}成功`)
    await getList()
  } catch {}
}

const getFilterOptions = async () => {
  try {
    const [names, codes] = await Promise.all([
      DistributorApi.getDistributorNameList(),
      DistributorApi.getDistributorCodeList()
    ])
    nameOptions.value = names || []
    codeOptions.value = codes || []
  } catch {
    nameOptions.value = []
    codeOptions.value = []
  }
}

const loadPage = () => {
  getList()
  getFilterOptions()
}

onMounted(loadPage)
onActivated(loadPage)
</script>
