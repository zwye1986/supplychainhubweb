<template>
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      class="-mb-15px search-form"
      :model="queryParams"
      :inline="true"
      label-width="90px"
    >
      <el-form-item label="供应商名称" prop="name">
        <el-select
          v-model="queryParams.name"
          placeholder="请选择/输入供应商名称"
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
      <el-form-item label="供应商编号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="供应商编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="可售品类" prop="category">
        <el-select
          v-model="queryParams.category"
          placeholder="请选择品类"
          multiple
          clearable
          collapse-tags
          collapse-tags-tooltip
        >
          <el-option
            v-for="item in SUPPLIER_CATEGORY_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="供货模式" prop="supplyMode">
        <el-select
          v-model="queryParams.supplyMode"
          placeholder="请选择供货模式"
          multiple
          clearable
          collapse-tags
          collapse-tags-tooltip
        >
          <el-option
            v-for="item in SUPPLIER_SUPPLY_MODE_OPTIONS"
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
            v-for="item in SUPPLIER_STATUS_OPTIONS"
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
        <el-button
          type="primary"
          plain
          @click="openForm()"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="warning"
          plain
          :disabled="selectedList.length === 0"
          @click="handleBatchStatusChange(SupplierStatusEnum.PAUSED)"
        >
          <Icon icon="ep:video-pause" class="mr-5px" /> 批量暂停
        </el-button>
        <el-button
          type="success"
          plain
          :disabled="selectedList.length === 0"
          @click="handleBatchStatusChange(SupplierStatusEnum.NORMAL)"
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
      <el-table-column label="供应商名称" align="center" prop="name" min-width="160">
        <template #default="{ row }">
          <el-link :underline="false" type="primary" @click="openDetail(row.id)">
            {{ row.name }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="供应商编号" align="center" prop="code" min-width="140" />
      <el-table-column label="可售品类" align="center" prop="category" min-width="160">
        <template #default="{ row }">
          <el-tag
            v-for="tag in row.category || []"
            :key="tag"
            class="m-2px"
            size="small"
            type="info"
          >
            {{ getCategoryLabel(tag) }}
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
            {{ getProductTypeLabel(tag) }}
          </el-tag>
          <span v-if="!row.productType?.length">-</span>
        </template>
      </el-table-column>
      <el-table-column label="商品分类" align="center" prop="productCategory" min-width="200">
        <template #default="{ row }">
          <el-tag
            v-for="tag in row.productCategory || []"
            :key="tag"
            class="m-2px"
            size="small"
            type="warning"
          >
            {{ getProductCategoryLabel(tag) }}
          </el-tag>
          <span v-if="!row.productCategory?.length">-</span>
        </template>
      </el-table-column>
      <el-table-column label="供货模式" align="center" prop="supplyMode" min-width="180">
        <template #default="{ row }">
          <el-tag
            v-for="tag in row.supplyMode || []"
            :key="tag"
            class="m-2px"
            size="small"
            type="primary"
          >
            {{ getSupplyModeLabel(tag) }}
          </el-tag>
          <span v-if="!row.supplyMode?.length">-</span>
        </template>
      </el-table-column>
      <el-table-column label="合作商品SKU数" align="center" prop="skuCount" min-width="160" />
      <el-table-column label="合作状态" align="center" prop="status" min-width="110">
        <template #default="{ row }">
          <el-tag :type="getSupplierStatusType(row.status)" size="small">
            {{ getSupplierStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="接入时间"
        align="center"
        prop="accessTime"
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
          <!-- 正常：暂停 -->
          <el-button
            v-if="row.status === SupplierStatusEnum.NORMAL"
            link
            type="warning"
            @click="handleStatusChange(row, SupplierStatusEnum.PAUSED)"
          >
            暂停
          </el-button>
          <!-- 暂停供货：恢复 -->
          <el-button
            v-if="row.status === SupplierStatusEnum.PAUSED"
            link
            type="success"
            @click="handleStatusChange(row, SupplierStatusEnum.NORMAL)"
          >
            恢复
          </el-button>
          <!-- 正常 / 暂停供货：移入黑名单 -->
          <el-button
            v-if="row.status !== SupplierStatusEnum.BLACKLIST"
            link
            type="danger"
            @click="handleStatusChange(row, SupplierStatusEnum.BLACKLIST)"
          >
            移入黑名单
          </el-button>
          <!-- 黑名单：移出黑名单 -->
          <el-button
            v-if="row.status === SupplierStatusEnum.BLACKLIST"
            link
            type="success"
            @click="handleStatusChange(row, SupplierStatusEnum.NORMAL)"
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

  <SupplierFormDialog
    v-model="formVisible"
    :id="formId"
    :mode="formMode"
    @success="handleFormSuccess"
  />
  <SupplierDetailDrawer
    ref="detailRef"
    v-model="detailVisible"
    :id="detailId"
    @success="getList"
    @edit="openForm"
  />
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import { SupplierApi, SupplierVO } from '@/api/supplier/manage'
import SupplierFormDialog from './form/index.vue'
import SupplierDetailDrawer from './detail/index.vue'
import {
  SUPPLIER_STATUS_OPTIONS,
  SUPPLIER_CATEGORY_OPTIONS,
  SUPPLIER_SUPPLY_MODE_OPTIONS,
  SupplierStatusEnum,
  getCategoryLabel,
  getProductTypeLabel,
  getProductCategoryLabel,
  getSupplyModeLabel,
  getSupplierStatusLabel,
  getSupplierStatusType
} from '@/views/supplier/utils/constants'

defineOptions({ name: 'SupplierManage' })

const message = useMessage()

const loading = ref(true)
const list = ref<SupplierVO[]>([])
const total = ref(0)
const queryFormRef = ref()
const selectedList = ref<SupplierVO[]>([])
const nameOptions = ref<{ value: string; label: string }[]>([])
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
  category: [] as string[],
  supplyMode: [] as string[],
  status: [] as number[],
  updateTime: [] as string[]
})

/** 查询列表（默认按更新时间倒序，由后端处理） */
const getList = async () => {
  loading.value = true
  try {
    const data = await SupplierApi.getSupplierPage({ ...queryParams })
    list.value = Array.isArray(data?.list) ? data.list : []
    total.value = Number(data?.total) || 0
  } catch (error: any) {
    list.value = []
    total.value = 0
    message.error(error?.message || '加载供应商列表失败')
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

/** 表单保存后刷新列表；详情抽屉仍打开时同步刷新 */
const handleFormSuccess = () => {
  getList()
  if (detailVisible.value) {
    detailRef.value?.reload?.()
  }
}

/** 按当前状态展示对应操作文案并二次确认 */
const getStatusActionText = (row: SupplierVO, targetStatus: number) => {
  if (targetStatus === SupplierStatusEnum.PAUSED) return '暂停供货'
  if (targetStatus === SupplierStatusEnum.BLACKLIST) return '移入黑名单'
  if (row.status === SupplierStatusEnum.BLACKLIST) return '移出黑名单'
  return '恢复合作'
}

const handleStatusChange = async (row: SupplierVO, status: number) => {
  const actionText = getStatusActionText(row, status)
  try {
    await message.confirm(`确认将供应商「${row.name}」${actionText}吗？`, `${actionText}确认`)
    await SupplierApi.updateSupplierStatus(row.id!, status)
    message.success(`${actionText}成功`)
    await getList()
  } catch {}
}

/** 表格多选 */
const handleSelectionChange = (rows: SupplierVO[]) => {
  selectedList.value = rows
}

/** 批量状态变更 */
const handleBatchStatusChange = async (status: number) => {
  if (selectedList.value.length === 0) return
  const actionText = status === SupplierStatusEnum.PAUSED ? '暂停供货' : '恢复合作'
  const names = selectedList.value.map((v) => v.name).join('、')
  try {
    await message.confirm(
      `确认将选中的 ${selectedList.value.length} 家供应商（${names}）${actionText}吗？`,
      `批量${actionText}确认`
    )
    await Promise.all(
      selectedList.value.map((row) => SupplierApi.updateSupplierStatus(row.id!, status))
    )
    message.success(`批量${actionText}成功`)
    await getList()
  } catch {}
}

/** 加载供应商名称下拉选项 */
const getNameOptions = async () => {
  try {
    nameOptions.value = (await SupplierApi.getSupplierNameList()) || []
  } catch {
    nameOptions.value = []
  }
}

const loadPage = () => {
  getList()
  getNameOptions()
}

onMounted(loadPage)
/** keep-alive 场景下再次进入时重新拉取，避免缓存空列表 */
onActivated(loadPage)
</script>
