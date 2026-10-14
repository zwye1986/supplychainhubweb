<template>
  <el-drawer v-model="drawerVisible" title="订单详情" size="80%" append-to-body destroy-on-close>
    <div v-loading="loading" class="p-16px">
      <div class="mb-16px flex items-center justify-between">
        <div class="flex flex-wrap items-center gap-12px">
          <el-tag :type="getOptionType(ORDER_STATUS_OPTIONS, order.status)" size="large">
            {{ getOptionLabel(ORDER_STATUS_OPTIONS, order.status) }}
          </el-tag>
          <span>{{ order.buyerName || '-' }}</span>
          <span class="text-13px text-gray-500">{{ order.buyerMobile || '-' }}</span>
          <span class="text-13px text-gray-500">{{ order.createTime || '-' }}</span>
        </div>
        <el-button type="primary" plain @click="copyInfo">一键复制</el-button>
      </div>

      <el-descriptions title="收货人信息" :column="3" border class="mb-16px">
        <el-descriptions-item label="收货人">{{ order.receiverName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货人手机号">{{
          order.receiverMobile || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="2">{{
          order.receiverAddress || '-'
        }}</el-descriptions-item>
      </el-descriptions>

      <el-descriptions title="支付信息" :column="1" border class="mb-16px">
        <el-descriptions-item label="用户支付方式">{{
          unpaid ? '--' : order.payMethod || '--'
        }}</el-descriptions-item>
        <el-descriptions-item label="支付流水号">{{
          unpaid ? '--' : order.payTradeNo || '--'
        }}</el-descriptions-item>
        <el-descriptions-item label="用户支付金额">
          <template v-if="unpaid">--</template>
          <template v-else>
            {{ formatAmount(userPayAmount) }}元 = 商品金额：{{ formatAmount(order.goodsAmount) }} +
            运费：{{ formatAmount(order.freightAmount) }} + 服务费：{{
              formatAmount(order.serviceFee)
            }}
            - 优惠券金额：{{ formatAmount(order.couponAmount) }}
          </template>
        </el-descriptions-item>
        <el-descriptions-item label="项目支付金额">
          <template v-if="unpaid">--</template>
          <template v-else>
            {{ formatAmount(projectPayAmount) }}元 = 商品金额：{{
              formatAmount(projectGoodsAmount)
            }}
            + 运费：{{ formatAmount(projectFreightAmount) }}
          </template>
        </el-descriptions-item>
        <el-descriptions-item label="分销商支付金额">
          <template v-if="unpaid">--</template>
          <template v-else>
            {{ formatAmount(distributorPayAmount) }}元 = 商品金额：{{
              formatAmount(distributorGoodsAmount)
            }}
            + 运费：{{ formatAmount(distributorFreightAmount) }}
          </template>
        </el-descriptions-item>
      </el-descriptions>

      <el-descriptions title="订单来源信息" :column="3" border class="mb-16px">
        <el-descriptions-item label="所属项目">{{ order.projectName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="所属分销商">{{
          order.distributorName || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ order.supplierName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单编号">{{ order.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="分销商订单编号">{{
          order.distributorOrderNo || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="供应商订单编号">
          <template v-if="supplierOrderLinks.length">
            <el-button
              v-for="item in supplierOrderLinks"
              :key="item.supplierOrderNo"
              link
              type="primary"
              @click="emit('open-supplier', item.supplierOrderNo)"
            >
              {{ item.supplierOrderNo }}
            </el-button>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
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
        <el-table-column label="供应价（元）" min-width="110">
          <template #default="{ row }">{{ formatMoney(row.supplyPrice) }}</template>
        </el-table-column>
        <el-table-column label="分销价（元）" min-width="110">
          <template #default="{ row }">{{ formatMoney(row.distPrice) }}</template>
        </el-table-column>
        <el-table-column label="项目专属价（元）" min-width="130">
          <template #default="{ row }">{{ formatMoney(row.projectPrice) }}</template>
        </el-table-column>
        <el-table-column label="销售价（元）" min-width="110">
          <template #default="{ row }">{{ formatMoney(row.salePrice) }}</template>
        </el-table-column>
        <el-table-column label="服务费（元）" min-width="110">
          <template #default="{ row }">{{ formatMoney(row.serviceFee) }}</template>
        </el-table-column>
        <el-table-column label="优惠券金额（元）" min-width="130">
          <template #default="{ row }">{{ formatMoney(row.couponAmount) }}</template>
        </el-table-column>
        <el-table-column label="订单类型" min-width="110">
          <template #default="{ row }">{{
            getOptionLabel(ORDER_BIZ_TYPE_OPTIONS, row.orderType)
          }}</template>
        </el-table-column>
        <el-table-column label="物流状态" min-width="100">
          <template #default="{ row }">{{
            getOptionLabel(LOGISTICS_STATUS_OPTIONS, row.logisticsStatus)
          }}</template>
        </el-table-column>
      </el-table>

      <ExclusiveOrderInfo :order="order" />
      <el-alert
        v-if="order.terminalReasonCode"
        :title="`平台失败原因：${order.terminalReasonCode}`"
        type="error"
        :closable="false"
        class="mb-16px"
      />
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
  LOGISTICS_STATUS_OPTIONS,
  ORDER_BIZ_TYPE_OPTIONS,
  ORDER_STATUS_OPTIONS,
  formatAmount,
  formatMoney,
  getOptionLabel,
  getOptionType,
  isUnpaidStatus
} from '@/views/supplier/order/utils/constants'

defineOptions({ name: 'OrderPlatformDetail' })

const emit = defineEmits(['open-supplier'])
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
const unpaid = computed(() => isUnpaidStatus(order.value.status))
const userPayAmount = computed(
  () =>
    Number(order.value.goodsAmount || 0) +
    Number(order.value.freightAmount || 0) +
    Number(order.value.serviceFee || 0) -
    Number(order.value.couponAmount || 0)
)
const projectGoodsAmount = computed(
  () => order.value.projectGoodsAmount ?? order.value.projectPayAmount ?? 0
)
const projectFreightAmount = computed(() => order.value.projectFreightAmount ?? 0)
const projectPayAmount = computed(
  () => order.value.projectPayAmount ?? projectGoodsAmount.value + projectFreightAmount.value
)
const distributorGoodsAmount = computed(
  () => order.value.distributorGoodsAmount ?? order.value.distGoodsAmount ?? 0
)
const distributorFreightAmount = computed(
  () => order.value.distributorFreightAmount ?? order.value.distFreightAmount ?? 0
)
const distributorPayAmount = computed(
  () =>
    order.value.distributorPayAmount ??
    distributorGoodsAmount.value + distributorFreightAmount.value
)
const supplierOrderLinks = computed(() => {
  if (order.value.supplierOrders?.length)
    return order.value.supplierOrders.filter((item) => item.supplierOrderNo)
  return order.value.supplierOrderNo ? [{ supplierOrderNo: order.value.supplierOrderNo }] : []
})

const load = async () => {
  if (!orderNo.value) return
  const no = orderNo.value
  const token = ++loadVersion
  loading.value = true
  try {
    const result = await OrderApi.getOrder(no)
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
  const text = `订单编号：${order.value.orderNo}\n商品：${order.value.items.map((item) => item.name).join('、')}\n金额：${formatMoney(order.value.amount)}`
  await navigator.clipboard.writeText(text)
  message.success('已复制订单核心信息')
}

defineExpose({ open })
</script>
