import assert from 'node:assert/strict'
import test from 'node:test'

import * as fulfillment from '../src/views/supplier/manage/detail/utils/fulfillment.ts'

const {
  FulfillmentStatusEnum,
  getFulfillmentStatusLabel,
  getFulfillmentStatusType,
  getOnShelfActionLabel,
  validateExternalSkuCode
} = fulfillment

// ── i-b 履约就绪度三态→标签/类型（就绪 success / 未配置 info / 过期 warning）──────────────
test('maps fulfillment status codes to labels and tag types', () => {
  assert.equal(getFulfillmentStatusLabel?.(FulfillmentStatusEnum?.READY), '就绪')
  assert.equal(getFulfillmentStatusLabel?.(FulfillmentStatusEnum?.NOT_CONFIGURED), '未配置')
  assert.equal(getFulfillmentStatusLabel?.(FulfillmentStatusEnum?.STALE), '过期')
  assert.equal(getFulfillmentStatusLabel?.(undefined), '-')
  assert.equal(getFulfillmentStatusType?.(FulfillmentStatusEnum?.READY), 'success')
  assert.equal(getFulfillmentStatusType?.(FulfillmentStatusEnum?.NOT_CONFIGURED), 'info')
  assert.equal(getFulfillmentStatusType?.(FulfillmentStatusEnum?.STALE), 'warning')
})

// ── 上架动作按钮文案：就绪→重新上架，未配置/过期→上架（§8.6）──────────────────────────
test('derives the on-shelf action label from fulfillment status', () => {
  assert.equal(getOnShelfActionLabel?.(FulfillmentStatusEnum?.READY), '重新上架')
  assert.equal(getOnShelfActionLabel?.(FulfillmentStatusEnum?.NOT_CONFIGURED), '上架')
  assert.equal(getOnShelfActionLabel?.(FulfillmentStatusEnum?.STALE), '上架')
  // 状态缺失（旧数据）按未配置处理，仍可上架
  assert.equal(getOnShelfActionLabel?.(undefined), '上架')
})

// ── f1 选品必填 externalSkuCode 校验（非空、去空白、<=128）────────────────────────────
test('requires a non-blank externalSkuCode within 128 chars', () => {
  assert.match(validateExternalSkuCode?.(undefined) || '', /供应商商品编码|externalSkuCode/)
  assert.match(validateExternalSkuCode?.('') || '', /供应商商品编码|externalSkuCode/)
  assert.match(validateExternalSkuCode?.('   ') || '', /供应商商品编码|externalSkuCode/)
  assert.equal(validateExternalSkuCode?.('QNM-1001'), null)
  assert.match(validateExternalSkuCode?.('x'.repeat(129)) || '', /128/)
  assert.equal(validateExternalSkuCode?.('x'.repeat(128)), null)
})
