<template>
  <ContentWrap v-loading="loading">
    <el-alert
      class="mb-16px"
      type="info"
      :closable="false"
      :title="invoiceTip"
    />
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      class="max-w-800px"
    >
      <el-form-item label="抬头类型" prop="titleType">
        <el-radio-group
          v-if="isEditing"
          v-model="formData.titleType"
          @change="handleTitleTypeChange"
        >
          <el-radio
            v-for="dict in getStrDictOptions('supply_chain_invoice_title_type')"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
        <span v-else>{{ getDictLabel('supply_chain_invoice_title_type', formData.titleType) || '-' }}</span>
      </el-form-item>
      <el-form-item label="开票抬头" prop="invoiceTitle">
        <el-input v-if="isEditing" v-model="formData.invoiceTitle" placeholder="请输入开票抬头" />
        <span v-else>{{ displayText(formData.invoiceTitle) }}</span>
      </el-form-item>
      <el-form-item label="统一社会信用代码" prop="socialCreditCode">
        <el-input
          v-if="isEditing"
          v-model="formData.socialCreditCode"
          placeholder="请输入统一社会信用代码"
          :disabled="formData.titleType === InvoiceTitleTypeEnum.PERSONAL"
        />
        <span v-else>{{ displayText(formData.socialCreditCode) }}</span>
      </el-form-item>
      <el-form-item label="电话" prop="phone">
        <el-input v-if="isEditing" v-model="formData.phone" placeholder="请输入电话" />
        <span v-else>{{ displayText(formData.phone) }}</span>
      </el-form-item>
      <el-form-item label="开户行" prop="bankName">
        <el-input
          v-if="isEditing"
          v-model="formData.bankName"
          placeholder="请输入开户行"
          :disabled="formData.titleType === InvoiceTitleTypeEnum.PERSONAL"
        />
        <span v-else>{{ displayText(formData.bankName) }}</span>
      </el-form-item>
      <el-form-item label="开户账号" prop="bankAccount">
        <el-input
          v-if="isEditing"
          v-model="formData.bankAccount"
          placeholder="请输入开户账号"
          :disabled="formData.titleType === InvoiceTitleTypeEnum.PERSONAL"
        />
        <span v-else>{{ displayText(formData.bankAccount) }}</span>
      </el-form-item>
      <el-form-item label="开票地址" prop="invoiceAddress">
        <el-input
          v-if="isEditing"
          v-model="formData.invoiceAddress"
          placeholder="请输入开票地址"
        />
        <span v-else>{{ displayText(formData.invoiceAddress) }}</span>
      </el-form-item>
      <el-form-item>
        <el-button v-if="!isEditing" type="primary" @click="handleEdit">编 辑</el-button>
        <template v-else>
          <el-button type="primary" :loading="saving" @click="handleSave">保 存</el-button>
          <el-button :disabled="saving" @click="handleCancel">取 消</el-button>
        </template>
      </el-form-item>
    </el-form>
  </ContentWrap>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import { InvoiceSaveReqVO, SupplierApi, SupplierInvoiceView } from '@/api/supplier/manage'
import { getDictLabel, getStrDictOptions } from '@/utils/dict'
import { InvoiceTitleTypeEnum } from '@/views/supplier/utils/constants'

defineOptions({ name: 'SupplierInvoiceInfo' })

const props = defineProps<{
  supplierCode: string
}>()

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const isEditing = ref(false)
const formRef = ref<FormInstance>()

const createDefaultForm = (): SupplierInvoiceView => ({
  id: undefined,
  persisted: false,
  supplierCode: props.supplierCode,
  titleType: InvoiceTitleTypeEnum.ENTERPRISE,
  invoiceTitle: '',
  socialCreditCode: '',
  phone: '',
  bankName: '',
  bankAccount: '',
  invoiceAddress: '',
  createdAt: undefined,
  updatedAt: undefined
})

const formData = reactive<SupplierInvoiceView>(createDefaultForm())
const originFormData = ref<SupplierInvoiceView>()

const snapshotFormData = () => {
  originFormData.value = { ...formData }
}

const restoreFormData = () => {
  if (!originFormData.value) return
  Object.assign(formData, originFormData.value)
}

const applyInvoice = (data?: SupplierInvoiceView | null) => {
  Object.assign(formData, createDefaultForm(), data || {})
  if (!formData.titleType) {
    formData.titleType = InvoiceTitleTypeEnum.ENTERPRISE
  }
}

const formRules = computed<FormRules>(() => {
  if (!isEditing.value) return {}
  const isEnterprise = formData.titleType === InvoiceTitleTypeEnum.ENTERPRISE
  return {
    titleType: [{ required: true, message: '请选择抬头类型', trigger: 'change' }],
    invoiceTitle: [{ required: true, message: '请输入开票抬头', trigger: 'blur' }],
    socialCreditCode: isEnterprise
      ? [{ required: true, message: '请输入统一社会信用代码', trigger: 'blur' }]
      : [],
    bankName: isEnterprise ? [{ required: true, message: '请输入开户行', trigger: 'blur' }] : [],
    bankAccount: isEnterprise
      ? [{ required: true, message: '请输入开户账号', trigger: 'blur' }]
      : []
  }
})

const displayText = (value?: string | number | null) => {
  if (value === undefined || value === null || value === '') return '-'
  return String(value)
}

const invoiceTip = computed(() => {
  if (formData.persisted) {
    return '开票信息已独立保存，不会回写供应商档案。'
  }
  return '暂无开票记录时，系统按供应商档案预填（不落库）；保存后独立存储，不会回写档案。'
})

const loadData = async () => {
  if (!props.supplierCode) return
  isEditing.value = false
  loading.value = true
  try {
    const data = await SupplierApi.getInvoice(props.supplierCode)
    applyInvoice(data)
    snapshotFormData()
  } catch {
    applyInvoice()
    snapshotFormData()
  } finally {
    loading.value = false
  }
}

const handleTitleTypeChange = () => {
  formRef.value?.clearValidate(['socialCreditCode', 'bankName', 'bankAccount'])
  if (formData.titleType === InvoiceTitleTypeEnum.PERSONAL) {
    formData.socialCreditCode = ''
    formData.bankName = ''
    formData.bankAccount = ''
  }
}

const handleEdit = () => {
  snapshotFormData()
  isEditing.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const handleCancel = () => {
  restoreFormData()
  isEditing.value = false
  nextTick(() => formRef.value?.clearValidate())
}

const buildSavePayload = (): InvoiceSaveReqVO => {
  const isEnterprise = formData.titleType === InvoiceTitleTypeEnum.ENTERPRISE
  return {
    titleType: formData.titleType,
    invoiceTitle: formData.invoiceTitle,
    socialCreditCode: isEnterprise ? formData.socialCreditCode : undefined,
    phone: formData.phone,
    bankName: isEnterprise ? formData.bankName : undefined,
    bankAccount: isEnterprise ? formData.bankAccount : undefined,
    invoiceAddress: formData.invoiceAddress
  }
}

const handleSave = async () => {
  if (!props.supplierCode) {
    message.error('缺少供应商编号，无法保存')
    return
  }
  await formRef.value?.validate()
  saving.value = true
  try {
    const data = await SupplierApi.saveInvoice(props.supplierCode, buildSavePayload())
    applyInvoice(data)
    snapshotFormData()
    message.success('开票信息保存成功')
    isEditing.value = false
    formRef.value?.clearValidate()
  } finally {
    saving.value = false
  }
}

watch(
  () => props.supplierCode,
  () => loadData(),
  { immediate: true }
)
</script>
