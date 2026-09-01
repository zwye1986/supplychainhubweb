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
            <span class="truncate text-20px font-700">{{ distributor.name || '分销商详情' }}</span>
            <el-tag :type="getDistributorStatusType(distributor.status)" size="small">
              {{ getDistributorStatusLabel(distributor.status) }}
            </el-tag>
            <el-tag size="small" type="primary">
              {{ getDistributionLevelLabel(distributor.level) }}
            </el-tag>
          </div>
          <div class="text-13px text-gray-500">
            编号：{{ distributor.code || '-' }}
          </div>
        </div>
        <div>
          <el-button type="primary" @click="openEdit">编辑</el-button>
          <el-button
            v-if="distributor.status === DistributorStatusEnum.NORMAL"
            type="warning"
            plain
            @click="handleStatusChange(DistributorStatusEnum.PAUSED)"
          >
            暂停
          </el-button>
          <el-button
            v-if="distributor.status === DistributorStatusEnum.PAUSED"
            type="success"
            plain
            @click="handleStatusChange(DistributorStatusEnum.NORMAL)"
          >
            恢复
          </el-button>
          <el-button
            v-if="distributor.status !== DistributorStatusEnum.BLACKLIST"
            type="danger"
            plain
            @click="handleStatusChange(DistributorStatusEnum.BLACKLIST)"
          >
            移入黑名单
          </el-button>
          <el-button
            v-if="distributor.status === DistributorStatusEnum.BLACKLIST"
            type="success"
            plain
            @click="handleStatusChange(DistributorStatusEnum.NORMAL)"
          >
            移出黑名单
          </el-button>
        </div>
      </div>

      <el-descriptions class="mt-16px" :column="3" border>
        <el-descriptions-item label="分销等级">
          {{ getDistributionLevelLabel(distributor.level) }}
        </el-descriptions-item>
        <el-descriptions-item label="上级分销商">
          {{ distributor.parentName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="合作模式">
          <template v-if="distributor.cooperationMode?.length">
            <el-tag
              v-for="mode in distributor.cooperationMode"
              :key="mode"
              class="m-2px"
              size="small"
            >
              {{ getCooperationModeLabel(mode) }}
            </el-tag>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="分销品类">
          <template v-if="distributor.category?.length">
            <el-tag
              v-for="tag in distributor.category"
              :key="tag"
              class="m-2px"
              size="small"
              type="info"
            >
              {{ getDistCategoryLabel(tag) }}
            </el-tag>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="商品类型">
          <template v-if="distributor.productType?.length">
            <el-tag
              v-for="tag in distributor.productType"
              :key="tag"
              class="m-2px"
              size="small"
              type="success"
            >
              {{ getDistProductTypeLabel(tag) }}
            </el-tag>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="分销SKU商品数">
          {{ distributor.skuCount ?? 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="关联项目">
          {{ distributor.projectCount ?? 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="供货择优倾向">
          {{ getSupplyPreferenceLabel(distributor.supplyPreference) }}
        </el-descriptions-item>
        <el-descriptions-item label="合作开始日期">
          {{ distributor.cooperationStartDate || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="activeTab" class="mt-16px">
        <el-tab-pane label="基础信息" name="basic">
          <el-form :model="distributor" label-width="140px">
            <el-divider content-position="left">基础信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="分销商名称">
                  {{ displayText(distributor.name) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="分销商编号">
                  {{ displayText(distributor.code) }}
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
                  {{ getDistributionLevelLabel(distributor.level) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="上级分销商">
                  {{ displayText(distributor.parentName) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="合作模式">
                  {{
                    (distributor.cooperationMode || [])
                      .map((mode) => getCooperationModeLabel(mode))
                      .join('、') || '-'
                  }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="分销商类型">
                  {{ getDistributorTypeLabel(distributor.distributorType) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="分销品类">
                  {{
                    (distributor.category || [])
                      .map((tag) => getDistCategoryLabel(tag))
                      .join('、') || '-'
                  }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="商品类型">
                  {{
                    (distributor.productType || [])
                      .map((tag) => getDistProductTypeLabel(tag))
                      .join('、') || '-'
                  }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="供货择优倾向">
                  {{ getSupplyPreferenceLabel(distributor.supplyPreference) }}
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">结算与商务</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="结算方式">
                  {{ getSettlementLabel(distributor.settlementType) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="结算周期（天）">
                  {{ displayText(distributor.settlementCycle) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="对接方式">
                  {{ integrationText }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="合作开始日期">
                  {{ displayText(distributor.cooperationStartDate) }}
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="合作状态">
                  {{ getDistributorStatusLabel(distributor.status) }}
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="合作说明">
                  {{ displayText(distributor.cooperationRemark) }}
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">公司及法人信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="公司名称">
                  {{ displayText(distributor.companyName) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="社会统一信用代码">
                  {{ displayText(distributor.socialCreditCode) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="法人姓名">
                  {{ displayText(distributor.legalPersonName) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="法人手机号">
                  {{ displayText(distributor.legalPersonMobile) }}
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
                  {{ displayText(distributor.bankAccount) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="当前账户余额">
                  {{ accountBalanceText }}
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="开票信息" name="invoice" lazy>
          <InvoiceInfo
            v-if="distributorId"
            :distributor-id="distributorId"
            :distributor="distributor"
          />
        </el-tab-pane>

        <el-tab-pane label="关联项目" name="project" lazy>
          <ProjectList v-if="distributorId" :distributor-id="distributorId" />
        </el-tab-pane>

        <el-tab-pane label="分销商品" name="product" lazy>
          <ProductList v-if="distributorId" :distributor-id="distributorId" />
        </el-tab-pane>

        <el-tab-pane label="分销层级" name="hierarchy" lazy>
          <HierarchyList
            v-if="distributorId"
            :distributor-id="distributorId"
            @open-detail="handleOpenChildDetail"
          />
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { DistributorApi, DistributorVO } from '@/api/supplier/distribution'
import {
  DistributorStatusEnum,
  getCooperationModeLabel,
  getDistCategoryLabel,
  getDistProductTypeLabel,
  getDistributionLevelLabel,
  getDistributorStatusLabel,
  getDistributorStatusType,
  getDistributorTypeLabel,
  getIntegrationLabel,
  getSettlementLabel,
  getSupplyPreferenceLabel
} from '@/views/supplier/utils/constants'
import InvoiceInfo from './InvoiceInfo.vue'
import ProjectList from './ProjectList.vue'
import ProductList from './ProductList.vue'
import HierarchyList from './HierarchyList.vue'

defineOptions({ name: 'DistributorDetailDrawer' })

const props = defineProps<{
  modelValue: boolean
  id?: number
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
const distributorId = computed(() => props.id)

const displayText = (value?: string | number | null) => {
  if (value === undefined || value === null || value === '') return '-'
  return String(value)
}

const integrationText = computed(() => {
  const methods = distributor.value.integrationMethods || []
  if (!methods.length) return '-'
  return methods.map((method) => getIntegrationLabel(method)).join('、')
})

const accountBalanceText = computed(() => {
  if (
    distributor.value.accountBalance === undefined ||
    distributor.value.accountBalance === null
  ) {
    return '-'
  }
  return Number(distributor.value.accountBalance).toFixed(2)
})

const getDetail = async () => {
  if (!distributorId.value) return
  loading.value = true
  try {
    const data = await DistributorApi.getDistributor(distributorId.value)
    distributor.value = {
      ...data,
      contacts: data.contacts || [],
      cooperationMode: data.cooperationMode || [],
      category: data.category || [],
      productType: data.productType || [],
      integrationMethods: data.integrationMethods || [],
      businessLicenseUrls: data.businessLicenseUrls || [],
      legalIdUrls: data.legalIdUrls || [],
      otherCertUrls: data.otherCertUrls || []
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.modelValue, props.id] as const,
  ([visible]) => {
    if (!visible || !props.id) return
    activeTab.value = 'basic'
    getDetail()
  }
)

const openEdit = () => {
  if (!props.id) return
  emit('edit', props.id)
}

const handleOpenChildDetail = (id: number) => {
  emit('open-detail', id)
}

const getStatusActionText = (targetStatus: number) => {
  if (targetStatus === DistributorStatusEnum.PAUSED) return '暂停分销'
  if (targetStatus === DistributorStatusEnum.BLACKLIST) return '移入黑名单'
  if (distributor.value.status === DistributorStatusEnum.BLACKLIST) return '移出黑名单'
  return '恢复合作'
}

const handleStatusChange = async (status: number) => {
  if (!distributorId.value) return
  const actionText = getStatusActionText(status)
  try {
    await message.confirm(
      `确认将分销商「${distributor.value.name}」${actionText}吗？`,
      `${actionText}确认`
    )
    await DistributorApi.updateDistributorStatus(distributorId.value, status)
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
