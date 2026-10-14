import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import * as vue from 'vue'
import { parse, compileScript } from 'vue/compiler-sfc'

const require = createRequire(import.meta.url)
const { renderToString } = createRequire(require.resolve('vue'))('@vue/server-renderer')

/** 执行真实 API 映射，HTTP 替身分别返回 order-views 摘要与 supplier-orders 完整尝试。 */
function orderApi(view) {
  const exports = {}
  const js = ts.transpileModule(fs.readFileSync('src/api/order/index.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText
  vm.runInNewContext(js, {
    exports,
    require: (name) => {
      if (name === '@/config/axios')
        return {
          get: async ({ url }) =>
            url === '/supply-chain/order-views' ? { list: [view], total: 1 } : view
        }
      if (name === './mock' || name === './asset-valid-time') return {}
      return require(name)
    }
  })
  return exports.OrderApi
}

const view = {
  orderNo: 'PLATFORM_A',
  distributorOrderNo: 'BUYER_A',
  bizType: 'VIRTUAL_CARD',
  status: 'SUCCESS',
  supplierOrders: [
    { supplierOrderNo: 'BO_FIRST', supplierName: '供应商甲', status: 'FAILED' },
    { supplierOrderNo: 'BO_SECOND', supplierName: '供应商乙', status: 'FINISHED' }
  ]
}

for (const operation of ['list', 'detail']) {
  test(`平台${operation}保留摘要中的全部供应商编号及顺序`, async () => {
    const api = orderApi(view)
    const order =
      operation === 'list' ? (await api.getOrderPage({})).list[0] : await api.getOrder('PLATFORM_A')
    assert.equal(
      order.supplierOrders.map((row) => row.supplierOrderNo).join(','),
      'BO_FIRST,BO_SECOND'
    )
    assert.equal(order.supplierOrderNo, 'BO_FIRST')
  })

  test(`平台${operation}使用总单的分销商编号而不是供应商尝试字段`, async () => {
    const api = orderApi(view)
    const order =
      operation === 'list' ? (await api.getOrderPage({})).list[0] : await api.getOrder('PLATFORM_A')
    assert.equal(order.distributorOrderNo, 'BUYER_A')
  })
}

test('没有供应商尝试仍返回分销商编号；历史缺号不以平台号兜底', async () => {
  const api = orderApi({ ...view, supplierOrders: [] })
  const order = (await api.getOrderPage({})).list[0]
  assert.equal(order.distributorOrderNo, 'BUYER_A')
  assert.equal(order.supplierOrders.length, 0)
  assert.equal(order.supplierOrderNo, undefined)
  const legacy = await orderApi({ orderNo: 'PLATFORM_LEGACY' }).getOrder('PLATFORM_LEGACY')
  assert.ok(!legacy.distributorOrderNo)
  assert.equal(legacy.supplierOrders.length, 0)
})

test('供应商工作台仍以完整尝试的 bOrderNo 为身份，不用供应商外部编号替换', async () => {
  const order = await orderApi({
    bOrderNo: 'BO_ATTEMPT',
    externalOrderNo: 'EXTERNAL_SUPPLIER',
    billno: 'OUTBOUND_REQUEST',
    orderNo: 'PLATFORM_A'
  }).getSupplierOrder('BO_ATTEMPT')
  assert.equal(order.orderNo, 'BO_ATTEMPT')
  assert.equal(order.supplierOrderNo, 'BO_ATTEMPT')
  assert.equal(order.relatedPlatformOrderNo, 'PLATFORM_A')
})

test('订单映射分别保留冻结供应价、基础价、专属价与最终价，金额只换算一次', async () => {
  const order = await orderApi({
    ...view,
    distributorPayAmount: 2250,
    projectPayAmount: 2250,
    items: [{ qty: 5, supplyPrice: 1800, baseDistPrice: 2500, projectPrice: 2250, distPrice: 2250 }]
  }).getOrder('PLATFORM_A')
  assert.equal(order.projectPayAmount, 22.5)
  assert.equal(order.distributorPayAmount, 22.5)
  assert.equal(order.items[0].supplyPrice, 18)
  assert.equal(order.items[0].baseDistPrice, 25)
  assert.equal(order.items[0].projectPrice, 22.5)
  assert.equal(order.items[0].distPrice, 22.5)
})

test('新增价格字段缺失保持未知；显式零价不丢失也不按最终价补造专属价', async () => {
  const legacy = await orderApi({ ...view, items: [{ qty: 1, distPrice: 2250 }] }).getOrder(
    'PLATFORM_A'
  )
  assert.equal(legacy.items[0].supplyPrice, undefined)
  assert.equal(legacy.items[0].baseDistPrice, undefined)
  assert.equal(legacy.items[0].projectPrice, undefined)
  const zero = await orderApi({
    ...view,
    projectPayAmount: 0,
    distributorPayAmount: 0,
    items: [{ qty: 1, supplyPrice: 0, baseDistPrice: 2500, projectPrice: 0, distPrice: 0 }]
  }).getOrder('PLATFORM_A')
  assert.equal(zero.items[0].supplyPrice, 0)
  assert.equal(zero.items[0].projectPrice, 0)
  assert.equal(zero.projectPayAmount, 0)
})

/** 执行真实详情 SFC 的公开 open()；仅隔离 HTTP 与 Element Plus 壳，断言用户可见结果。 */
async function renderDetail(order) {
  const { descriptor } = parse(
    fs.readFileSync('src/views/supplier/order/platform/detail/index.vue', 'utf8')
  )
  const script = compileScript(descriptor, { id: 'order-detail', inlineTemplate: true })
  const exports = {}
  const constants = {}
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('src/views/supplier/order/utils/constants.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS }
    }).outputText,
    { exports: constants }
  )
  vm.runInNewContext(
    ts.transpileModule(script.content, { compilerOptions: { module: ts.ModuleKind.CommonJS } })
      .outputText,
    {
      exports,
      ref: vue.ref,
      computed: vue.computed,
      watch: vue.watch,
      useMessage: () => ({ success() {} }),
      require: (name) => {
        if (name === '@/api/order') return { OrderApi: { getOrder: async () => order } }
        if (name.endsWith('/constants')) return constants
        if (name.endsWith('.vue')) return { __esModule: true, default: { render: () => null } }
        return require(name)
      }
    }
  )
  const app = vue.createSSRApp({
    async setup(props, context) {
      let exposed
      const render = exports.default.setup(props, {
        ...context,
        expose: (value) => (exposed = value)
      })
      exposed.open(order.orderNo)
      await vue.nextTick()
      return render
    }
  })
  for (const name of [
    'ElDrawer',
    'ElDescriptions',
    'ElTag',
    'ElButton',
    'ElTimeline',
    'ElTimelineItem',
    'ElImage',
    'ElAlert'
  ])
    app.component(name, {
      setup:
        (_, { slots }) =>
        () =>
          vue.h('div', slots.default?.())
    })
  app.component('ElDescriptionsItem', {
    setup:
      (_, { slots, attrs }) =>
      () =>
        vue.h('div', [attrs.label, slots.default?.()])
  })
  app.component('ElTable', {
    setup(_, { slots, attrs }) {
      vue.provide('rows', attrs.data)
      return () => vue.h('div', slots.default?.())
    }
  })
  app.component('ElTableColumn', {
    setup(_, { slots, attrs }) {
      const rows = vue.inject('rows')
      return () =>
        vue.h('div', [
          attrs.label,
          ...rows.map((row) => slots.default?.({ row }) || row[attrs.prop])
        ])
    }
  })
  app.component('ElEmpty', { render: () => null })
  app.directive('loading', {})
  return (await renderToString(app)).replace(/<[^>]*>/g, '')
}

for (const [label, projectPrice, supplyPrice, payAmount, expectedPrice, expectedAmount] of [
  ['专属价', 22.5, 18, 22.5, '¥22.50', '22.50元'],
  ['继承价', undefined, 18, 25, '—', '25.00元'],
  ['真实零价', 0, 0, 0, '¥0.00', '0.00元'],
  ['历史缺值', undefined, undefined, undefined, '—', '—']
]) {
  test(`真实订单详情展示${label}，不展示用户金额和虚构运费公式`, async () => {
    const html = await renderDetail({
      ...view,
      projectPayAmount: payAmount,
      distributorPayAmount: payAmount,
      items: [{ name: '测试商品', qty: 1, baseDistPrice: 25, projectPrice, supplyPrice }]
    })
    assert.doesNotMatch(html, /用户支付金额|商品金额：|运费：/)
    assert.match(html, /用户支付方式/)
    assert.match(html, /支付流水号/)
    assert.ok(html.includes(`项目支付金额${expectedAmount}`))
    assert.ok(html.includes(`分销商支付金额${expectedAmount}`))
    assert.ok(html.includes(`项目专属价（元）${expectedPrice}`))
    assert.ok(
      html.includes(`供应价（元）${supplyPrice == null ? '—' : `¥${supplyPrice.toFixed(2)}`}`)
    )
    assert.ok(html.includes('基础分销价（元）¥25.00'))
    assert.match(html, /BUYER_A/)
    assert.match(html, /BO_FIRST/)
    assert.match(html, /BO_SECOND/)
  })
}
