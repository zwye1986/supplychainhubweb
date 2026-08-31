<template>
  <ContentWrap v-loading="loading">
    <el-alert
      class="mb-16px"
      type="info"
      :closable="false"
      title="进入标签页时，系统自动从基础信息中读取开票相关字段进行预填；可二次编辑并独立保存。"
    />
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      class="max-w-800px"
    >
      <el-form-item label="抬头类型" prop="titleType">
        <el-radio-group v-model="formData.titleType" @change="handleTitleTypeChange">
          <el-radio
            v-for="item in INVOICE_TITLE_TYPE_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="开票抬头" prop="invoiceTitle">
        <el-input v-model="formData.invoiceTitle" placeholder="请输入开票抬头" />
      </el-form-item>
      <el-form-item label="统一社会信用代码" prop="socialCreditCode">
        <el-input
          v-model="formData.socialCreditCode"
          placeholder="请输入统一社会信用代码"
          :disabled="formData.titleType === InvoiceTitleTypeEnum.PERSONAL"
        />
      </el-form-item>
      <el-form-item label="电话" prop="phone">
        <el-input v-model="formData.phone" placeholder="请输入电话" />
      </el-form-item>
      <el-form-item label="开户行" prop="bankName">
        <el-input
          v-model="formData.bankName"
          placeholder="请输入开户行"
          :disabled="formData.titleType === InvoiceTitleTypeEnum.PERSONAL"
        />
      </el-form-item>
      <el-form-item label="开户账号" prop="bankAccount">
        <el-input
          v-model="formData.bankAccount"
          placeholder="请输入开户账号"
          :disabled="formData.titleType === InvoiceTitleTypeEnum.PERSONAL"
        />
      </el-form-item>
      <el-form-item label="开票地址" prop="invoiceAddress">
        <el-input v-model="formData.invoiceAddress" placeholder="请输入开票地址" />
      </el-form-item>
      <el-form-item>
        <el-button
          v-hasPermi="['scm:supplier:update']"
          type="primary"
          :loading="saving"
          @click="handleSave"
        >
          保 存
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import { SupplierApi, SupplierInvoiceVO, SupplierVO } from '@/api/supplier/manage'
import {
  INVOICE_TITLE_TYPE_OPTIONS,
  InvoiceTitleTypeEnum
} from '@/views/supplier/utils/constants'

defineOptions({ name: 'SupplierInvoiceInfo' })

const props = defineProps<{
  supplierId: number
  supplier: SupplierVO
}>()

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive<SupplierInvoiceVO>({
  supplierId: undefined,
  titleType: InvoiceTitleTypeEnum.ENTERPRISE,
  invoiceTitle: '',
  socialCreditCode: '',
  phone: '',
  bankName: '',
  bankAccount: '',
  invoiceAddress: ''
})

const formRules = computed<FormRules>(() => {
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

const prefillFromSupplier = () => {
  formData.supplierId = props.supplierId
  formData.invoiceTitle = props.supplier.companyName || props.supplier.name || ''
  formData.socialCreditCode = props.supplier.socialCreditCode || ''
  formData.phone = props.supplier.contactMobile || props.supplier.contacts?.[0]?.mobile || ''
  formData.bankName = props.supplier.bankName || ''
  formData.bankAccount = props.supplier.bankAccount || ''
  formData.invoiceAddress = props.supplier.registerAddress || props.supplier.businessAddress || ''
}

const loadData = async () => {
  if (!props.supplierId) return
  loading.value = true
  try {
    const data = await SupplierApi.getInvoice(props.supplierId)
    if (data?.id || data?.invoiceTitle) {
      Object.assign(formData, data, { supplierId: props.supplierId })
    } else {
      prefillFromSupplier()
    }
  } catch {
    prefillFromSupplier()
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

const handleSave = async () => {
  await formRef.value?.validate()
  saving.value = true
  try {
    await SupplierApi.saveInvoice({ ...formData, supplierId: props.supplierId })
    message.success('开票信息保存成功')
  } finally {
    saving.value = false
  }
}

watch(
  () => props.supplierId,
  () => loadData(),
  { immediate: true }
)
</script>
