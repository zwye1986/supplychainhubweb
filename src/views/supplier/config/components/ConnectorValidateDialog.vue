<template>
  <el-dialog v-model="dialogVisible" title="校验连接器（声明能力）" width="620px" append-to-body>
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <el-form-item label="连接器">
        <span>{{ connectorLabel }}</span>
      </el-form-item>
      <el-form-item label="启用能力" prop="capabilities">
        <el-checkbox-group v-model="formData.capabilities">
          <el-checkbox v-for="cap in capabilityOptions" :key="cap" :value="cap" :label="cap" disabled />
        </el-checkbox-group>
        <div class="text-12px text-gray-400 mt-4px">
          校验须声明该适配器的完整能力集合，已自动全部选中；此步骤不支持选择能力子集。
        </div>
      </el-form-item>
      <el-form-item label="校验有效期(分)" prop="validMinutes">
        <el-input-number v-model="formData.validMinutes" :min="1" :step="5" controls-position="right" />
      </el-form-item>
      <el-form-item label="校验原因" prop="reason">
        <el-input v-model="formData.reason" type="textarea" :rows="2" maxlength="256" placeholder="审计用，简述本次校验目的" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :disabled="formLoading" @click="submitForm">校验</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { SupplierConfigApi } from '@/api/supplier/config'
import type { AdapterTypeView, ConnectorListItem } from '@/api/supplier/config'

/**
 * 连接器校验对话框（§6.4/§8.4）：能力在此步骤声明（草稿表单不含能力），落 sc_supplier_connector_capability。
 * 能力声明自动复制该连接器 adapterType 对应 T1 AdapterTypeView.capabilities() 完整集合，只读展示。
 * 校验要求版本处于草稿态，非法跃迁由后端守卫拒绝并经 axios 拦截器透传。
 * 设计见 docs/superpowers/specs/2026-10-03-supplier-offer-publication-admin-design.md#64-能力声明。
 */
defineOptions({ name: 'ConnectorValidateDialog' })

const props = defineProps<{ adapterTypes: AdapterTypeView[] }>()
const emit = defineEmits<{ success: [] }>()

const message = useMessage()
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const connectorLabel = ref('')
const capabilityOptions = ref<string[]>([])
const currentRow = ref<ConnectorListItem | null>(null)

const formData = ref<{ capabilities: string[]; validMinutes: number; reason: string }>({
  capabilities: [],
  validMinutes: 10,
  reason: ''
})

const formRules = reactive({
  capabilities: [
    { required: true, type: 'array', min: 1, message: '适配器能力目录未加载，请刷新后重试', trigger: 'change' }
  ],
  validMinutes: [{ required: true, message: '请输入校验有效期', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入校验原因（审计）', trigger: 'blur' }]
})

const open = (row: ConnectorListItem) => {
  currentRow.value = row
  connectorLabel.value = `${row.connectorCode || row.connectorNo}（v${row.latestVersionNo ?? '-'}）`
  const view = props.adapterTypes.find((item) => item.adapterType === row.adapterType)
  capabilityOptions.value = view?.capabilities || []
  formData.value = { capabilities: [...capabilityOptions.value], validMinutes: 10, reason: '' }
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}
defineExpose({ open })

const submitForm = async () => {
  const versionId = currentRow.value?.latestVersionId
  if (versionId == null) {
    message.warning('该连接器尚无可用版本，无法校验')
    return
  }
  // 完整集合契约由后端最终校验；目录缺失或被意外改成子集时不发送无效请求。
  // 设计见 docs/superpowers/specs/2026-10-03-supplier-offer-publication-admin-design.md#153-能力声明契约。
  if (!capabilityOptions.value.length
    || formData.value.capabilities.length !== capabilityOptions.value.length
    || capabilityOptions.value.some((code) => !formData.value.capabilities.includes(code))) {
    message.warning('适配器能力目录未加载或声明不完整，请刷新后重试')
    return
  }
  await formRef.value.validate()
  formLoading.value = true
  try {
    await SupplierConfigApi.validateConnector({
      connectorVersionId: versionId,
      capabilities: formData.value.capabilities,
      validMinutes: formData.value.validMinutes,
      reason: formData.value.reason
    })
    message.success('校验通过，可继续发布')
    dialogVisible.value = false
    emit('success')
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  } finally {
    formLoading.value = false
  }
}
</script>
