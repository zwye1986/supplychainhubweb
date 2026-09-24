<template>
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      class="-mb-15px search-form"
      :model="queryParams"
      :inline="true"
      label-width="110px"
    >
      <el-form-item label="规则名称" prop="name">
        <el-input v-model="queryParams.name" maxlength="50" placeholder="请输入规则名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="适用分销商" prop="distributorCodes">
        <el-select
          v-model="queryParams.distributorCodes"
          multiple
          collapse-tags
          clearable
          filterable
          placeholder="请选择适用分销商"
        >
          <el-option v-for="item in distributorOptions" :key="item.code" :label="item.name" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="适用项目" prop="projectCodes">
        <el-select
          v-model="queryParams.projectCodes"
          multiple
          collapse-tags
          clearable
          filterable
          placeholder="请选择适用项目"
        >
          <el-option v-for="item in projectOptions" :key="item.code" :label="item.name" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="适用商品类型" prop="productTypeCodes">
        <ProductType v-model="queryParams.productTypeCodes" placeholder="请选择适用商品类型" />
      </el-form-item>
      <el-form-item label="适用供应商" prop="supplierCodes">
        <el-select
          v-model="queryParams.supplierCodes"
          multiple
          collapse-tags
          clearable
          filterable
          placeholder="请选择适用供应商"
        >
          <el-option v-for="item in supplierOptions" :key="item.code" :label="item.name" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="请选择状态">
          <el-option v-for="item in ROUTE_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="更新人" prop="updaters">
        <el-select
          v-model="queryParams.updaters"
          multiple
          collapse-tags
          clearable
          filterable
          placeholder="请选择更新人"
        >
          <el-option v-for="item in userOptions" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="更新时间">
        <el-date-picker
          v-model="updateRange"
          type="datetimerange"
          value-format="YYYY-MM-DDTHH:mm:ss"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          clearable
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
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="规则名称" prop="name" min-width="180">
        <template #default="{ row }">
          <span>{{ row.name }}</span>
          <el-tag v-if="row.protectedRule" class="ml-8px" size="small" type="warning">默认</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="适用分销商" min-width="160">
        <template #default="{ row }">{{ formatScope(row.distributorMode, row.distributorNames, '全部分销商') }}</template>
      </el-table-column>
      <el-table-column label="适用项目" min-width="160">
        <template #default="{ row }">{{ formatScope(row.projectMode, row.projectNames, '全部项目') }}</template>
      </el-table-column>
      <el-table-column label="适用商品类型" min-width="150">
        <template #default="{ row }">{{ formatScope(row.productTypeMode, row.productTypeNames, '全部类型') }}</template>
      </el-table-column>
      <el-table-column label="路由模式" min-width="110">
        <template #default="{ row }">{{ getOptionLabel(ROUTE_MODE_OPTIONS, row.routeMode) }}</template>
      </el-table-column>
      <el-table-column label="适用供应商" min-width="160">
        <template #default="{ row }">{{ formatSuppliers(row) }}</template>
      </el-table-column>
      <el-table-column label="稳定" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small" type="success">{{ strategyRank(row, 'STABLE') }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="价格" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small" type="warning">{{ strategyRank(row, 'PRICE') }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="综合" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small">{{ strategyRank(row, 'COMPOSITE') }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-switch
            :model-value="row.status"
            active-value="ENABLED"
            inactive-value="DISABLED"
            @change="(val) => handleStatus(row, String(val))"
          />
        </template>
      </el-table-column>
      <el-table-column label="更新人" min-width="100">
        <template #default="{ row }">{{ formatUpdater(row.updater) }}</template>
      </el-table-column>
      <el-table-column label="更新时间" prop="updateTime" min-width="170" />
      <el-table-column label="操作" fixed="right" width="140">
        <template #default="{ row }">
          <el-button link type="primary" @click="openForm(row.ruleCode)">编辑</el-button>
          <el-button v-if="!row.protectedRule" link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && !list.length" description="暂无路由规则" />
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>
  <RuleForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { RoutingApi, RouteRuleVO, RouteStrategy } from '@/api/routing'
import { DistributorApi, ProjectApi } from '@/api/supplier/distribution'
import { SupplierApi } from '@/api/supplier/manage'
import { getSimpleUserList } from '@/api/system/user'
import RuleForm from './RuleForm.vue'
import {
  ROUTE_MODE_OPTIONS,
  ROUTE_STATUS_OPTIONS,
  formatScope,
  getOptionLabel
} from '@/views/supplier/routing/rule/utils/constants'

defineOptions({ name: 'RoutingRule' })

interface CodeNameOption {
  code: string
  name: string
}

interface UserOption {
  id: string
  name: string
}

const message = useMessage()
const loading = ref(false)
const list = ref<RouteRuleVO[]>([])
const total = ref(0)
const formRef = ref()
const queryFormRef = ref()
const distributorOptions = ref<CodeNameOption[]>([])
const projectOptions = ref<CodeNameOption[]>([])
const supplierOptions = ref<CodeNameOption[]>([])
const userOptions = ref<UserOption[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined as string | undefined,
  distributorCodes: [] as string[],
  projectCodes: [] as string[],
  productTypeCodes: [] as string[],
  supplierCodes: [] as string[],
  status: undefined as RouteRuleVO['status'] | undefined,
  updaters: [] as string[],
  updateFrom: undefined as string | undefined,
  updateTo: undefined as string | undefined
})
const updateRange = computed<string[]>({
  get: () =>
    queryParams.updateFrom && queryParams.updateTo ? [queryParams.updateFrom, queryParams.updateTo] : [],
  set: (val) => {
    queryParams.updateFrom = val?.[0]
    queryParams.updateTo = val?.[1]
  }
})

const strategyRank = (row: RouteRuleVO, strategy: RouteStrategy) => {
  const index = (row.priorities || []).findIndex((item) => item.strategy === strategy)
  return index >= 0 ? index + 1 : '-'
}

const formatSuppliers = (row: RouteRuleVO) => {
  if (row.routeMode === 'FIXED') return row.primarySupplierName || row.supplierNames?.[0] || '-'
  return formatScope(row.supplierMode, row.supplierNames, '全部供应商')
}

const formatUpdater = (updater?: string) => {
  if (!updater) return '-'
  return userOptions.value.find((item) => item.id === updater)?.name || updater
}

const toCodeName = (code?: string, name?: string) => ({ code: code || '', name: name || code || '' })

const loadOptions = async () => {
  const [distributors, projects, suppliers, users] = await Promise.all([
    DistributorApi.getDistributorNameList().catch(() => []),
    ProjectApi.getProjectNameList().catch(() => []),
    SupplierApi.getSupplierNameList({ view: 'simple' }).catch(() => []),
    getSimpleUserList().catch(() => [])
  ])
  distributorOptions.value = (distributors || [])
    .map((item) => toCodeName(item.code, item.label || item.value))
    .filter((item) => item.code)
  projectOptions.value = (projects || [])
    .map((item) => toCodeName(item.code, item.label || item.value))
    .filter((item) => item.code)
  const supplierList = Array.isArray(suppliers) ? suppliers : suppliers?.list || []
  supplierOptions.value = supplierList
    .map((item: { supplierCode?: string; code?: string; supplierName?: string; name?: string }) =>
      toCodeName(item.supplierCode || item.code, item.supplierName || item.name)
    )
    .filter((item: CodeNameOption) => item.code)
  userOptions.value = (users || [])
    .map((item) => ({ id: String(item.id), name: item.nickname || item.username || String(item.id) }))
    .filter((item) => item.id)
}

const getList = async () => {
  loading.value = true
  try {
    const data = await RoutingApi.getPage(queryParams)
    list.value = data.list || []
    total.value = data.total || 0
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
  queryParams.updateFrom = undefined
  queryParams.updateTo = undefined
  handleQuery()
}

const openForm = (ruleCode?: string) => formRef.value.open(ruleCode)

const handleDelete = async (row: RouteRuleVO) => {
  try {
    await message.confirm(`确认删除路由规则「${row.name}」？`)
    await RoutingApi.delete(row.ruleCode)
    message.success('删除成功')
    getList()
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  }
}

const handleStatus = async (row: RouteRuleVO, next: string) => {
  const target = next === 'ENABLED' ? 'ENABLED' : 'DISABLED'
  try {
    await message.confirm(`确认${target === 'ENABLED' ? '启用' : '停用'}规则「${row.name}」？`)
    await RoutingApi.changeStatus(row.ruleCode, target)
    message.success('操作成功')
    getList()
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  }
}

onMounted(() => {
  loadOptions()
  getList()
})
</script>
