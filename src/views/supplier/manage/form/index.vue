<template>
  <el-dialog
    v-model="dialogVisible"
    :title="pageTitle"
    width="1100px"
    append-to-body
    :before-close="handleClosed"
  >
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      :disabled="isView"
      label-width="140px"
    >
      <!-- 基础信息 -->
      <el-divider content-position="left">基础信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="供应商名称" prop="supplierName">
            <el-input
              v-model="formData.supplierName"
              placeholder="请输入供应商名称"
              maxlength="128"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="供应商编号" prop="supplierCode">
            <el-input
              :model-value="formData.supplierCode"
              placeholder="保存后系统自动生成"
              readonly
            >
              <template v-if="!formData.supplierCode" #suffix>
                <span class="text-gray-400 text-12px">SPL_xxx</span>
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
                  :disabled="(formData.contacts?.length || 0) <= 1"
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
          <el-form-item label="配送区域" prop="deliveryRegionType">
            <div class="flex w-full flex-col gap-10px">
              <el-select
                v-model="formData.deliveryRegionType"
                placeholder="请选择配送区域"
                clearable
                class="!w-full"
                @change="handleDeliveryRegionTypeChange"
              >
                <el-option
                  v-for="dict in getStrDictOptions('supply_chain_delivery_region_type')"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
              <AreaSelect
                v-if="formData.deliveryRegionType === 'DESIGNATED'"
                v-model="selectedDeliveryAdcodes"
                :disabled="isView"
                check-strictly
                emit-path
                class="!w-full"
                placeholder="请选择省市区"
              />
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发货时效" prop="shippingSlaCode">
            <div class="flex w-full items-center gap-10px">
              <el-select
                v-model="formData.shippingSlaCode"
                placeholder="请选择发货时效"
                clearable
                class="!w-full"
                @change="handleShippingSlaChange"
              >
                <el-option
                  v-for="dict in getStrDictOptions('supply_chain_shipping_sla_code')"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
              <el-input
                v-if="formData.shippingSlaCode === 'CUSTOM'"
                v-model="formData.shippingSlaCustom"
                placeholder="请输入自定义时效"
                maxlength="50"
                class="!w-220px"
              />
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否支持售后" prop="aftersalesSupported">
            <el-radio-group v-model="formData.aftersalesSupported">
              <el-radio
                v-for="dict in getBoolDictOptions('supply_chain_aftersales_supported')"
                :key="String(dict.value)"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 商务信息 -->
      <el-divider content-position="left">商务信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="结算方式" prop="settlementMethod">
            <el-select
              v-model="formData.settlementMethod"
              placeholder="请选择结算方式"
              clearable
              class="!w-full"
            >
              <el-option
                v-for="dict in getStrDictOptions('supply_chain_settlement_method')"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结算周期（天）" prop="settlementCycleDays">
            <el-input-number
              v-model="formData.settlementCycleDays"
              :min="1"
              :precision="0"
              class="!w-full"
              placeholder="请输入结算账期天数"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="对接方式" prop="integrationModes">
            <el-select
              v-model="formData.integrationModes"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择对接方式"
              clearable
              class="!w-full"
            >
              <el-option
                v-for="dict in getStrDictOptions('supply_chain_integration_mode')"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="接入时间" prop="onboardedAt">
            <el-date-picker
              v-model="formData.onboardedAt"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss"
              placeholder="请选择接入时间"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="合作状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio
                v-for="dict in getStrDictOptions('supply_chain_supplier_status')"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="合作说明" prop="cooperationNote">
            <el-input
              v-model="formData.cooperationNote"
              type="textarea"
              :rows="3"
              maxlength="200"
              show-word-limit
              placeholder="请输入合作备注说明"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 公司及法人信息 -->
      <el-divider content-position="left">公司及法人信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="公司名称" prop="legalEntityName">
            <el-input
              v-model="formData.legalEntityName"
              placeholder="请输入营业执照上的公司全称"
              maxlength="256"
              show-word-limit
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="社会统一信用代码" prop="creditCode">
            <el-input
              v-model="formData.creditCode"
              placeholder="请输入统一社会信用代码"
              maxlength="18"
              show-word-limit
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="营业执照" prop="licenseFileKeys">
            <UploadImgs
              v-model="licenseFileKeysModel"
              :limit="5"
              :file-size="10"
              :disabled="isView"
              height="120px"
              width="120px"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="法人姓名" prop="legalPersonName">
            <el-input
              v-model="formData.legalPersonName"
              placeholder="请输入法定代表人姓名"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="法人手机号" prop="legalPersonMobile">
            <el-input
              v-model="formData.legalPersonMobile"
              placeholder="请输入法人手机号"
              maxlength="11"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="身份证正面" prop="idFrontFileKey">
            <UploadImg
              v-model="formData.idFrontFileKey"
              :file-size="10"
              :disabled="isView"
              height="120px"
              width="200px"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="身份证反面" prop="idBackFileKey">
            <UploadImg
              v-model="formData.idBackFileKey"
              :file-size="10"
              :disabled="isView"
              height="120px"
              width="200px"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="联系地址" prop="contactAddress">
            <el-input
              v-model="formData.contactAddress"
              placeholder="请输入公司联系地址"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 账户信息 -->
      <el-divider content-position="left">账户信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开户行" prop="bankName">
            <el-input
              v-model="formData.bankName"
              placeholder="请输入开户银行名称"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开户账号" prop="bankAccount">
            <el-input
              v-model="formData.bankAccount"
              placeholder="请输入银行账户号码"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
        </el-col>
        <el-col v-if="!isEdit" :span="12">
          <el-form-item label="当前账户余额" prop="openingBalanceYuan">
            <el-input-number
              v-model="openingBalanceYuan"
              :min="0"
              :precision="2"
              class="!w-full"
              placeholder="请输入当前账户可用余额"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 资质信息 -->
      <el-divider content-position="left">资质信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="资质文件" prop="qualificationFileKeys">
            <UploadFile
              v-model="formData.qualificationFileKeys"
              :file-type="UNLIMITED_FILE_TYPES"
              :file-size="10"
              :limit="5"
              :drag="true"
              :disabled="isView"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">{{ isView ? '关 闭' : '取 消' }}</el-button>
      <el-button v-if="!isView" type="primary" :loading="formLoading" @click="submitForm">
        保 存
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import { UploadFile, UploadImg, UploadImgs } from '@/components/UploadFile'
import AreaSelect from '@/views/system/area/components/AreaSelect.vue'
import {
  SupplierApi,
  SupplierContactVO,
  SupplierSaveReqVO,
  SupplierVO
} from '@/api/supplier/manage'
import { getBoolDictOptions, getStrDictOptions } from '@/utils/dict'

/** UploadFile 用空串绕过扩展名校验，实现「格式不限」 */
const UNLIMITED_FILE_TYPES = ['']

defineOptions({ name: 'SupplierManageForm' })

const { t } = useI18n()
const message = useMessage()
const emit = defineEmits(['success', 'update:modelValue'])

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    /** 供应商业务编码；有值时为编辑/详情 */
    supplierCode?: string
    /** create 新增 / edit 编辑 / view 详情只读 */
    mode?: 'create' | 'edit' | 'view'
  }>(),
  {
    mode: 'create'
  }
)

type SupplierFormModel = SupplierSaveReqVO & {
  supplierCode?: string
}

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formLoading = ref(false)
const formRef = ref<FormInstance>()
const isView = computed(() => props.mode === 'view')
const isEdit = computed(
  () => props.mode === 'edit' || (!!props.supplierCode && props.mode !== 'view')
)

/** 期初余额（元），提交时转换为分 */
const openingBalanceYuan = ref<number | undefined>(undefined)

const createEmptyContact = (): SupplierContactVO => ({
  name: '',
  mobile: '',
  email: ''
})

const createDefaultForm = (): SupplierFormModel => ({
  supplierCode: undefined,
  supplierName: '',
  status: 'ACTIVE',
  deliveryRegionType: '',
  deliveryRegionAdcodes: [],
  shippingSlaCode: undefined,
  shippingSlaCustom: '',
  aftersalesSupported: true,
  legalEntityName: '',
  creditCode: '',
  licenseFileKeys: [],
  idFrontFileKey: '',
  idBackFileKey: '',
  legalPersonName: '',
  legalPersonMobile: '',
  contactAddress: '',
  settlementMethod: undefined,
  settlementCycleDays: undefined,
  integrationModes: [],
  onboardedAt: undefined,
  cooperationNote: '',
  bankName: '',
  bankAccount: '',
  qualificationFileKeys: [],
  contacts: [createEmptyContact()]
})

const formData = ref<SupplierFormModel>(createDefaultForm())

/** UploadImgs 要求 string[]，避免 undefined */
const licenseFileKeysModel = computed<string[]>({
  get: () => formData.value.licenseFileKeys || [],
  set: (val) => {
    formData.value.licenseFileKeys = Array.isArray(val) ? val : val ? [val] : []
  }
})

/** AreaSelect 完整路径（省/市/区） <-> deliveryRegionAdcodes[] */
const selectedDeliveryAdcodes = computed<number[] | undefined>({
  get: () => {
    const codes = formData.value.deliveryRegionAdcodes
    if (!codes?.length) return undefined
    const nums = codes.map(Number).filter((n) => !Number.isNaN(n))
    return nums.length ? nums : undefined
  },
  set: (val) => {
    formData.value.deliveryRegionAdcodes = Array.isArray(val) ? val.map(String) : []
  }
})

const formRules = reactive<FormRules>({
  supplierName: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  deliveryRegionType: [{ required: true, message: '请选择配送区域', trigger: 'change' }],
  aftersalesSupported: [{ required: true, message: '请选择是否支持售后', trigger: 'change' }],
  legalEntityName: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
  creditCode: [
    { required: true, message: '请输入社会统一信用代码', trigger: 'blur' },
    {
      pattern: /^[0-9A-Z]{18}$/,
      message: '社会统一信用代码应为18位数字或大写字母',
      trigger: 'blur'
    }
  ],
  legalPersonMobile: [
    {
      validator: (_rule, value, callback) => {
        if (!value || /^1\d{10}$/.test(value)) {
          callback()
          return
        }
        callback(new Error('法人手机号格式不正确'))
      },
      trigger: 'blur'
    }
  ]
})

const pageTitle = computed(() => {
  if (props.mode === 'view') return '供应商详情'
  if (props.mode === 'edit' || props.supplierCode) return '编辑供应商'
  return '新增供应商'
})

/** 弹窗打开或切换 supplierCode/mode 时加载并回显数据 */
watch(
  () => [props.modelValue, props.supplierCode, props.mode] as const,
  async ([visible]) => {
    if (!visible) return
    resetForm()
    if (props.supplierCode) {
      await loadDetail(props.supplierCode)
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

const handleDeliveryRegionTypeChange = () => {
  if (formData.value.deliveryRegionType !== 'DESIGNATED') {
    formData.value.deliveryRegionAdcodes = []
  }
}

const handleShippingSlaChange = () => {
  if (formData.value.shippingSlaCode !== 'CUSTOM') {
    formData.value.shippingSlaCustom = ''
  }
}

const resetForm = () => {
  formData.value = createDefaultForm()
  openingBalanceYuan.value = undefined
  formRef.value?.resetFields()
}

const toFileArray = (value?: string | string[] | null) => {
  if (Array.isArray(value)) return value.filter(Boolean)
  return value ? [value] : []
}

const toSingleFile = (value?: string | string[] | null) => {
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
}

const formatOnboardedAt = (value?: string | number | null) => {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'number') {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return undefined
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }
  return String(value)
}

const mapDetailToForm = (data: SupplierVO): SupplierFormModel => {
  return {
    ...createDefaultForm(),
    supplierCode: data.supplierCode || data.code,
    supplierName: data.supplierName || data.name || '',
    status: data.status || 'ACTIVE',
    deliveryRegionType: data.deliveryRegionType || data.deliveryAreaType || '',
    deliveryRegionAdcodes:
      data.deliveryRegionAdcodes?.length
        ? data.deliveryRegionAdcodes.map(String)
        : data.deliveryAreaId != null
          ? [String(data.deliveryAreaId)]
          : [],
    shippingSlaCode: data.shippingSlaCode || data.shippingTimeliness,
    shippingSlaCustom: data.shippingSlaCustom || data.shippingTimelinessCustom || '',
    aftersalesSupported:
      data.aftersalesSupported ?? data.supportAfterSale ?? true,
    legalEntityName: data.legalEntityName || data.companyName || '',
    creditCode: data.creditCode || data.socialCreditCode || '',
    licenseFileKeys: toFileArray(data.licenseFileKeys),
    idFrontFileKey: data.idFrontFileKey || toFileArray(data.legalIdUrls)[0] || '',
    idBackFileKey: data.idBackFileKey || toFileArray(data.legalIdUrls)[1] || '',
    legalPersonName: data.legalPersonName || '',
    legalPersonMobile: data.legalPersonMobile || data.legalPersonMobileMasked || '',
    contactAddress: data.contactAddress || '',
    settlementMethod: data.settlementMethod || data.settlementType,
    settlementCycleDays: data.settlementCycleDays ?? data.settlementCycle,
    integrationModes: data.integrationModes || data.integrationMethods || [],
    onboardedAt: formatOnboardedAt(data.onboardedAt || data.accessDate || data.accessTime),
    cooperationNote: data.cooperationNote || data.cooperationRemark || '',
    bankName: data.bankName || '',
    bankAccount: data.bankAccount || data.bankAccountMasked || '',
    qualificationFileKeys: toFileArray(data.qualificationFileKeys || data.otherCertUrls),
    contacts: data.contacts?.length ? data.contacts : [createEmptyContact()]
  }
}

const loadDetail = async (supplierCode: string) => {
  formLoading.value = true
  try {
    const data = await SupplierApi.getSupplier(supplierCode)
    formData.value = mapDetailToForm(data)
  } finally {
    formLoading.value = false
  }
}

const buildSavePayload = (): SupplierSaveReqVO => {
  const licenseFileKeys = toFileArray(formData.value.licenseFileKeys)
  const qualificationFileKeys = toFileArray(formData.value.qualificationFileKeys)
  const payload: SupplierSaveReqVO = {
    supplierName: formData.value.supplierName,
    contacts: formData.value.contacts || [],
    deliveryRegionType: formData.value.deliveryRegionType,
    deliveryRegionAdcodes:
      formData.value.deliveryRegionType === 'DESIGNATED'
        ? formData.value.deliveryRegionAdcodes || []
        : [],
    aftersalesSupported: !!formData.value.aftersalesSupported,
    shippingSlaCode: formData.value.shippingSlaCode || undefined,
    shippingSlaCustom:
      formData.value.shippingSlaCode === 'CUSTOM'
        ? formData.value.shippingSlaCustom
        : undefined,
    settlementMethod: formData.value.settlementMethod || undefined,
    settlementCycleDays: formData.value.settlementCycleDays || undefined,
    integrationModes: formData.value.integrationModes || [],
    onboardedAt: formData.value.onboardedAt || undefined,
    status: formData.value.status || undefined,
    cooperationNote: formData.value.cooperationNote || undefined,
    legalEntityName: formData.value.legalEntityName,
    creditCode: formData.value.creditCode,
    legalPersonName: formData.value.legalPersonName || undefined,
    legalPersonMobile: formData.value.legalPersonMobile || undefined,
    contactAddress: formData.value.contactAddress || undefined,
    bankName: formData.value.bankName || undefined,
    bankAccount: formData.value.bankAccount || undefined,
    licenseFileKeys,
    licenseFileKey: licenseFileKeys[0],
    idFrontFileKey: toSingleFile(formData.value.idFrontFileKey) || undefined,
    idBackFileKey: toSingleFile(formData.value.idBackFileKey) || undefined,
    qualificationFileKeys,
    qualificationFileKey: qualificationFileKeys[0]
  }
  if (!isEdit.value && openingBalanceYuan.value != null) {
    payload.openingBalanceCents = Math.round(Number(openingBalanceYuan.value) * 100)
  }
  return payload
}

const submitForm = async () => {
  await formRef.value?.validate()
  if (!formData.value.contacts?.length) {
    message.warning('请至少填写一行联系人信息')
    return
  }
  if (
    formData.value.deliveryRegionType === 'DESIGNATED' &&
    !formData.value.deliveryRegionAdcodes?.length
  ) {
    message.warning('请选择指定配送区域')
    return
  }
  if (
    formData.value.shippingSlaCode === 'CUSTOM' &&
    !formData.value.shippingSlaCustom?.trim()
  ) {
    message.warning('请输入自定义发货时效')
    return
  }
  formLoading.value = true
  try {
    const data = buildSavePayload()
    if (isEdit.value) {
      const supplierCode = formData.value.supplierCode || props.supplierCode
      if (!supplierCode) {
        message.error('缺少供应商编号，无法保存')
        return
      }
      await SupplierApi.updateSupplier(supplierCode, data)
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
  dialogVisible.value = false
  resetForm()
}
</script>
