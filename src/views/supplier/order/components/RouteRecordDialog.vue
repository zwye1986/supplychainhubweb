<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`订单路由记录-${record.orderNo || ''}`"
    width="920px"
    append-to-body
    destroy-on-close
  >
    <div v-loading="loading">
      <el-descriptions :column="3" border class="mb-16px">
        <el-descriptions-item label="商品名称">{{ record.productName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="路由状态">
          <el-tag :type="record.status === 'SUCCESS' ? 'success' : 'danger'" size="small">
            {{ record.status === 'SUCCESS' ? '路由成功' : '路由失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="商品类型">
          {{ getOptionLabel(ORDER_BIZ_TYPE_OPTIONS, record.productType) }}
        </el-descriptions-item>
        <el-descriptions-item label="尝试次数">
          {{ record.tryCount || 0 }}次
          <span v-if="record.failCount" class="ml-4px text-[var(--el-color-danger)]">（失败{{ record.failCount }}次）</span>
        </el-descriptions-item>
        <el-descriptions-item label="最终供应商">{{ record.finalSupplierName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="供应商订单">{{ record.supplierOrderNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="累计耗时">{{ formatDuration(record.durationSec) }}</el-descriptions-item>
      </el-descriptions>

      <div class="mb-8px font-600">路由步骤详情</div>
      <el-empty v-if="!record.steps?.length" description="订单未进入路由或暂无尝试记录" />
      <div v-for="step in record.steps" :key="step.index" class="mb-12px rounded border p-12px">
        <div class="mb-8px flex flex-wrap items-center gap-12px">
          <el-tag round>{{ step.index }}</el-tag>
          <span class="font-600">{{ step.supplierName }}</span>
          <el-tag :type="step.result === 'SUCCESS' ? 'success' : 'danger'" size="small">
            {{ step.result === 'SUCCESS' ? '路由成功' : '路由失败' }}
          </el-tag>
          <span class="text-13px text-gray-500">{{ step.time }}</span>
        </div>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="供应价">{{ formatMoney(step.supplyPrice) }}</el-descriptions-item>
          <el-descriptions-item label="分配数量">{{ step.assignQty }}件</el-descriptions-item>
          <el-descriptions-item label="失败原因">
            <el-tag v-if="step.failReason" type="danger" size="small">
              {{ getOptionLabel(ROUTE_FAIL_REASON_OPTIONS, step.failReason) }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="3">{{ step.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div class="mt-8px">
          <el-button link type="primary" @click="toggleStep(step.index)">
            {{ expandedMap[step.index] ? '收起请求/响应' : '查看请求/响应' }}
          </el-button>
        </div>
        <el-tabs v-if="expandedMap[step.index]" class="mt-8px">
          <el-tab-pane label="请求参数">
            <pre class="m-0 max-h-240px overflow-auto rounded bg-gray-50 p-12px text-12px">{{ formatJson(step.request) }}</pre>
          </el-tab-pane>
          <el-tab-pane label="响应结果">
            <pre class="m-0 max-h-240px overflow-auto rounded bg-gray-50 p-12px text-12px">{{ formatJson(step.response) }}</pre>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { OrderApi } from '@/api/order'
import type { OrderRouteRecordVO } from '@/api/order'
import {
  ORDER_BIZ_TYPE_OPTIONS,
  ROUTE_FAIL_REASON_OPTIONS,
  formatMoney,
  getOptionLabel
} from '@/views/supplier/order/utils/constants'

defineOptions({ name: 'RouteRecordDialog' })

const message = useMessage()
const dialogVisible = ref(false)
const loading = ref(false)
const expandedMap = reactive<Record<number, boolean>>({})
const record = ref<OrderRouteRecordVO>({
  orderNo: '',
  productName: '',
  qty: 0,
  status: 'FAILED',
  productType: 'VIRTUAL_CARD',
  tryCount: 0,
  failCount: 0,
  durationSec: 0,
  steps: []
})

const formatDuration = (value?: number) => `${Number(value || 0).toFixed(1)}s`
const formatJson = (value?: Record<string, any>) => JSON.stringify(value || {}, null, 2)
const toggleStep = (index: number) => {
  expandedMap[index] = !expandedMap[index]
}

const open = async (orderNo: string) => {
  dialogVisible.value = true
  loading.value = true
  Object.keys(expandedMap).forEach((key) => delete expandedMap[Number(key)])
  try {
    record.value = await OrderApi.getRouteRecord(orderNo)
  } catch (error: any) {
    record.value = {
      orderNo,
      productName: '',
      qty: 0,
      status: 'FAILED',
      productType: 'VIRTUAL_CARD',
      tryCount: 0,
      failCount: 0,
      durationSec: 0,
      steps: []
    }
    if (error?.message) message.error(error.message)
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>
