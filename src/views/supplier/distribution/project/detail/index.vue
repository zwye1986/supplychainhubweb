<template>
  <el-drawer
    v-model="drawerVisible"
    title="项目详情"
    size="80%"
    append-to-body
    destroy-on-close
    @closed="handleClosed"
  >
    <div v-loading="loading">
      <div class="flex items-start justify-between">
        <div class="min-w-0">
          <div class="mb-8px flex items-center gap-10px">
            <span class="truncate text-20px font-700">{{ project.name || '项目详情' }}</span>
            <el-tag :type="getProjectStatusType(project.status)" size="small">
              {{ getProjectStatusLabel(project.status) }}
            </el-tag>
            <el-tag v-if="project.projectType" size="small" type="primary">
              {{ getProjectTypeLabel(project.projectType) }}
            </el-tag>
          </div>
          <div class="text-13px text-gray-500">编号：{{ project.code || '-' }}</div>
        </div>
        <div>
          <el-button type="primary" @click="openEdit">编辑</el-button>
          <el-button
            v-if="project.status === ProjectStatusEnum.DRAFT"
            type="success"
            plain
            @click="handleStatusChange(ProjectStatusEnum.ACTIVE, '启动项目')"
          >
            启动
          </el-button>
          <el-button
            v-if="project.status === ProjectStatusEnum.ACTIVE"
            type="warning"
            plain
            @click="handleStatusChange(ProjectStatusEnum.PAUSED, '暂停项目')"
          >
            暂停
          </el-button>
          <el-button
            v-if="project.status === ProjectStatusEnum.PAUSED"
            type="success"
            plain
            @click="handleStatusChange(ProjectStatusEnum.ACTIVE, '恢复项目')"
          >
            恢复
          </el-button>
          <el-button
            v-if="
              project.status === ProjectStatusEnum.ACTIVE ||
              project.status === ProjectStatusEnum.PAUSED
            "
            type="info"
            plain
            @click="handleStatusChange(ProjectStatusEnum.CLOSED, '结束项目')"
          >
            结束
          </el-button>
        </div>
      </div>

      <el-descriptions class="mt-16px" :column="3" border>
        <el-descriptions-item label="关联分销商">
          {{ project.distributorName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="项目类型">
          {{ getProjectTypeLabel(project.projectType) }}
        </el-descriptions-item>
        <el-descriptions-item label="项目周期">
          {{ periodText }}
        </el-descriptions-item>
        <el-descriptions-item label="商品数（SKU）">
          {{ project.skuCount ?? 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="项目定价覆盖（SKU）">
          <span class="text-[var(--el-color-warning)] font-600">
            {{ project.projectPriceSkuCount ?? 0 }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="结算方">
          {{ project.settlementParty || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="activeTab" class="mt-16px">
        <el-tab-pane label="基础信息" name="basic">
          <el-alert class="mb-16px" type="info" :closable="false">
            <template #title>
              项目是中台与分销商之间的合作载体，用于管理特定业务场景下的SKU范围和定价规则。一个项目关联一个分销商，可对部分SKU设定项目专属价覆盖基础销售价。
            </template>
          </el-alert>
          <el-form :model="project" label-width="140px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="项目名称">
                  {{ displayText(project.name) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="项目编号">
                  {{ displayText(project.code) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="关联分销商">
                  {{ displayText(project.distributorName) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="项目类型">
                  {{ getProjectTypeLabel(project.projectType) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="项目周期">
                  {{ periodText }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="结算方">
                  {{ displayText(project.settlementParty) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="项目状态">
                  {{ getProjectStatusLabel(project.status) }}
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="项目描述">
                  {{ displayText(project.description) }}
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="分销商品" name="product" lazy>
          <ProductList
            v-if="projectId"
            :project-id="projectId"
            :distributor-id="project.distributorId"
          />
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ProjectApi, ProjectVO } from '@/api/supplier/distribution'
import {
  ProjectStatusEnum,
  getProjectStatusLabel,
  getProjectStatusType,
  getProjectTypeLabel
} from '@/views/supplier/utils/constants'
import ProductList from './ProductList.vue'

defineOptions({ name: 'DistributionProjectDetailDrawer' })

const props = defineProps<{
  modelValue: boolean
  id?: number
}>()

const emit = defineEmits(['update:modelValue', 'success', 'edit'])
const message = useMessage()

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const activeTab = ref('basic')
const project = ref<ProjectVO>({} as ProjectVO)
const projectId = computed(() => props.id)

const displayText = (value?: string | number | null) => {
  if (value === undefined || value === null || value === '') return '-'
  return String(value)
}

const periodText = computed(() => {
  if (!project.value.startDate && !project.value.endDate) return '-'
  return `${project.value.startDate || '-'} ~ ${project.value.endDate || '-'}`
})

const getDetail = async () => {
  if (!projectId.value) return
  loading.value = true
  try {
    project.value = await ProjectApi.getProject(projectId.value)
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.modelValue, props.id] as const,
  ([visible]) => {
    if (!visible || !props.id) return
    activeTab.value = 'basic'
    getDetail()
  }
)

const openEdit = () => {
  if (!props.id) return
  emit('edit', props.id)
}

const handleStatusChange = async (status: number, actionText: string) => {
  if (!projectId.value) return
  try {
    await message.confirm(`确认将项目「${project.value.name}」${actionText}吗？`, `${actionText}确认`)
    await ProjectApi.updateProjectStatus(projectId.value, status)
    message.success(`${actionText}成功`)
    await getDetail()
    emit('success')
  } catch {}
}

const handleClosed = () => {
  project.value = {} as ProjectVO
  activeTab.value = 'basic'
}

defineExpose({ reload: getDetail })
</script>
