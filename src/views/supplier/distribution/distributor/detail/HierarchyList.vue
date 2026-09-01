<template>
  <ContentWrap v-loading="loading">
    <el-alert
      class="mb-16px"
      type="info"
      :closable="false"
      title="展示当前分销商的下级分销链路及下级分销商列表。本页只读，维护操作请进入对应分销商详情。"
    />

    <el-empty v-if="!loading && !list.length" description="暂无下级分销商" />

    <el-table v-else :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="分销商名称" prop="name" min-width="160">
        <template #default="{ row }">
          <el-link :underline="false" type="primary" @click="emit('open-detail', row.id)">
            {{ row.name }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="分销商编号" prop="code" min-width="150" />
      <el-table-column label="分销等级" prop="level" min-width="120">
        <template #default="{ row }">
          {{ getDistributionLevelLabel(row.level) }}
        </template>
      </el-table-column>
      <el-table-column label="合作模式" prop="cooperationMode" min-width="140">
        <template #default="{ row }">
          {{
            (row.cooperationMode || [])
              .map((mode: string) => getCooperationModeLabel(mode))
              .join('、') || '-'
          }}
        </template>
      </el-table-column>
      <el-table-column label="联系人" prop="contactName" min-width="100" />
      <el-table-column label="手机号" prop="contactMobile" min-width="120" />
      <el-table-column label="合作状态" prop="status" min-width="110">
        <template #default="{ row }">
          <el-tag :type="getDistributorStatusType(row.status)" size="small">
            {{ getDistributorStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="分销商品SKU数" prop="skuCount" min-width="120" />
      <el-table-column
        label="创建时间"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="emit('open-detail', row.id)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import { DistributorApi, DistributorVO } from '@/api/supplier/distribution'
import {
  getCooperationModeLabel,
  getDistributionLevelLabel,
  getDistributorStatusLabel,
  getDistributorStatusType
} from '@/views/supplier/utils/constants'

defineOptions({ name: 'DistributorHierarchyList' })

const props = defineProps<{
  distributorId: number
}>()

const emit = defineEmits<{
  'open-detail': [id: number]
}>()

const loading = ref(false)
const list = ref<DistributorVO[]>([])

const loadData = async () => {
  if (!props.distributorId) return
  loading.value = true
  try {
    list.value = (await DistributorApi.getChildren(props.distributorId)) || []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.distributorId,
  () => loadData(),
  { immediate: true }
)
</script>
