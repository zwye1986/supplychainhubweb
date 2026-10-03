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
          <el-checkbox v-for="cap in capabilityOptions" :key="cap" :value="cap" :label="cap" />
        </el-checkbox-group>
        <div class="text-12px text-gray-400 mt-4px">
          能力为封闭集，来自所选适配器类型的 capabilities()；上架即发布时按 SKU 履约类型推导所需能力，缺失将拒绝上架。
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
 * 能力勾选项来自该连接器 adapterType 对应 T1 AdapterTypeView.capabilities()（封闭集，前端不自由输入）。
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
    { required: true, type: 'array', min: 1, message: '请至少勾选一项能力', trigger: 'change' }
  ],
  validMinutes: [{ required: true, message: '请输入校验有效期', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入校验原因（审计）', trigger: 'blur' }]
})

const open = (row: ConnectorListItem) => {
  currentRow.value = row
  connectorLabel.value = `${row.connectorCode || row.connectorNo}（v${row.latestVersionNo ?? '-'}）`
  const view = props.adapterTypes.find((item) => item.adapterType === row.adapterType)
  capabilityOptions.value = view?.capabilities || []
  formData.value = { capabilities: [], validMinutes: 10, reason: '' }
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
