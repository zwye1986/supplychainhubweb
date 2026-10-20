import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import ts from 'typescript'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

const baseDict = 'supply_chain_suggested_sale_price_base'
const market = { value: 'MARKET_PRICE', label: '字典市场价' }
const supply = { value: 'SUPPLY_PRICE', label: '字典供应价' }
const supplyRule = {
  mode: 'CUSTOM',
  base: 'SUPPLY_PRICE',
  percentage: 80,
  operator: 'ADD',
  operand: 1
}
const dictionary = (bases = [supply, market]) => ({
  getStrDictOptions: (type) => (type === baseDict ? bases : []),
  getDictLabel: (type, value) =>
    type === baseDict ? bases.find((item) => item.value === value)?.label || '' : ''
})
async function mount(entry, fields = {}, { edit = false, bases } = {}) {
  const sku = {
    skuCode: 'SKU_1',
    skuName: '规格',
    marketPrice: 10000,
    suggestedSalePriceRule: supplyRule,
    ...fields
  }
  const detail = { spuCode: 'SPU_1', spuName: '商品', status: 0, skus: [sku] }
  const writes = []
  const write = async (req) => {
    writes.push(req)
    return 'SPU_1'
  }
  const view = mountProductList(
    {
      get: async (req) =>
        req.url.endsWith('/management-page')
          ? { list: [detail], total: 1 }
          : req.url.endsWith('/spus/SPU_1')
            ? detail
            : [],
      post: write,
      put: write
    },
    undefined,
    {
      entryFile: `views/supplier/product/list/${entry === 'list' ? 'index.vue' : `${entry}/index.vue`}`,
      modules: { '@/utils/dict': dictionary(bases) }
    }
  )
  if (entry === 'form') await view.state.open(edit ? 'SPU_1' : undefined)
  if (entry === 'detail') await view.exposed.open('SPU_1')
  await flushProductList()
  return { view, writes }
}
const priceColumn = (view) =>
  view.components('ElTableColumn').find((item) => item.props.label === '销售建议价（元）').text

test('真实表单开放字典供应价并过滤历史/未知码，新增默认市场价不受字典排序影响', async () => {
  const { view } = await mount(
    'form',
    {},
    {
      bases: [
        supply,
        { value: 'SUGGESTED_SALE_PRICE', label: '历史' },
        { value: 'UNKNOWN', label: '未知' },
        market
      ]
    }
  )
  try {
    const options = view
      .components('ElOption')
      .filter((item) =>
        ['MARKET_PRICE', 'SUPPLY_PRICE', 'SUGGESTED_SALE_PRICE', 'UNKNOWN'].includes(
          item.props.value
        )
      )
    assert.deepEqual(
      options.map((item) => [item.props.value, item.props.label]),
      [
        [supply.value, supply.label],
        [market.value, market.label]
      ]
    )
    assert.equal(view.state.formData.skus[0].suggestedSalePriceRule.base, 'MARKET_PRICE')
  } finally {
    view.unmount()
  }
})
test('新建无供应价仍可保存供应价公式，并提示待计算', async () => {
  const { view, writes } = await mount('form')
  try {
    Object.assign(view.state.formData.skus[0].suggestedSalePriceRule, supplyRule)
    await flushProductList()
    assert.ok(view.text().includes('字典供应价*80%ADD1元'))
    assert.ok(view.text().includes('暂无有效供应价'))
    assert.ok(view.text().includes('待计算'))
    await view.state.submitForm()
    assert.equal(writes.length, 1)
    assert.equal(writes[0].data.skus[0].suggestedSalePriceRule.base, 'SUPPLY_PRICE')
  } finally {
    view.unmount()
  }
})
test('供应价表单回显服务端权威结果、零供应价与计算快照，提交剔除状态/历史/快照/金额', async () => {
  const fields = {
    supplyPrice: 0,
    suggestedSalePrice: 1234,
    suggestedSalePriceStatus: 'READY',
    suggestedSalePriceUnavailableReason: null,
    lastValidSuggestedSalePrice: 1234,
    lastValidSuggestedSalePriceCalculatedAt: '2026-10-19 10:00:00',
    suggestedSalePriceRule: { ...supplyRule, basePriceSnapshotCents: 0 }
  }
  const { view, writes } = await mount('form', fields, { edit: true })
  try {
    assert.ok(view.text().includes('供应价：0.00元'))
    assert.ok(view.text().includes('本轮计算供应价：0.00元'))
    assert.ok(view.text().includes('12.34'))
    assert.equal(view.text().includes('暂无有效供应价'), false)
    view.state.formData.spuName = '改名'
    await view.state.submitForm()
    const sent = writes[0].data.skus[0]
    assert.deepEqual(sent.suggestedSalePriceRule, { ...supplyRule, fixedPriceCents: undefined })
    for (const key of [
      'suggestedSalePrice',
      'suggestedSalePriceCents',
      'supplyPrice',
      'suggestedSalePriceStatus',
      'suggestedSalePriceUnavailableReason',
      'lastValidSuggestedSalePrice',
      'lastValidSuggestedSalePriceCalculatedAt'
    ])
      assert.equal(Object.hasOwn(sent, key), false, key)
  } finally {
    view.unmount()
  }
})
for (const entry of ['list', 'detail', 'form']) {
  for (const timeFormat of ['日期文本', '毫秒时间戳', '时间戳字符串']) {
    test(`${entry}待计算不展示兼容零金额，历史参考和${timeFormat}独立展示`, async () => {
      const timestamp = new Date(2026, 9, 19, 10, 0, 0).getTime()
      const calculatedAt =
        timeFormat === '日期文本'
          ? '2026-10-19 10:00:00'
          : timeFormat === '毫秒时间戳'
            ? timestamp
            : String(timestamp)
      const { view } = await mount(
        entry,
        {
          supplyPrice: null,
          suggestedSalePrice: null,
          suggestedSalePriceCents: 0,
          suggestedSalePriceStatus: 'DEPENDENCY_MISSING',
          suggestedSalePriceUnavailableReason: 'EFFECTIVE_SUPPLY_PRICE_MISSING',
          lastValidSuggestedSalePrice: 9900,
          lastValidSuggestedSalePriceCalculatedAt: calculatedAt
        },
        { edit: true }
      )
      try {
        const text = priceColumn(view)
        assert.ok(text.includes('待计算：暂无有效供应价'), text)
        assert.ok(text.includes('历史参考：99.00元'), text)
        assert.ok(text.includes('2026-10-19 10:00:00'), text)
        assert.equal(text.includes('=0.00'), false)
        assert.equal(text.includes('=99.00'), false)
      } finally {
        view.unmount()
      }
    })
  }
  test(`${entry}计算失败保留公式并展示失败原因，旧金额不能作为当前金额`, async () => {
    const { view } = await mount(
      entry,
      {
        supplyPrice: 5000,
        suggestedSalePrice: 8800,
        suggestedSalePriceStatus: 'CALCULATION_FAILED',
        suggestedSalePriceUnavailableReason: 'SUGGESTED_PRICE_CALCULATION_FAILED',
        lastValidSuggestedSalePrice: 7700
      },
      { edit: true }
    )
    try {
      const text = priceColumn(view)
      assert.ok(text.includes('计算失败'), text)
      assert.ok(text.includes('请检查定价规则'), text)
      assert.ok(text.includes('历史参考：77.00元'), text)
      assert.equal(text.includes('88.00'), false)
      assert.ok(text.includes('字典供应价*80%'), text)
    } finally {
      view.unmount()
    }
  })
}
for (const entry of ['list', 'detail']) {
  test(`${entry}READY展示后端结果与字典供应价标签，不在前端计算或回退旧分字段`, async () => {
    const { view } = await mount(entry, {
      supplyPrice: 0,
      suggestedSalePrice: 1234,
      suggestedSalePriceStatus: 'READY'
    })
    try {
      assert.ok(priceColumn(view).includes('字典供应价*80%+1元=12.34'))
    } finally {
      view.unmount()
    }
  })
  test(`${entry}当前金额显式null时不回退旧金额字段`, async () => {
    const { view } = await mount(entry, { suggestedSalePrice: null, suggestedSalePriceCents: 9900 })
    try {
      assert.equal(priceColumn(view).includes('99.00'), false)
    } finally {
      view.unmount()
    }
  })
}

test('详情转保存适配器同样剔除服务端快照，并省略空规则和历史基准规则', () => {
  const source = fs.readFileSync(new URL('../src/api/product/index.ts', import.meta.url), 'utf8')
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS }
  }).outputText
  const api = {}
  new Function('exports', 'require', javascript)(api, () => ({}))
  const sent = api.toSpuSaveReq({
    skus: [
      {
        skuName: '供应价',
        suggestedSalePriceRule: { ...supplyRule, basePriceSnapshotCents: 5000 }
      },
      { skuName: '空规则', suggestedSalePriceRule: null },
      { skuName: '历史', suggestedSalePriceRule: { ...supplyRule, base: 'SUGGESTED_SALE_PRICE' } }
    ]
  })
  assert.equal(Object.hasOwn(sent.skus[0].suggestedSalePriceRule, 'basePriceSnapshotCents'), false)
  assert.equal(Object.hasOwn(sent.skus[1], 'suggestedSalePriceRule'), false)
  assert.equal(Object.hasOwn(sent.skus[2], 'suggestedSalePriceRule'), false)
})
