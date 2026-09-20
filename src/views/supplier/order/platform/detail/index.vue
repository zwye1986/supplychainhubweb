<template>
  <el-drawer
    v-model="drawerVisible"
    title="订单详情"
    size="80%"
    append-to-body
    destroy-on-close
  >
  <div class="p-16px">
    <div v-loading="loading">
      <div class="mb-16px flex items-center justify-between">
        <div class="flex items-center gap-12px">
          <el-tag :type="getOptionType(ORDER_STATUS_OPTIONS, order.status)" size="large">
            {{ getOptionLabel(ORDER_STATUS_OPTIONS, order.status) }}
          </el-tag>
          <span class="text-16px font-600">{{ order.orderNo }}</span>
          <span class="text-13px text-gray-500">{{ order.buyerName }} {{ order.buyerMobile }}</span>
          <span class="text-13px text-gray-500">{{ order.createTime }}</span>
        </div>
        <el-button type="primary" plain @click="copyInfo">一键复制</el-button>
      </div>
    </div>

    <el-descriptions title="下单人信息" :column="3" border class="mb-16px">
      <el-descriptions-item label="下单人ID">{{ order.buyerId || '-' }}</el-descriptions-item>
      <el-descriptions-item label="下单人昵称">{{ order.buyerName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="下单人手机号">{{ order.buyerMobile || '-' }}</el-descriptions-item>
      <el-descriptions-item label="所属分组">{{ order.buyerGroup || '-' }}</el-descriptions-item>
      <el-descriptions-item label="下单时间">{{ order.createTime || '-' }}</el-descriptions-item>
    </el-descriptions>

    <el-descriptions title="收货人信息" :column="3" border class="mb-16px">
      <el-descriptions-item label="收货人">{{ order.receiverName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="收货人手机号">{{ order.receiverMobile || '-' }}</el-descriptions-item>
      <el-descriptions-item label="收货地址" :span="2">{{ order.receiverAddress || '-' }}</el-descriptions-item>
    </el-descriptions>

    <el-descriptions title="支付信息" :column="1" border class="mb-16px">
      <el-descriptions-item label="用户支付方式">{{ order.payMethod || '-' }}</el-descriptions-item>
      <el-descriptions-item label="支付流水号">{{ order.payTradeNo || '-' }}</el-descriptions-item>
      <el-descriptions-item label="用户支付金额">
        （商品金额：{{ formatMoney(order.goodsAmount) }}）+（运费：{{ formatMoney(order.freightAmount) }}）+（服务费：{{ formatMoney(order.serviceFee) }}）-（优惠券金额：{{ formatMoney(order.couponAmount) }}）
      </el-descriptions-item>
      <el-descriptions-item label="项目支付金额">
        {{ formatMoney(order.projectPayAmount ?? order.distGoodsAmount) }}
        （商品金额：{{ formatMoney(order.distGoodsAmount) }}）+（运费：{{ formatMoney(order.distFreightAmount) }}）+（扣点：{{ formatMoney(order.distFeeAmount) }}）
      </el-descriptions-item>
    </el-descriptions>

    <el-descriptions title="订单来源信息" :column="3" border class="mb-16px">
      <el-descriptions-item label="所属项目">{{ order.projectName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="所属分销商">{{ order.distributorName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="供应商">{{ order.supplierName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="订单编号">{{ order.orderNo }}</el-descriptions-item>
      <el-descriptions-item label="分销商订单编号">{{ order.distributorOrderNo || '-' }}</el-descriptions-item>
      <el-descriptions-item label="供应商订单编号">{{ order.supplierOrderNo || '-' }}</el-descriptions-item>
      <el-descriptions-item v-if="order.source === 'SUPPLIER'" label="推送时间">{{ order.pushTime || '-' }}</el-descriptions-item>
      <el-descriptions-item v-if="order.source === 'SUPPLIER'" label="确认时间">{{ order.confirmTime || '-' }}</el-descriptions-item>
      <el-descriptions-item label="订单备注">{{ order.remark || '-' }}</el-descriptions-item>
      <el-descriptions-item label="完成时间">{{ order.finishTime || '-' }}</el-descriptions-item>
    </el-descriptions>

    <div class="mb-8px font-600">商品详情</div>
    <el-table :data="order.items" class="mb-16px">
      <el-table-column label="商品详情" min-width="200">
        <template #default="{ row }">
          <div class="flex items-center gap-8px">
            <el-image v-if="row.picUrl" :src="row.picUrl" class="h-40px w-40px rounded" fit="cover" />
            <span>{{ row.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="商品编码(SKU)" prop="skuCode" min-width="130" />
      <el-table-column label="规格" prop="spec" min-width="100" />
      <el-table-column label="数量" prop="qty" width="80" />
      <el-table-column label="售后完成数量" prop="afterSaleQty" width="120" />
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
      <el-table-column label="优惠券金额" min-width="110">
        <template #default="{ row }">{{ formatMoney(row.couponAmount) }}</template>
      </el-table-column>
      <el-table-column label="订单类型" min-width="110">
        <template #default="{ row }">{{ getOptionLabel(ORDER_BIZ_TYPE_OPTIONS, row.orderType) }}</template>
      </el-table-column>
      <el-table-column label="供应商" prop="supplierName" min-width="140" />
      <el-table-column label="分销子单编号" prop="distSubOrderNo" min-width="160" />
      <el-table-column label="物流状态" min-width="100">
        <template #default="{ row }">{{ getOptionLabel(LOGISTICS_STATUS_OPTIONS, row.logisticsStatus) }}</template>
      </el-table-column>
      <el-table-column v-if="order.bizType === 'MOVIE'" label="取票码" prop="ticketCode" min-width="120" />
      <el-table-column v-if="order.bizType === 'DINING'" label="取餐码" prop="pickupCode" min-width="120" />
      <el-table-column label="售后类型" min-width="110">
        <template #default="{ row }">{{ getOptionLabel(AFTER_SALE_TYPE_OPTIONS, row.afterSaleType) }}</template>
      </el-table-column>
      <el-table-column label="售后状态" min-width="120">
        <template #default="{ row }">{{ getOptionLabel(AFTER_SALE_STATUS_OPTIONS, row.afterSaleStatus) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button
            v-if="row.afterSaleStatus === 'NONE' && order.status === 'SUCCESS'"
            link
            type="primary"
            @click="openAfterSale(row)"
          >
            申请售后
          </el-button>
          <el-button
            v-if="row.afterSaleStatus && row.afterSaleStatus !== 'NONE'"
            link
            type="primary"
            @click="goAfterSale(row)"
          >
            售后详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <template v-if="order.bizType === 'VIRTUAL_CARD' || order.bizType === 'VIRTUAL_RECHARGE'">
      <div class="mb-8px font-600">卡密/直充信息</div>
      <el-table v-if="cardRows.length" :data="cardRows" class="mb-16px">
        <el-table-column label="卡号" prop="cardNo" min-width="160" />
        <el-table-column label="卡密" prop="password" min-width="140" />
        <el-table-column label="有效期" prop="expireTime" min-width="170" />
      </el-table>
      <el-descriptions v-if="rechargeRows.length" :column="3" border class="mb-16px">
        <template v-for="(item, index) in rechargeRows" :key="index">
          <el-descriptions-item label="充值账号">{{ item.account || '-' }}</el-descriptions-item>
          <el-descriptions-item label="充值结果">{{ item.result || '-' }}</el-descriptions-item>
          <el-descriptions-item label="凭证号">{{ item.voucherNo || '-' }}</el-descriptions-item>
        </template>
      </el-descriptions>
    </template>

    <div class="mb-8px font-600">包裹信息</div>
    <el-timeline v-if="order.traces?.length">
      <el-timeline-item v-for="item in order.traces" :key="item.time" :timestamp="item.time">
        {{ item.content }}
      </el-timeline-item>
    </el-timeline>
    <el-empty v-else description="暂无物流信息" />
    <AfterSaleForm ref="afterSaleRef" @success="load" />
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { OrderApi, OrderItemVO, OrderVO } from '@/api/order'
import AfterSaleForm from '@/views/supplier/order/components/AfterSaleForm.vue'
import {
  AFTER_SALE_STATUS_OPTIONS,
  AFTER_SALE_TYPE_OPTIONS,
  LOGISTICS_STATUS_OPTIONS,
  ORDER_BIZ_TYPE_OPTIONS,
  ORDER_STATUS_OPTIONS,
  formatMoney,
  getOptionLabel,
  getOptionType
} from '@/views/supplier/order/utils/constants'

defineOptions({ name: 'OrderPlatformDetail' })

const router = useRouter()
const message = useMessage()
const drawerVisible = ref(false)
const loading = ref(false)
const afterSaleRef = ref()
const orderNo = ref('')
const order = ref<OrderVO>({ orderNo: '', bizType: 'VIRTUAL_CARD', status: 'WAIT_PAY', amount: 0, qty: 0, items: [] })
const cardRows = computed(() => order.value.items.flatMap((item) => item.cardInfos || []))
const rechargeRows = computed(() => order.value.items.map((item) => item.rechargeInfo).filter(Boolean) as any[])

const load = async () => {
  if (!orderNo.value) return
  loading.value = true
  try {
    order.value = await OrderApi.getOrder(orderNo.value)
  } finally {
    loading.value = false
  }
}

const open = (no: string) => {
  orderNo.value = no
  drawerVisible.value = true
  load()
}

const copyInfo = async () => {
  const text = `订单编号：${order.value.orderNo}\n商品：${order.value.items.map((item) => item.name).join('、')}\n金额：${formatMoney(order.value.amount)}`
  await navigator.clipboard.writeText(text)
  message.success('已复制订单核心信息')
}

const openAfterSale = (row: OrderItemVO) => {
  afterSaleRef.value.open({ orderNo: order.value.orderNo, itemId: row.id, maxQty: row.qty })
}

const goAfterSale = (row: OrderItemVO) => {
  drawerVisible.value = false
  router.push({ path: '/order/aftersale', query: { orderNo: order.value.orderNo, itemId: String(row.id) } })
}

defineExpose({ open })
</script>
