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

// ── i-b 履约就绪度三态→标签/类型（就绪 success / 未配置 info / 待发布变更 warning）──────────────
test('maps fulfillment status codes to labels and tag types', () => {
  assert.equal(getFulfillmentStatusLabel?.(FulfillmentStatusEnum?.READY), '就绪')
  assert.equal(getFulfillmentStatusLabel?.(FulfillmentStatusEnum?.NOT_CONFIGURED), '未配置')
  assert.equal(getFulfillmentStatusLabel?.(FulfillmentStatusEnum?.STALE), '待发布变更')
  assert.equal(getFulfillmentStatusLabel?.(undefined), '-')
  assert.equal(getFulfillmentStatusType?.(FulfillmentStatusEnum?.READY), 'success')
  assert.equal(getFulfillmentStatusType?.(FulfillmentStatusEnum?.NOT_CONFIGURED), 'info')
  assert.equal(getFulfillmentStatusType?.(FulfillmentStatusEnum?.STALE), 'warning')
})

// ── 上架动作按钮文案：Offer已上架→下架，已下架→上架──────────────────────────
test('derives shelf actions from Offer lifecycle status', () => {
  assert.equal(getOnShelfActionLabel?.('PUBLISHED'), '下架')
  assert.equal(getOnShelfActionLabel?.('SUSPENDED'), '上架')
  assert.equal(getOnShelfActionLabel?.('RETIRED'), undefined)
  // 状态缺失（旧数据）不推断为下架
  assert.equal(getOnShelfActionLabel?.(undefined), undefined)
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
