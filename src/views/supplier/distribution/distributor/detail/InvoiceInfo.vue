<template>
  <ContentWrap v-loading="loading">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="140px" class="max-w-800px">
      <el-form-item label="抬头类型" prop="titleType">
        <el-radio-group v-if="isEditing" v-model="formData.titleType" @change="handleTitleTypeChange">
          <el-radio v-for="dict in titleTypeOptions" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
        <span v-else>{{ titleTypeOptions.find((item) => item.value === formData.titleType)?.label || '-' }}</span>
      </el-form-item>
      <el-form-item label="开票抬头" prop="invoiceTitle">
        <el-input v-if="isEditing" v-model="formData.invoiceTitle" placeholder="请输入开票抬头" />
        <span v-else>{{ displayText(formData.invoiceTitle) }}</span>
      </el-form-item>
      <el-form-item v-if="formData.titleType !== 'PERSONAL'" label="统一社会信用代码" prop="socialCreditCode">
        <el-input v-if="isEditing" v-model="formData.socialCreditCode" placeholder="请输入统一社会信用代码" />
        <span v-else>{{ displayText(formData.socialCreditCode) }}</span>
      </el-form-item>
      <el-form-item label="电话" prop="phone">
        <el-input v-if="isEditing" v-model="formData.phone" placeholder="请输入电话" />
        <span v-else>{{ displayText(formData.phone) }}</span>
      </el-form-item>
      <el-form-item label="开户行" prop="bankName">
        <el-input v-if="isEditing" v-model="formData.bankName" placeholder="请输入开户行" />
        <span v-else>{{ displayText(formData.bankName) }}</span>
      </el-form-item>
      <el-form-item label="开户账号" prop="bankAccount">
        <el-input v-if="isEditing" v-model="formData.bankAccount" placeholder="请输入开户账号" />
        <span v-else>{{ displayText(formData.bankAccount) }}</span>
      </el-form-item>
      <el-form-item label="开票地址" prop="invoiceAddress">
        <el-input v-if="isEditing" v-model="formData.invoiceAddress" placeholder="请输入开票地址" />
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
  import { BuyerInvoiceView, DistributorApi, InvoiceSaveReqVO } from '@/api/supplier/distribution'
  import { getDictLabel } from '@/utils/dict'

  defineOptions({ name: 'DistributorInvoiceInfo' })

  const props = defineProps<{
    buyerCode: string
  }>()

  const message = useMessage()
  const loading = ref(false)
  const saving = ref(false)
  const isEditing = ref(false)
  const formRef = ref<FormInstance>()

  // 固定业务类型保证个人可选，展示名称仍优先使用字典。
  const titleTypeOptions = computed(() => [
    { value: 'ENTERPRISE', label: getDictLabel('supply_chain_invoice_title_type', 'ENTERPRISE') || '企业' },
    { value: 'PERSONAL', label: getDictLabel('supply_chain_invoice_title_type', 'PERSONAL') || '个人' }
  ])

  const createDefaultForm = (): BuyerInvoiceView => ({
    id: undefined,
    persisted: false,
    buyerCode: props.buyerCode,
    titleType: 'ENTERPRISE',
    invoiceTitle: '',
    socialCreditCode: '',
    phone: '',
    bankName: '',
    bankAccount: '',
    invoiceAddress: '',
    createdAt: undefined,
    updatedAt: undefined
  })

  const formData = reactive<BuyerInvoiceView>(createDefaultForm())
  const originFormData = ref<BuyerInvoiceView>()
  type InvoiceDraft = Pick<BuyerInvoiceView,
    'invoiceTitle' | 'socialCreditCode' | 'phone' | 'bankName' | 'bankAccount' | 'invoiceAddress'>
  const titleTypeDrafts = ref<Record<string, InvoiceDraft>>({})
  const activeTitleType = ref('ENTERPRISE')

  const pickInvoiceDraft = (data: BuyerInvoiceView): InvoiceDraft => ({
    invoiceTitle: data.invoiceTitle,
    socialCreditCode: data.socialCreditCode,
    phone: data.phone,
    bankName: data.bankName,
    bankAccount: data.bankAccount,
    invoiceAddress: data.invoiceAddress
  })

  const resetTitleTypeDrafts = () => {
    titleTypeDrafts.value = {}
    activeTitleType.value = formData.titleType || 'ENTERPRISE'
  }

  const snapshotFormData = () => {
    originFormData.value = { ...formData }
  }

  const restoreFormData = () => {
    if (!originFormData.value) return
    Object.assign(formData, originFormData.value)
  }

  const applyInvoice = (data?: BuyerInvoiceView | null) => {
    Object.assign(formData, createDefaultForm(), data || {})
    if (!formData.titleType) {
      formData.titleType = 'ENTERPRISE'
    }
    resetTitleTypeDrafts()
  }

  const formRules = computed<FormRules>(() => {
    if (!isEditing.value) return {}
    const isEnterprise = formData.titleType === 'ENTERPRISE'
    return {
      titleType: [{ required: true, message: '请选择抬头类型', trigger: 'change' }],
      invoiceTitle: [{ required: true, message: '请输入开票抬头', trigger: 'blur' }],
      socialCreditCode: isEnterprise
        ? [{ required: true, message: '请输入统一社会信用代码', trigger: 'blur' }]
        : [],
      bankName: [{ required: true, message: '请输入开户行', trigger: 'blur' }],
      bankAccount: [{ required: true, message: '请输入开户账号', trigger: 'blur' }]
    }
  })

  const displayText = (value?: string | number | null) => {
    if (value === undefined || value === null || value === '') return '-'
    return String(value)
  }

  const loadData = async () => {
    if (!props.buyerCode) return
    isEditing.value = false
    loading.value = true
    try {
      const data = await DistributorApi.getInvoice(props.buyerCode)
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
    const nextType = formData.titleType || 'ENTERPRISE'
    if (nextType !== activeTitleType.value) {
      titleTypeDrafts.value[activeTitleType.value] = pickInvoiceDraft(formData)
      Object.assign(formData, titleTypeDrafts.value[nextType] || pickInvoiceDraft(createDefaultForm()))
      activeTitleType.value = nextType
    }
    nextTick(() => formRef.value?.clearValidate())
  }

  const handleEdit = () => {
    snapshotFormData()
    resetTitleTypeDrafts()
    isEditing.value = true
    nextTick(() => formRef.value?.clearValidate())
  }

  const handleCancel = () => {
    restoreFormData()
    resetTitleTypeDrafts()
    isEditing.value = false
    nextTick(() => formRef.value?.clearValidate())
  }

  const buildSavePayload = (): InvoiceSaveReqVO => {
    const isEnterprise = formData.titleType === 'ENTERPRISE'
    return {
      titleType: formData.titleType,
      invoiceTitle: formData.invoiceTitle,
      socialCreditCode: isEnterprise ? formData.socialCreditCode : undefined,
      phone: formData.phone,
      bankName: formData.bankName,
      bankAccount: formData.bankAccount,
      invoiceAddress: formData.invoiceAddress
    }
  }

  const handleSave = async () => {
    if (!props.buyerCode) {
      message.error('缺少分销商编号，无法保存')
      return
    }
    await formRef.value?.validate()
    saving.value = true
    try {
      const data = await DistributorApi.saveInvoice(props.buyerCode, buildSavePayload())
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
    () => props.buyerCode,
    () => loadData(),
    { immediate: true }
  )
</script>
