<template>
  <div v-if="visible" class="mb-16px">
    <div class="mb-8px font-600">专属订单信息</div>
    <el-table v-if="cardRows.length" :data="cardRows" class="mb-12px">
      <el-table-column label="卡号" min-width="160">
        <template #default="{ row }">{{ row.cardNo || '-' }}</template>
      </el-table-column>
      <el-table-column label="卡密" min-width="140">
        <template #default="{ row }">{{ row.password || '-' }}</template>
      </el-table-column>
      <el-table-column label="有效期" min-width="200">
        <template #default="{ row }">{{ row.expireTime || '-' }}</template>
      </el-table-column>
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

const cardRows = computed(() =>
  (props.order.items || []).flatMap((item) =>
    (item.cardInfos || []).map((card) => ({
      cardNo: card.cardNo,
      password: card.password,
      expireTime: card.expireTime
    }))
  )
)
const rechargeRows = computed(() =>
  (props.order.items || []).flatMap((item) => {
    if (item.rechargeInfos?.length) return item.rechargeInfos
    return item.rechargeInfo ? [item.rechargeInfo] : []
  })
)
const collectCodes = (key: 'ticketCode' | 'pickupCode', listKey: 'ticketCodes' | 'pickupCodes') =>
  (props.order.items || []).flatMap((item) => {
    if (item[listKey]?.length) return item[listKey] || []
    return item[key] ? [item[key] as string] : []
  })
const ticketCodes = computed(() => collectCodes('ticketCode', 'ticketCodes'))
const pickupCodes = computed(() => collectCodes('pickupCode', 'pickupCodes'))
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
