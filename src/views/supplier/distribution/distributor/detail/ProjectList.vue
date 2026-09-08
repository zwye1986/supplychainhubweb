<template>
  <ContentWrap v-loading="loading">
    <el-alert class="mb-16px" type="info" :closable="false">
      <template #title>
        该分销商关联了 {{ list.length }} 个项目。项目内对特定SKU配置了项目专属定价，结算时项目定价优先于基础销售价。未配置项目定价的SKU按基础销售价结算。
      </template>
    </el-alert>

    <el-empty v-if="!loading && !list.length" description="暂无关联项目" />

    <el-row v-else :gutter="16">
      <el-col
        v-for="item in list"
        :key="item.projectCode || item.id"
        :xs="24"
        :sm="12"
        :lg="8"
        class="mb-16px"
      >
        <el-card shadow="hover" class="h-full">
          <div class="mb-10px flex items-start justify-between gap-8px">
            <div class="min-w-0 truncate text-16px font-600">{{ item.projectName }}</div>
            <el-tag :type="getProjectStatusType(item.status)" size="small">
              {{ getProjectStatusLabel(item.status) }}
            </el-tag>
          </div>
          <div class="mb-6px text-13px text-gray-500">编号：{{ item.projectCode || '-' }}</div>
          <div class="mb-6px text-13px text-gray-500">
            周期：{{ item.startDate || '-' }} ~ {{ item.endDate || '-' }}
          </div>
          <div class="mb-6px text-13px">
            商品SKU数：<span class="font-600">{{ item.skuCount ?? 0 }}</span>
          </div>
          <div class="mb-6px text-13px">
            项目定价覆盖（SKU）：
            <span class="font-600 text-[var(--el-color-warning)]">
              {{ item.projectPriceSkuCount ?? 0 }}
            </span>
          </div>
          <div class="mb-12px text-13px">
            结算方：{{ getSettlementPartyTypeLabel(item.settlementPartyType) }}
          </div>
          <el-button link type="primary" @click="handleViewDetail(item)">查看详情</el-button>
        </el-card>
      </el-col>
    </el-row>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { DistributorApi, DistributorProjectVO } from '@/api/supplier/distribution'
import {
  getProjectStatusLabel,
  getProjectStatusType,
  getSettlementPartyTypeLabel
} from '@/views/supplier/utils/constants'

defineOptions({ name: 'DistributorProjectList' })

const props = defineProps<{
  buyerCode: string
}>()

const router = useRouter()
const loading = ref(false)
const list = ref<DistributorProjectVO[]>([])

const loadData = async () => {
  if (!props.buyerCode) return
  loading.value = true
  try {
    list.value = (await DistributorApi.getProjectList(props.buyerCode)) || []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

const handleViewDetail = (item: DistributorProjectVO) => {
  if (!item.projectCode) return
  router.push({
    name: 'SupplierDistributionProject',
    query: { projectCode: item.projectCode }
  })
}

watch(
  () => props.buyerCode,
  () => loadData(),
  { immediate: true }
)
</script>
