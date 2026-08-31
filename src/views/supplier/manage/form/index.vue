<template>
  <el-dialog
    v-model="dialogVisible"
    :title="pageTitle"
    width="1100px"
    :close-on-click-modal="false"
    append-to-body
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="140px"
    >
      <!-- 基础信息 -->
      <el-divider content-position="left">基础信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="供应商名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入供应商名称" maxlength="100" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="供应商编号" prop="code">
            <el-input
              :model-value="formData.code"
              placeholder="保存后系统自动生成"
              readonly
            >
              <template v-if="!formData.code" #suffix>
                <span class="text-gray-400 text-12px">YYYYMMDD-XXX</span>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 联系信息 -->
      <el-divider content-position="left">联系信息</el-divider>
      <el-form-item label="联系人" required>
        <div class="w-full">
          <el-table :data="formData.contacts" border size="small" class="mb-10px">
            <el-table-column label="姓名" min-width="140">
              <template #default="{ row, $index }">
                <el-form-item
                  :prop="`contacts.${$index}.name`"
                  :rules="[{ required: true, message: '请输入姓名', trigger: 'blur' }]"
                  class="!mb-0"
                >
                  <el-input v-model="row.name" placeholder="姓名" />
                </el-form-item>
              </template>
            </el-table-column>
            <el-table-column label="手机号" min-width="160">
              <template #default="{ row, $index }">
                <el-form-item
                  :prop="`contacts.${$index}.mobile`"
                  :rules="[
                    { required: true, message: '请输入手机号', trigger: 'blur' },
                    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' }
                  ]"
                  class="!mb-0"
                >
                  <el-input v-model="row.mobile" placeholder="手机号" maxlength="11" />
                </el-form-item>
              </template>
            </el-table-column>
            <el-table-column label="邮箱" min-width="180">
              <template #default="{ row }">
                <el-input v-model="row.email" placeholder="邮箱" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90" align="center">
              <template #default="{ $index }">
                <el-button
                  link
                  type="danger"
                  :disabled="formData.contacts!.length <= 1"
                  @click="removeContact($index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" link @click="addContact">
            <Icon icon="ep:plus" class="mr-4px" /> 添加联系人
          </el-button>
        </div>
      </el-form-item>

      <!-- 服务能力 -->
      <el-divider content-position="left">服务能力</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="配送区域" prop="deliveryAreaType">
            <div class="flex w-full flex-col gap-10px">
              <el-select
                v-model="formData.deliveryAreaType"
                placeholder="请选择配送区域"
                clearable
                class="!w-full"
                @change="handleDeliveryAreaTypeChange"
              >
                <el-option
                  v-for="item in DELIVERY_AREA_TYPE_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <AreaSelect
                v-if="formData.deliveryAreaType === DeliveryAreaTypeEnum.SPECIFIED"
                v-model="formData.deliveryAreaId"
                check-strictly
                class="!w-full"
                placeholder="请选择省市区"
              />
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发货时效" prop="shippingTimeliness">
            <div class="flex w-full items-center gap-10px">
              <el-select
                v-model="formData.shippingTimeliness"
                placeholder="请选择发货时效"
                clearable
                class="!w-full"
                @change="handleShippingTimelinessChange"
              >
                <el-option
                  v-for="item in SHIPPING_TIMELINESS_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-input
                v-if="formData.shippingTimeliness === ShippingTimelinessEnum.CUSTOM"
                v-model="formData.shippingTimelinessCustom"
                placeholder="请输入自定义时效"
                maxlength="50"
                class="!w-220px"
              />
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否支持售后" prop="supportAfterSale">
            <el-radio-group v-model="formData.supportAfterSale">
              <el-radio :value="true">是</el-radio>
              <el-radio :value="false">否</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 商务信息 -->
      <el-divider content-position="left">商务信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="结算方式" prop="settlementType">
            <el-select
              v-model="formData.settlementType"
              placeholder="请选择结算方式"
              clearable
              class="!w-full"
            >
              <el-option
                v-for="item in SUPPLIER_SETTLEMENT_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="账期(天)" prop="settlementCycle">
            <el-input-number
              v-model="formData.settlementCycle"
              :min="0"
              :precision="0"
              class="!w-full"
              placeholder="账期天数"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="合同编号" prop="contractNo">
            <el-input v-model="formData.contractNo" placeholder="请输入合同编号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="合同起止日期" prop="contractDateRange">
            <el-date-picker
              v-model="contractDateRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 公司及法人信息 -->
      <el-divider content-position="left">公司及法人信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="公司名称" prop="companyName">
            <el-input v-model="formData.companyName" placeholder="请输入公司名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="统一社会信用代码" prop="socialCreditCode">
            <el-input
              v-model="formData.socialCreditCode"
              placeholder="请输入统一社会信用代码"
              maxlength="18"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="法人姓名" prop="legalPersonName">
            <el-input v-model="formData.legalPersonName" placeholder="请输入法人姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="法人身份证号" prop="legalPersonIdNo">
            <el-input
              v-model="formData.legalPersonIdNo"
              placeholder="请输入法人身份证号"
              maxlength="18"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="注册地址" prop="registerAddress">
            <el-input v-model="formData.registerAddress" placeholder="请输入注册地址" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="经营地址" prop="businessAddress">
            <el-input v-model="formData.businessAddress" placeholder="请输入经营地址" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 账户信息 -->
      <el-divider content-position="left">账户信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开户名" prop="accountName">
            <el-input v-model="formData.accountName" placeholder="请输入开户名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开户行" prop="bankName">
            <el-input v-model="formData.bankName" placeholder="请输入开户行" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开户账号" prop="bankAccount">
            <el-input v-model="formData.bankAccount" placeholder="请输入开户账号" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 资质信息 -->
      <el-divider content-position="left">资质信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="营业执照" prop="businessLicenseUrl" label-width="100px">
            <UploadImg v-model="formData.businessLicenseUrl" height="120px" width="120px" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="法人身份证正面" prop="legalIdFrontUrl" label-width="120px">
            <UploadImg v-model="formData.legalIdFrontUrl" height="120px" width="120px" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="法人身份证反面" prop="legalIdBackUrl" label-width="120px">
            <UploadImg v-model="formData.legalIdBackUrl" height="120px" width="120px" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="其他资质" prop="otherCertUrls">
            <UploadImgs v-model="formData.otherCertUrls" :limit="5" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" :loading="formLoading" @click="submitForm">保 存</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import { UploadImg, UploadImgs } from '@/components/UploadFile'
import AreaSelect from '@/views/system/area/components/AreaSelect.vue'
import { SupplierApi, SupplierContactVO, SupplierVO } from '@/api/supplier/manage'
import {
  DELIVERY_AREA_TYPE_OPTIONS,
  DeliveryAreaTypeEnum,
  SHIPPING_TIMELINESS_OPTIONS,
  ShippingTimelinessEnum,
  SUPPLIER_SETTLEMENT_OPTIONS,
  SupplierStatusEnum
} from '@/views/supplier/utils/constants'

defineOptions({ name: 'SupplierManageForm' })

const { t } = useI18n()
const message = useMessage()
const emit = defineEmits(['success', 'update:modelValue'])

const props = defineProps<{
  modelValue: boolean
  id?: number
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formLoading = ref(false)
const formRef = ref<FormInstance>()
const contractDateRange = ref<string[]>([])

const createEmptyContact = (): SupplierContactVO => ({
  name: '',
  mobile: '',
  email: ''
})

const createDefaultForm = (): SupplierVO =>
  ({
    id: undefined,
    code: '',
    name: '',
    shortName: '',
    status: SupplierStatusEnum.NORMAL,
    deliveryAreaType: undefined,
    deliveryAreaId: undefined,
    shippingTimeliness: undefined,
    shippingTimelinessCustom: '',
    supportAfterSale: undefined,
    companyName: '',
    socialCreditCode: '',
    legalPersonName: '',
    legalPersonIdNo: '',
    registerAddress: '',
    businessAddress: '',
    settlementType: undefined,
    settlementCycle: undefined,
    contractNo: '',
    contractStartDate: undefined,
    contractEndDate: undefined,
    accountName: '',
    bankName: '',
    bankAccount: '',
    businessLicenseUrl: '',
    legalIdFrontUrl: '',
    legalIdBackUrl: '',
    otherCertUrls: [],
    remark: '',
    contacts: [createEmptyContact()]
  }) as SupplierVO

const formData = ref<SupplierVO>(createDefaultForm())

const formRules = reactive<FormRules>({
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  companyName: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
  socialCreditCode: [
    { required: true, message: '请输入统一社会信用代码', trigger: 'blur' },
    {
      pattern: /^[0-9A-Z]{18}$/,
      message: '统一社会信用代码应为18位数字或大写字母',
      trigger: 'blur'
    }
  ]
})

const isEdit = computed(() => !!props.id)
const pageTitle = computed(() => (isEdit.value ? '编辑供应商' : '新增供应商'))

watch(
  contractDateRange,
  (val) => {
    formData.value.contractStartDate = val?.[0]
    formData.value.contractEndDate = val?.[1]
  },
  { deep: true }
)

/** 弹窗打开时加载数据 */
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      resetForm()
      if (props.id) {
        loadDetail(props.id)
      }
    }
  }
)

const addContact = () => {
  formData.value.contacts = [...(formData.value.contacts || []), createEmptyContact()]
}

const removeContact = (index: number) => {
  if ((formData.value.contacts?.length || 0) <= 1) {
    message.warning('至少保留一行联系人信息')
    return
  }
  formData.value.contacts?.splice(index, 1)
}

const handleDeliveryAreaTypeChange = () => {
  if (formData.value.deliveryAreaType !== DeliveryAreaTypeEnum.SPECIFIED) {
    formData.value.deliveryAreaId = undefined
  }
}

const handleShippingTimelinessChange = () => {
  if (formData.value.shippingTimeliness !== ShippingTimelinessEnum.CUSTOM) {
    formData.value.shippingTimelinessCustom = ''
  }
}

const resetForm = () => {
  formData.value = createDefaultForm()
  contractDateRange.value = []
  formRef.value?.resetFields()
}

const loadDetail = async (id: number) => {
  formLoading.value = true
  try {
    const data = await SupplierApi.getSupplier(id)
    formData.value = {
      ...createDefaultForm(),
      ...data,
      contacts: data.contacts?.length ? data.contacts : [createEmptyContact()],
      otherCertUrls: data.otherCertUrls || []
    } as any
    if (data.contractStartDate && data.contractEndDate) {
      contractDateRange.value = [data.contractStartDate, data.contractEndDate]
    }
  } finally {
    formLoading.value = false
  }
}

const submitForm = async () => {
  await formRef.value?.validate()
  if (!formData.value.contacts?.length) {
    message.warning('请至少填写一行联系人信息')
    return
  }
  if (
    formData.value.deliveryAreaType === DeliveryAreaTypeEnum.SPECIFIED &&
    !formData.value.deliveryAreaId
  ) {
    message.warning('请选择指定配送区域')
    return
  }
  if (
    formData.value.shippingTimeliness === ShippingTimelinessEnum.CUSTOM &&
    !formData.value.shippingTimelinessCustom?.trim()
  ) {
    message.warning('请输入自定义发货时效')
    return
  }
  formLoading.value = true
  try {
    const data = { ...formData.value } as SupplierVO
    if (isEdit.value) {
      await SupplierApi.updateSupplier(data)
      message.success(t('common.updateSuccess'))
    } else {
      await SupplierApi.createSupplier(data)
      message.success(t('common.createSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } catch (error: any) {
    message.error(error?.message || '保存失败')
  } finally {
    formLoading.value = false
  }
}

/** 弹窗完全关闭后重置表单 */
const handleClosed = () => {
  resetForm()
}
</script>
