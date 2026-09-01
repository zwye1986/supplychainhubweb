<template>
  <el-dialog
    v-model="dialogVisible"
    :title="pageTitle"
    width="720px"
    append-to-body
    :before-close="handleClosed"
  >
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      :disabled="isView"
      label-width="120px"
    >
      <el-form-item label="项目名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入项目名称" maxlength="100" show-word-limit />
      </el-form-item>
      <el-form-item label="项目编号" prop="code">
        <el-input :model-value="formData.code" placeholder="保存后系统自动生成" readonly>
          <template v-if="!formData.code" #suffix>
            <span class="text-12px text-gray-400">如 PRJ20260901010</span>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="关联分销商" prop="distributorId">
        <el-select
          v-model="formData.distributorId"
          filterable
          clearable
          placeholder="请选择关联分销商（一个项目关联一个分销商）"
          class="!w-full"
          @change="handleDistributorChange"
        >
          <el-option
            v-for="item in distributorOptions"
            :key="item.id"
            :label="item.label"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="项目类型" prop="projectType">
        <el-select v-model="formData.projectType" placeholder="请选择项目类型" class="!w-full">
          <el-option
            v-for="item in PROJECT_TYPE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="项目周期" prop="period">
        <el-date-picker
          v-model="formData.period"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-full"
        />
      </el-form-item>
      <el-form-item label="结算方" prop="settlementPartyType">
        <el-radio-group v-model="formData.settlementPartyType" @change="syncSettlementParty">
          <el-radio
            v-for="item in SETTLEMENT_PARTY_TYPE_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="项目状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio v-for="item in PROJECT_STATUS_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="项目描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="4"
          maxlength="500"
          show-word-limit
          placeholder="请输入项目描述，说明合作场景、SKU 范围或定价规则"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">{{ isView ? '关 闭' : '取 消' }}</el-button>
      <el-button v-if="!isView" type="primary" :loading="formLoading" @click="submitForm">
        确 定
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import { DistributorApi, ProjectApi, ProjectVO } from '@/api/supplier/distribution'
import {
  PROJECT_STATUS_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  ProjectStatusEnum,
  SETTLEMENT_PARTY_TYPE_OPTIONS,
  SettlementPartyTypeEnum
} from '@/views/supplier/utils/constants'

defineOptions({ name: 'DistributionProjectFormDialog' })

const { t } = useI18n()
const message = useMessage()
const emit = defineEmits(['success', 'update:modelValue'])

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    id?: number
    mode?: 'create' | 'edit' | 'view'
  }>(),
  { mode: 'create' }
)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

type ProjectFormData = ProjectVO & { period?: string[] }

const formLoading = ref(false)
const formRef = ref<FormInstance>()
const distributorOptions = ref<{ id: number; label: string }[]>([])
const isView = computed(() => props.mode === 'view')
const isEdit = computed(() => props.mode === 'edit' || (!!props.id && props.mode !== 'view'))

const createDefaultForm = (): ProjectFormData => ({
  id: undefined,
  name: '',
  code: '',
  distributorId: undefined,
  distributorName: '',
  projectType: undefined,
  status: ProjectStatusEnum.DRAFT,
  startDate: undefined,
  endDate: undefined,
  period: [],
  settlementPartyType: SettlementPartyTypeEnum.DISTRIBUTOR,
  settlementParty: '',
  description: ''
})

const formData = ref<ProjectFormData>(createDefaultForm())

const formRules = reactive<FormRules>({
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  distributorId: [{ required: true, message: '请选择关联分销商', trigger: 'change' }],
  projectType: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
  period: [{ required: true, message: '请选择项目周期', trigger: 'change', type: 'array' }],
  settlementPartyType: [{ required: true, message: '请选择结算方', trigger: 'change' }],
  status: [{ required: true, message: '请选择项目状态', trigger: 'change' }]
})

const pageTitle = computed(() => {
  if (props.mode === 'view') return '项目详情'
  if (props.mode === 'edit' || props.id) return '编辑项目'
  return '创建项目'
})

watch(
  () => [props.modelValue, props.id, props.mode] as const,
  async ([visible]) => {
    if (!visible) return
    resetForm()
    await loadDistributorOptions()
    if (props.id) {
      await loadDetail(props.id)
    }
  }
)

const loadDistributorOptions = async () => {
  try {
    const list = (await DistributorApi.getDistributorNameList()) || []
    distributorOptions.value = list
      .filter((item: any) => item.id)
      .map((item: any) => ({
        id: item.id,
        label: item.label || item.value || item.name
      }))
  } catch {
    distributorOptions.value = []
  }
}

const handleDistributorChange = (id?: number) => {
  const found = distributorOptions.value.find((item) => item.id === id)
  formData.value.distributorName = found?.label || ''
  syncSettlementParty()
}

const syncSettlementParty = () => {
  if (formData.value.settlementPartyType === SettlementPartyTypeEnum.PLATFORM) {
    formData.value.settlementParty = '平台结算'
    return
  }
  formData.value.settlementParty = formData.value.distributorName || ''
}

const resetForm = () => {
  formData.value = createDefaultForm()
  formRef.value?.resetFields()
}

const loadDetail = async (id: number) => {
  formLoading.value = true
  try {
    const data = await ProjectApi.getProject(id)
    formData.value = {
      ...createDefaultForm(),
      ...data,
      period: data.startDate && data.endDate ? [data.startDate, data.endDate] : []
    }
    syncSettlementParty()
  } finally {
    formLoading.value = false
  }
}

const submitForm = async () => {
  await formRef.value?.validate()
  if (!formData.value.period?.length || formData.value.period.length !== 2) {
    message.warning('请选择项目周期')
    return
  }
  formLoading.value = true
  try {
    syncSettlementParty()
    const { period, ...rest } = formData.value
    const data: ProjectVO = {
      ...rest,
      startDate: period[0],
      endDate: period[1]
    }
    if (isEdit.value) {
      await ProjectApi.updateProject(data)
      message.success(t('common.updateSuccess'))
    } else {
      await ProjectApi.createProject(data)
      message.success(t('common.createSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } catch (error: any) {
    message.error(error?.message || '保存失败')
  } finally {
    formLoading.value = false
  }
}

const handleClosed = () => {
  dialogVisible.value = false
  resetForm()
}
</script>
