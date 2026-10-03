<template>
  <el-dialog v-model="dialogVisible" :title="isStatus ? '追加状态映射' : '追加错误码映射'" width="600px" append-to-body>
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="130px"
    >
      <template v-if="isStatus">
        <el-form-item label="外部状态" prop="externalStatus">
          <el-input v-model="formData.externalStatus" maxlength="64" placeholder="供应商侧状态码" clearable />
        </el-form-item>
        <el-form-item label="外部子状态" prop="externalSubStatus">
          <el-input v-model="formData.externalSubStatus" maxlength="64" placeholder="可空" clearable />
        </el-form-item>
        <el-form-item label="业务阶段" prop="businessPhase">
          <el-select v-model="formData.businessPhase" placeholder="请选择业务阶段" clearable class="!w-full">
            <el-option v-for="opt in BUSINESS_PHASE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="事实类型" prop="factType">
          <el-select v-model="formData.factType" placeholder="请选择事实类型" clearable class="!w-full">
            <el-option v-for="opt in FACT_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否终态" prop="terminal">
          <el-switch v-model="formData.terminal" />
        </el-form-item>
      </template>
      <template v-else>
        <el-form-item label="外部错误码" prop="externalErrorCode">
          <el-input v-model="formData.externalErrorCode" maxlength="64" placeholder="供应商侧错误码" clearable />
        </el-form-item>
        <el-form-item label="外部子错误码" prop="externalSubCode">
          <el-input v-model="formData.externalSubCode" maxlength="64" placeholder="可空" clearable />
        </el-form-item>
        <el-form-item label="错误分类" prop="errorClass">
          <el-input v-model="formData.errorClass" maxlength="64" placeholder="如 TIMEOUT / BUSINESS" clearable />
        </el-form-item>
        <el-form-item label="处置动作" prop="actionType">
          <el-select v-model="formData.actionType" placeholder="请选择处置动作" clearable class="!w-full">
            <el-option v-for="opt in ERROR_ACTION_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否可重试" prop="retryable">
          <el-switch v-model="formData.retryable" />
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :disabled="formLoading" @click="submitForm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { SupplierConfigApi } from '@/api/supplier/config'
import { BUSINESS_PHASE_OPTIONS, ERROR_ACTION_OPTIONS, FACT_TYPE_OPTIONS } from '../utils/constants'

/**
 * 追加单条映射对话框（G2，§8.5）：按 mode 渲染状态映射或错误码映射表单，分别调
 * status-mappings / error-mappings 端点。模板初始化之外的增量补充入口；封闭选项来自常量，前端不自由输入枚举。
 * 设计见 docs/superpowers/specs/2026-10-03-supplier-offer-publication-admin-design.md#85-映射子页g2。
 */
defineOptions({ name: 'MappingAppendDialog' })

type MappingMode = 'STATUS' | 'ERROR'

const emit = defineEmits<{ success: [] }>()

const message = useMessage()
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const mode = ref<MappingMode>('STATUS')
const versionId = ref<number | null>(null)

const isStatus = computed(() => mode.value === 'STATUS')

const createForm = () => ({
  externalStatus: '',
  externalSubStatus: '',
  businessPhase: '',
  factType: '',
  terminal: false,
  externalErrorCode: '',
  externalSubCode: '',
  errorClass: '',
  actionType: '',
  retryable: false
})
const formData = ref(createForm())

const formRules = reactive({
  externalStatus: [{ required: true, message: '请输入外部状态', trigger: 'blur' }],
  businessPhase: [{ required: true, message: '请选择业务阶段', trigger: 'change' }],
  factType: [{ required: true, message: '请选择事实类型', trigger: 'change' }],
  externalErrorCode: [{ required: true, message: '请输入外部错误码', trigger: 'blur' }],
  errorClass: [{ required: true, message: '请输入错误分类', trigger: 'blur' }],
  actionType: [{ required: true, message: '请选择处置动作', trigger: 'change' }]
})

const open = (openMode: MappingMode, connectorVersionId: number) => {
  mode.value = openMode
  versionId.value = connectorVersionId
  formData.value = createForm()
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}
defineExpose({ open })

const submitForm = async () => {
  if (versionId.value == null) {
    message.warning('缺少连接器版本，无法追加映射')
    return
  }
  await formRef.value.validate()
  formLoading.value = true
  try {
    if (isStatus.value) {
      await SupplierConfigApi.addStatusMapping({
        connectorVersionId: versionId.value,
        externalStatus: formData.value.externalStatus,
        externalSubStatus: formData.value.externalSubStatus || undefined,
        businessPhase: formData.value.businessPhase,
        factType: formData.value.factType,
        terminal: formData.value.terminal
      })
    } else {
      await SupplierConfigApi.addErrorMapping({
        connectorVersionId: versionId.value,
        externalErrorCode: formData.value.externalErrorCode,
        externalSubCode: formData.value.externalSubCode || undefined,
        errorClass: formData.value.errorClass,
        actionType: formData.value.actionType,
        retryable: formData.value.retryable
      })
    }
    message.success('映射追加成功')
    dialogVisible.value = false
    emit('success')
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  } finally {
    formLoading.value = false
  }
}
</script>
