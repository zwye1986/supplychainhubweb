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
            <dict-tag
              v-if="supplier.status"
              type="supply_chain_supplier_status"
              :value="supplier.status"
            />
            <span v-else>-</span>
          </div>
          <div class="text-13px text-gray-500">
            编号：{{ supplier.supplierCode || supplier.code || '-' }}
          </div>
        </div>
        <div>
          <el-button type="primary" @click="openEdit">编辑</el-button>
          <el-button
            v-if="supplier.status === 'ACTIVE'"
            type="warning"
            plain
            @click="handleStatusChange('SUSPENDED')"
          >
            暂停
          </el-button>
          <el-button
            v-if="supplier.status === 'SUSPENDED'"
            type="success"
            plain
            @click="handleStatusChange('ACTIVE')"
          >
            恢复
          </el-button>
          <el-button
            v-if="supplier.status !== 'BLACKLIST'"
            type="danger"
            plain
            @click="handleStatusChange('BLACKLIST')"
          >
            移入黑名单
          </el-button>
          <el-button
            v-if="supplier.status === 'BLACKLIST'"
            type="success"
            plain
            @click="handleStatusChange('ACTIVE')"
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
          {{ supplier.scopes?.length }}组
        </el-descriptions-item>
        <el-descriptions-item label="接入时间">
          {{ formatNullableDate(supplier.onboardAt) }}
        </el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="activeTab" class="mt-16px" @tab-change="handleTabChange">
        <el-tab-pane label="基础信息" name="basic">
          <el-form :model="supplier" label-width="140px">
            <el-divider content-position="left">基础信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="供应商名称">
                  {{ displayText(supplier.supplierName) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="供应商编号">
                  {{ displayText(supplier.supplierCode) }}
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">联系信息</el-divider>
            <el-table
              :data="supplier.contacts || []"
              border
              class="mb-24px"
              header-cell-class-name="!font-400"
            >
              <el-table-column label="姓名" min-width="140" align="center">
                <template #default="{ row }">{{ displayText(row.name) }}</template>
              </el-table-column>
              <el-table-column label="手机号" min-width="180" align="center">
                <template #default="{ row }">{{ displayText(row.mobile) }}</template>
              </el-table-column>
              <el-table-column label="邮箱" min-width="220" align="center" show-overflow-tooltip>
                <template #default="{ row }">{{ displayText(row.email) }}</template>
              </el-table-column>
              <template #empty><el-empty description="暂无联系人" /></template>
            </el-table>

            <el-divider content-position="left">服务能力</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="配送区域">
                  {{ deliveryAreaText }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="发货时效">
                  {{ shippingSlaText }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="是否支持售后">
                  {{ getDictLabel('supply_chain_aftersales_supported', supplier.aftersalesSupported) || '-' }}
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">商务信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="结算方式">
                  {{ getDictLabel('supply_chain_settlement_method', supplier.settlementMethod) || '-' }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="结算周期（天）">
                  {{ `${supplier.settlementCycleDays}天` }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="对接方式">
                  {{
                    (supplier.integrationModes || [])
                      .map((item) => getDictLabel('supply_chain_integration_mode', item))
                      .filter(Boolean)
                      .join('、') || '-'
                  }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="接入时间">
                  {{ formatNullableDate(supplier.onboardAt) }}
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="合作状态">
                  {{ getDictLabel('supply_chain_supplier_status', supplier.status) || '-' }}
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="合作说明">
                  {{ displayText(supplier.cooperationNote) }}
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">公司及法人信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="公司名称">
                  {{ displayText(supplier.legalEntityName) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="社会统一信用代码">
                  {{ displayText(supplier.creditCode) }}
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="营业执照">
                  <template v-if="supplier.licenseFileKeys?.length">
                    <el-link
                      v-for="(url, index) in supplier.licenseFileKeys"
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
                  {{ displayText(supplier.legalPersonMobile) }}
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="身份证正面">
                  <el-link
                    v-if="supplier.idFrontFileKey"
                    :href="supplier.idFrontFileKey"
                    type="primary"
                    target="_blank"
                  >
                    查看正面
                  </el-link>
                  <span v-else>-</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="身份证反面">
                  <el-link
                    v-if="supplier.idBackFileKey"
                    :href="supplier.idBackFileKey"
                    type="primary"
                    target="_blank"
                  >
                    查看反面
                  </el-link>
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
                  {{ displayText(supplier.bankAccount) }}
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
                  <template v-if="supplier.qualificationFileKeys?.length">
                    <el-link
                      v-for="(url, index) in supplier.qualificationFileKeys"
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
          <ProductList ref="productListRef" v-if="supplierCode" :supplier-code="supplierCode" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { SupplierApi, SupplierVO } from '@/api/supplier/manage'
import { getDictLabel } from '@/utils/dict'
import { formatNullableDate } from '@/utils/formatTime'
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
const productListRef = ref<InstanceType<typeof ProductList>>()

const displayText = (value?: string | number | null) => {
  if (value === undefined || value === null || value === '') return '-'
  return String(value)
}

const shippingSlaText = computed(() => {
  const code = supplier.value.shippingSlaCode
  const label = getDictLabel('supply_chain_shipping_sla_code', code)
  if (code === 'CUSTOM') {
    const custom = supplier.value.shippingSlaCustom?.trim()
    if (custom) return `${label} / ${custom}`
    return label
  }
  return label || '-'
})

const accountBalanceText = computed(() => {
  const cents = supplier.value.settlementBalanceCents
  if (cents === undefined || cents === null || cents === '') return '-'
  return (Number(cents) / 100).toFixed(2)
})

const deliveryAreaText = computed(() => {
  const regionType = supplier.value.deliveryRegionType
  const typeLabel = getDictLabel('supply_chain_delivery_region_type', regionType) || '-'

  const address = (supplier.value.deliveryRegions || [])
    .map((item) => item?.name?.trim())
    .filter(Boolean)
    .join(' / ')
  return address ? `${typeLabel} / ${address}` : typeLabel
})

const getDetail = async () => {
  if (!props.supplierCode) return
  loading.value = true
  try {
    const data = await SupplierApi.getSupplier(props.supplierCode)
    supplier.value = {
      ...data,
      integrationMethods: data.integrationModes || data.integrationMethods || [],
      licenseFileKeys: data.licenseFileKeys || [],
      qualificationFileKeys: data.qualificationFileKeys || data.otherCertUrls || [],
      otherCertUrls: data.qualificationFileKeys || data.otherCertUrls || []
    }
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
  if (targetStatus === 'SUSPENDED') return '暂停供货'
  if (targetStatus === 'BLACKLIST') return '移入黑名单'
  if (supplier.value.status === 'BLACKLIST') return '移出黑名单'
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
  activeTab.value = 'basic'
}

const handleTabChange = async (name: string | number) => {
  if (name !== 'product') return
  await nextTick()
  await productListRef.value?.reload?.()
}

defineExpose({ reload: getDetail })
</script>
