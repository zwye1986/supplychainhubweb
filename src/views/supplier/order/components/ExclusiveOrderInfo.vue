<template>
  <div v-if="visible" class="mb-16px">
    <div class="mb-8px font-600">专属订单信息</div>
    <el-table v-if="cardRows.length" :data="cardRows" class="mb-12px">
      <el-table-column label="卡号" prop="cardNo" min-width="160" />
      <el-table-column label="卡密" prop="password" min-width="140" />
      <el-table-column label="有效期" prop="expireTime" min-width="170" />
    </el-table>
    <el-descriptions v-if="rechargeRows.length" :column="3" border class="mb-12px">
      <template v-for="(item, index) in rechargeRows" :key="index">
        <el-descriptions-item label="充值账号">{{ item.account || '-' }}</el-descriptions-item>
        <el-descriptions-item label="充值结果">{{ item.result || '-' }}</el-descriptions-item>
        <el-descriptions-item label="凭证号">{{ item.voucherNo || '-' }}</el-descriptions-item>
      </template>
    </el-descriptions>
    <el-descriptions v-if="ticketCodes.length" :column="2" border class="mb-12px">
      <el-descriptions-item v-for="(code, index) in ticketCodes" :key="index" label="取票码">
        {{ code }}
      </el-descriptions-item>
    </el-descriptions>
    <el-descriptions v-if="pickupCodes.length" :column="2" border class="mb-12px">
      <el-descriptions-item v-for="(code, index) in pickupCodes" :key="index" label="取餐码">
        {{ code }}
      </el-descriptions-item>
    </el-descriptions>
    <el-empty v-if="empty" description="暂无专属订单信息" />
  </div>
</template>

<script lang="ts" setup>
import type { OrderVO } from '@/api/order'

defineOptions({ name: 'ExclusiveOrderInfo' })

const props = defineProps({
  order: { type: Object as PropType<OrderVO>, required: true }
})

const cardRows = computed(() => props.order.items?.flatMap((item) => item.cardInfos || []) || [])
const rechargeRows = computed(
  () => (props.order.items || []).map((item) => item.rechargeInfo).filter(Boolean) as any[]
)
const ticketCodes = computed(() =>
  (props.order.items || []).map((item) => item.ticketCode).filter((item): item is string => Boolean(item))
)
const pickupCodes = computed(() =>
  (props.order.items || []).map((item) => item.pickupCode).filter((item): item is string => Boolean(item))
)
const visible = computed(
  () =>
    ['VIRTUAL_CARD', 'VIRTUAL_RECHARGE', 'MOVIE', 'DINING'].includes(props.order.bizType) ||
    cardRows.value.length > 0 ||
    rechargeRows.value.length > 0
)
const empty = computed(
  () => visible.value && !cardRows.value.length && !rechargeRows.value.length && !ticketCodes.value.length && !pickupCodes.value.length
)
</script>
