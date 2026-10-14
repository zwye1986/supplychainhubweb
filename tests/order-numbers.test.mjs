import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)

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
