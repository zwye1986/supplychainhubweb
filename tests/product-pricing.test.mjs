import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

/** 编译真实定价表单、弹窗和 API，验证发往后端的业务字段；HTTP 与 Element UI 壳使用桩。
 * 契约见后端 docs/superpowers/specs/2026-09-15-generic-batch-pricing-design.md#4-税务展示属性。
 */
const detail = (taxIncluded, taxRateCode) => ({
  pricingStatus: 'DEPENDENCY_MISSING', currentVersionId: 1,
  distributionRule: { mode: 'DIRECT_MARKET_PRICE' }, salesRule: { mode: 'DIRECT_MARKET_PRICE' },
  serviceFeeRule: { percentage: 100, operator: 'MULTIPLY', operand: 0, hideCopy: true },
  hideRule: { distributionThresholdPercent: 0, salesThresholdPercent: 0 },
  taxMetadata: { taxIncluded, taxRateCode }
})

for (const codes of [['SKU_1'], ['SKU_1', 'SKU_2']]) {
  test(`不含税${codes.length === 1 ? '单条' : '批量'}保存始终输出 NON_TAXABLE`, async () => {
    const writes = []
    const view = mountProductList({ get: async () => detail(false, 'NON_TAXABLE'),
      put: async request => { writes.push(request); return true } }, undefined,
    { pricing: true, entryFile: 'views/supplier/product/list/components/PriceDialog.vue' })
    try {
      await view.state.open(codes, codes.length > 1)
      await flushProductList()
      if (codes.length > 1) view.state.pricingFormRef.applyDetail(detail(false, 'NON_TAXABLE'))
      await view.state.submit()
      assert.equal(writes.length, 1)
      assert.equal(writes[0].url, '/supply-chain/products/skus/pricing')
      const payload = JSON.parse(JSON.stringify(writes[0].data))
      assert.deepEqual(payload.platformSkuCodes, codes)
      assert.equal(payload.taxIncluded, false)
      assert.equal(payload.taxRateCode, 'NON_TAXABLE')
    } finally { view.unmount() }
  })
}

test('含税税率原样提交，切换不含税后丢弃旧税率并发送 NON_TAXABLE', async () => {
  const writes = []
  const view = mountProductList({ get: async () => detail(true, 'RATE_6'),
    put: async request => { writes.push(request); return true } }, undefined,
  { pricing: true, entryFile: 'views/supplier/product/list/components/PriceDialog.vue' })
  try {
    await view.state.open(['SKU_1'], false); await flushProductList()
    await view.state.submit()
    assert.equal(writes[0].data.taxRateCode, 'RATE_6')
    await view.state.open(['SKU_1'], false); await flushProductList()
    const form = view.state.pricingFormRef.$.setupState
    form.formData.taxIncluded = false
    form.onTaxIncludedChange(false)
    await view.state.submit()
    assert.equal(writes[1].data.taxIncluded, false)
    assert.equal(writes[1].data.taxRateCode, 'NON_TAXABLE')
  } finally { view.unmount() }
})

test('表单含税缺编码拒绝，不含税无需手选税率但输出完整税务组', async () => {
  const view = mountProductList({}, undefined,
    { pricing: true, entryFile: 'views/supplier/product/list/components/PricingForm.vue' })
  try {
    const state = view.state
    const validator = state.formRules.taxRateCode[0].validator
    let error
    validator({}, '', value => { error = value })
    assert.equal(error.message, '请选择税率')
    state.formData.taxIncluded = false
    validator({}, '', value => { error = value })
    assert.equal(error, undefined)
    assert.equal(state.getValues().taxRateCode, 'NON_TAXABLE')
  } finally { view.unmount() }
})

for (const [spuStatus, skuStatus] of [[0, 10], [20, 10], [90, 10], [10, 0], [10, 20], [10, 90], [undefined, 10]]) {
  test(`SPU=${spuStatus} SKU=${skuStatus} 的人工定价入口在打开弹窗前拒绝`, async () => {
    const view = mountProductList({ get: async () => [] })
    try {
      await flushProductList()
      view.state.list = [{ spuCode: 'SPU_1', status: spuStatus, skus: [{ skuCode: 'SKU_1', status: skuStatus }] }]
      await flushProductList()
      view.state.openSkuPriceDialog('SKU_1')
      assert.equal(view.priceOpens.length, 0)
      assert.ok(view.messages.some(message => message.text.includes('上架')))
    } finally { view.unmount() }
  })
}

test('混合批次整体拒绝且不静默过滤；两层启用后整批原样打开', async () => {
  const view = mountProductList({ get: async () => [] })
  try {
    await flushProductList()
    view.state.list = [{ spuCode: 'SPU_1', status: 10, skus: [
      { skuCode: 'SKU_1', status: 10 }, { skuCode: 'SKU_2', status: 0 }
    ] }]
    view.state.handleSelectionChange([{ spuCode: 'SPU_1' }])
    await flushProductList()
    view.state.openPriceDialog()
    assert.equal(view.priceOpens.length, 0)
    view.state.list[0].skus[1].status = 10
    await flushProductList()
    view.state.openPriceDialog()
    assert.deepEqual(view.priceOpens, [[['SKU_1', 'SKU_2'], true]])
  } finally { view.unmount() }
})
