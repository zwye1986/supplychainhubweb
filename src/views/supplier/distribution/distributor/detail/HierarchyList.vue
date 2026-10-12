<template>
  <div v-loading="loading" class="hierarchy-page">
    <section class="hierarchy-section">
      <div class="hierarchy-section__title">分销链路</div>
      <div class="hierarchy-chain">
        <el-tag class="hierarchy-chain__node" type="primary" effect="light" round>
          {{ buyerName || buyerCode || '-' }}
        </el-tag>
      </div>
    </section>

    <section class="hierarchy-section">
      <div class="hierarchy-section__title">下级分销商（{{ list.length }}家）</div>
      <el-empty v-if="!loading && !list.length" description="暂无下级分销商" :image-size="80" />
      <div v-else class="hierarchy-table">
        <el-table :data="list" :show-overflow-tooltip="true">
          <el-table-column label="分销商名称" min-width="220">
            <template #default="{ row }">
              <span class="hierarchy-name" @click="openChildDetail(row)">
                {{ row.buyerName || '-' }}
              </span>
              <span v-if="row.buyerCode" class="hierarchy-code">{{ row.buyerCode }}</span>
            </template>
          </el-table-column>
          <el-table-column label="等级" width="90" align="center">
            <template #default="{ row }">
              <el-tag class="hierarchy-level" type="primary" effect="light" size="small" round>
                {{ formatLevel(row.distributionLevel) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="合作模式" min-width="140">
            <template #default="{ row }">
              {{ formatCooperationModes(row.cooperationModes) }}
            </template>
          </el-table-column>
          <el-table-column label="关联项目" width="110">
            <template #default="{ row }">{{ `${row.projectCount ?? 0}个` }}</template>
          </el-table-column>
          <el-table-column label="状态" width="110" align="center">
            <template #default="{ row }">
              <dict-tag
                v-if="row.status"
                type="supply_chain_buyer_status"
                :value="row.status"
              />
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { DistributorApi, type BuyerChildItem } from '@/api/supplier/distribution'
import { getDictLabel } from '@/utils/dict'

defineOptions({ name: 'DistributorHierarchyList' })

const props = defineProps<{
  buyerCode: string
  buyerName?: string
}>()

const emit = defineEmits<{
  'open-detail': [buyerCode: string]
}>()

const loading = ref(false)
const list = ref<BuyerChildItem[]>([])

const formatLevel = (level?: number) => {
  const value = Number(level)
  return Number.isFinite(value) && value > 0 ? `${value}级` : '-'
}

const formatCooperationModes = (modes?: string[]) => {
  if (!modes?.length) return '-'
  return modes
    .map((mode) => getDictLabel('supply_chain_cooperation_mode', mode) || mode)
    .filter(Boolean)
    .join('、')
}

const openChildDetail = (row: BuyerChildItem) => {
  if (!row.buyerCode) return
  emit('open-detail', row.buyerCode)
}

const loadData = async () => {
  if (!props.buyerCode) return
  loading.value = true
  try {
    list.value = (await DistributorApi.getBuyerChildren(props.buyerCode)) || []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.buyerCode,
  () => loadData(),
  { immediate: true }
)
</script>

<style scoped>
.hierarchy-page {
  padding: 4px 0 12px;
}

.hierarchy-section + .hierarchy-section {
  margin-top: 28px;
}

.hierarchy-section__title {
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
}

.hierarchy-chain {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hierarchy-chain__node {
  --el-tag-bg-color: #eef4ff;
  --el-tag-border-color: transparent;
  --el-tag-text-color: var(--el-color-primary);
  font-size: 13px;
  height: 28px;
  padding: 0 12px;
}

.hierarchy-table {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}

.hierarchy-table :deep(.el-table) {
  --el-table-header-bg-color: #f5f7fa;
  --el-table-header-text-color: var(--el-text-color-regular);
  --el-table-border-color: var(--el-border-color-extra-light);
}

.hierarchy-table :deep(.el-table th.el-table__cell) {
  font-weight: 500;
}

.hierarchy-table :deep(.el-table td.el-table__cell),
.hierarchy-table :deep(.el-table th.el-table__cell) {
  border-right: none;
}

.hierarchy-name {
  color: var(--el-color-primary);
  cursor: pointer;
  font-weight: 500;
}

.hierarchy-name:hover {
  text-decoration: underline;
}

.hierarchy-code {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.hierarchy-level {
  --el-tag-bg-color: #f0f0ff;
  --el-tag-border-color: transparent;
  --el-tag-text-color: #6b6bd6;
}
</style>
