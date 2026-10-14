<template>
  <el-card class="mb-16px" header="原单核实与失败处置">
    <el-alert
      title="核实仅查询原单，不恢复购买。HTTP 受理不代表核实成功；失败关单以服务端证据为准。"
      type="warning"
      :closable="false"
    />
    <el-descriptions :column="2" border class="mt-12px">
      <el-descriptions-item label="终结原因">{{
        detail?.terminalReasonNote ||
        summary.terminalReasonNote ||
        detail?.reasonCode ||
        summary.terminalReasonCode ||
        '未知'
      }}</el-descriptions-item>
      <el-descriptions-item label="Case">{{
        summary.caseNo || '无关联处置单'
      }}</el-descriptions-item>
      <el-descriptions-item label="预期 / 实报 / 价差（元）"
        >{{ money(summary.expectedSupplierSettlementAmount) }} /
        {{ money(summary.reportedSupplierSettlementAmount) }} /
        {{ money(summary.supplierSettlementDifferenceAmount) }}</el-descriptions-item
      >
      <el-descriptions-item label="资金处置">{{ fundText }}</el-descriptions-item>
      <el-descriptions-item label="异步执行状态">{{
        action?.executionStatus || detail?.latestActionStatus || '尚未核实'
      }}</el-descriptions-item>
      <el-descriptions-item label="原单证据"
        >{{ action?.externalSupplierStatus || summary.externalSupplierStatus || '未知' }} /
        {{
          action?.verifyConclusion || detail?.latestVerifyConclusion || '未知'
        }}</el-descriptions-item
      >
      <el-descriptions-item label="证据有效期">{{
        action?.freshUntil || '未知'
      }}</el-descriptions-item>
      <el-descriptions-item label="核实摘要">{{
        action?.completionSummary || '无'
      }}</el-descriptions-item>
    </el-descriptions>
    <el-alert v-if="error" :title="error" type="error" :closable="false" class="mt-12px" />
    <template v-if="summary.caseNo && hasPermission(['supply-chain:fulfillment-case:query'])">
      <el-input
        v-model="reason"
        placeholder="请输入核实 / 关单原因（必填）"
        maxlength="500"
        class="mt-12px"
      />
      <div class="mt-12px flex gap-8px">
        <el-button :disabled="busy" @click="refresh">刷新核实结果</el-button>
        <el-button
          v-if="hasPermission(['supply-chain:fulfillment-case:verify'])"
          :disabled="busy || !detail?.canVerify || !reason.trim()"
          @click="submit(false)"
          >核实原单</el-button
        >
        <el-button
          v-if="hasPermission(['supply-chain:fulfillment-case:confirm-failure'])"
          type="danger"
          :disabled="busy || !detail?.canConfirmFailure || !action || !reason.trim()"
          @click="confirmVisible = true"
          >确认失败关单</el-button
        >
      </div>
    </template>
    <el-dialog v-model="confirmVisible" title="确认失败关单" width="520px" append-to-body>
      <p>将基于最近一次原单核实证据终结履约失败，仅释放本单剩余预留，不代表供应商已核账。</p>
      <p
        >原单：{{ detail?.bOrderNo }}；证据：{{ action?.externalSupplierStatus }} /
        {{ action?.verifyConclusion }}</p
      >
      <p
        >剩余预留：{{
          money(detail?.fundDisposition?.remainingAmount)
        }}
        元。请核对原因并输入“确认失败关单”。</p
      >
      <el-input v-model="confirmation" placeholder="确认失败关单" />
      <template #footer>
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button
          type="danger"
          :disabled="busy || confirmation !== '确认失败关单' || !detail?.canConfirmFailure"
          @click="submit(true)"
          >确认失败关单</el-button
        >
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  CaseApi,
  type CaseAction,
  type CaseCommand,
  type CaseDetail,
  type FailureClosure
} from '@/api/order/failure-closure'
import { hasPermission } from '@/directives/permission/hasPermi'

const props = defineProps<{ summary: FailureClosure }>()
const emit = defineEmits(['changed'])
const detail = ref<CaseDetail>()
const action = ref<CaseAction>()
const busy = ref(false)
const error = ref('')
const reason = ref('')
const confirmation = ref('')
const confirmVisible = ref(false)
let epoch = 0
let readVersion = 0
let poll: ReturnType<typeof setTimeout> | undefined
let pending: { confirm: boolean; command: CaseCommand } | undefined
const money = (value?: number | null) => (value == null ? '未知' : (value / 100).toFixed(2))
const fundText = computed(() => {
  const fund = detail.value?.fundDisposition ?? props.summary.fundDisposition
  return !fund
    ? '未知（无预留快照）'
    : `仍冻结 ${money(fund.remainingAmount)} / 已扣款 ${money(fund.committedAmount)} / 已释放 ${money(fund.releasedAmount)} 元`
})
const active = (status?: string) =>
  ['RECEIVED', 'ACCEPTED', 'PENDING', 'STARTED', 'RUNNING'].includes(status || '')

/** 页面代次隔离所有读取与提交返回；不让旧订单、旧动作覆盖新页面。 */
async function refresh() {
  const no = props.summary.caseNo
  if (!no || !hasPermission(['supply-chain:fulfillment-case:query'])) return
  const token = epoch
  const readToken = ++readVersion
  try {
    const next = await CaseApi.detail(no)
    const nextAction = next.latestActionNo
      ? await CaseApi.action(no, next.latestActionNo)
      : undefined
    if (token !== epoch || readToken !== readVersion) return
    detail.value = next
    action.value = nextAction ?? action.value
    error.value = ''
    clearTimeout(poll)
    if (active(action.value?.executionStatus)) poll = setTimeout(refresh, 2000)
  } catch {
    if (token === epoch && readToken === readVersion) {
      detail.value = undefined
      error.value = '查询失败，操作资格未知，请刷新。'
    }
  }
}
async function submit(confirm: boolean) {
  if (busy.value || !detail.value || !reason.value.trim()) return
  if (
    !Number.isSafeInteger(detail.value.caseVersion) ||
    !Number.isSafeInteger(detail.value.generation)
  )
    return
  if (!hasPermission([`supply-chain:fulfillment-case:${confirm ? 'confirm-failure' : 'verify'}`]))
    return
  if (
    confirm
      ? !detail.value.canConfirmFailure || !action.value || confirmation.value !== '确认失败关单'
      : !detail.value.canVerify
  )
    return
  const token = epoch
  const no = detail.value.caseNo
  // 网络未知时保留原 actionNo 和完整指纹，同号重试不重新核实或重复释放。
  if (!pending || pending.confirm !== confirm)
    pending = {
      confirm,
      command: {
        actionNo: crypto.randomUUID().replaceAll('-', ''),
        expectedCaseVersion: detail.value.caseVersion,
        expectedGeneration: detail.value.generation,
        reason: reason.value.trim(),
        ...(confirm ? { verifyActionNo: action.value!.actionNo } : {})
      }
    }
  busy.value = true
  try {
    const result = await (confirm ? CaseApi.confirmFailure : CaseApi.verify)(no, pending.command)
    if (token !== epoch) return
    action.value = result
    pending = undefined
    confirmVisible.value = false
    confirmation.value = ''
    await refresh()
    if (token === epoch) emit('changed')
  } catch {
    if (token === epoch)
      error.value = '命令结果未知或已被拒绝，请刷新核实结果；重试沿用原命令编号，不表示关单成功。'
  } finally {
    if (token === epoch) busy.value = false
  }
}
watch(
  () => props.summary.caseNo,
  () => {
    epoch++
    clearTimeout(poll)
    detail.value = undefined
    action.value = undefined
    pending = undefined
    busy.value = false
    reason.value = ''
    error.value = ''
    confirmation.value = ''
    confirmVisible.value = false
    void refresh()
  },
  { immediate: true }
)
onBeforeUnmount(() => {
  epoch++
  clearTimeout(poll)
})
</script>
