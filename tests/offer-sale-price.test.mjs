import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

/** 执行真实 Vue SFC setup、模板及 SupplierApi/ProductApi，仅隔离 HTTP 和 UI 壳。
 * 契约：后端 docs/superpowers/specs/2026-10-11-supplier-offer-sale-price-alignment-design.md#5-前端展示与写入。
 */
const supplierCode = 'SPL_004'
const row = (overrides = {}) => ({
  offerNo: 'OFR_011',
  platformSkuCode: 'SKU_011_001',
  platformSkuName: '优惠卡券测试',
  platformSpuCode: 'SPU_011',
  platformSpuName: '卡券测试',
  priceMode: 'FIXED',
  suggestedSalePriceCents: 9600,
  suggestPriceCents: null,
  unitPriceCents: 9500,
  offerSupplyMode: 'API_DIRECT',
  externalSkuCode: '22',
  ...overrides
})
async function mountOffers(offer) {
  const writes = []
  const view = mountProductList(
    {
      get: async (request) => (request.url.endsWith('/offers') ? { list: [offer], total: 1 } : []),
      put: async (request) => {
        writes.push(request)
        return true
      }
    },
    undefined,
    { props: { supplierCode }, entryFile: 'views/supplier/manage/detail/ProductList.vue' }
  )
  await flushProductList()
  return { view, writes }
}
const column = (view, label) =>
  view.components('ElTableColumn').find((item) => item.props.label === label)
test('真实合作列表无L1仍显示SKU建议价96.00，固定供应价保持95.00并说明冻结价执行', async () => {
  const { view } = await mountOffers(row())
  try {
    assert.equal(column(view, '销售建议价（元）').text.trim(), '96.00')
    assert.ok(column(view, '供应价（元）').text.includes('95.00'))
    assert.ok(
      view
        .components('ElTooltip')
        .some((item) => item.props.content === '按当前商业条款展示；已发布履约版本按冻结价执行')
    )
  } finally {
    view.unmount()
  }
})
for (const value of [undefined, null, 0])
  test(`建议价${value}严格展示、不回退旧L1，折扣供应价不能以非正建议价试算`, async () => {
    const offer = row({
      suggestedSalePriceCents: value,
      suggestPriceCents: 8000,
      priceMode: 'DISCOUNT',
      discountBp: 9000
    })
    if (value === undefined) delete offer.suggestedSalePriceCents
    const { view } = await mountOffers(offer)
    try {
      assert.equal(column(view, '销售建议价（元）').text.trim(), value === 0 ? '0.00' : '-')
      assert.ok(column(view, '供应价（元）').text.trim().endsWith('-'))
      view.state.openEdit(offer)
      assert.equal(view.state.priceForm.suggestedPriceCents, value)
    } finally {
      view.unmount()
    }
  })
test('折扣条款按SKU96元试算90%为86.40，不取旧L1的80元', async () => {
  const { view } = await mountOffers(
    row({
      suggestedSalePriceCents: 9600,
      suggestPriceCents: 8000,
      priceMode: 'DISCOUNT',
      discountBp: 9000
    })
  )
  try {
    assert.ok(column(view, '供应价（元）').text.includes('86.40'))
  } finally {
    view.unmount()
  }
})
test('无L1的SKU可通过真实改价API切换折扣，提示价传SKU价且固定价不随折扣提交', async () => {
  const offer = row()
  const { view, writes } = await mountOffers(offer)
  try {
    view.state.openEdit(offer)
    view.state.priceForm.priceMode = 'DISCOUNT'
    view.state.priceForm.discountPercent = 90
    await view.state.submitPrice()
    assert.equal(writes.length, 1)
    assert.equal(writes[0].url, '/supply-chain/suppliers/SPL_004/offers/OFR_011')
    assert.equal(writes[0].data.suggestedPriceCents, 9600)
    assert.equal(writes[0].data.discountBp, 9000)
    assert.equal(Object.hasOwn(writes[0].data, 'unitPriceCents'), false)
  } finally {
    view.unmount()
  }
})
for (const value of [undefined, null, 0, -1])
  test(`改价折扣建议价${value}明确提示并阻止HTTP写入`, async () => {
    const offer = row({ suggestedSalePriceCents: value, suggestPriceCents: 8000 })
    const { view, writes } = await mountOffers(offer)
    try {
      view.state.openEdit(offer)
      view.state.priceForm.priceMode = 'DISCOUNT'
      view.state.priceForm.discountPercent = 90
      await view.state.submitPrice()
      assert.equal(writes.length, 0)
      assert.ok(
        view.messages.some(
          (item) => item.type === 'warning' && item.text.includes('销售建议价大于0')
        )
      )
    } finally {
      view.unmount()
    }
  })
for (const value of [undefined, 0])
  test(`固定价改价允许SKU建议价${value}，保持9500分`, async () => {
    const offer = row({ suggestedSalePriceCents: value })
    const { view, writes } = await mountOffers(offer)
    try {
      view.state.openEdit(offer)
      await view.state.submitPrice()
      assert.equal(writes.length, 1)
      assert.equal(writes[0].data.unitPriceCents, 9500)
      assert.equal(writes[0].data.suggestedPriceCents, value)
    } finally {
      view.unmount()
    }
  })

async function mountSelection(suggestedSalePrice) {
  const writes = []
  const spu = {
    spuCode: 'SPU_011',
    spuName: '卡券测试',
    skus: [
      { skuCode: 'SKU_011_001', skuName: '优惠卡券测试', marketPrice: 10000, suggestedSalePrice }
    ]
  }
  const view = mountProductList(
    {
      get: async (request) =>
        request.url.endsWith('management-page') ? { list: [spu], total: 1 } : [],
      post: async (request) => {
        writes.push(request)
        return ['OFR_011']
      }
    },
    undefined,
    { props: { supplierCode }, entryFile: 'views/supplier/manage/detail/ProductSelectDialog.vue' }
  )
  await view.state.open()
  await flushProductList()
  view.state.handleSelectionChange(view.state.skuList)
  const item = view.state.selectedList[0]
  item.externalSkuCode = '22'
  item.supplyMode = 'API_DIRECT'
  item.unitPriceCents = 9500
  return { view, writes, item }
}
test('新增选品市场价100元仍展示市场价，提交真实SKU建议价96元', async () => {
  const { view, writes, item } = await mountSelection(9600)
  try {
    assert.equal(column(view, '市场价（元）').text.trim(), '100.00')
    assert.equal(item.suggestedPriceCents, 9600)
    await view.state.handleSubmit()
    assert.equal(writes[0].url, '/supply-chain/suppliers/SPL_004/offers')
    assert.equal(writes[0].data.items[0].suggestedPriceCents, 9600)
  } finally {
    view.unmount()
  }
})
test('新增批量切换折扣/固定/实时模式及清空均保留SKU建议价，折扣提交90%', async () => {
  const { view, writes, item } = await mountSelection(9600)
  try {
    for (const priceMode of ['DISCOUNT', 'FIXED', 'REALTIME']) {
      Object.assign(view.state.batchConfig, {
        priceMode,
        priceOrDiscount: 90,
        supplyMode: 'API_DIRECT'
      })
      view.state.applyBatch()
      assert.equal(item.suggestedPriceCents, 9600)
    }
    view.state.resetBatchConfig()
    assert.equal(item.suggestedPriceCents, 9600)
    Object.assign(view.state.batchConfig, {
      priceMode: 'DISCOUNT',
      priceOrDiscount: 90,
      supplyMode: 'API_DIRECT'
    })
    view.state.applyBatch()
    await view.state.handleSubmit()
    assert.equal(writes[0].data.items[0].suggestedPriceCents, 9600)
    assert.equal(writes[0].data.items[0].discountBp, 9000)
  } finally {
    view.unmount()
  }
})
for (const value of [undefined, null, 0, -1])
  test(`新增折扣SKU建议价${value}不取市场价、阻止写入并提示`, async () => {
    const { view, writes, item } = await mountSelection(value)
    try {
      item.priceMode = 'DISCOUNT'
      item.discountBp = 9000
      await view.state.handleSubmit()
      assert.equal(writes.length, 0)
      assert.ok(
        view.messages.some(
          (message) => message.type === 'warning' && message.text.includes('销售建议价大于0')
        )
      )
    } finally {
      view.unmount()
    }
  })
for (const value of [undefined, null, 0])
  test(`新增固定价SKU建议价${value}仍可提交9500且不填市场价`, async () => {
    const { view, writes } = await mountSelection(value)
    try {
      await view.state.handleSubmit()
      assert.equal(writes.length, 1)
      assert.equal(writes[0].data.items[0].unitPriceCents, 9500)
      assert.equal(writes[0].data.items[0].suggestedPriceCents, value == null ? undefined : value)
    } finally {
      view.unmount()
    }
  })
