import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

/** 真实合作商品SFC/API交互：Offer状态决定上下架，发布诊断只阻断发布。 */
async function mountOffer(overrides = {}, requestError) {
  const reads = []
  const writes = []
  const offer = {
    offerNo: 'OF_1',
    platformSkuCode: 'SKU_1',
    platformSkuName: '卡券测试',
    priceMode: 'FIXED',
    unitPriceCents: 9500,
    suggestedSalePriceCents: 9600,
    fulfillmentStatus: 'NOT_CONFIGURED',
    ...overrides
  }
  const view = mountProductList(
    {
      get: async (request) => {
        reads.push(request)
        return request.url.endsWith('/offers') ? { list: [offer], total: 1 } : []
      },
      patch: async (request) => {
        writes.push(request)
        if (requestError) throw requestError
        return true
      },
      post: async (request) => {
        writes.push(request)
        if (requestError) throw requestError
        return {}
      }
    },
    undefined,
    {
      props: { supplierCode: 'SPL_004' },
      entryFile: 'views/supplier/manage/detail/ProductList.vue'
    }
  )
  await flushProductList()
  return { view, reads, writes }
}
const button = (view, label) => view.allButtons().find((item) => item.text.trim() === label)

test('已上架且未配置行显示下架与发布变更，下架PATCH一次并刷新', async () => {
  const { view, reads, writes } = await mountOffer({
    status: 'PUBLISHED',
    canPublish: false,
    publishBlockedReason: '供应商未配置已发布连接器'
  })
  try {
    assert.ok(button(view, '下架'))
    assert.equal(button(view, '上架'), undefined)
    assert.equal(button(view, '发布变更')?.props.disabled, true)
    assert.ok(
      view.components('ElTooltip').some((item) => item.props.content === '供应商未配置已发布连接器')
    )
    await button(view, '下架').props.onClick()
    await flushProductList()
    assert.deepEqual(writes, [
      { url: '/supply-chain/suppliers/SPL_004/offers/OF_1', data: { status: 'SUSPENDED' } }
    ])
    assert.equal(reads.filter((item) => item.url.endsWith('/offers')).length, 2)
  } finally {
    view.unmount()
  }
})
test('下架行上架走正式发布，资格false时按钮禁用且方法不发请求', async () => {
  const { view, writes } = await mountOffer({ status: 'SUSPENDED', canPublish: false })
  try {
    assert.equal(button(view, '上架')?.props.disabled, true)
    assert.equal(button(view, '下架'), undefined)
    await view.state.handleListOnShelf(view.state.list[0])
    assert.equal(writes.length, 0)
  } finally {
    view.unmount()
  }
})
for (const [status, label] of [
  ['SUSPENDED', '上架'],
  ['PUBLISHED', '发布变更']
])
  test(`${status}的${label}调用POST并刷新`, async () => {
    const { view, reads, writes } = await mountOffer({
      status,
      canPublish: true,
      fulfillmentStatus: 'READY'
    })
    try {
      assert.ok(button(view, label))
      await button(view, label).props.onClick()
      await flushProductList()
      assert.deepEqual(writes, [
        { url: '/supply-chain/suppliers/SPL_004/offers/OF_1/list-on-shelf', data: {} }
      ])
      assert.equal(reads.filter((item) => item.url.endsWith('/offers')).length, 2)
    } finally {
      view.unmount()
    }
  })
test('缺失生命周期状态没有上架或下架按钮', async () => {
  const { view } = await mountOffer({ canPublish: true })
  try {
    assert.equal(button(view, '上架'), undefined)
    assert.equal(button(view, '下架'), undefined)
    assert.equal(button(view, '发布变更'), undefined)
  } finally {
    view.unmount()
  }
})
test('后端拒绝由请求拦截器提示，组件不重复错误toast、不报告成功', async () => {
  const { view, writes } = await mountOffer(
    { status: 'SUSPENDED', canPublish: true },
    new Error('供应商已暂停')
  )
  try {
    await view.state.handleListOnShelf(view.state.list[0])
    await flushProductList()
    assert.equal(writes.length, 1)
    assert.equal(
      view.messages.filter((item) => item.type === 'error' || item.type === 'success').length,
      0
    )
  } finally {
    view.unmount()
  }
})
