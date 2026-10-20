import assert from 'node:assert/strict'
import test from 'node:test'
import { mountSupplierConfig, flushSfc } from './support/supplier-config-sfc-harness.mjs'

const row = () => ({ id: 48, sellableCategory: 'PHYSICAL', productType: 'TYPE_A',
  productClassification: 'LEAF', supplyModes: ['API_DIRECT'], maxQuantity: 100, minQuantity: 1 })
function mount(confirm = async () => true) {
  const saved = []
  const api = { getSupplyScopes: async () => [row()], saveSupplyScopes: async (code, body) => saved.push({ code, body }) }
  const view = mountSupplierConfig(api, '../manage/detail/SupplyConfig.vue', { supplierCode: 'SPL_007' }, { confirm })
  return { view, saved }
}

test('真实配置保存保留行id，原样保存不要求破坏性确认', async () => {
  let confirmations = 0
  const { view, saved } = mount(async () => { confirmations++ })
  try {
    await flushSfc()
    await view.root.setupState.handleSave()
    assert.equal(saved[0].body.lines[0].id, 48)
    assert.equal(confirmations, 0)
  } finally { view.unmount() }
})
for (const field of ['productType', 'productClassification']) {
  test(`真实配置修改${field}取消确认不发送保存请求`, async () => {
    let confirmations = 0
    const { view, saved } = mount(async () => { confirmations++; throw new Error('cancel') })
    try {
      await flushSfc()
      view.root.setupState.list[0][field] = 'CHANGED'
      await view.root.setupState.handleSave()
      assert.equal(confirmations, 1)
      assert.equal(saved.length, 0)
    } finally { view.unmount() }
  })
}
test('确认变更后携带原id保存，品类模式数量变更不误触发移除确认', async () => {
  let confirmations = 0
  const { view, saved } = mount(async () => { confirmations++ })
  try {
    await flushSfc()
    const state = view.root.setupState
    state.list[0].sellableCategory = 'MOVIE'
    state.list[0].supplyModes = ['H5']
    state.list[0].maxQuantity = 200
    await state.handleSave()
    assert.equal(confirmations, 0)
    state.list[0].productClassification = 'ROOT'
    await state.handleSave()
    assert.equal(confirmations, 1)
    assert.equal(saved[1].body.lines[0].id, 48)
    assert.equal(saved[1].body.lines[0].productClassification, 'ROOT')
    assert.match(view.text(), /移除/)
  } finally { view.unmount() }
})
