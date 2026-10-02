<template>
  <el-dialog
    v-model="visible"
    :title="target?.kind === 'retry' ? '触发限频检查' : '释放限频占用'"
    width="560px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="!hasPending"
    :before-close="close"
  >
    <template v-if="target">
      <el-alert
        v-if="!allowed"
        title="查询或操作权限已撤销，暂停发送。未确定的操作号与正文持续保留，恢复权限后可按原意图重试。"
        type="warning"
        :closable="false"
        class="mb-16px"
      />
      <el-alert
        :title="
          target.kind === 'retry'
            ? '仅触发检查，不承诺订单已发送。'
            : '仅按服务端可信资格释放，提交时将再次校验占用与版本。'
        "
        type="warning"
        :closable="false"
        class="mb-16px"
      />
      <el-descriptions :column="1" border>
        <el-descriptions-item label="手机号">{{ target.row.maskedMobile }}</el-descriptions-item>
        <el-descriptions-item label="SPU">{{ target.row.platformSpuCode }}</el-descriptions-item>
        <el-descriptions-item label="订单">{{
          target.kind === 'retry' ? target.row.orderNo : target.row.holderOrderNo
        }}</el-descriptions-item>
        <el-descriptions-item v-if="intent" label="操作号">{{
          intent.payload.actionNo
        }}</el-descriptions-item>
      </el-descriptions>
      <el-form class="mt-16px" label-position="top">
        <el-form-item label="操作原因（必填，最多512字）">
          <el-input
            v-model="reason"
            type="textarea"
            :rows="4"
            maxlength="512"
            show-word-limit
            :disabled="!!intent || refused"
          />
        </el-form-item>
      </el-form>
      <el-alert
        v-if="notice"
        :title="notice"
        :type="uncertain ? 'warning' : 'error'"
        :closable="false"
      />
    </template>
    <template #footer>
      <el-button :disabled="hasPending" @click="close">关闭</el-button>
      <el-button
        v-if="!refused"
        type="primary"
        :loading="submitting"
        :disabled="!allowed || (!intent && !reason.trim())"
        @click="submit"
      >
        {{ uncertain ? '使用原操作号重试' : '确认操作' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, ref, shallowRef } from 'vue'

import {
  FREQUENCY_ERROR_CODES,
  FREQUENCY_PERMISSIONS,
  isDeterminedFrequencyError,
  RechargeFrequencyApi
} from '@/api/order/rechargeFrequency'
import type {
  Occupancy,
  ReleasePayload,
  RetryPayload,
  WaitingOrder,
  WireLong
} from '@/api/order/rechargeFrequency'
import { checkPermi } from '@/utils/permission'

type Target = { kind: 'retry'; row: WaitingOrder } | { kind: 'release'; row: Occupancy }
type Intent =
  | { kind: 'retry'; id: WireLong; payload: Readonly<RetryPayload> }
  | { kind: 'release'; id: WireLong; payload: Readonly<ReleasePayload> }
const emit = defineEmits<{ resolved: []; changed: [] }>()
const visible = ref(false)
const target = ref<Target>()
const intent = shallowRef<Intent>()
const reason = ref('')
const notice = ref('')
const submitting = ref(false)
const uncertain = ref(false)
const refused = ref(false)
const hasPending = computed(() => submitting.value || uncertain.value)
const allowed = computed(
  () =>
    !!target.value &&
    checkPermi([FREQUENCY_PERMISSIONS.query]) &&
    checkPermi([FREQUENCY_PERMISSIONS[target.value.kind]])
)

/**
 * 操作号绑定完整不可变意图；未知结果禁止关闭/离页，原正文原号重试直到确定。
 * 不把网络错误当CAS冲突，不根据展示状态授予释放资格。
 * 设计：docs/superpowers/specs/2026-09-30-direct-recharge-mobile-spu-frequency-design.md#7-管理端契约与权限
 */
const open = (value: Target) => {
  if (
    hasPending.value ||
    !checkPermi([FREQUENCY_PERMISSIONS.query]) ||
    !checkPermi([FREQUENCY_PERMISSIONS[value.kind]])
  )
    return
  if (value.kind === 'release' && !value.row.canRelease) return
  target.value = value
  intent.value = undefined
  reason.value = ''
  notice.value = ''
  uncertain.value = false
  refused.value = false
  visible.value = true
}
const close = () => {
  if (hasPending.value) return
  visible.value = false
  target.value = undefined
  intent.value = undefined
  reason.value = ''
}
const submit = async () => {
  if (submitting.value || !allowed.value || !target.value || refused.value) return
  if (!intent.value) {
    const text = reason.value.trim()
    if (!text || text.length > 512) return
    const payload = {
      actionNo: crypto.randomUUID(),
      expectedVersion: target.value.row.version,
      reason: text
    }
    if (target.value.kind === 'retry') {
      intent.value = {
        kind: 'retry',
        id: target.value.row.entryId,
        payload: Object.freeze(payload)
      }
    } else {
      if (!target.value.row.canRelease || !target.value.row.holderOrderNo) return
      intent.value = {
        kind: 'release',
        id: target.value.row.queueId,
        payload: Object.freeze({
          ...payload,
          expectedHolderOrderNo: target.value.row.holderOrderNo,
          expectedGeneration: target.value.row.generation
        })
      }
    }
  }
  const command = intent.value
  submitting.value = true
  notice.value = ''
  try {
    const result =
      command.kind === 'retry'
        ? await RechargeFrequencyApi.retry(command.id, command.payload)
        : await RechargeFrequencyApi.release(command.id, command.payload)
    const expectedCode = command.kind === 'retry' ? 'RETRY_SCHEDULED' : 'RELEASED'
    if (
      !result ||
      result.actionNo !== command.payload.actionNo ||
      result.resultCode !== expectedCode
    ) {
      uncertain.value = true
      notice.value = '响应未确认原操作结果，请保留原操作号并使用原正文重试。'
      return
    }
    uncertain.value = false
    ElMessage.success(result.message)
    visible.value = false
    intent.value = undefined
    reason.value = ''
    emit('resolved')
  } catch (error: unknown) {
    if (isDeterminedFrequencyError(error)) {
      uncertain.value = false
      refused.value = true
      notice.value =
        error.code === FREQUENCY_ERROR_CODES.versionConflict
          ? '占用或版本已变化，列表已刷新。请关闭后核对最新数据，再发起新操作。'
          : error.message
      emit('changed')
    } else {
      uncertain.value = true
      notice.value = '结果未确定，操作号与正文已保留。请使用原操作号重试，不能修改原因或另起操作。'
    }
  } finally {
    submitting.value = false
  }
}
defineExpose({ open, hasPending })
</script>
