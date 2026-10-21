import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

const createDetail = () => ({
  spuCode: 'SPU_001',
  spuName: '爱奇艺会员',
  brandName: '爱奇艺',
  productType: 'VIRTUAL_CARD',
  primaryCategoryId: 1,
  status: 0,
  deliveryType: 'VIRTUAL',
  skus: [{
    skuCode: 'SKU_001_001',
    skuName: '爱奇艺月卡',
    picUrl: '/main.png',
    detailPics: ['/detail-1.png', '/detail-2.png'],
    description: '虚拟供货商品',
    marketPrice: 1990,
    suggestedSalePrice: 10,
    supplyPrice: 2014,
    taxRateDisplay: '6%',
    taxAmount: 114,
    suppliers: [
      { supplierCode: 'SUP_001', supplierName: '供应商甲' },
      { supplierCode: 'SUP_002', supplierName: '供应商乙' }
    ],
    totalInventory: 120,
    skuInventory: 5,
    suggestedSalePriceRule: {
      mode: 'CUSTOM', base: 'MARKET_PRICE', percentage: 0.5, operator: 'ADD', operand: 0
    }
  }]
})

const mountDetail = (get = async () => createDetail(), props) =>
  mountProductList({ get }, undefined, {
    entryFile: 'views/supplier/product/list/detail/index.vue', props
  })

test('商品详情显示分区、含税率税额的SKU列及分转元金额', async () => {
  const requests = []
  const view = mountDetail(async (request) => {
    requests.push(request.url)
    return createDetail()
  })
  try {
    await view.exposed.open('SPU_001')
    await flushProductList()
    assert.deepEqual(requests, ['/supply-chain/products/spus/SPU_001'])
    for (const text of ['基本信息', 'SKU规格管理', '配送设置', '爱奇艺会员', '爱奇艺', '草稿', '19.90', '20.14', '市场价*0.5%+0元=0.10']) {
      assert.ok(view.text().includes(text), text)
    }
    assert.deepEqual(view.components('ElTableColumn').map((column) => column.props.label), [
      'SKU主图', 'SKU详情图', '商品描述', 'SKU名称', 'SKU编码', '市场价（元）', '销售建议价（元）', '供应价（元）', '税率', '税额(元)', '供应商', '总库存'
    ])
    const columns = view.components('ElTableColumn')
    assert.equal(columns.find((column) => column.props.label === '税率').text.trim(), '6%')
    assert.equal(columns.find((column) => column.props.label === '税额(元)').text.trim(), '1.14')
    assert.ok(columns.find((column) => column.props.label === '供应商').text.includes('供应商甲、供应商乙'))
    assert.equal(columns.find((column) => column.props.label === '总库存').text.trim(), '120')
    const images = view.components('ElImage')
    assert.equal(images.length, 3)
    assert.equal(images[2].props.src, '/detail-2.png')
    assert.deepEqual(images[2].props['preview-src-list'], ['/detail-1.png', '/detail-2.png'])
    assert.equal(images[2].props['initial-index'], 1)
    assert.equal(view.components('ElCheckbox')[0].props['model-value'], true)
    assert.equal(view.components('ElCheckbox')[0].props.disabled, '')
  } finally {
    view.unmount()
  }
})

for (const [taxRateDisplay, taxAmount, rateText, amountText] of [
  ['0%', 0, '0%', '0.00'],
  ['不征税', 0, '不征税', '0.00'],
  [undefined, undefined, '—', '-'],
  [null, null, '—', '-']
]) {
  test(`SKU详情税率${taxRateDisplay}、税额${taxAmount}保持列表展示口径`, async () => {
    const detail = createDetail()
    Object.assign(detail.skus[0], { taxRateDisplay, taxAmount })
    const view = mountDetail(async () => detail)
    try {
      await view.exposed.open('SPU_001')
      await flushProductList()
      const columns = view.components('ElTableColumn')
      assert.equal(columns.find((column) => column.props.label === '税率').text.trim(), rateText)
      assert.equal(columns.find((column) => column.props.label === '税额(元)').text.trim(), amountText)
    } finally {
      view.unmount()
    }
  })
}

test('供应商优先展示名称，缺少名称时展示编码，缺失数据时展示占位', () => {
  const view = mountDetail()
  try {
    const format = view.state.formatSuppliers
    assert.equal(format([{ supplierName: '供应商甲' }, { supplierCode: 'SUP_002' }]), '供应商甲、SUP_002')
    assert.equal(format(undefined), '—')
    assert.equal(format([]), '—')
    assert.equal(format([{}]), '—')
  } finally {
    view.unmount()
  }
})

for (const [totalInventory, skuInventory, expected] of [
  [0, 5, '0'],
  [undefined, 5, '5'],
  [undefined, undefined, '0']
]) {
  test(`总库存${totalInventory}、SKU库存${skuInventory}显示为${expected}`, async () => {
    const detail = createDetail()
    Object.assign(detail.skus[0], { totalInventory, skuInventory })
    const view = mountDetail(async () => detail)
    try {
      await view.exposed.open('SPU_001')
      await flushProductList()
      const column = view.components('ElTableColumn').find((column) => column.props.label === '总库存')
      assert.equal(column.text.trim(), expected)
    } finally {
      view.unmount()
    }
  })
}

test('建议价区分市场价、固定金额与自定义公式，不把缺失规则显示成零元', () => {
  const view = mountDetail()
  try {
    const format = (rule) => view.state.formatSuggestedSalePrice({ suggestedSalePriceRule: rule })
    for (const [rule, expected] of [
      [undefined, '-'],
      [{ mode: 'MARKET' }, '市场价'],
      [{ mode: 'EQUAL_MARKET_PRICE', base: null, percentage: null, operator: null, operand: null }, '市场价'],
      [{ mode: 'DIRECT_MARKET_PRICE' }, '市场价'],
      [{ mode: 'FIXED', fixedPriceCents: 1990 }, '19.90元'],
      [{ mode: 'FIXED', fixedPriceCents: 0 }, '0.00元'],
      [{ mode: 'FIXED' }, '-'],
      [{ mode: 'CUSTOM' }, '-'],
      [{ mode: 'CUSTOM', base: 'SUGGESTED_SALE_PRICE', percentage: 100, operator: 'SUBTRACT', operand: 2 }, '销售建议价*100%-2元'],
      [{ mode: 'CUSTOM', base: 'SUPPLY_PRICE', percentage: 90, operator: 'MULTIPLY', operand: 2 }, '供应价*90%*2元'],
      [{ mode: 'CUSTOM', base: 'MARKET_PRICE', percentage: 100, operator: 'DIVIDE', operand: 2 }, '市场价*100%/2元']
    ]) {
      assert.equal(format(rule), expected)
    }
  } finally {
    view.unmount()
  }
})

test('详情图兼容数组、JSON数组及逗号分隔地址', () => {
  const view = mountDetail()
  try {
    const normalize = view.state.skuDetailPics
    assert.deepEqual(normalize(['/a.png', '', '/b.png']), ['/a.png', '/b.png'])
    assert.deepEqual(normalize('["/a.png", "/b.png"]'), ['/a.png', '/b.png'])
    assert.deepEqual(normalize('/a.png, /b.png'), ['/a.png', '/b.png'])
    assert.deepEqual(normalize(undefined), [])
  } finally {
    view.unmount()
  }
})

test('编辑沿用SPU编码，保存后可刷新详情，关闭时不额外请求', async () => {
  const edits = []
  let calls = 0
  const view = mountDetail(async () => {
    calls++
    return { ...createDetail(), spuName: `商品${calls}` }
  }, { onEdit: (code) => edits.push(code) })
  try {
    await view.exposed.open('SPU_001')
    await flushProductList()
    view.allButtons().find((button) => button.text.includes('编辑')).props.onClick()
    assert.deepEqual(edits, ['SPU_001'])
    await view.exposed.reload()
    await flushProductList()
    assert.ok(view.text().includes('商品2'))
    view.state.drawerVisible = false
    await view.exposed.reload()
    assert.equal(calls, 2)
  } finally {
    view.unmount()
  }
})

test('切换商品加载失败时清除旧详情并禁用编辑，不误操作上一个商品', async () => {
  let calls = 0
  const view = mountDetail(async () => {
    if (++calls === 1) return createDetail()
    throw new Error('加载失败')
  })
  try {
    await view.exposed.open('SPU_001')
    await assert.rejects(view.exposed.open('SPU_002'), /加载失败/)
    await flushProductList()
    assert.equal(view.state.loading, false)
    assert.equal(view.state.detail.spuCode, undefined)
    assert.equal(view.state.skuRows.length, 0)
    assert.equal(view.allButtons().find((button) => button.text.includes('编辑')).props.disabled, true)
    assert.ok(!view.text().includes('爱奇艺会员'))
  } finally {
    view.unmount()
  }
})

for (const [price, expected] of [[null, '暂无有效供货价'], [0, '0.00']]) {
  test(`供应价 ${price} 正确区分缺失和零价，实体配送不勾选无需物流`, async () => {
    const detail = createDetail()
    detail.deliveryType = 'PHYSICAL'
    detail.skus[0].supplyPrice = price
    const view = mountDetail(async () => detail)
    try {
      await view.exposed.open('SPU_001')
      await flushProductList()
      assert.ok(view.text().includes(expected))
      assert.equal(view.components('ElCheckbox')[0].props['model-value'], false)
    } finally {
      view.unmount()
    }
  })
}
