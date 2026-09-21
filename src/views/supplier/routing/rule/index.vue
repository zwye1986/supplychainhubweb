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
        <el-select v-model="queryParams.distributorCodes" multiple collapse-tags clearable filterable>
          <el-option v-for="item in MOCK_DISTRIBUTORS" :key="item.code" :label="item.name" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="适用项目" prop="projectCodes">
        <el-select v-model="queryParams.projectCodes" multiple collapse-tags clearable filterable>
          <el-option v-for="item in MOCK_PROJECTS" :key="item.code" :label="item.name" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="适用商品类型" prop="productTypeCodes">
        <el-select v-model="queryParams.productTypeCodes" multiple collapse-tags clearable>
          <el-option v-for="item in PRODUCT_TYPE_OPTIONS" :key="item.code" :label="item.name" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="适用供应商" prop="supplierCodes">
        <el-select v-model="queryParams.supplierCodes" multiple collapse-tags clearable filterable>
          <el-option v-for="item in MOCK_SUPPLIERS" :key="item.code" :label="item.name" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable>
          <el-option v-for="item in ROUTE_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="更新人" prop="updaters">
        <el-select v-model="queryParams.updaters" multiple collapse-tags clearable>
          <el-option v-for="item in MOCK_UPDATERS" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="更新时间">
        <el-date-picker
          v-model="updateRange"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
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
        <template #default="{ row }">{{ formatScope(row.supplierMode, row.supplierNames, '全部供应商') }}</template>
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
      <el-table-column label="更新人" prop="updater" min-width="100" />
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
import RuleForm from './RuleForm.vue'
import {
  MOCK_DISTRIBUTORS,
  MOCK_PROJECTS,
  MOCK_SUPPLIERS,
  MOCK_UPDATERS,
  PRODUCT_TYPE_OPTIONS,
  ROUTE_MODE_OPTIONS,
  ROUTE_STATUS_OPTIONS,
  formatScope,
  getOptionLabel
} from '@/views/supplier/routing/rule/utils/constants'

defineOptions({ name: 'RoutingRule' })

const message = useMessage()
const loading = ref(false)
const list = ref<RouteRuleVO[]>([])
const total = ref(0)
const formRef = ref()
const queryFormRef = ref()
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

onMounted(getList)
</script>
