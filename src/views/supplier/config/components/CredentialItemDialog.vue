<template>
  <el-dialog v-model="dialogVisible" title="新建凭据项" width="620px" append-to-body>
    <el-alert
      class="mb-12px"
      type="warning"
      :closable="false"
      show-icon
      title="凭据只写不回显：ENVELOPE 明文提交后服务端立即信封加密，列表/详情永不展示 secret_ref 值或密文。"
    />
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="140px"
    >
      <el-form-item label="所属凭据集">
        <span>{{ setCode }}</span>
      </el-form-item>
      <el-form-item label="凭据项标识" prop="itemKey">
        <el-select v-model="formData.itemKey" placeholder="从适配器 credentialKeys() 并集中选择" clearable class="!w-full">
          <el-option v-for="key in itemKeys" :key="key" :label="key" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="来源类型" prop="providerType">
        <el-radio-group v-model="formData.providerType">
          <el-radio v-for="opt in CREDENTIAL_PROVIDER_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="formData.providerType === CredentialProviderEnum.ENV" label="秘密引用" prop="secretRef">
        <el-input v-model="formData.secretRef" maxlength="256" placeholder="以 env: 前缀，如 env:QNM_PROD_USERKEY" clearable />
      </el-form-item>
      <el-form-item v-if="formData.providerType === CredentialProviderEnum.ENVELOPE" label="密钥明文" prop="secretValue">
        <el-input
          v-model="formData.secretValue"
          type="password"
          show-password
          autocomplete="new-password"
          maxlength="512"
          placeholder="仅入参，服务端信封加密，不回显不落日志"
        />
      </el-form-item>
      <el-form-item label="脱敏提示" prop="maskedHint">
        <el-input v-model="formData.maskedHint" maxlength="128" placeholder="供列表识别，不含明文，如 qnm-****" clearable />
      </el-form-item>
      <el-form-item label="生效密钥版本" prop="activeSecretVersion">
        <el-input-number v-model="formData.activeSecretVersion" :min="1" controls-position="right" />
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
import {
  CredentialProviderEnum,
  CREDENTIAL_PROVIDER_OPTIONS,
  validateCredentialItem
} from '../utils/constants'

/**
 * 新建凭据项对话框（F1-hybrid，§8.3）。护栏：ENV 填 env: 引用且不带明文；ENVELOPE 填明文（type=password、
 * 只写不回显）且不带 env: 引用；maskedHint 与 activeSecretVersion 必填。跨字段即时校验用纯函数
 * validateCredentialItem，后端为最终裁决。提交后不回显任何密文/明文。
 * 设计见 docs/superpowers/specs/2026-10-03-supplier-offer-publication-admin-design.md#83-凭据子页f1-hybrid。
 */
defineOptions({ name: 'CredentialItemDialog' })

const props = defineProps<{ supplierCode: string; setCode: string; itemKeys: string[] }>()
const emit = defineEmits<{ success: [] }>()

const message = useMessage()
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()

const createForm = () => ({
  itemKey: '',
  providerType: CredentialProviderEnum.ENV as string,
  secretRef: '',
  secretValue: '',
  maskedHint: '',
  activeSecretVersion: 1
})
const formData = ref(createForm())

const validateCrossField = (_rule: any, _value: any, callback: (e?: Error) => void) => {
  const error = validateCredentialItem(formData.value)
  if (error) callback(new Error(error))
  else callback()
}
const formRules = reactive({
  itemKey: [{ required: true, message: '请选择凭据项标识', trigger: 'change' }],
  providerType: [{ required: true, message: '请选择来源类型', trigger: 'change' }],
  maskedHint: [{ required: true, message: '请填写脱敏提示', trigger: 'blur' }],
  activeSecretVersion: [{ required: true, message: '请填写生效密钥版本', trigger: 'blur' }],
  secretRef: [{ validator: validateCrossField, trigger: 'blur' }],
  secretValue: [{ validator: validateCrossField, trigger: 'blur' }]
})

const open = () => {
  formData.value = createForm()
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}
defineExpose({ open })

const submitForm = async () => {
  const crossError = validateCredentialItem(formData.value)
  if (crossError) {
    message.warning(crossError)
    return
  }
  await formRef.value.validate()
  formLoading.value = true
  try {
    const isEnv = formData.value.providerType === CredentialProviderEnum.ENV
    await SupplierConfigApi.createCredentialItem({
      supplierCode: props.supplierCode,
      setCode: props.setCode,
      itemKey: formData.value.itemKey,
      providerType: formData.value.providerType,
      secretRef: isEnv ? formData.value.secretRef : undefined,
      secretValue: isEnv ? undefined : formData.value.secretValue,
      maskedHint: formData.value.maskedHint,
      activeSecretVersion: formData.value.activeSecretVersion
    })
    message.success('凭据项创建成功（明文不回显）')
    dialogVisible.value = false
    emit('success')
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  } finally {
    formLoading.value = false
  }
}
</script>
