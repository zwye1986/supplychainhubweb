<template>
  <div v-loading="loading">
    <ContentWrap>
      <div class="flex items-start justify-between">
        <div class="min-w-0">
          <div class="mb-8px flex items-center gap-10px">
            <Icon icon="ep:arrow-left" class="cursor-pointer" @click="goBack" />
            <span class="truncate text-20px font-700">{{ supplier.name || '供应商详情' }}</span>
            <el-tag :type="getSupplierStatusType(supplier.status)" size="small">
              {{ getSupplierStatusLabel(supplier.status) }}
            </el-tag>
          </div>
          <div class="text-13px text-gray-500">
            编号：{{ supplier.code || '-' }}
            <span class="mx-8px">|</span>
            公司：{{ supplier.companyName || '-' }}
            <span class="mx-8px">|</span>
            信用代码：{{ supplier.socialCreditCode || '-' }}
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

      <el-descriptions class="mt-16px" :column="4" border>
        <el-descriptions-item label="供应商简称">
          {{ supplier.shortName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="联系人">
          {{ supplier.contactName || supplier.contacts?.[0]?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{ supplier.contactMobile || supplier.contacts?.[0]?.mobile || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="合作商品数">
          {{ supplier.productCount ?? 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="能力标签" :span="2">
          <el-tag
            v-for="tag in supplier.capabilityTags || []"
            :key="tag"
            class="m-2px"
            size="small"
            type="info"
          >
            {{ getCapabilityLabel(tag) }}
          </el-tag>
          <span v-if="!supplier.capabilityTags?.length">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="配送区域">
          {{ getDeliveryAreaTypeLabel(supplier.deliveryAreaType) }}
          <span
            v-if="
              supplier.deliveryAreaType === DeliveryAreaTypeEnum.SPECIFIED && supplier.deliveryAreaId
            "
          >
            （区域ID：{{ supplier.deliveryAreaId }}）
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="发货时效">
          {{
            getShippingTimelinessLabel(
              supplier.shippingTimeliness,
              supplier.shippingTimelinessCustom
            )
          }}
        </el-descriptions-item>
        <el-descriptions-item label="是否支持售后">
          {{
            supplier.supportAfterSale === true
              ? '是'
              : supplier.supportAfterSale === false
                ? '否'
                : '-'
          }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ formatDate(supplier.updateTime) }}
        </el-descriptions-item>
      </el-descriptions>
    </ContentWrap>

    <ContentWrap class="mt-10px">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="法人姓名">
              {{ supplier.legalPersonName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="法人身份证号">
              {{ supplier.legalPersonIdNo || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="注册地址">
              {{ supplier.registerAddress || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="经营地址">
              {{ supplier.businessAddress || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="开户名">
              {{ supplier.accountName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="开户行">
              {{ supplier.bankName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="开户账号">
              {{ supplier.bankAccount || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="合同编号">
              {{ supplier.contractNo || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="合同起止">
              {{
                supplier.contractStartDate && supplier.contractEndDate
                  ? `${supplier.contractStartDate} ~ ${supplier.contractEndDate}`
                  : '-'
              }}
            </el-descriptions-item>
            <el-descriptions-item label="备注">
              {{ supplier.remark || '-' }}
            </el-descriptions-item>
          </el-descriptions>

          <div class="mt-16px text-14px font-600">联系人</div>
          <el-table :data="supplier.contacts || []" border class="mt-10px" size="small">
            <el-table-column label="姓名" prop="name" />
            <el-table-column label="手机号" prop="mobile" />
            <el-table-column label="邮箱" prop="email" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="开票信息" name="invoice" lazy>
          <InvoiceInfo
            v-if="supplierId"
            :supplier-id="supplierId"
            :supplier="supplier"
          />
        </el-tab-pane>

        <el-tab-pane label="供货配置" name="supply" lazy>
          <SupplyConfig v-if="supplierId" :supplier-id="supplierId" />
        </el-tab-pane>

        <el-tab-pane label="合作商品" name="product" lazy>
          <ProductList
            v-if="supplierId"
            :supplier-id="supplierId"
            :capability-tags="supplier.capabilityTags"
          />
        </el-tab-pane>
      </el-tabs>
    </ContentWrap>
  </div>
</template>

<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { SupplierApi, SupplierVO } from '@/api/supplier/manage'
import {
  DeliveryAreaTypeEnum,
  SupplierStatusEnum,
  getCapabilityLabel,
  getDeliveryAreaTypeLabel,
  getShippingTimelinessLabel,
  getSupplierStatusLabel,
  getSupplierStatusType
} from '@/views/supplier/utils/constants'
import InvoiceInfo from './InvoiceInfo.vue'
import SupplyConfig from './SupplyConfig.vue'
import ProductList from './ProductList.vue'

defineOptions({ name: 'SupplierManageDetail' })

const message = useMessage()
const route = useRoute()
const router = useRouter()
const { delView } = useTagsViewStore()

const loading = ref(false)
const activeTab = ref('basic')
const supplier = ref<SupplierVO>({} as SupplierVO)
const supplierId = computed(() => Number(route.params.id))

const getDetail = async () => {
  if (!supplierId.value) return
  loading.value = true
  try {
    supplier.value = await SupplierApi.getSupplier(supplierId.value)
  } finally {
    loading.value = false
  }
}

const openEdit = () => {
  router.push({ name: 'SupplierManageForm', params: { id: supplierId.value } })
}

const goBack = () => {
  delView(route)
  router.push({ name: 'SupplierManage' })
}

const getStatusActionText = (targetStatus: number) => {
  if (targetStatus === SupplierStatusEnum.PAUSED) return '暂停供货'
  if (targetStatus === SupplierStatusEnum.BLACKLIST) return '移入黑名单'
  if (supplier.value.status === SupplierStatusEnum.BLACKLIST) return '移出黑名单'
  return '恢复合作'
}

const handleStatusChange = async (status: number) => {
  const actionText = getStatusActionText(status)
  try {
    await message.confirm(
      `确认将供应商「${supplier.value.name}」${actionText}吗？`,
      `${actionText}确认`
    )
    await SupplierApi.updateSupplierStatus(supplierId.value, status)
    message.success(`${actionText}成功`)
    await getDetail()
  } catch {}
}

onMounted(() => {
  getDetail()
})
</script>
