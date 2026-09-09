<template>
  <el-drawer
    v-model="drawerVisible"
    title="分销商详情"
    size="80%"
    append-to-body
    destroy-on-close
    @closed="handleClosed"
  >
    <div v-loading="loading">
      <div class="flex items-start justify-between">
        <div class="min-w-0">
          <div class="mb-8px flex items-center gap-10px">
            <span class="truncate text-20px font-700">
              {{ displayName || '分销商详情' }}
            </span>
            <el-tag :type="getBuyerStatusType(distributor.status)" size="small">
              {{ getDictLabel('supply_chain_buyer_status', distributor.status) || '-' }}
            </el-tag>
            <el-tag size="small" type="primary">
              {{ getDictLabel('supply_chain_distribution_level', distributionLevel) || '-' }}
            </el-tag>
          </div>
          <div class="text-13px text-gray-500">编号：{{ displayCode || '-' }}</div>
        </div>
        <div>
          <el-button type="primary" @click="openEdit">编辑</el-button>
          <el-button
            v-if="distributor.status === 'ACTIVE'"
            type="warning"
            plain
            @click="handleStatusChange('SUSPENDED')"
          >
            暂停
          </el-button>
          <el-button
            v-if="distributor.status === 'SUSPENDED'"
            type="success"
            plain
            @click="handleStatusChange('ACTIVE')"
          >
            恢复
          </el-button>
          <el-button
            v-if="distributor.status !== 'BLACKLIST'"
            type="danger"
            plain
            @click="handleStatusChange('BLACKLIST')"
          >
            移入黑名单
          </el-button>
          <el-button
            v-if="distributor.status === 'BLACKLIST'"
            type="success"
            plain
            @click="handleStatusChange('ACTIVE')"
          >
            移出黑名单
          </el-button>
        </div>
      </div>

      <el-descriptions class="mt-16px" :column="3" border>
        <el-descriptions-item label="分销等级">
          {{ getDictLabel('supply_chain_distribution_level', distributionLevel) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="上级分销商">
          {{ displayText(distributor.parentBuyerCode) }}
        </el-descriptions-item>
        <el-descriptions-item label="合作模式">
          <template v-if="cooperationModes.length">
            <el-tag v-for="mode in cooperationModes" :key="mode" class="m-2px" size="small">
              {{ getDictLabel('supply_chain_cooperation_mode', mode) || mode }}
            </el-tag>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="分销品类">
          <template v-if="sellableCategories.length">
            <el-tag
              v-for="tag in sellableCategories"
              :key="tag"
              class="m-2px"
              size="small"
              type="info"
            >
              {{ getDictLabel('supply_chain_sellable_category', tag) || tag }}
            </el-tag>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="商品类型">
          <template v-if="productTypes.length">
            <el-tag
              v-for="tag in productTypes"
              :key="tag"
              class="m-2px"
              size="small"
              type="success"
            >
              {{ getDictLabel('supply_chain_product_type', tag) || tag }}
            </el-tag>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="主联系人">
          {{
            displayText(
              distributor.primaryContactName || distributor.contacts?.[0]?.name
            )
          }}
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{
            displayText(
              distributor.primaryContactMobile || distributor.contacts?.[0]?.mobile
            )
          }}
        </el-descriptions-item>
        <el-descriptions-item label="供货择优倾向">
          {{ getDictLabel('supply_chain_supply_preference', distributor.supplyPreference) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="合作开始时间">
          {{ displayText(distributor.cooperationStartedAt || distributor.cooperationStartDate) }}
        </el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="activeTab" class="mt-16px">
        <el-tab-pane label="基础信息" name="basic">
          <el-form :model="distributor" label-width="140px">
            <el-divider content-position="left">基础信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="分销商名称">
                  {{ displayText(displayName) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="分销商编号">
                  {{ displayText(displayCode) }}
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">联系信息</el-divider>
            <el-form-item label="联系人">
              <div class="w-full">
                <template v-if="distributor.contacts?.length">
                  <div v-for="(item, index) in distributor.contacts" :key="item.id || index">
                    {{ [item.name, item.mobile, item.email].filter(Boolean).join(' / ') || '-' }}
                  </div>
                </template>
                <span v-else>-</span>
              </div>
            </el-form-item>

            <el-divider content-position="left">分销信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="分销等级">
                  {{ getDictLabel('supply_chain_distribution_level', distributionLevel) || '-' }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="上级分销商">
                  {{ displayText(distributor.parentBuyerCode || distributor.parentName) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="合作模式">
                  {{
                    cooperationModes
                      .map((mode) => getDictLabel('supply_chain_cooperation_mode', mode) || mode)
                      .join('、') || '-'
                  }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="分销商类型">
                  {{
                    getDictLabel('supply_chain_distributor_type', distributor.distributorType) || '-'
                  }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="分销品类">
                  {{
                    sellableCategories
                      .map((tag) => getDictLabel('supply_chain_sellable_category', tag) || tag)
                      .join('、') || '-'
                  }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="商品类型">
                  {{
                    productTypes
                      .map((tag) => getDictLabel('supply_chain_product_type', tag) || tag)
                      .join('、') || '-'
                  }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="供货择优倾向">
                  {{
                    getDictLabel('supply_chain_supply_preference', distributor.supplyPreference) ||
                    '-'
                  }}
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">结算与商务</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="结算方式">
                  {{
                    getDictLabel(
                      'supply_chain_settlement_method',
                      distributor.settlementMethod || distributor.settlementType
                    ) || '-'
                  }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="结算周期（天）">
                  {{ displayText(distributor.settlementCycleDays ?? distributor.settlementCycle) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="对接方式">
                  {{ integrationText }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="合作开始时间">
                  {{
                    displayText(distributor.cooperationStartedAt || distributor.cooperationStartDate)
                  }}
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="合作状态">
                  {{ getDictLabel('supply_chain_buyer_status', distributor.status) || '-' }}
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="合作说明">
                  {{ displayText(distributor.cooperationNote || distributor.cooperationRemark) }}
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">公司及法人信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="公司名称">
                  {{ displayText(distributor.legalEntityName || distributor.companyName) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="社会统一信用代码">
                  {{ displayText(distributor.creditCode || distributor.socialCreditCode) }}
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="营业执照">
                  <template v-if="licenseFileKeys.length">
                    <el-link
                      v-for="(url, index) in licenseFileKeys"
                      :key="url"
                      :href="url"
                      type="primary"
                      target="_blank"
                      class="mr-12px"
                    >
                      附件{{ index + 1 }}
                    </el-link>
                  </template>
                  <span v-else>-</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="法人姓名">
                  {{ displayText(distributor.legalPersonName) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="法人手机号">
                  {{
                    displayText(
                      distributor.legalPersonMobileMasked || distributor.legalPersonMobile
                    )
                  }}
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="联系地址">
                  {{ displayText(distributor.contactAddress) }}
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">账户信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="开户行">
                  {{ displayText(distributor.bankName) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="开户账号">
                  {{ displayText(distributor.bankAccountMasked || distributor.bankAccount) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="当前账户余额">
                  {{ accountBalanceText }}
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">资质信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="资质文件">
                  <template v-if="qualificationFileKeys.length">
                    <el-link
                      v-for="(url, index) in qualificationFileKeys"
                      :key="url"
                      :href="url"
                      type="primary"
                      target="_blank"
                      class="mr-12px"
                    >
                      附件{{ index + 1 }}
                    </el-link>
                  </template>
                  <span v-else>-</span>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="开票信息" name="invoice" lazy>
          <InvoiceInfo v-if="buyerCode" :buyer-code="buyerCode" />
        </el-tab-pane>

        <el-tab-pane label="关联项目" name="project" lazy>
          <ProjectList v-if="buyerCode" :buyer-code="buyerCode" />
        </el-tab-pane>

        <el-tab-pane label="分销商品" name="product" lazy>
          <ProductList
            v-if="buyerCode"
            :buyer-code="buyerCode"
            :distributor-id="distributorId"
          />
        </el-tab-pane>

        <el-tab-pane label="分销层级" name="hierarchy" lazy>
          <HierarchyList
            v-if="hasInternalId"
            :distributor-id="distributorId"
            @open-detail="handleOpenChildDetail"
          />
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { DistributorApi, DistributorVO, NamedRef } from '@/api/supplier/distribution'
import { getDictLabel } from '@/utils/dict'
import { formatCentsYuan } from '@/views/supplier/utils/constants'
import InvoiceInfo from './InvoiceInfo.vue'
import ProjectList from './ProjectList.vue'
import ProductList from './ProductList.vue'
import HierarchyList from './HierarchyList.vue'

defineOptions({ name: 'DistributorDetailDrawer' })

const props = defineProps<{
  modelValue: boolean
  buyerCode?: string
}>()

const emit = defineEmits(['update:modelValue', 'success', 'edit', 'open-detail'])
const message = useMessage()

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const activeTab = ref('basic')
const distributor = ref<DistributorVO>({} as DistributorVO)
const distributorId = computed(() => distributor.value.id as number)
const hasInternalId = computed(() => distributor.value.id != null)

const displayName = computed(
  () => distributor.value.buyerName || distributor.value.name || ''
)
const displayCode = computed(
  () => distributor.value.buyerCode || distributor.value.code || props.buyerCode || ''
)
const distributionLevel = computed(
  () => distributor.value.distributionLevel ?? distributor.value.level
)

const displayText = (value?: string | number | null) => {
  if (value === undefined || value === null || value === '') return '-'
  return String(value)
}

const getBuyerStatusType = (status?: string) => {
  if (status === 'ACTIVE') return 'success'
  if (status === 'SUSPENDED') return 'warning'
  if (status === 'BLACKLIST') return 'danger'
  return 'info'
}

const namedRefValues = (refs?: NamedRef[] | null, fallback?: Array<string | number>) => {
  const fromRefs = (refs || [])
    .map((item) => item?.id ?? item?.name)
    .filter((value) => value !== undefined && value !== null && String(value).trim().length > 0)
    .map(String)
  const values = fromRefs.length ? fromRefs : (fallback || []).map(String)
  return [...new Set(values.filter(Boolean))]
}

const cooperationModes = computed(() => {
  const modes = distributor.value.cooperationModes?.length
    ? distributor.value.cooperationModes
    : distributor.value.cooperationMode || []
  return [...new Set(modes.filter(Boolean))]
})

const sellableCategories = computed(() => {
  const values = distributor.value.sellableCategories || distributor.value.categoryL1Ids
  if (values?.length) return values.map(String)
  return namedRefValues(
    distributor.value.categoryL1s || distributor.value.categories,
    distributor.value.category
  )
})

const productTypes = computed(() =>
  distributor.value.productTypes?.length
    ? distributor.value.productTypes
    : namedRefValues(distributor.value.categoryL2s, distributor.value.productType)
)

const licenseFileKeys = computed(
  () => distributor.value.licenseFileKeys || distributor.value.businessLicenseUrls || []
)

const qualificationFileKeys = computed(
  () => distributor.value.qualificationFileKeys || distributor.value.otherCertUrls || []
)

const integrationText = computed(() => {
  const methods = distributor.value.integrationModes || distributor.value.integrationMethods || []
  if (!methods.length) return '-'
  return methods
    .map((method) => getDictLabel('supply_chain_integration_mode', method) || method)
    .join('、')
})

const accountBalanceText = computed(() => {
  if (distributor.value.accountBalanceCents != null) {
    return formatCentsYuan(distributor.value.accountBalanceCents)
  }
  if (distributor.value.accountBalance === undefined || distributor.value.accountBalance === null) {
    return '-'
  }
  return Number(distributor.value.accountBalance).toFixed(2)
})

const getDetail = async () => {
  if (!props.buyerCode) return
  loading.value = true
  try {
    const data = await DistributorApi.getDistributor(props.buyerCode)
    distributor.value = {
      ...data,
      contacts: data.contacts || [],
      cooperationModes: data.cooperationModes || [],
      productTypes: data.productTypes || [],
      sellableCategories: (data.sellableCategories || data.categoryL1Ids || []).map(String),
      categoryL1s: data.categoryL1s || [],
      categoryL2s: data.categoryL2s || [],
      integrationModes: data.integrationModes || [],
      licenseFileKeys: data.licenseFileKeys || [],
      qualificationFileKeys: data.qualificationFileKeys || []
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.modelValue, props.buyerCode] as const,
  ([visible]) => {
    if (!visible || !props.buyerCode) return
    activeTab.value = 'basic'
    getDetail()
  }
)

const openEdit = () => {
  const code = displayCode.value
  if (!code) return
  emit('edit', code)
}

const handleOpenChildDetail = (buyerCode?: string) => {
  emit('open-detail', buyerCode)
}

const getStatusActionText = (targetStatus: string) => {
  if (targetStatus === 'SUSPENDED') return '暂停分销'
  if (targetStatus === 'BLACKLIST') return '移入黑名单'
  if (distributor.value.status === 'BLACKLIST') return '移出黑名单'
  return '恢复合作'
}

const handleStatusChange = async (status: string) => {
  const buyerCode = displayCode.value
  if (!buyerCode) {
    message.error('缺少分销商编号，无法变更状态')
    return
  }
  const actionText = getStatusActionText(status)
  try {
    await message.confirm(
      `确认将分销商「${displayName.value}」${actionText}吗？`,
      `${actionText}确认`
    )
    await DistributorApi.batchUpdateDistributorStatus([buyerCode], status)
    message.success(`${actionText}成功`)
    await getDetail()
    emit('success')
  } catch {}
}

const handleClosed = () => {
  distributor.value = {} as DistributorVO
  activeTab.value = 'basic'
}

defineExpose({ reload: getDetail })
</script>
