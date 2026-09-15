<template>
  <el-drawer
    v-model="drawerVisible"
    title="售后详情"
    size="80%"
    append-to-body
    destroy-on-close
  >
    <div v-loading="loading">
      <div class="mb-16px flex items-center justify-between">
        <div class="flex items-center gap-12px">
          <el-tag :type="getOptionType(AFTER_SALE_STATUS_OPTIONS, detail.status)" size="large">
            {{ getOptionLabel(AFTER_SALE_STATUS_OPTIONS, detail.status) }}
          </el-tag>
          <el-tag>{{ getOptionLabel(AFTER_SALE_TYPE_OPTIONS, detail.type) }}</el-tag>
          <span class="font-600">{{ detail.afterSaleNo }}</span>
        </div>
        <el-button type="primary" plain @click="copyInfo">一键复制</el-button>
      </div>
    <el-descriptions title="售后信息" :column="2" border class="mb-16px">
      <el-descriptions-item label="售后申请时间">{{ detail.applyTime || '-' }}</el-descriptions-item>
      <el-descriptions-item label="售后服务单号">{{ detail.afterSaleNo }}</el-descriptions-item>
      <el-descriptions-item label="退给分销商">{{ formatMoney(detail.refundToDistributor) }}</el-descriptions-item>
      <el-descriptions-item label="退款原因">{{ detail.reason || '-' }}</el-descriptions-item>
      <el-descriptions-item label="退给用户" :span="2">
        {{ formatMoney(detail.refundToUser) }}（现金{{ formatMoney(detail.refundCash) }}；余额{{ formatMoney(detail.refundBalance) }}。其中运费{{ formatMoney(detail.refundFreight) }}，服务费{{ formatMoney(detail.refundServiceFee) }}）
      </el-descriptions-item>
      <el-descriptions-item label="问题描述" :span="2">{{ detail.description || '-' }}</el-descriptions-item>
    </el-descriptions>
    <el-descriptions title="用户信息" :column="2" border class="mb-16px">
      <el-descriptions-item label="收货人">{{ detail.order?.receiverName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="下单人">{{ detail.order?.buyerName }} {{ detail.order?.buyerId }}</el-descriptions-item>
      <el-descriptions-item label="收货人联系电话">{{ detail.order?.receiverMobile || '-' }}</el-descriptions-item>
      <el-descriptions-item label="下单人联系方式">{{ detail.order?.buyerMobile || '-' }}</el-descriptions-item>
      <el-descriptions-item label="收货地址" :span="2">{{ detail.order?.receiverAddress || '-' }}</el-descriptions-item>
    </el-descriptions>
    <el-descriptions title="订单来源信息" :column="2" border class="mb-16px">
      <el-descriptions-item label="所属分销商">{{ detail.order?.distributorName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="订单编号">
        <el-button link type="primary" @click="goOrder">{{ detail.orderNo }}</el-button>
      </el-descriptions-item>
      <el-descriptions-item label="分销商订单编号">{{ detail.order?.distributorOrderNo || '-' }}</el-descriptions-item>
      <el-descriptions-item label="父订单编号">{{ detail.order?.parentOrderNo || '-' }}</el-descriptions-item>
      <el-descriptions-item label="供应商订单号">{{ detail.order?.supplierOrderNo || '-' }}</el-descriptions-item>
    </el-descriptions>
    <div class="mb-8px font-600">售后商品</div>
    <el-table :data="detail.item ? [detail.item] : []" class="mb-16px">
      <el-table-column label="商品详情" prop="name" min-width="200" />
      <el-table-column label="商品编码" prop="skuCode" min-width="120" />
      <el-table-column label="数量" prop="qty" width="80" />
      <el-table-column label="售后申请数量" width="120">
        <template>{{ detail.qty }}</template>
      </el-table-column>
      <el-table-column label="供货价" min-width="100">
        <template #default="{ row }">{{ formatMoney(row.supplyPrice) }}</template>
      </el-table-column>
      <el-table-column label="销售价" min-width="100">
        <template #default="{ row }">{{ formatMoney(row.salePrice) }}</template>
      </el-table-column>
      <el-table-column label="优惠金额" min-width="100">
        <template #default="{ row }">{{ formatMoney(row.couponAmount) }}</template>
      </el-table-column>
      <el-table-column label="订单类型" min-width="100">
        <template #default="{ row }">{{ getOptionLabel(ORDER_BIZ_TYPE_OPTIONS, row.orderType) }}</template>
      </el-table-column>
      <el-table-column label="供应商" prop="supplierName" min-width="140" />
      <el-table-column label="分销商子单号" prop="distSubOrderNo" min-width="160" />
      <el-table-column label="物流状态" min-width="100">
        <template #default="{ row }">{{ getOptionLabel(LOGISTICS_STATUS_OPTIONS, row.logisticsStatus) }}</template>
      </el-table-column>
    </el-table>
    <div class="mb-8px font-600">售后处理详情</div>
    <el-timeline>
      <el-timeline-item
        v-for="(item, index) in detail.timeline || []"
        :key="index"
        :timestamp="item.time || '待处理'"
        :type="item.done ? 'primary' : 'info'"
        :color="item.done ? '' : '#c0c4cc'"
      >
        <div>{{ item.status }}</div>
        <div class="text-12px text-gray-500">处理人：{{ item.operator || '-' }}</div>
        <div v-if="item.remark" class="text-12px text-gray-500">备注：{{ item.remark }}</div>
      </el-timeline-item>
    </el-timeline>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { AfterSaleVO, OrderApi } from '@/api/order'
import {
  AFTER_SALE_STATUS_OPTIONS,
  AFTER_SALE_TYPE_OPTIONS,
  LOGISTICS_STATUS_OPTIONS,
  ORDER_BIZ_TYPE_OPTIONS,
  formatMoney,
  getOptionLabel,
  getOptionType
} from '@/views/supplier/order/utils/constants'

defineOptions({ name: 'OrderAftersaleDetail' })

const emit = defineEmits(['view-order'])
const message = useMessage()
const drawerVisible = ref(false)
const loading = ref(false)
const afterSaleNo = ref('')
const detail = ref<AfterSaleVO>({
  afterSaleNo: '',
  orderNo: '',
  type: 'REFUND_ONLY',
  status: 'WAIT_PLATFORM',
  qty: 1
})

const load = async () => {
  if (!afterSaleNo.value) return
  loading.value = true
  try {
    detail.value = await OrderApi.getAfterSale(afterSaleNo.value)
  } finally {
    loading.value = false
  }
}

const open = (no: string) => {
  afterSaleNo.value = no
  drawerVisible.value = true
  load()
}

const copyInfo = async () => {
  await navigator.clipboard.writeText(`售后单号：${detail.value.afterSaleNo}\n订单编号：${detail.value.orderNo}`)
  message.success('已复制')
}

const goOrder = () => emit('view-order', detail.value.orderNo)

defineExpose({ open })
</script>
