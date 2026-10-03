<template>
  <el-dialog v-model="dialogVisible" title="新建连接器" width="760px" append-to-body>
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="140px"
    >
      <el-form-item label="连接器编码" prop="connectorCode">
        <el-input v-model="formData.connectorCode" maxlength="64" placeholder="供应商内自定义，如 QNM_PRIMARY" clearable />
      </el-form-item>
      <el-form-item label="适配器类型" prop="adapterType">
        <el-select v-model="formData.adapterType" placeholder="请选择代码注册的适配器类型" clearable class="!w-full">
          <el-option v-for="item in adapterTypes" :key="item.adapterType" :label="item.adapterType" :value="item.adapterType!" />
        </el-select>
      </el-form-item>
      <el-form-item label="网关基础地址" prop="baseUrl">
        <el-input v-model="formData.baseUrl" maxlength="512" placeholder="https://api.example.com" clearable />
      </el-form-item>
      <el-form-item label="商户账号" prop="merchantAccount">
        <el-input v-model="formData.merchantAccount" maxlength="128" placeholder="可空" clearable />
      </el-form-item>
      <el-form-item v-if="bindingMode === 'SINGLE_SLOT'" label="凭据槽引用" prop="credentialSlotNo">
        <el-select v-model="formData.credentialSlotNo" placeholder="请选择可用凭据槽（平台级，脱敏）" clearable filterable class="!w-full">
          <el-option
            v-for="slot in credentialSlots"
            :key="slot.slotNo"
            :label="`${slot.maskedHint || slot.slotNo}（${slot.providerType}）`"
            :value="slot.slotNo!"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-else label="凭据集引用" prop="credentialSetCode">
        <el-select v-model="formData.credentialSetCode" placeholder="请选择当前供应商完整且可用的凭据集" clearable filterable class="!w-full">
          <el-option v-for="set in availableSets" :key="set.setCode" :label="set.setCode" :value="set.setCode!" />
        </el-select>
      </el-form-item>
      <el-form-item label="协议版本" prop="protocolVersion">
        <el-input v-model="formData.protocolVersion" maxlength="32" placeholder="如 V1" clearable />
      </el-form-item>
      <el-form-item label="回调路径" prop="callbackPath">
        <el-input v-model="formData.callbackPath" maxlength="256" placeholder="可空，如 /callbacks/xxx" clearable />
      </el-form-item>
      <el-form-item label="连接超时(ms)" prop="connectTimeoutMs">
        <el-input-number v-model="formData.connectTimeoutMs" :min="1" :step="500" controls-position="right" />
      </el-form-item>
      <el-form-item label="读取超时(ms)" prop="readTimeoutMs">
        <el-input-number v-model="formData.readTimeoutMs" :min="1" :step="1000" controls-position="right" />
      </el-form-item>
      <el-form-item label="限流(次/秒)" prop="rateLimit">
        <el-input-number v-model="formData.rateLimit" :min="1" controls-position="right" />
      </el-form-item>
      <el-form-item label="并发上限" prop="concurrencyLimit">
        <el-input-number v-model="formData.concurrencyLimit" :min="1" controls-position="right" />
      </el-form-item>
      <el-form-item label="适配器配置JSON" prop="adapterConfigJson">
        <el-input
          v-model="formData.adapterConfigJson"
          type="textarea"
          :rows="4"
          placeholder="封闭 Schema JSON，保存时后端校验；无私有配置填 {}"
        />
        <div class="text-12px text-gray-400 mt-4px">前端仅做 JSON 语法即时校验，字段合法性由后端按适配器 Schema 裁决。</div>
      </el-form-item>
      <el-form-item label="非秘密扩展JSON" prop="extraConfig">
        <el-input v-model="formData.extraConfig" type="textarea" :rows="4" placeholder="仅填写适配器 Schema 声明的非秘密参数，无参数填 {}" />
        <div class="text-12px text-gray-400 mt-4px">字段与类型由后端 Schema 校验；禁止密钥或 token。</div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :disabled="formLoading" @click="submitForm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { SupplierConfigApi } from '@/api/supplier/config'
import type { AdapterTypeView, CredentialSlotView, CredentialSetView } from '@/api/supplier/config'
import { isValidJson } from '../utils/constants'

/**
 * 新建连接器草稿表单（§8.2）。连接器版本一经创建即不可变，无「编辑草稿」；改配置＝新建连接器。
 * 能力勾选不在此表单，而在校验步骤声明（§6.4）。adapter_config_json 用文本域 + 前端 JSON 语法校验，
 * 字段合法性由后端 ClosedJsonSchemaValidator 裁决。
 * 设计见 docs/superpowers/specs/2026-10-03-supplier-offer-publication-admin-design.md#82-连接器子页e1。
 */
defineOptions({ name: 'ConnectorFormDialog' })

const props = defineProps<{
  supplierCode: string
  adapterTypes: AdapterTypeView[]
  credentialSlots: CredentialSlotView[]
  credentialSets?: CredentialSetView[]
}>()
const emit = defineEmits<{ success: [] }>()

const message = useMessage()
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()

const createForm = () => ({
  connectorCode: '',
  adapterType: '',
  baseUrl: '',
  merchantAccount: '',
  credentialSlotNo: '',
  credentialSetCode: '',
  extraConfig: '{}',
  protocolVersion: 'V1',
  callbackPath: '',
  connectTimeoutMs: 3000,
  readTimeoutMs: 10000,
  rateLimit: 100,
  concurrencyLimit: 20,
  adapterConfigJson: '{}'
})
const formData = ref(createForm())

/** 模式与完整项集来自代码元数据，供应商/适配器变化必须清空旧引用。
 * 设计见 docs/superpowers/specs/2026-10-02-huasheng-fulfillment-adapter-design.md#123-第二切片显式凭据集绑定与运行时配置。 */
const selectedAdapter = computed(() => props.adapterTypes.find(item => item.adapterType === formData.value.adapterType))
const bindingMode = computed(() => selectedAdapter.value?.credentialBindingMode || 'SINGLE_SLOT')
const availableSets = computed(() => {
  const required = new Set(selectedAdapter.value?.credentialKeys || [])
  if (!required.size) return []
  return (props.credentialSets || []).filter(set => {
    const activeItems = (set.items || []).filter(item => item.status === 10)
    return set.status === 10 && activeItems.length === required.size && activeItems.every(item => required.has(item.itemKey || ''))
  })
})
watch([() => props.supplierCode, () => formData.value.adapterType], () => {
  formData.value.credentialSlotNo = ''
  formData.value.credentialSetCode = ''
  formRef.value?.clearValidate(['credentialSlotNo', 'credentialSetCode'])
})
const validateReference = (_rule: any, _value: string, callback: (e?: Error) => void) => {
  const value = bindingMode.value === 'CREDENTIAL_SET' ? formData.value.credentialSetCode : formData.value.credentialSlotNo
  if (!value) callback(new Error('请选择当前模式的凭据引用'))
  else callback()
}
const validateJson = (_rule: any, value: string, callback: (e?: Error) => void) => {
  if (!isValidJson(value)) callback(new Error('请输入合法 JSON（无私有配置填 {}）'))
  else callback()
}
const formRules = reactive({
  connectorCode: [{ required: true, message: '请输入连接器编码', trigger: 'blur' }],
  adapterType: [{ required: true, message: '请选择适配器类型', trigger: 'change' }],
  baseUrl: [{ required: true, message: '请输入网关基础地址', trigger: 'blur' }],
  credentialSlotNo: [{ validator: validateReference, trigger: 'change' }],
  credentialSetCode: [{ validator: validateReference, trigger: 'change' }],
  extraConfig: [{ validator: validateJson, trigger: 'blur' }],
  protocolVersion: [{ required: true, message: '请输入协议版本', trigger: 'blur' }],
  connectTimeoutMs: [{ required: true, message: '请输入连接超时', trigger: 'blur' }],
  readTimeoutMs: [{ required: true, message: '请输入读取超时', trigger: 'blur' }],
  adapterConfigJson: [{ required: true, validator: validateJson, trigger: 'blur' }]
})

const open = () => {
  formData.value = createForm()
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}
defineExpose({ open })

const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    await SupplierConfigApi.createConnectorDraft({
      supplierCode: props.supplierCode,
      connectorCode: formData.value.connectorCode,
      adapterType: formData.value.adapterType,
      baseUrl: formData.value.baseUrl,
      merchantAccount: formData.value.merchantAccount || undefined,
      credentialSlotNo: bindingMode.value === 'SINGLE_SLOT' ? formData.value.credentialSlotNo : undefined,
      credentialSetCode: bindingMode.value === 'CREDENTIAL_SET' ? formData.value.credentialSetCode : undefined,
      extraConfig: formData.value.extraConfig,
      protocolVersion: formData.value.protocolVersion,
      callbackPath: formData.value.callbackPath || undefined,
      connectTimeoutMs: formData.value.connectTimeoutMs,
      readTimeoutMs: formData.value.readTimeoutMs,
      rateLimit: formData.value.rateLimit || undefined,
      concurrencyLimit: formData.value.concurrencyLimit || undefined,
      adapterConfigJson: formData.value.adapterConfigJson
    })
    message.success('连接器草稿创建成功，请继续校验并发布')
    dialogVisible.value = false
    emit('success')
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  } finally {
    formLoading.value = false
  }
}
</script>
