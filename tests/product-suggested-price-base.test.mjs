import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

const BASE_DICT = 'supply_chain_suggested_sale_price_base'
const market = { value: 'MARKET_PRICE', label: '字典市场价' }
const legacyRule = { mode: 'CUSTOM', base: 'SUGGESTED_SALE_PRICE', percentage: 80, operator: 'ADD', operand: 1 }
const detail = (rule = legacyRule) => ({
  spuCode: 'SPU_1', spuName: '商品', status: 0,
  skus: [{ skuCode: 'SKU_1', skuName: '规格', marketPrice: 10000, suggestedSalePrice: 6500, suggestedSalePriceRule: rule }]
})
async function mount({ edit = false, bases = [market], rule = legacyRule } = {}) {
  const writes = []
  const dicts = {
    [BASE_DICT]: bases,
    supply_chain_suggested_sale_price_mode: [{ value: 'EQUAL_MARKET_PRICE', label: '等于市场价' }, { value: 'CUSTOM', label: '自定义设置' }, { value: 'FIXED', label: '固定值' }],
    supply_chain_suggested_sale_price_operator: [{ value: 'ADD', label: '加' }]
  }
  const dictionary = {
    getStrDictOptions: type => dicts[type] || [],
    getDictLabel: (type, value) => (dicts[type] || []).find(item => item.value === value)?.label || ''
  }
  const write = async req => { writes.push(req); return 'SPU_1' }
  const view = mountProductList({
    get: async req => req.url.endsWith('/spus/SPU_1') ? detail(rule) : [],
    post: write, put: write
  }, undefined, { entryFile: 'views/supplier/product/list/form/index.vue', modules: { '@/utils/dict': dictionary } })
  await view.state.open(edit ? 'SPU_1' : undefined)
  await flushProductList()
  return { view, writes }
}
const baseOptions = view => view.components('ElOption').filter(item => ['MARKET_PRICE', 'SUGGESTED_SALE_PRICE', 'UNKNOWN'].includes(item.props.value))
const fillCustom = sku => Object.assign(sku.suggestedSalePriceRule, { percentage: 80, operator: 'ADD', operand: 1 })

test('新增基数选项与公式标签来自字典，真实请求提交市场价编码', async () => {
  const { view, writes } = await mount()
  try {
    assert.deepEqual(baseOptions(view).map(item => [item.props.value, item.props.label]), [['MARKET_PRICE', '字典市场价']])
    fillCustom(view.state.formData.skus[0]); await flushProductList()
    assert.ok(view.text().includes('字典市场价*80%加1元'))
    await view.state.submitForm()
    assert.equal(writes.length, 1)
    assert.deepEqual(writes[0].data.skus[0].suggestedSalePriceRule, { mode: 'CUSTOM', base: 'MARKET_PRICE', percentage: 80, operator: 'ADD', operand: 1, fixedPriceCents: undefined })
  } finally { view.unmount() }
})
test('字典误加历史基数或未知编码时不提供为新选择', async () => {
  const { view } = await mount({ bases: [{ value: 'SUGGESTED_SALE_PRICE', label: '销售建议价' }, { value: 'UNKNOWN', label: '未知价' }, market] })
  try {
    assert.deepEqual(baseOptions(view).map(item => item.props.value), ['MARKET_PRICE'])
    assert.equal(view.state.formData.skus[0].suggestedSalePriceRule.base, 'MARKET_PRICE')
  } finally { view.unmount() }
})
test('字典缺失不回退写死基数，阻止CUSTOM写入并显示配置提示', async () => {
  const { view, writes } = await mount({ bases: [] })
  try {
    assert.equal(baseOptions(view).length, 0)
    fillCustom(view.state.formData.skus[0]); await view.state.submitForm(); await flushProductList()
    assert.equal(writes.length, 0)
    assert.ok(view.text().includes('基准价格来源字典未配置'))
  } finally { view.unmount() }
})
test('清空基数或伪造历史/未知基数不能作为新规则提交', async () => {
  for (const base of ['', 'SUGGESTED_SALE_PRICE', 'UNKNOWN']) {
    const { view, writes } = await mount()
    try {
      fillCustom(view.state.formData.skus[0]); view.state.formData.skus[0].suggestedSalePriceRule.base = base
      await view.state.submitForm(); assert.equal(writes.length, 0)
      assert.ok(view.messages.some(item => item.type === 'warning' && item.text.includes('基准价格')))
    } finally { view.unmount() }
  }
})
test('历史规则只读回显，修改商品名称与市场价时省略规则和结果，避免重复调价', async () => {
  const { view, writes } = await mount({ edit: true })
  try {
    assert.ok(view.text().includes('当前使用历史基准：修改前销售建议价'))
    assert.equal(baseOptions(view).some(item => item.props.value === 'SUGGESTED_SALE_PRICE'), false)
    assert.equal(view.components('ElInputNumber').some(item => item.props.modelValue === 80), false)
    view.state.formData.spuName = '新名称'; view.state.formData.skus[0].marketPrice = 120
    await view.state.submitForm()
    assert.equal(writes[0].data.spuName, '新名称')
    assert.equal(writes[0].data.skus[0].marketPrice, 12000)
    assert.equal(Object.hasOwn(writes[0].data.skus[0], 'suggestedSalePriceRule'), false)
    assert.equal(Object.hasOwn(writes[0].data.skus[0], 'suggestedSalePrice'), false)
  } finally { view.unmount() }
})
test('历史基准主动重新设置后使用字典市场价，混合SKU分别保留或提交规则', async () => {
  const { view, writes } = await mount({ edit: true })
  try {
    const button = view.allButtons().find(item => item.text.includes('重新设置建议价'))
    assert.ok(button); button.props.onClick(); await flushProductList()
    fillCustom(view.state.formData.skus[0])
    assert.equal(view.state.formData.skus[0].suggestedSalePriceRule.base, 'MARKET_PRICE')
    view.state.formData.skus.push(view.state.mapSkuToForm({ ...detail().skus[0], skuCode: 'SKU_2' }))
    await view.state.submitForm()
    assert.equal(writes[0].data.skus[0].suggestedSalePriceRule.base, 'MARKET_PRICE')
    assert.equal(Object.hasOwn(writes[0].data.skus[1], 'suggestedSalePriceRule'), false)
  } finally { view.unmount() }
})
test('历史规则切换固定值再回CUSTOM时不会重新带入历史基数', async () => {
  const { view } = await mount({ edit: true })
  try {
    const sku = view.state.formData.skus[0]
    sku.suggestedSalePriceRule.mode = 'FIXED'; view.state.onAdjustModeChange(sku)
    sku.suggestedSalePriceRule.mode = 'CUSTOM'; view.state.onAdjustModeChange(sku)
    await flushProductList()
    assert.equal(sku.suggestedSalePriceRule.base, 'MARKET_PRICE')
    assert.equal(view.text().includes('当前使用历史基准'), false)
  } finally { view.unmount() }
})
test('等于市场价模式预览与字典模式编码一致，缺少基数字典仍可提交固定价', async () => {
  const { view, writes } = await mount({ bases: [] })
  try {
    const sku = view.state.formData.skus[0]
    sku.suggestedSalePriceRule.mode = 'EQUAL_MARKET_PRICE'; view.state.onAdjustModeChange(sku)
    await flushProductList(); assert.equal(view.state.formatSuggestFormula(sku), '等于市场价')
    sku.suggestedSalePriceRule.mode = 'FIXED'; sku.suggestedSalePriceRule.fixedPriceCents = 6100
    await view.state.submitForm(); assert.equal(writes.length, 1)
    assert.equal(writes[0].data.skus[0].suggestedSalePriceRule.fixedPriceCents, 6100)
  } finally { view.unmount() }
})
