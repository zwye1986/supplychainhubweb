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
          <el-form-item label="分销商名称" prop="buyerName">
            <el-input v-model="formData.buyerName" placeholder="请输入分销商企业全称" maxlength="100" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="分销商编号" prop="buyerCode">
            <el-input :model-value="formData.buyerCode" placeholder="保存后系统自动生成" readonly>
              <template v-if="!formData.buyerCode" #suffix>
                <span class="text-12px text-gray-400">BYR_xxx</span>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="分销等级" prop="distributionLevel">
            <el-select
              v-model="formData.distributionLevel"
              placeholder="请选择分销等级"
              class="!w-full"
              @change="handleLevelChange"
            >
              <el-option
                v-for="dict in getStrDictOptions('supply_chain_distribution_level')"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="上级分销商" prop="parentBuyerCode">
            <el-select
              v-model="formData.parentBuyerCode"
              placeholder="一级分销商可不选上级"
              clearable
              filterable
              class="!w-full"
              :disabled="isL1Distributor"
            >
              <el-option
                v-for="item in parentOptions"
                :key="item.buyerCode"
                :label="`${item.buyerName}（${getDictLabel('supply_chain_distribution_level', item.distributionLevel) || '-'}）`"
                :value="item.buyerCode"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="合作模式" prop="cooperationModes">
            <el-select
              v-model="formData.cooperationModes"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择合作模式（可多选）"
              class="!w-full"
            >
              <el-option
                v-for="dict in getStrDictOptions('supply_chain_cooperation_mode')"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
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
                v-for="dict in getStrDictOptions('supply_chain_distributor_type')"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
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
              <template #default="{ row, $index }">
                <el-form-item
                  :prop="`contacts.${$index}.name`"
                  :rules="[{ required: true, message: '请输入姓名', trigger: 'blur' }]"
                  class="!mb-0"
                >
                  <el-input v-model="row.name" placeholder="姓名" maxlength="50" />
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
                <el-input v-model="row.email" placeholder="邮箱" maxlength="100" />
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

      <el-divider content-position="left">分销信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="分销品类" prop="categoryL1Ids">
            <el-checkbox-group v-model="formData.categoryL1Ids">
              <el-checkbox
                v-for="dict in getStrDictOptions('supply_chain_sellable_category')"
                :key="dict.value"
                :label="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="商品类型" prop="productTypes">
            <el-checkbox-group v-model="formData.productTypes">
              <el-checkbox
                v-for="item in typeList"
                :key="item.typeCode"
                :label="item.typeCode"
                :value="item.typeCode"
              >
                {{ item.typeName }}
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
                v-for="dict in getStrDictOptions('supply_chain_supply_preference')"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">结算与商务</el-divider>
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
              :controls="false"
              v-model="formData.settlementCycleDays"
              :min="0"
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
          <el-form-item label="合作开始时间" prop="cooperationStartedAt">
            <el-date-picker
              v-model="formData.cooperationStartedAt"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss"
              placeholder="请选择合作开始时间"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="合作状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio
                v-for="dict in getStrDictOptions('supply_chain_buyer_status')"
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

      <el-divider content-position="left">公司及法人信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="公司名称" prop="legalEntityName">
            <el-input
              v-model="formData.legalEntityName"
              placeholder="请输入营业执照上的公司全称"
              maxlength="100"
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
        <el-col v-if="!isEdit" :span="12">
          <el-form-item label="当前账户余额" prop="openingBalanceYuan">
            <el-input-number
              :controls="false"
              v-model="openingBalanceYuan"
              :min="0"
              :precision="2"
              class="!w-full"
              placeholder="请输入期初余额，空视为 0"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">资质信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="资质文件" prop="qualificationFileKeys">
            <UploadFile
              v-model="qualificationFileKeysModel"
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
import { UploadFile, UploadImg, UploadImgs } from '@/components/UploadFile'
import {
  BuyerDetail,
  BuyerSaveReqVO,
  DistributorApi,
  DistributorContactVO,
  DistributorVO
} from '@/api/supplier/distribution'
import { ProductTypeApi, ProductTypeVO } from '@/api/product'
import { getDictLabel, getStrDictOptions } from '@/utils/dict'
import { DistributorStatusEnum, yuanToCents } from '@/views/supplier/utils/constants'

const UNLIMITED_FILE_TYPES = ['']

defineOptions({ name: 'DistributorFormDialog' })

const { t } = useI18n()
const message = useMessage()
const emit = defineEmits(['success', 'update:modelValue'])

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    buyerCode?: string
    mode?: 'create' | 'edit' | 'view'
  }>(),
  { mode: 'create' }
)

type DistributorFormModel = BuyerSaveReqVO & {
  id?: number
  buyerCode?: string
  status?: string
}

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formLoading = ref(false)
const formRef = ref<FormInstance>()
const parentOptions = ref<{ buyerCode: string; buyerName: string; distributionLevel?: string | number }[]>([])
const typeList = ref<ProductTypeVO[]>([])
const isView = computed(() => props.mode === 'view')
const isEdit = computed(() => props.mode === 'edit' || (!!props.buyerCode && props.mode !== 'view'))
const openingBalanceYuan = ref<number | undefined>(undefined)

const createEmptyContact = (): DistributorContactVO => ({
  name: '',
  mobile: '',
  email: ''
})

const createDefaultForm = (): DistributorFormModel => ({
  id: undefined,
  buyerCode: undefined,
  buyerName: '',
  status: DistributorStatusEnum.NORMAL,
  distributionLevel: '1',
  parentBuyerCode: undefined,
  cooperationModes: [],
  distributorType: undefined,
  categoryL1Ids: [],
  productTypes: [],
  supplyPreference: undefined,
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
  cooperationStartedAt: undefined,
  cooperationNote: '',
  bankName: '',
  bankAccount: '',
  qualificationFileKeys: [],
  contacts: [createEmptyContact()]
})

const formData = ref<DistributorFormModel>(createDefaultForm())

const isL1Distributor = computed(() => formData.value.distributionLevel === '1')

/** 先用本地数据验证新增回显，后端就绪后改为 false */
const USE_FORM_MOCK = true

const firstDictValues = (dictType: string, count = 2) =>
  getStrDictOptions(dictType)
    .slice(0, count)
    .map((item) => item.value)

const applyMockForm = () => {
  formData.value = {
    ...createDefaultForm(),
    buyerName: '华东福利分销中心',
    status: 'ACTIVE',
    distributionLevel: '1',
    cooperationModes: firstDictValues('supply_chain_cooperation_mode'),
    distributorType: firstDictValues('supply_chain_distributor_type', 1)[0],
    categoryL1Ids: firstDictValues('supply_chain_sellable_category'),
    productTypes: typeList.value.slice(0, 2).map((item) => item.typeCode).filter(Boolean) as string[],
    supplyPreference: firstDictValues('supply_chain_supply_preference', 1)[0],
    legalEntityName: '上海华东福利科技有限公司',
    creditCode: '91310000MA1DIST001',
    legalPersonName: '李伟',
    legalPersonMobile: '13900010001',
    contactAddress: '上海市浦东新区世纪大道100号',
    settlementMethod: firstDictValues('supply_chain_settlement_method', 1)[0],
    settlementCycleDays: 30,
    integrationModes: firstDictValues('supply_chain_integration_mode'),
    cooperationStartedAt: '2026-07-01T10:00:00',
    cooperationNote: '一级分销商，覆盖华东区域企业客户',
    bankName: '工商银行上海分行',
    bankAccount: '6222020000000000001',
    contacts: [
      { name: '李伟', mobile: '13900010001', email: 'liwei@hdfl.com' },
      { name: '王芳', mobile: '13900010002', email: 'wangfang@hdfl.com' }
    ]
  }
  openingBalanceYuan.value = 10000
}

const licenseFileKeysModel = computed<string[]>({
  get: () => formData.value.licenseFileKeys || [],
  set: (val) => {
    formData.value.licenseFileKeys = Array.isArray(val) ? val : val ? [val] : []
  }
})

const qualificationFileKeysModel = computed<string[]>({
  get: () => formData.value.qualificationFileKeys || [],
  set: (val) => {
    formData.value.qualificationFileKeys = Array.isArray(val) ? val : val ? [val] : []
  }
})

const formRules = reactive<FormRules>({
  buyerName: [{ required: true, message: '请输入分销商名称', trigger: 'blur' }],
  distributionLevel: [{ required: true, message: '请选择分销等级', trigger: 'change' }],
  parentBuyerCode: [
    {
      validator: (_rule, value, callback) => {
        if (isL1Distributor.value || value) {
          callback()
          return
        }
        callback(new Error('请选择上级分销商'))
      },
      trigger: 'change'
    }
  ],
  cooperationModes: [{ required: true, message: '请选择合作模式', trigger: 'change', type: 'array' }],
  categoryL1Ids: [{ required: true, message: '请选择分销品类', trigger: 'change', type: 'array' }],
  productTypes: [{ required: true, message: '请选择商品类型', trigger: 'change', type: 'array' }],
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
  if (props.mode === 'view') return '分销商详情'
  if (props.mode === 'edit' || props.buyerCode) return '编辑分销商'
  return '新增分销商'
})

watch(
  () => [props.modelValue, props.buyerCode, props.mode] as const,
  async ([visible]) => {
    if (!visible) return
    resetForm()
    typeList.value = await ProductTypeApi.getTypeList()
    if (props.buyerCode) {
      await loadDetail(props.buyerCode)
    } else if (USE_FORM_MOCK) {
      applyMockForm()
    }
    await loadParentOptions()
  }
)

const loadParentOptions = async () => {
  const level = formData.value.distributionLevel
  if (!level || level === '1') {
    parentOptions.value = []
    return
  }
  try {
    parentOptions.value =
      (await DistributorApi.getParentOptions({
        excludeBuyerCode: formData.value.buyerCode || props.buyerCode,
        forLevel: level
      })) || []
  } catch {
    parentOptions.value = []
  }
}

const handleLevelChange = async () => {
  if (isL1Distributor.value) {
    formData.value.parentBuyerCode = undefined
  }
  await loadParentOptions()
  const codes = new Set(parentOptions.value.map((item) => item.buyerCode))
  if (formData.value.parentBuyerCode && !codes.has(formData.value.parentBuyerCode)) {
    formData.value.parentBuyerCode = undefined
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
  openingBalanceYuan.value = undefined
  parentOptions.value = []
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

const formatDateTime = (value?: string | number | null) => {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'number') {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return undefined
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return `${text}T00:00:00`
  return text
}

const normalizeCooperationModes = (modes?: string[]) => {
  const aliases: Record<string, string> = {
    direct: 'DIRECT',
    agent: 'AGENT',
    channel: 'CHANNEL'
  }
  return (modes || []).map((mode) => aliases[mode] || mode).filter(Boolean)
}

const normalizeDistributorType = (value?: string) => {
  const aliases: Record<string, string> = {
    enterprise: 'ENTERPRISE',
    personal: 'PERSONAL',
    platform: 'PLATFORM'
  }
  return value ? aliases[value] || value : undefined
}

const normalizeSettlementMethod = (value?: string) => {
  if (!value) return undefined
  const aliases: Record<string, string> = {
    daily: 'DAILY',
    weekly: 'WEEKLY',
    monthly: 'MONTHLY',
    quarterly: 'QUARTERLY',
    prepaid: 'PREPAID'
  }
  return aliases[value] || value.toUpperCase()
}

const normalizeIntegrationModes = (modes?: string[]) => {
  const aliases: Record<string, string> = {
    api: 'API',
    h5: 'H5',
    manual: 'MANUAL'
  }
  return (modes || []).map((mode) => aliases[mode] || mode.toUpperCase()).filter(Boolean)
}

const namedRefIds = (refs?: { id?: number; name?: string }[], fallback?: Array<string | number>) => {
  const ids = (refs || [])
    .map((item) => item?.id)
    .filter((id): id is number => typeof id === 'number')
  if (ids.length) return ids
  return fallback || []
}

const mapDetailToForm = (data: BuyerDetail & Partial<DistributorVO>): DistributorFormModel => {
  const licenseFileKeys = toFileArray(data.licenseFileKeys || data.businessLicenseUrls)
  const qualificationFileKeys = toFileArray(data.qualificationFileKeys || data.otherCertUrls)
  const legalIds = toFileArray(data.legalIdUrls)
  return {
    ...createDefaultForm(),
    id: data.id,
    buyerCode: data.buyerCode || data.code,
    buyerName: data.buyerName || data.name || '',
    status: data.status || DistributorStatusEnum.NORMAL,
    distributionLevel: String(data.distributionLevel ?? data.level ?? '1'),
    parentBuyerCode: data.parentBuyerCode || undefined,
    cooperationModes: normalizeCooperationModes(data.cooperationModes || data.cooperationMode),
    distributorType: normalizeDistributorType(data.distributorType),
    categoryL1Ids: data.categoryL1Ids?.length
      ? data.categoryL1Ids
      : namedRefIds(data.categoryL1s || data.categories, data.category),
    productTypes: data.productTypes || [],
    supplyPreference: data.supplyPreference,
    legalEntityName: data.legalEntityName || data.companyName || '',
    creditCode: data.creditCode || data.socialCreditCode || '',
    licenseFileKeys,
    idFrontFileKey: data.idFrontFileKey || legalIds[0] || '',
    idBackFileKey: data.idBackFileKey || legalIds[1] || '',
    legalPersonName: data.legalPersonName || '',
    legalPersonMobile: data.legalPersonMobile || data.legalPersonMobileMasked || '',
    contactAddress: data.contactAddress || '',
    settlementMethod: normalizeSettlementMethod(data.settlementMethod || data.settlementType),
    settlementCycleDays: data.settlementCycleDays ?? data.settlementCycle,
    integrationModes: normalizeIntegrationModes(data.integrationModes || data.integrationMethods),
    cooperationStartedAt: formatDateTime(
      data.cooperationStartedAt || data.cooperationStartDate || data.cooperationTime
    ),
    cooperationNote: data.cooperationNote || data.cooperationRemark || '',
    bankName: data.bankName || '',
    bankAccount: data.bankAccount || data.bankAccountMasked || '',
    qualificationFileKeys,
    contacts: data.contacts?.length
      ? data.contacts.map((item) => ({
          name: item.name,
          mobile: item.mobile,
          email: item.email
        }))
      : [createEmptyContact()]
  }
}

const loadDetail = async (buyerCode: string) => {
  formLoading.value = true
  try {
    const data = await DistributorApi.getDistributor(buyerCode)
    formData.value = mapDetailToForm(data)
    openingBalanceYuan.value = undefined
  } finally {
    formLoading.value = false
  }
}

const buildSavePayload = (): BuyerSaveReqVO => {
  const licenseFileKeys = toFileArray(formData.value.licenseFileKeys)
  const qualificationFileKeys = toFileArray(formData.value.qualificationFileKeys)
  const distributionLevel = formData.value.distributionLevel || '1'
  const isL1 = distributionLevel === '1'
  const payload: BuyerSaveReqVO = {
    buyerName: formData.value.buyerName,
    contacts: formData.value.contacts || [],
    parentBuyerCode: isL1 ? undefined : formData.value.parentBuyerCode || undefined,
    distributionLevel,
    distributorType: formData.value.distributorType || undefined,
    supplyPreference: formData.value.supplyPreference || undefined,
    settlementMethod: formData.value.settlementMethod || undefined,
    settlementCycleDays: formData.value.settlementCycleDays,
    cooperationModes: formData.value.cooperationModes || [],
    integrationModes: formData.value.integrationModes || [],
    cooperationStartedAt: formData.value.cooperationStartedAt || undefined,
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
    qualificationFileKey: qualificationFileKeys[0],
    categoryL1Ids: formData.value.categoryL1Ids || [],
    productTypes: formData.value.productTypes || []
  }
  if (!isEdit.value) {
    payload.openingBalanceCents = yuanToCents(openingBalanceYuan.value) ?? 0
  }
  return payload
}

const submitForm = async () => {
  await formRef.value?.validate()
  if (!formData.value.contacts?.length) {
    message.warning('请至少保留一行联系人信息')
    return
  }
  formLoading.value = true
  try {
    const payload = buildSavePayload()
    if (isEdit.value) {
      const buyerCode = formData.value.buyerCode || props.buyerCode
      if (!buyerCode) {
        message.error('缺少分销商编号，无法保存')
        return
      }
      await DistributorApi.updateDistributor(buyerCode, payload)
      message.success(t('common.updateSuccess'))
    } else {
      await DistributorApi.createDistributor(payload)
      message.success(t('common.createSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } catch (error: any) {
    if (error?.message) {
      message.error(error.message)
    }
  } finally {
    formLoading.value = false
  }
}

const handleClosed = () => {
  dialogVisible.value = false
  resetForm()
}
</script>
