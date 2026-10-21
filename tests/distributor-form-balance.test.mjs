import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

const emptyComponent = { render: () => null }
const mountForm = (mode, data = {}, put = async () => true) => mountProductList({ get: async () => data, put }, undefined, {
  entryFile: 'views/supplier/distribution/distributor/form/index.vue',
  props: { modelValue: true, mode, buyerCode: mode === 'create' ? undefined : 'BUY_001' },
  modules: {
    '@/components/UploadFile': { UploadFile: emptyComponent, UploadImg: emptyComponent, UploadImgs: emptyComponent }
  }
})
const balanceField = (view) => view.components('ElFormItem')
  .find((item) => item.props?.label === '当前账户余额')

for (const [data, amount] of [
  [{ accountBalanceCents: 12345 }, 123.45],
  [{ accountBalanceCents: 0, accountBalance: 999, openingBalanceCents: 50000 }, 0],
  [{ openingBalanceCents: 6000 }, 60],
  [{ accountBalance: 12.34 }, 12.34],
  [{}, undefined]
]) {
  test(`编辑分销商回显余额 ${amount} 且允许修改，通过openingBalanceCents提交`, async () => {
    const view = mountForm('edit', { buyerCode: 'BUY_001', ...data })
    try {
      await view.state.loadDetail('BUY_001')
      await flushProductList()
      assert.ok(balanceField(view))
      const input = view.components('ElInputNumber').find((item) => item.props.placeholder?.includes('当前账户余额'))
      assert.ok(input)
      assert.equal(input.props.modelValue, amount)
      input.props['onUpdate:modelValue'](999.12)
      const payload = view.state.buildSavePayload()
      assert.equal(payload.openingBalanceCents, 99912)
      assert.equal(Object.hasOwn(payload, 'accountBalanceCents'), false)
    } finally { view.unmount() }
  })
}

test('新增分销商保留期初余额输入并将元转换为分提交', async () => {
  const view = mountForm('create')
  try {
    await flushProductList()
    assert.ok(balanceField(view))
    const input = view.components('ElInputNumber').find((item) => item.props.placeholder?.includes('期初余额'))
    assert.ok(input)
    input.props['onUpdate:modelValue'](12.34)
    assert.equal(view.state.buildSavePayload().openingBalanceCents, 1234)
  } finally { view.unmount() }
})

test('重置表单会清除上一个分销商的余额，查看模式也只读展示余额', async () => {
  const view = mountForm('view', { buyerCode: 'BUY_001', accountBalanceCents: 5000 })
  try {
    await view.state.loadDetail('BUY_001')
    await flushProductList()
    assert.equal(balanceField(view).text.trim(), '50.00 元')
    assert.ok(!view.components('ElInputNumber').some((item) => item.props.placeholder?.includes('期初余额')))
    await view.state.resetForm()
    await flushProductList()
    assert.equal(balanceField(view).text.trim(), '-')
  } finally { view.unmount() }
})

test('编辑保存的真实HTTP请求携带openingBalanceCents，零余额也正常提交', async () => {
  const writes = []
  const view = mountForm('edit', { buyerCode: 'BUY_001', accountBalanceCents: 12345 }, async (request) => {
    writes.push(request)
    return true
  })
  try {
    await view.state.loadDetail('BUY_001')
    await flushProductList()
    view.state.openingBalanceYuan = 0
    await view.state.submitForm()
    assert.equal(writes.length, 1)
    assert.equal(writes[0].url, '/supply-chain/buyers/BUY_001')
    assert.equal(writes[0].data.openingBalanceCents, 0)
    assert.equal(Object.hasOwn(writes[0].data, 'accountBalanceCents'), false)
  } finally { view.unmount() }
})
