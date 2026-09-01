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
      <el-divider content-position="left">基础信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="分销商名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入分销商企业全称" maxlength="100" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="分销商编号" prop="code">
            <el-input :model-value="formData.code" placeholder="保存后系统自动生成" readonly>
              <template v-if="!formData.code" #suffix>
                <span class="text-12px text-gray-400">如 18-001</span>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="分销等级" prop="level">
            <el-select
              v-model="formData.level"
              placeholder="请选择分销等级"
              class="!w-full"
              @change="handleLevelChange"
            >
              <el-option
                v-for="item in DISTRIBUTION_LEVEL_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="上级分销商" prop="parentId">
            <el-select
              v-model="formData.parentId"
              placeholder="一级分销商可不选上级"
              clearable
              filterable
              class="!w-full"
              :disabled="formData.level === DistributionLevelEnum.L1"
            >
              <el-option
                v-for="item in parentOptions"
                :key="item.id"
                :label="`${item.name}（${getDistributionLevelLabel(item.level)}）`"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="合作模式" prop="cooperationMode">
            <el-select
              v-model="formData.cooperationMode"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择合作模式（可多选）"
              class="!w-full"
            >
              <el-option
                v-for="item in COOPERATION_MODE_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="分销商类型" prop="distributorType">
            <el-select
              v-model="formData.distributorType"
              placeholder="请选择分销商类型"
              clearable
              class="!w-full"
            >
              <el-option
                v-for="item in DISTRIBUTOR_TYPE_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">联系信息</el-divider>
      <el-form-item label="联系人" required>
        <div class="w-full">
          <el-table :data="formData.contacts" border size="small" class="mb-10px">
            <el-table-column label="姓名" min-width="140">
              <template #default="{ row }">
                <el-input v-model="row.name" placeholder="姓名" maxlength="50" />
              </template>
            </el-table-column>
            <el-table-column label="手机号" min-width="160">
              <template #default="{ row }">
                <el-input v-model="row.mobile" placeholder="手机号" maxlength="11" />
              </template>
            </el-table-column>
            <el-table-column label="邮箱" min-width="180">
              <template #default="{ row }">
                <el-input v-model="row.email" placeholder="邮箱" maxlength="100" />
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

      <el-divider content-position="left">分销信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="分销品类" prop="category">
            <el-checkbox-group v-model="formData.category">
              <el-checkbox
                v-for="item in DIST_CATEGORY_OPTIONS"
                :key="item.value"
                :label="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="商品类型" prop="productType">
            <el-checkbox-group v-model="formData.productType">
              <el-checkbox
                v-for="item in DIST_PRODUCT_TYPE_OPTIONS"
                :key="item.value"
                :label="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="供货择优倾向" prop="supplyPreference">
            <el-select
              v-model="formData.supplyPreference"
              placeholder="请选择供货择优倾向"
              clearable
              class="!w-full"
            >
              <el-option
                v-for="item in SUPPLY_PREFERENCE_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">结算与商务</el-divider>
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
          <el-form-item label="结算周期（天）" prop="settlementCycle">
            <el-input-number
              v-model="formData.settlementCycle"
              :min="0"
              :precision="0"
              class="!w-full"
              placeholder="请输入结算账期天数"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="对接方式" prop="integrationMethods">
            <el-select
              v-model="formData.integrationMethods"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择对接方式"
              clearable
              class="!w-full"
            >
              <el-option
                v-for="item in SUPPLIER_INTEGRATION_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="合作开始日期" prop="cooperationStartDate">
            <el-date-picker
              v-model="formData.cooperationStartDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择合作开始日期"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="合作状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio
                v-for="item in DISTRIBUTOR_STATUS_OPTIONS"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="合作说明" prop="cooperationRemark">
            <el-input
              v-model="formData.cooperationRemark"
              type="textarea"
              :rows="3"
              maxlength="200"
              show-word-limit
              placeholder="请输入合作备注说明"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">公司及法人信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="公司名称" prop="companyName">
            <el-input
              v-model="formData.companyName"
              placeholder="请输入营业执照上的公司全称"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="社会统一信用代码" prop="socialCreditCode">
            <el-input
              v-model="formData.socialCreditCode"
              placeholder="请输入统一社会信用代码"
              maxlength="18"
              show-word-limit
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="营业执照" prop="businessLicenseUrls">
            <UploadFile
              v-model="businessLicenseUrls"
              :file-type="UNLIMITED_FILE_TYPES"
              :file-size="10"
              :limit="5"
              :drag="true"
              :disabled="isView"
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
        <el-col :span="24">
          <el-form-item label="法人身份证" prop="legalIdUrls">
            <UploadFile
              v-model="legalIdUrls"
              :file-type="UNLIMITED_FILE_TYPES"
              :file-size="10"
              :limit="2"
              :drag="true"
              :disabled="isView"
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

      <el-divider content-position="left">账户信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开户行" prop="bankName">
            <el-input v-model="formData.bankName" placeholder="请输入开户银行名称" maxlength="100" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开户账号" prop="bankAccount">
            <el-input v-model="formData.bankAccount" placeholder="请输入银行账户号码" maxlength="50" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="当前账户余额" prop="accountBalance">
            <el-input-number
              v-model="formData.accountBalance"
              :min="0"
              :precision="2"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">资质信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="资质文件" prop="otherCertUrls">
            <UploadFile
              v-model="otherCertUrls"
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
        确 定
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import { UploadFile } from '@/components/UploadFile'
import {
  DistributorApi,
  DistributorContactVO,
  DistributorVO
} from '@/api/supplier/distribution'
import {
  COOPERATION_MODE_OPTIONS,
  DIST_CATEGORY_OPTIONS,
  DIST_PRODUCT_TYPE_OPTIONS,
  DISTRIBUTION_LEVEL_OPTIONS,
  DISTRIBUTOR_STATUS_OPTIONS,
  DISTRIBUTOR_TYPE_OPTIONS,
  DistributionLevelEnum,
  DistributorStatusEnum,
  SUPPLIER_INTEGRATION_OPTIONS,
  SUPPLIER_SETTLEMENT_OPTIONS,
  SUPPLY_PREFERENCE_OPTIONS,
  getDistributionLevelLabel
} from '@/views/supplier/utils/constants'

const UNLIMITED_FILE_TYPES = ['']

defineOptions({ name: 'DistributorFormDialog' })

const { t } = useI18n()
const message = useMessage()
const emit = defineEmits(['success', 'update:modelValue'])

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    id?: number
    mode?: 'create' | 'edit' | 'view'
  }>(),
  { mode: 'create' }
)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formLoading = ref(false)
const formRef = ref<FormInstance>()
const parentOptions = ref<{ id: number; name: string; level?: number; code?: string }[]>([])
const isView = computed(() => props.mode === 'view')
const isEdit = computed(() => props.mode === 'edit' || (!!props.id && props.mode !== 'view'))

const createEmptyContact = (): DistributorContactVO => ({
  name: '',
  mobile: '',
  email: ''
})

const createDefaultForm = (): DistributorVO =>
  ({
    id: undefined,
    code: '',
    name: '',
    status: DistributorStatusEnum.NORMAL,
    level: DistributionLevelEnum.L1,
    parentId: undefined,
    parentName: '',
    cooperationMode: [],
    distributorType: undefined,
    category: [],
    productType: [],
    supplyPreference: undefined,
    companyName: '',
    socialCreditCode: '',
    businessLicenseUrls: [],
    legalPersonName: '',
    legalIdUrls: [],
    legalPersonMobile: '',
    contactAddress: '',
    settlementType: undefined,
    settlementCycle: undefined,
    integrationMethods: [],
    cooperationStartDate: undefined,
    cooperationRemark: '',
    bankName: '',
    bankAccount: '',
    accountBalance: undefined,
    otherCertUrls: [],
    contacts: [createEmptyContact()]
  }) as DistributorVO

const formData = ref<DistributorVO>(createDefaultForm())

/** UploadFile 要求 string | string[]，用计算属性避免 undefined */
const businessLicenseUrls = computed<string[]>({
  get: () => formData.value.businessLicenseUrls || [],
  set: (val) => {
    formData.value.businessLicenseUrls = Array.isArray(val) ? val : val ? [val] : []
  }
})
const legalIdUrls = computed<string[]>({
  get: () => formData.value.legalIdUrls || [],
  set: (val) => {
    formData.value.legalIdUrls = Array.isArray(val) ? val : val ? [val] : []
  }
})
const otherCertUrls = computed<string[]>({
  get: () => formData.value.otherCertUrls || [],
  set: (val) => {
    formData.value.otherCertUrls = Array.isArray(val) ? val : val ? [val] : []
  }
})

const formRules = reactive<FormRules>({
  name: [{ required: true, message: '请输入分销商名称', trigger: 'blur' }],
  level: [{ required: true, message: '请选择分销等级', trigger: 'change' }],
  cooperationMode: [{ required: true, message: '请选择合作模式', trigger: 'change', type: 'array' }],
  category: [{ required: true, message: '请选择分销品类', trigger: 'change', type: 'array' }],
  productType: [{ required: true, message: '请选择商品类型', trigger: 'change', type: 'array' }],
  companyName: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
  socialCreditCode: [
    { required: true, message: '请输入社会统一信用代码', trigger: 'blur' },
    {
      pattern: /^[0-9A-Z]{18}$/,
      message: '社会统一信用代码应为18位数字或大写字母',
      trigger: 'blur'
    }
  ]
})

const pageTitle = computed(() => {
  if (props.mode === 'view') return '分销商详情'
  if (props.mode === 'edit' || props.id) return '编辑分销商'
  return '新增分销商'
})

watch(
  () => [props.modelValue, props.id, props.mode] as const,
  async ([visible]) => {
    if (!visible) return
    resetForm()
    await loadParentOptions(props.id)
    if (props.id) {
      await loadDetail(props.id)
    }
  }
)

const loadParentOptions = async (excludeId?: number) => {
  try {
    parentOptions.value = (await DistributorApi.getParentOptions(excludeId)) || []
  } catch {
    parentOptions.value = []
  }
}

const handleLevelChange = () => {
  if (formData.value.level === DistributionLevelEnum.L1) {
    formData.value.parentId = undefined
  }
}

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

const resetForm = () => {
  formData.value = createDefaultForm()
  formRef.value?.resetFields()
}

const loadDetail = async (id: number) => {
  formLoading.value = true
  try {
    const data = await DistributorApi.getDistributor(id)
    formData.value = {
      ...createDefaultForm(),
      ...data,
      contacts: data.contacts?.length ? data.contacts : [createEmptyContact()],
      cooperationMode: data.cooperationMode || [],
      category: data.category || [],
      productType: data.productType || [],
      integrationMethods: data.integrationMethods || [],
      businessLicenseUrls: data.businessLicenseUrls || [],
      legalIdUrls: data.legalIdUrls || [],
      otherCertUrls: data.otherCertUrls || []
    } as DistributorVO
  } finally {
    formLoading.value = false
  }
}

const submitForm = async () => {
  await formRef.value?.validate()
  if (!formData.value.contacts?.length) {
    message.warning('请至少保留一行联系人信息')
    return
  }
  formLoading.value = true
  try {
    const data = { ...formData.value } as DistributorVO
    if (isEdit.value) {
      await DistributorApi.updateDistributor(data)
      message.success(t('common.updateSuccess'))
    } else {
      await DistributorApi.createDistributor(data)
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

const handleClosed = () => {
  dialogVisible.value = false
  resetForm()
}
</script>
