import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

async function mountSelection() {
  const view = mountProductList({
    get: async ({ url }) => url.endsWith('/management-page') ? {
      list: [{ spuCode: 'SPU_001', skus: [
        { skuCode: 'SKU_001', skuName: '规格一', suggestedSalePrice: 10000 },
        { skuCode: 'SKU_002', skuName: '规格二', suggestedSalePrice: 20000 }
      ] }], total: 1
    } : []
  }, undefined, {
    entryFile: 'views/supplier/manage/detail/ProductSelectDialog.vue',
    props: { supplierCode: 'SUP_001' },
    modules: {
      '@/utils/dict': {
        DICT_TYPE: { SUPPLY_CHAIN_TAX_RATE: 'supply_chain_tax_rate' },
        getDictLabel: () => '',
        getStrDictOptions: (type) => ({
          supply_chain_tax_rate: [{ value: 'RATE_6', label: '6%' }, { value: 'RATE_13', label: '13%' }],
          supply_chain_offer_price_mode: [
            { value: 'FIXED', label: '固定值' },
            { value: 'REALTIME', label: '实时更新' },
            { value: 'DISCOUNT', label: '按供货折扣' }
          ],
          supply_chain_supply_mode: [{ value: 'API_DIRECT', label: 'API直发' }]
        })[type] || []
      }
    }
  })
  await view.exposed.open()
  view.state.handleSelectionChange(view.state.skuList)
  await flushProductList()
  return view
}

test('新增供应商品批量区显示是否含税与税率，默认不含税时税率禁用', async () => {
  const view = await mountSelection()
  try {
    const included = view.components('ElSelect').find((item) => item.props.placeholder === '是否含税')
    assert.equal(included.props.modelValue, false)
    const rate = view.components('ElSelect').find((item) => item.props.placeholder === '税率')
    assert.equal(rate.props.disabled, true)
    included.props['onUpdate:modelValue'](true)
    included.props.onChange(true)
    await flushProductList()
    assert.equal(view.components('ElSelect').find((item) => item.props.placeholder === '税率').props.disabled, false)
    assert.ok(view.components('ElOption').some((item) => item.props.value === 'RATE_6' && item.props.label === '6%'))
  } finally { view.unmount() }
})

test('批量含税税率仅在点击应用后同步到全部已选SKU，不改写SKU建议价', async () => {
  const view = await mountSelection()
  try {
    Object.assign(view.state.batchConfig, { taxIncluded: true, taxRateCode: 'RATE_6' })
    assert.ok(view.state.selectedList.every((item) => item.taxIncluded === false))
    view.state.applyBatch()
    assert.ok(view.state.selectedList.every((item) => item.taxIncluded === true && item.taxRateCode === 'RATE_6'))
    assert.deepEqual(view.state.selectedList.map((item) => item.suggestedPriceCents), [10000, 20000])
    view.state.batchConfig.taxIncluded = false
    view.state.onBatchTaxIncludedChange()
    assert.equal(view.state.batchConfig.taxRateCode, undefined)
    view.state.applyBatch()
    assert.ok(view.state.selectedList.every((item) => item.taxIncluded === false && item.taxRateCode === undefined))
  } finally { view.unmount() }
})

test('含税但没有选择税率时阻止整批应用，不部分修改已选SKU', async () => {
  const view = await mountSelection()
  try {
    const before = JSON.parse(JSON.stringify(view.state.selectedList))
    Object.assign(view.state.batchConfig, { taxIncluded: true, taxRateCode: undefined, supplyMode: 'API_DIRECT' })
    view.state.applyBatch()
    assert.deepEqual(JSON.parse(JSON.stringify(view.state.selectedList)), before)
    assert.ok(view.messages.some((item) => item.type === 'warning' && item.text.includes('含税时请选择税率')))
  } finally { view.unmount() }
})

test('清空批量配置同时重置已选SKU的是否含税和税率', async () => {
  const view = await mountSelection()
  try {
    Object.assign(view.state.batchConfig, { taxIncluded: true, taxRateCode: 'RATE_13' })
    view.state.applyBatch()
    view.state.resetBatchConfig()
    assert.equal(view.state.batchConfig.taxIncluded, false)
    assert.equal(view.state.batchConfig.taxRateCode, undefined)
    assert.ok(view.state.selectedList.every((item) => item.taxIncluded === false && item.taxRateCode === undefined))
  } finally { view.unmount() }
})

test('每个SKU使用独立供应价模式按钮，配置项带标签，保留商品编码且切换不影响其他SKU', async () => {
  const view = await mountSelection()
  try {
    assert.equal(view.components('ElRadioGroup').length, 2)
    assert.deepEqual(view.components('ElRadioButton').map((item) => item.text.trim()), [
      '固定值', '实时更新', '按供货折扣', '固定值', '实时更新', '按供货折扣'
    ])
    for (const name of ['是否含税', '税率', '供货模式', '供货上限', '最低起购量', '供应商商品编码']) {
      assert.ok(view.text().includes(name))
    }
    assert.equal(view.components('ElInput').filter((item) => item.props['aria-label'] === '供应商商品编码').length, 2)
    const first = view.state.selectedList[0]
    const second = view.state.selectedList[1]
    view.components('ElRadioGroup')[0].props['onUpdate:modelValue']('REALTIME')
    await flushProductList()
    assert.equal(first.priceMode, 'REALTIME')
    assert.equal(second.priceMode, 'FIXED')
    assert.equal(view.components('ElInput').filter((item) => item.props['model-value'] === 'API实时获取').length, 1)
    view.components('ElRadioGroup')[0].props['onUpdate:modelValue']('DISCOUNT')
    await flushProductList()
    const discount = view.components('ElInputNumber').find((item) => item.props['aria-label'] === '供货折扣（%）')
    discount.props['onUpdate:modelValue'](90)
    assert.equal(first.discountBp, 9000)
    assert.equal(second.discountBp, undefined)
    view.components('ElRadioGroup')[0].props['onUpdate:modelValue']('FIXED')
    await flushProductList()
    const price = view.components('ElInputNumber').find((item) => item.props['aria-label'] === '固定供应价（元）')
    price.props['onUpdate:modelValue'](19.9)
    assert.equal(first.unitPriceCents, 1990)
  } finally { view.unmount() }
})
