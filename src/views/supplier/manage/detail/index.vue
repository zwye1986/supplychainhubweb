<template>
  <el-drawer
    v-model="drawerVisible"
    title="供应商详情"
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
              {{ supplier.supplierName || supplier.name || '供应商详情' }}
            </span>
            <el-tag :type="getSupplierStatusType(supplier.status)" size="small">
              {{ getSupplierStatusLabel(supplier.status) }}
            </el-tag>
          </div>
          <div class="text-13px text-gray-500">
            编号：{{ supplier.supplierCode || supplier.code || '-' }}
          </div>
        </div>
        <div>
          <el-button type="primary" @click="openEdit">编辑</el-button>
          <el-button
            v-if="supplier.status === SupplierStatusEnum.NORMAL"
            type="warning"
            plain
            @click="handleStatusChange(SupplierStatusEnum.PAUSED)"
          >
            暂停
          </el-button>
          <el-button
            v-if="supplier.status === SupplierStatusEnum.PAUSED"
            type="success"
            plain
            @click="handleStatusChange(SupplierStatusEnum.NORMAL)"
          >
            恢复
          </el-button>
          <el-button
            v-if="supplier.status !== SupplierStatusEnum.BLACKLIST"
            type="danger"
            plain
            @click="handleStatusChange(SupplierStatusEnum.BLACKLIST)"
          >
            移入黑名单
          </el-button>
          <el-button
            v-if="supplier.status === SupplierStatusEnum.BLACKLIST"
            type="success"
            plain
            @click="handleStatusChange(SupplierStatusEnum.NORMAL)"
          >
            移出黑名单
          </el-button>
        </div>
      </div>

      <el-descriptions class="mt-16px" :column="3" border>
        <el-descriptions-item label="可售品类">
          <template v-if="supplier.sellableCategories?.length">
            <el-tag
              v-for="item in supplier.sellableCategories"
              :key="item"
              class="m-2px"
              size="small"
              type="info"
            >
              {{
                getDictLabel('supply_chain_sellable_category', item) || '-'
              }}
            </el-tag>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="主联系人">
          {{ supplier.primaryContactName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{ supplier.primaryContactMobile || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="合作商品数(SPU)">
          {{ supplier.productCount ?? 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="供货配置">
          <template v-if="supplyConfigSummary.length">
            <el-tag
              v-for="item in supplyConfigSummary"
              :key="item"
              class="m-2px"
              size="small"
              type="success"
            >
              {{ item }}
            </el-tag>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="接入时间">
          {{ supplier.onboardedAt || supplier.accessDate || supplier.accessTime || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="activeTab" class="mt-16px">
        <el-tab-pane label="基础信息" name="basic">
          <el-form :model="supplier" label-width="140px">
            <el-divider content-position="left">基础信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="供应商名称">
                  {{ displayText(supplier.supplierName || supplier.name) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="供应商编号">
                  {{ displayText(supplier.supplierCode || supplier.code) }}
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">联系信息</el-divider>
            <el-form-item label="联系人">
              <div class="w-full">
                <template v-if="supplier.contacts?.length">
                  <div v-for="(item, index) in supplier.contacts" :key="item.id || index">
                    {{ [item.name, item.mobile, item.email].filter(Boolean).join(' / ') || '-' }}
                  </div>
                </template>
                <span v-else>-</span>
              </div>
            </el-form-item>

            <el-divider content-position="left">服务能力</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="配送区域">
                  {{ deliveryAreaText }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="发货时效">
                  {{
                    getShippingTimelinessLabel(
                      supplier.shippingSlaCode || supplier.shippingTimeliness,
                      supplier.shippingSlaCustom || supplier.shippingTimelinessCustom
                    )
                  }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="是否支持售后">
                  {{ afterSaleText }}
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">商务信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="结算方式">
                  {{ getSettlementLabel(supplier.settlementMethod || supplier.settlementType) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="结算周期（天）">
                  {{ displayText(supplier.settlementCycleDays ?? supplier.settlementCycle) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="对接方式">
                  {{ integrationText }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="接入时间">
                  {{ displayText(supplier.onboardedAt || supplier.accessDate) }}
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="合作状态">
                  {{ getSupplierStatusLabel(supplier.status) }}
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="合作说明">
                  {{ displayText(supplier.cooperationNote || supplier.cooperationRemark) }}
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">公司及法人信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="公司名称">
                  {{ displayText(supplier.legalEntityName || supplier.companyName) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="社会统一信用代码">
                  {{ displayText(supplier.creditCode || supplier.socialCreditCode) }}
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="营业执照">
                  <template v-if="(supplier.licenseFileKeys || supplier.businessLicenseUrls)?.length">
                    <el-link
                      v-for="(url, index) in supplier.licenseFileKeys || supplier.businessLicenseUrls"
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
                  {{ displayText(supplier.legalPersonName) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="法人手机号">
                  {{ displayText(supplier.legalPersonMobileMasked) }}
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="法人身份证">
                  <template v-if="supplier.legalIdUrls?.length">
                    <el-link
                      v-for="(url, index) in supplier.legalIdUrls"
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
              <el-col :span="24">
                <el-form-item label="联系地址">
                  {{ displayText(supplier.contactAddress) }}
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">账户信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="开户行">
                  {{ displayText(supplier.bankName) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="开户账号">
                  {{ displayText(supplier.bankAccountMasked) }}
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
                  <template v-if="supplier.otherCertUrls?.length">
                    <el-link
                      v-for="(url, index) in supplier.otherCertUrls"
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
          <InvoiceInfo v-if="supplierCode" :supplier-code="supplierCode" />
        </el-tab-pane>

        <el-tab-pane label="供货配置" name="supply" lazy>
          <SupplyConfig
            v-if="supplierCode"
            :supplier-code="supplierCode"
            @success="getDetail"
          />
        </el-tab-pane>

        <el-tab-pane label="合作商品" name="product" lazy>
          <ProductList v-if="supplierCode" :supplier-code="supplierCode" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import * as AreaApi from '@/api/system/area'
import { SupplierApi, SupplierVO } from '@/api/supplier/manage'
import { getDictLabel } from '@/utils/dict'
import {
  DeliveryAreaTypeEnum,
  SupplierStatusEnum,
  getCategoryLabel,
  getDeliveryAreaTypeLabel,
  getIntegrationLabel,
  getSettlementLabel,
  getShippingTimelinessLabel,
  getSupplierStatusLabel,
  getSupplierStatusType,
  getSupplyModeLabel
} from '@/views/supplier/utils/constants'
import InvoiceInfo from './InvoiceInfo.vue'
import SupplyConfig from './SupplyConfig.vue'
import ProductList from './ProductList.vue'

defineOptions({ name: 'SupplierManageDetail' })

const props = defineProps<{
  modelValue: boolean
  supplierCode?: string
}>()

const emit = defineEmits(['update:modelValue', 'success', 'edit'])
const message = useMessage()

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const activeTab = ref('basic')
const supplier = ref<SupplierVO>({} as SupplierVO)
const deliveryAreaName = ref('')

const displayText = (value?: string | number | null) => {
  if (value === undefined || value === null || value === '') return '-'
  return String(value)
}

const afterSaleText = computed(() => {
  const value = supplier.value.aftersalesSupported ?? supplier.value.supportAfterSale
  if (value === true) return '是'
  if (value === false) return '否'
  return '-'
})

const integrationText = computed(() => {
  const methods = supplier.value.integrationModes || supplier.value.integrationMethods || []
  if (!methods.length) return '-'
  return methods.map((method) => getIntegrationLabel(method)).join('、')
})

const accountBalanceText = computed(() => {
  if (supplier.value.settlementBalanceCents != null) {
    return (Number(supplier.value.settlementBalanceCents) / 100).toFixed(2)
  }
  if (supplier.value.accountBalance === undefined || supplier.value.accountBalance === null) {
    return '-'
  }
  return Number(supplier.value.accountBalance).toFixed(2)
})

const deliveryAreaText = computed(() => {
  const regionType = supplier.value.deliveryRegionType || supplier.value.deliveryAreaType
  const typeLabel = getDeliveryAreaTypeLabel(regionType)
  if (regionType !== DeliveryAreaTypeEnum.DESIGNATED) return typeLabel
  if (deliveryAreaName.value) return `${typeLabel} / ${deliveryAreaName.value}`
  const adcode = supplier.value.deliveryRegionAdcodes?.[0] || supplier.value.deliveryAreaId
  if (adcode) return `${typeLabel}（${adcode}）`
  return typeLabel
})

const findAreaName = (nodes: any[] = [], id: number): string => {
  for (const node of nodes) {
    if (Number(node.id) === Number(id)) return node.name || ''
    const childName = findAreaName(node.children || [], id)
    if (childName) return childName
  }
  return ''
}

const resolveDeliveryAreaName = async (areaId?: number) => {
  deliveryAreaName.value = ''
  if (!areaId) return
  try {
    const tree = await AreaApi.getAreaTree()
    deliveryAreaName.value = findAreaName(tree, areaId)
  } catch {
    deliveryAreaName.value = ''
  }
}

/** 供货配置摘要：品类组合 + 供货模式 */
const supplyConfigSummary = computed(() => {
  return (supplier.value.supplyConfigs || [])
    .filter((item) => item.categoryCode || item.categoryName)
    .map((item) => {
      const category =
        item.categoryName || getCategoryLabel(item.categoryCode) || item.categoryCode || '-'
      const modes = (Array.isArray(item.supplyMode) ? item.supplyMode : [item.supplyMode])
        .map((mode) => getSupplyModeLabel(mode))
        .filter((label) => label && label !== '-')
      return modes.length ? `${category}（${modes.join('、')}）` : category
    })
})

const getDetail = async () => {
  if (!props.supplierCode) return
  loading.value = true
  try {
    const data = await SupplierApi.getSupplier(props.supplierCode)
    supplier.value = {
      ...data,
      integrationMethods: data.integrationModes || data.integrationMethods || [],
      licenseFileKeys: data.licenseFileKeys || data.businessLicenseUrls || [],
      businessLicenseUrls: data.licenseFileKeys || data.businessLicenseUrls || [],
      qualificationFileKeys: data.qualificationFileKeys || data.otherCertUrls || [],
      otherCertUrls: data.qualificationFileKeys || data.otherCertUrls || [],
      legalIdUrls: [
        data.idFrontFileKey,
        data.idBackFileKey,
        ...(data.legalIdUrls || [])
      ].filter(Boolean) as string[]
    }
    const areaId = Number(data.deliveryRegionAdcodes?.[0] || data.deliveryAreaId)
    await resolveDeliveryAreaName(Number.isNaN(areaId) ? undefined : areaId)
  } finally {
    loading.value = false
  }
}

/** 抽屉打开或切换供应商时加载详情 */
watch(
  () => [props.modelValue, props.supplierCode] as const,
  ([visible]) => {
    if (!visible || !props.supplierCode) return
    activeTab.value = 'basic'
    getDetail()
  }
)

const openEdit = () => {
  const code = props.supplierCode || supplier.value.supplierCode || supplier.value.code
  if (!code) return
  emit('edit', code)
}

const getStatusActionText = (targetStatus: string) => {
  if (targetStatus === SupplierStatusEnum.PAUSED) return '暂停供货'
  if (targetStatus === SupplierStatusEnum.BLACKLIST) return '移入黑名单'
  if (supplier.value.status === SupplierStatusEnum.BLACKLIST) return '移出黑名单'
  return '恢复合作'
}

const handleStatusChange = async (status: string) => {
  const supplierCode = props.supplierCode || supplier.value.supplierCode || supplier.value.code
  if (!supplierCode) {
    message.error('缺少供应商编号，无法变更状态')
    return
  }
  const actionText = getStatusActionText(status)
  const displayName = supplier.value.supplierName || supplier.value.name || ''
  try {
    await message.confirm(`确认将供应商「${displayName}」${actionText}吗？`, `${actionText}确认`)
    await SupplierApi.updateSupplierStatus(supplierCode, status)
    message.success(`${actionText}成功`)
    await getDetail()
    emit('success')
  } catch {}
}

/** 抽屉完全关闭后重置内容 */
const handleClosed = () => {
  supplier.value = {} as SupplierVO
  deliveryAreaName.value = ''
  activeTab.value = 'basic'
}

defineExpose({ reload: getDetail })
</script>
