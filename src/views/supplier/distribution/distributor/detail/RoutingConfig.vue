<template>
  <div v-loading="loading" class="routing-config">
    <div class="routing-config__title">生效路由规则</div>
    <el-empty v-if="!loading && !list.length" description="暂无命中该分销商的启用路由规则" :image-size="80" />
    <div v-else class="routing-config__table">
      <el-table :data="list" row-key="ruleCode" :show-overflow-tooltip="true">
        <el-table-column label="规则名称" min-width="180">
          <template #default="{ row }">
            <span>{{ row.name || '-' }}</span>
            <el-tag v-if="row.protectedRule" class="ml-8px" size="small" type="info" effect="plain">
              默认
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="适用商品类型" min-width="140">
          <template #default="{ row }">
            {{ formatScope(row.productTypeMode, row.productTypeNames) }}
          </template>
        </el-table-column>
        <el-table-column label="适用分销商" min-width="160">
          <template #default="{ row }">
            {{ formatScope(row.distributorMode, row.distributorNames) }}
          </template>
        </el-table-column>
        <el-table-column label="路由模式" min-width="120">
          <template #default="{ row }">
            {{ getDictLabel('supply_chain_routing_mode', row.routeMode) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="稳定" width="80" align="center">
          <template #default="{ row }">
            <span class="rank-dot">{{ strategyRank(row, 'STABLE') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="80" align="center">
          <template #default="{ row }">
            <span class="rank-dot">{{ strategyRank(row, 'PRICE') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="综合" width="80" align="center">
          <template #default="{ row }">
            <span class="rank-dot">{{ strategyRank(row, 'COMPOSITE') }}</span>
          </template>
        </el-table-column>
        </el-table>
    </div>
    <Pagination
      v-if="total > queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
  </div>
</template>

<script lang="ts" setup>
import { RoutingApi, type RouteRuleVO, type RouteStrategy } from '@/api/routing'
import { getDictLabel } from '@/utils/dict'

defineOptions({ name: 'DistributorRoutingConfig' })

const props = defineProps<{
  buyerCode: string
}>()

const loading = ref(false)
const list = ref<RouteRuleVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10
})

const formatScope = (mode?: string, names?: string[]) => {
  if (mode !== 'SPECIFIED') return '全部'
  return names?.length ? names.join('、') : '全部'
}

const strategyRank = (row: RouteRuleVO, strategy: RouteStrategy) => {
  const index = (row.priorities || []).findIndex((item) => item.strategy === strategy)
  return index >= 0 ? index + 1 : '-'
}

const getList = async () => {
  if (!props.buyerCode) {
    list.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const data = await RoutingApi.getPage({
      pageNo: queryParams.pageNo,
      pageSize: queryParams.pageSize,
      distributorCodes: [props.buyerCode],
      status: 'ENABLED'
    })
    list.value = (data.list || []).filter((item) => item.status === 'ENABLED')
    total.value = data.total || 0
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
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
.routing-config {
  padding: 4px 0 12px;
}

.routing-config__title {
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
}

.routing-config__table {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}

.routing-config__table :deep(.el-table) {
  --el-table-header-bg-color: #f5f7fa;
  --el-table-header-text-color: var(--el-text-color-regular);
  --el-table-border-color: var(--el-border-color-extra-light);
}

.routing-config__table :deep(.el-table th.el-table__cell) {
  font-weight: 500;
}

.routing-config__table :deep(.el-table td.el-table__cell),
.routing-config__table :deep(.el-table th.el-table__cell) {
  border-right: none;
}

.rank-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #8bc34a;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}
</style>
