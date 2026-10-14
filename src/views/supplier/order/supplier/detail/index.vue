<template>
  <el-drawer
    v-model="drawerVisible"
    title="供应商订单详情"
    size="80%"
    append-to-body
    destroy-on-close
  >
    <div v-loading="loading" class="p-16px">
      <div class="mb-16px flex items-center justify-between">
        <el-tag :type="supplierStatusType(order.status)" size="large">
          {{ supplierStatusText(order.status) }}
        </el-tag>
        <el-button type="primary" plain @click="copyInfo">一键复制</el-button>
      </div>

      <el-descriptions title="基本信息" :column="3" border class="mb-16px">
        <el-descriptions-item label="供应商订单编号">{{
          order.supplierOrderNo || order.orderNo
        }}</el-descriptions-item>
        <el-descriptions-item label="关联平台订单">
          <el-button v-if="order.relatedPlatformOrderNo" link type="primary" @click="openPlatform">
            {{ order.relatedPlatformOrderNo }}
          </el-button>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ order.createTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="供货模式">
          {{ getOptionLabel(SUPPLY_MODE_OPTIONS, order.supplyMode) }}
        </el-descriptions-item>
        <el-descriptions-item label="配送方式">{{
          order.deliveryMode || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="发货时间">{{ order.shipTime || '--' }}</el-descriptions-item>
      </el-descriptions>

      <el-descriptions title="收货信息" :column="3" border class="mb-16px">
        <el-descriptions-item label="收货人">{{ order.receiverName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货人手机号">{{
          order.receiverMobile || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="2">{{
          order.receiverAddress || '-'
        }}</el-descriptions-item>
      </el-descriptions>

      <el-descriptions title="订单备注" :column="1" border class="mb-16px">
        <el-descriptions-item label="订单备注">{{ order.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="mb-8px font-600">商品详情</div>
      <el-table :data="order.items" class="mb-16px">
        <el-table-column label="商品详情" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-8px">
              <el-image
                v-if="row.picUrl"
                :src="row.picUrl"
                class="h-40px w-40px rounded"
                fit="cover"
              />
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商品编码(SKU)" prop="skuCode" min-width="130" />
        <el-table-column label="规格" prop="spec" min-width="100" />
        <el-table-column label="数量" prop="qty" width="80" />
        <el-table-column label="供应价结算（元）" min-width="130">
          <template #default="{ row }">{{
            formatMoney((row.supplyPrice || 0) * (row.qty || 0))
          }}</template>
        </el-table-column>
        <el-table-column label="订单类型" min-width="110">
          <template #default="{ row }">{{
            getOptionLabel(ORDER_BIZ_TYPE_OPTIONS, row.orderType)
          }}</template>
        </el-table-column>
        <el-table-column label="物流状态" min-width="100">
          <template #default="{ row }">
            {{ getOptionLabel(SUPPLIER_LOGISTICS_STATUS_OPTIONS, row.logisticsStatus) }}
          </template>
        </el-table-column>
      </el-table>

      <ExclusiveOrderInfo :order="order" />
      <FailureClosurePanel
        v-for="(summary, index) in order.failureClosures"
        :key="`${orderNo}-${index}`"
        :summary="summary"
        @changed="load"
      />

      <div class="mb-8px font-600">包裹信息</div>
      <el-timeline v-if="order.traces?.length">
        <el-timeline-item v-for="item in order.traces" :key="item.time" :timestamp="item.time">
          {{ item.content }}
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无物流信息" />
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { OrderApi, OrderVO } from '@/api/order'
import ExclusiveOrderInfo from '@/views/supplier/order/components/ExclusiveOrderInfo.vue'
import FailureClosurePanel from '@/views/supplier/order/components/FailureClosurePanel.vue'
import {
  FULFILLMENT_STATUS_OPTIONS,
  ORDER_BIZ_TYPE_OPTIONS,
  SUPPLIER_LOGISTICS_STATUS_OPTIONS,
  SUPPLIER_STATUS_OPTIONS,
  SUPPLY_MODE_OPTIONS,
  formatMoney,
  getOptionLabel,
  getOptionType
} from '@/views/supplier/order/utils/constants'

defineOptions({ name: 'OrderSupplierDetail' })

const emit = defineEmits(['open-platform'])
const message = useMessage()
const drawerVisible = ref(false)
const loading = ref(false)
const orderNo = ref('')
const order = ref<OrderVO>({
  orderNo: '',
  bizType: 'VIRTUAL_CARD',
  status: 'WAIT_PAY',
  amount: 0,
  qty: 0,
  items: []
})

const supplierStatusText = (status?: string) => {
  const prd = getOptionLabel(SUPPLIER_STATUS_OPTIONS, status)
  if (prd !== '-') return prd
  return getOptionLabel(FULFILLMENT_STATUS_OPTIONS, status)
}

const supplierStatusType = (status?: string) => {
  if (SUPPLIER_STATUS_OPTIONS.some((item) => item.value === status))
    return getOptionType(SUPPLIER_STATUS_OPTIONS, status)
  return getOptionType(FULFILLMENT_STATUS_OPTIONS, status)
}

const load = async () => {
  if (!orderNo.value) return
  const no = orderNo.value
  const token = ++loadVersion
  loading.value = true
  try {
    const result = await OrderApi.getSupplierOrder(no)
    if (token === loadVersion) order.value = result
  } finally {
    if (token === loadVersion) loading.value = false
  }
}

let loadVersion = 0
watch(drawerVisible, (visible) => {
  if (!visible) loadVersion++
})
const open = (no: string) => {
  order.value.failureClosures = []
  orderNo.value = no
  drawerVisible.value = true
  load()
}

const copyInfo = async () => {
  const text = `供应商订单编号：${order.value.supplierOrderNo || order.value.orderNo}\n商品：${order.value.items.map((item) => item.name).join('、')}`
  await navigator.clipboard.writeText(text)
  message.success('已复制订单核心信息')
}

const openPlatform = () => {
  const platformNo = order.value.relatedPlatformOrderNo
  if (!platformNo) return
  emit('open-platform', platformNo)
}

defineExpose({ open })
</script>
