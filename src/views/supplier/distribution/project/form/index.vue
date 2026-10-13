<template>
  <el-dialog
    v-model="dialogVisible"
    :title="pageTitle"
    width="720px"
    append-to-body
    destroy-on-close
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
      <el-form-item label="项目名称" prop="projectName">
        <el-input
          v-model="formData.projectName"
          placeholder="请输入项目名称"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="项目编号">
        <el-input :model-value="formData.projectCode" placeholder="系统保存后自动生成" disabled />
      </el-form-item>
      <el-form-item label="关联分销商" prop="buyerCode">
        <el-select
          v-model="formData.buyerCode"
          filterable
          clearable
          placeholder="请选择关联分销商"
          class="!w-full"
          :disabled="isEdit"
          @change="handleBuyerChange"
        >
          <el-option
            v-for="item in buyerOptions"
            :key="item.buyerCode"
            :label="item.buyerName"
            :value="item.buyerCode"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="项目类型" prop="projectType">
        <el-select v-model="formData.projectType" placeholder="请选择项目类型" class="!w-full" clearable>
          <el-option
            v-for="dict in getStrDictOptions('supply_chain_project_type')"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
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
          clearable
        />
      </el-form-item>
      <el-form-item label="结算方" prop="settlementBuyerCode">
        <el-select
          v-model="formData.settlementBuyerCode"
          filterable
          clearable
          placeholder="请选择结算方"
          class="!w-full"
          @change="settlementTouched = true"
        >
          <el-option
            v-for="item in buyerOptions"
            :key="item.buyerCode"
            :label="item.buyerName"
            :value="item.buyerCode"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="项目状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="项目说明" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="4"
          maxlength="500"
          show-word-limit
          placeholder="请输入项目说明"
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
import { DistributorApi, ProjectApi, ProjectSaveReqVO, ProjectVO } from '@/api/supplier/distribution'
import { getStrDictOptions } from '@/utils/dict'

defineOptions({ name: 'DistributionProjectFormDialog' })

const { t } = useI18n()
const message = useMessage()
const emit = defineEmits(['success', 'update:modelValue'])

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    projectCode?: string
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
const buyerOptions = ref<{ buyerCode: string; buyerName: string }[]>([])
/** 用户是否手动改过结算方；未改过时跟随关联分销商 */
const settlementTouched = ref(false)
const isView = computed(() => props.mode === 'view')
const isEdit = computed(() => props.mode === 'edit' || (!!props.projectCode && props.mode !== 'view'))

const statusOptions = computed(() => {
  const all = getStrDictOptions('supply_chain_project_status')
  if (isEdit.value) return all
  return all.filter((item) => item.value === 'DRAFT' || item.value === 'ACTIVE')
})

const createDefaultForm = (): ProjectFormData => ({
  projectCode: undefined,
  projectName: '',
  buyerCode: undefined,
  buyerName: '',
  projectType: undefined,
  status: 'DRAFT',
  startDate: undefined,
  endDate: undefined,
  period: [],
  settlementPartyType: 'DISTRIBUTOR',
  settlementBuyerCode: undefined,
  description: ''
})

const formData = ref<ProjectFormData>(createDefaultForm())

const formRules = reactive<FormRules>({
  projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  buyerCode: [{ required: true, message: '请选择关联分销商', trigger: 'change' }],
  projectType: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
  period: [{ required: true, message: '请选择项目周期', trigger: 'change', type: 'array' }],
  settlementBuyerCode: [{ required: true, message: '请选择结算方', trigger: 'change' }],
  status: [{ required: true, message: '请选择项目状态', trigger: 'change' }]
})

const handleBuyerChange = (buyerCode?: string) => {
  if (settlementTouched.value && formData.value.settlementBuyerCode) return
  formData.value.settlementBuyerCode = buyerCode || undefined
}

const pageTitle = computed(() => {
  if (props.mode === 'view') return '项目详情'
  if (props.mode === 'edit' || props.projectCode) return '编辑项目'
  return '创建项目'
})

watch(
  () => [props.modelValue, props.projectCode, props.mode] as const,
  async ([visible]) => {
    if (!visible) return
    await resetForm()
    await loadBuyerOptions()
    if (props.projectCode && props.mode !== 'create') {
      await loadDetail(props.projectCode)
    }
  }
)

const loadBuyerOptions = async () => {
  try {
    const list = (await DistributorApi.getDistributorNameList()) || []
    buyerOptions.value = list
      .map((item: any) => ({
        buyerCode: item.code || item.buyerCode || '',
        buyerName: item.label || item.value || item.buyerName || ''
      }))
      .filter((item) => item.buyerCode)
  } catch {
    buyerOptions.value = []
  }
}

const resetForm = async () => {
  settlementTouched.value = false
  formData.value = createDefaultForm()
  await nextTick()
  formRef.value?.clearValidate()
}

const loadDetail = async (projectCode: string) => {
  formLoading.value = true
  try {
    const data = await ProjectApi.getProject(projectCode)
    const settlementBuyerCode = data.settlementBuyerCode || data.buyerCode
    formData.value = {
      ...createDefaultForm(),
      ...data,
      projectCode: data.projectCode || projectCode,
      status: data.status || 'DRAFT',
      settlementPartyType: data.settlementPartyType || 'DISTRIBUTOR',
      settlementBuyerCode,
      period: data.startDate && data.endDate ? [data.startDate, data.endDate] : []
    }
    settlementTouched.value = !!(
      data.settlementBuyerCode &&
      data.buyerCode &&
      data.settlementBuyerCode !== data.buyerCode
    )
  } finally {
    formLoading.value = false
  }
}

const buildSavePayload = (): ProjectSaveReqVO => {
  const period = formData.value.period || []
  return {
    projectName: formData.value.projectName || '',
    buyerCode: formData.value.buyerCode || '',
    projectType: formData.value.projectType,
    startDate: period[0],
    endDate: period[1],
    settlementPartyType: 'DISTRIBUTOR',
    settlementBuyerCode: formData.value.settlementBuyerCode || formData.value.buyerCode || undefined,
    description: formData.value.description || undefined,
    status: formData.value.status || 'DRAFT'
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
    const data = buildSavePayload()
    if (isEdit.value) {
      const projectCode = formData.value.projectCode || props.projectCode
      if (!projectCode) {
        message.error('缺少项目编号，无法保存')
        return
      }
      await ProjectApi.updateProject(projectCode, data)
      message.success(t('common.updateSuccess'))
    } else {
      await ProjectApi.createProject(data)
      message.success(t('common.createSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } catch (error: any) {
    if (error?.message) {
      message.error(error.message)
    }
  } finally {
    formLoading.value = false
  }
}

const handleClosed = () => {
  dialogVisible.value = false
  resetForm()
}
</script>
