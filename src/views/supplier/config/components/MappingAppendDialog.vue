<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isStatus ? '追加状态映射' : '追加错误码映射'"
    width="600px"
    append-to-body
  >
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="130px"
    >
      <template v-if="isStatus">
        <el-form-item label="外部状态" prop="externalStatus">
          <el-input
            v-model="formData.externalStatus"
            maxlength="64"
            placeholder="供应商侧状态码"
            clearable
          />
        </el-form-item>
        <el-form-item label="外部子状态" prop="externalSubStatus">
          <el-input
            v-model="formData.externalSubStatus"
            maxlength="64"
            placeholder="可空"
            clearable
          />
        </el-form-item>
        <el-form-item label="业务阶段" prop="businessPhase">
          <el-select
            v-model="formData.businessPhase"
            placeholder="请选择业务阶段"
            clearable
            class="!w-full"
          >
            <el-option
              v-for="opt in BUSINESS_PHASE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="事实类型" prop="factType">
          <el-select
            v-model="formData.factType"
            placeholder="请选择事实类型"
            clearable
            class="!w-full"
          >
            <el-option
              v-for="opt in FACT_TYPE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="是否终态" prop="terminal">
          <el-switch v-model="formData.terminal" />
        </el-form-item>
      </template>
      <template v-else>
        <el-form-item label="外部错误码" prop="externalErrorCode">
          <el-input
            v-model="formData.externalErrorCode"
            maxlength="64"
            placeholder="供应商侧错误码"
            clearable
          />
        </el-form-item>
        <el-form-item label="外部子错误码" prop="externalSubCode">
          <el-input
            v-model="formData.externalSubCode"
            maxlength="64"
            placeholder="可空"
            clearable
          />
        </el-form-item>
        <el-form-item label="错误分类" prop="errorClass">
          <el-select v-model="formData.errorClass" placeholder="请选择错误分类" class="!w-full">
            <el-option
              v-for="opt in ERROR_CLASS_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="处置动作" prop="actionType">
          <el-select
            v-model="formData.actionType"
            placeholder="请选择处置动作"
            clearable
            class="!w-full"
          >
            <el-option
              v-for="opt in ERROR_ACTION_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="是否可重试" prop="retryable">
          <el-switch v-model="formData.retryable" disabled />
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :disabled="formLoading || !canAppend" @click="submitForm"
        >确定</el-button
      >
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { SupplierConfigApi } from '@/api/supplier/config'
import {
  BUSINESS_PHASE_OPTIONS,
  ERROR_ACTION_OPTIONS,
  ERROR_CLASS_OPTIONS,
  ErrorActionEnum,
  FACT_TYPE_OPTIONS
} from '../utils/constants'

/**
 * 追加单条映射对话框（G2，§8.5）：按 mode 渲染状态映射或错误码映射表单，分别调
 * status-mappings / error-mappings 端点。模板初始化之外的增量补充入口；封闭选项来自常量，前端不自由输入枚举。
 * 当前版本或管理规则变更后关闭旧表单；提交在异步验证后重新核对资格，避免跨版本写入。
 * 已发出的请求仍可完成，但仅所属弹窗会话可接收反馈及改变 loading，避免污染后来打开的表单。
 * 设计见 docs/superpowers/specs/2026-10-12-huasheng-fulfillment-hardening-design.md#32-前端展示与竞态。
 */
defineOptions({ name: 'MappingAppendDialog' })

type MappingMode = 'STATUS' | 'ERROR'

const props = defineProps<{
  connectorVersionId?: number | null
  statusAppendAllowed?: boolean
  errorAppendAllowed?: boolean
}>()

const emit = defineEmits<{ success: [] }>()

const message = useMessage()
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const mode = ref<MappingMode>('STATUS')
const versionId = ref<number | null>(null)

const isStatus = computed(() => mode.value === 'STATUS')
const canAppend = computed(
  () =>
    versionId.value != null &&
    versionId.value === props.connectorVersionId &&
    (isStatus.value ? props.statusAppendAllowed : props.errorAppendAllowed) === true
)
let openSession = 0

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
  errorClass: [{ required: true, message: '请选择错误分类', trigger: 'change' }],
  actionType: [{ required: true, message: '请选择处置动作', trigger: 'change' }]
})

const open = (openMode: MappingMode, connectorVersionId: number) => {
  if (
    connectorVersionId !== props.connectorVersionId ||
    (openMode === 'STATUS' ? props.statusAppendAllowed : props.errorAppendAllowed) !== true
  ) {
    message.warning('当前版本不允许追加该类映射')
    return
  }
  ++openSession
  formLoading.value = false
  mode.value = openMode
  versionId.value = connectorVersionId
  formData.value = createForm()
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}
defineExpose({ open })

/**
 * 可重试标志由处置动作唯一决定：仅 RETRY_SAFE 为 true，其余为 false；与后端一致性约束保持一致。
 * 设计见 docs/superpowers/specs/2026-10-12-huasheng-fulfillment-hardening-design.md#32-前端展示与竞态。
 */
watch(
  () => formData.value.actionType,
  (actionType) => {
    formData.value.retryable = actionType === ErrorActionEnum.RETRY_SAFE
  }
)
watch(
  () => [props.connectorVersionId, props.statusAppendAllowed, props.errorAppendAllowed],
  () => {
    ++openSession
    formLoading.value = false
    if (!canAppend.value) {
      dialogVisible.value = false
      formData.value = createForm()
    }
  },
  { flush: 'sync' }
)

const submitForm = async () => {
  if (!dialogVisible.value || !canAppend.value || formLoading.value) {
    message.warning('当前版本不允许追加该类映射')
    return
  }
  const session = openSession
  await formRef.value.validate()
  if (!dialogVisible.value || !canAppend.value || session !== openSession) return
  if (
    !isStatus.value &&
    !ERROR_CLASS_OPTIONS.some((option) => option.value === formData.value.errorClass)
  ) {
    message.warning('请选择支持的错误分类')
    return
  }
  formLoading.value = true
  try {
    if (isStatus.value) {
      await SupplierConfigApi.addStatusMapping({
        connectorVersionId: versionId.value!,
        externalStatus: formData.value.externalStatus,
        externalSubStatus: formData.value.externalSubStatus || undefined,
        businessPhase: formData.value.businessPhase,
        factType: formData.value.factType,
        terminal: formData.value.terminal
      })
    } else {
      await SupplierConfigApi.addErrorMapping({
        connectorVersionId: versionId.value!,
        externalErrorCode: formData.value.externalErrorCode,
        externalSubCode: formData.value.externalSubCode || undefined,
        errorClass: formData.value.errorClass,
        actionType: formData.value.actionType,
        retryable: formData.value.actionType === ErrorActionEnum.RETRY_SAFE
      })
    }
    if (session !== openSession) return
    message.success('映射追加成功')
    dialogVisible.value = false
    emit('success')
  } catch (error: any) {
    if (session === openSession && error?.message) message.error(error.message)
  } finally {
    if (session === openSession) formLoading.value = false
  }
}
</script>
