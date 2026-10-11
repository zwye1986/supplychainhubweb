import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

const pageUrl = '/supply-chain/products/management-page'
const batchUrl = '/supply-chain/products/batch-status'
function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
function boundary(reply) {
  const writes = [], reads = []
  let readError
  let refreshPromise
  return {
    writes, reads, failRefresh: error => { readError = error },
    waitRefresh: promise => { refreshPromise = promise },
    get: async request => {
      reads.push(request)
      if (request.url === pageUrl) {
        if (readError) throw readError
        if (refreshPromise) return refreshPromise
        return { list: [], total: 0 }
      }
      return []
    },
    put: async request => { writes.push(request); return typeof reply === 'function' ? reply(request) : reply }
  }
}
const codes = count => Array.from({ length: count }, (_, i) => `SPU_${i + 1}`)
const synced = (succeeded, failed = []) => ({ syncSkuOnShelf: true, succeeded, failed: failed.map(item => ({ ...item, failedEntityType: 'SPU', failedEntityCode: item.code })), groups: [...succeeded.map(spuCode => ({ spuCode, skuCodes: [`SKU_${spuCode}`], succeeded: true })), ...failed.map(item => ({ spuCode: item.code, skuCodes: [], succeeded: false, failedEntityType: 'SPU', failedEntityCode: item.code }))] })
const failure = (code, errorMessage = '商品类型未启用') => ({ entityType: 'SPU', code, errorCode: 1050001082, errorMessage })
async function mount(reply, selection = ['SPU_1'], confirm) {
  const http = boundary(reply)
  const view = mountProductList(http, confirm)
  await flushProductList()
  view.state.handleSelectionChange(selection.map(spuCode => ({ spuCode, skuCode: `SKU_${spuCode}` })))
  await flushProductList()
  return { http, view }
}
function assertSingleWrite(http) {
  assert.equal(http.writes.length, 1, '禁止因批量异常自动重发状态写请求')
  assert.equal(http.writes[0].url, batchUrl)
}
function assertRefreshed(http) { assert.equal(http.reads.filter(item => item.url === pageUrl).length, 2) }

for (const reply of [true, false]) {
  test(`Boolean ${reply} 回执受控提示契约不兼容并刷新`, async () => {
    const { http, view } = await mount(reply)
    try {
      await assert.doesNotReject(view.state.handleBatchStatus(10))
      assertSingleWrite(http); assertRefreshed(http)
      assert.ok(view.messages.some(item => item.type === 'error' && item.text.includes('契约') && item.text.includes('核对')))
    } finally { view.unmount() }
  })
}
for (const [name, reason] of [
  ['DO_NOT_RETRY 业务拒绝', { code: 1050001169, retryDirective: 'DO_NOT_RETRY', message: '批量入参不合法' }],
  ['鉴权', { code: 401, message: '未登录' }], ['网络', new Error('Network Error')],
  ['网关', { response: { status: 502 }, message: 'Bad Gateway' }], ['系统异常', { code: 500, message: '连接池耗尽' }]
]) {
  test(`${name} 不自动重发写请求且刷新`, async () => {
    const { http, view } = await mount(() => Promise.reject(reason), ['SPU_1', 'SPU_2'])
    try {
      await view.state.handleBatchStatus(20)
      assertSingleWrite(http); assertRefreshed(http)
      assert.equal(view.state.batchStatusBusy, false)
      assert.ok(view.messages.some(item => item.text.includes('核对')))
    } finally { view.unmount() }
  })
}
test('确认在途两按钮禁用并加载，重复点击只确认一次且冻结选中编码', async () => {
  const confirmation = deferred()
  const { http, view } = await mount(synced(['SPU_1']), ['SPU_1'], () => confirmation.promise)
  try {
    const first = view.buttons()[0].props.onClick()
    const duplicate = view.buttons()[1].props.onClick()
    await flushProductList()
    const confirmCount = view.confirmations.length
    const disabled = view.buttons().map(item => item.props.disabled)
    const loading = view.buttons().map(item => item.props.loading)
    view.state.handleSelectionChange([{ spuCode: 'SPU_CHANGED' }])
    confirmation.resolve()
    await Promise.all([first, duplicate]); await flushProductList()
    assert.equal(confirmCount, 1)
    assert.deepEqual(disabled, [true, true])
    assert.deepEqual(loading, [true, true])
    assertSingleWrite(http)
    assert.deepEqual(http.writes[0].data, { spuCodes: ['SPU_1'], skuCodes: [], targetStatus: 10, unshelveMode: undefined, syncSkuOnShelf: true })
    assert.equal(view.state.batchStatusBusy, false)
  } finally { view.unmount() }
})
test('写请求在途两按钮禁用并加载，重复点击只发一次', async () => {
  const write = deferred()
  const { http, view } = await mount(() => write.promise)
  try {
    const first = view.buttons()[0].props.onClick(); await flushProductList()
    const duplicate = view.buttons()[1].props.onClick(); await flushProductList()
    const disabled = view.buttons().map(item => item.props.disabled)
    const loading = view.buttons().map(item => item.props.loading)
    write.resolve(synced(['SPU_1']))
    await Promise.all([first, duplicate])
    assertSingleWrite(http); assert.deepEqual(disabled, [true, true])
    assert.deepEqual(loading, [true, true])
    assert.equal(view.confirmations.length, 1)
  } finally { view.unmount() }
})
test('读刷新在途两按钮禁用并加载，重复点击不再确认或写入，完成后解除反馈', async () => {
  const refresh = deferred()
  const { http, view } = await mount(synced(['SPU_1']))
  try {
    http.waitRefresh(refresh.promise)
    const first = view.buttons()[0].props.onClick(); await flushProductList()
    const disabled = view.buttons().map(item => item.props.disabled)
    const loading = view.buttons().map(item => item.props.loading)
    const listLoading = view.state.loading
    const duplicate = view.buttons()[1].props.onClick(); await flushProductList()
    refresh.resolve({ list: [], total: 0 })
    await Promise.all([first, duplicate]); await flushProductList()
    assert.deepEqual(disabled, [true, true])
    assert.deepEqual(loading, [true, true])
    assert.equal(listLoading, true)
    assertSingleWrite(http); assertRefreshed(http)
    assert.equal(view.confirmations.length, 1)
    assert.equal(view.state.batchStatusBusy, false)
    assert.equal(view.state.loading, false)
    assert.deepEqual(view.buttons().map(item => item.props.disabled), [false, false])
    assert.deepEqual(view.buttons().map(item => item.props.loading), [false, false])
  } finally { view.unmount() }
})
test('201 个 SPU 在确认和请求之前拒绝', async () => {
  const { http, view } = await mount({ succeeded: codes(201), failed: [] }, codes(201))
  try {
    await view.state.handleBatchStatus(20)
    assert.equal(http.writes.length, 0); assert.equal(view.confirmations.length, 0)
    assert.ok(view.messages.some(item => item.text.includes('200')))
  } finally { view.unmount() }
})
test('21 个失败项完整可见且原因按文本渲染', async () => {
  const requested = codes(21)
  const { http, view } = await mount({ succeeded: [], failed: requested.map(code => failure(code, `<img src=x onerror=alert(1)>-${code}`)) }, requested)
  try {
    await view.state.handleBatchStatus(20); await flushProductList()
    assertSingleWrite(http)
    const rendered = view.text()
    for (const code of requested) assert.ok(rendered.includes(`${code}：`), `缺少失败项 ${code}`)
    assert.ok(rendered.includes('1050001082')); assert.ok(rendered.includes('<img src=x onerror=alert(1)>'))
    assert.ok(rendered.includes('成功 0 项，失败 21 项'))
    assert.equal(view.state.batchStatusResultVisible, true)
    let scrollable = false
    const inspect = node => {
      if (node.props?.['aria-label'] === '批量上下架全部失败明细') {
        scrollable = node.props.class.includes('overflow-y-auto') && node.props.class.includes('max-h-400px')
      }
      assert.notEqual(node.tag, 'img'); assert.equal(node.props?.innerHTML, undefined)
      for (const child of node.children || []) inspect(child)
    }
    inspect(view.container)
    assert.ok(scrollable, '全部失败明细容器须可滚动')
  } finally { view.unmount() }
})

for (const action of ['cancel', 'close']) {
  test(`确认 ${action} 是预期流程，解除busy并允许下一次操作`, async () => {
    let cancelled = true
    const { http, view } = await mount(synced(['SPU_1']), ['SPU_1'], () => cancelled ? Promise.reject(action) : Promise.resolve())
    try {
      await view.state.handleBatchStatus(10)
      assert.equal(view.state.batchStatusBusy, false)
      assert.equal(http.writes.length, 0); assert.equal(view.messages.length, 0)
      cancelled = false; await view.state.handleBatchStatus(10)
      assertSingleWrite(http)
    } finally { view.unmount() }
  })
}
test('空选不开确认或写请求', async () => {
  const { http, view } = await mount(true, [])
  try {
    await view.state.handleBatchStatus(10)
    assert.equal(http.writes.length, 0); assert.equal(view.confirmations.length, 0)
    assert.ok(view.messages.some(item => item.type === 'warning' && item.text.includes('请选择')))
  } finally { view.unmount() }
})
test('200 项合法边界且同 SPU 多个 SKU 行只写一次 SPU', async () => {
  const requested = codes(200)
  const { http, view } = await mount({ succeeded: requested, failed: [] }, [...requested, 'SPU_1'])
  try {
    await view.state.handleBatchStatus(20)
    assertSingleWrite(http); assert.equal(http.writes[0].data.spuCodes.length, 200)
    assert.deepEqual(http.writes[0].data.skuCodes, [])
    assert.ok(view.messages.some(item => item.type === 'success' && item.text.includes('200')))
  } finally { view.unmount() }
})
for (const [name, reply, type, succeeded, failed] of [
  ['全成功', { succeeded: ['SPU_1', 'SPU_2'], failed: [] }, 'success', 2, 0],
  ['部分成功', { succeeded: ['SPU_1'], failed: [failure('SPU_2')] }, 'warning', 1, 1],
  ['全失败', { succeeded: [], failed: [failure('SPU_1'), failure('SPU_2')] }, 'error', 0, 2]
]) {
  test(`合法${name}准确展示计数与失败项`, async () => {
    const { http, view } = await mount(synced(reply.succeeded, reply.failed), ['SPU_1', 'SPU_2'])
    try {
      await view.state.handleBatchStatus(10); await flushProductList()
      assertSingleWrite(http); assertRefreshed(http)
      assert.ok(view.messages.some(item => item.type === type))
      assert.ok(view.text().includes(`成功 ${succeeded} 个商品组`)); assert.ok(view.text().includes(`失败 ${failed} 个商品组`))
      for (const item of reply.failed) assert.ok(view.text().includes(`${item.code}：${item.errorMessage}`))
      assert.equal(view.state.batchStatusBusy, false)
    } finally { view.unmount() }
  })
}
for (const [name, reply] of [
  ['null', null], ['undefined', undefined], ['空对象', {}], ['数组', []],
  ['成功非数组', { succeeded: true, failed: [] }], ['失败非数组', { succeeded: [], failed: {} }],
  ['非字符串成功编码', { succeeded: [1, 'SPU_2'], failed: [] }],
  ['未知成功编码', { succeeded: ['OTHER', 'SPU_2'], failed: [] }],
  ['未知失败编码', { succeeded: ['SPU_1'], failed: [failure('OTHER')] }],
  ['重复成功编码', { succeeded: ['SPU_1', 'SPU_1'], failed: [] }],
  ['重复失败编码', { succeeded: [], failed: [failure('SPU_1'), failure('SPU_1')] }],
  ['成功失败交叉重复', { succeeded: ['SPU_1'], failed: [failure('SPU_1')] }],
  ['缺项', { succeeded: ['SPU_1'], failed: [] }],
  ['失败实体SKU', { succeeded: ['SPU_1'], failed: [{ ...failure('SPU_2'), entityType: 'SKU' }] }],
  ['失败项为空', { succeeded: ['SPU_1'], failed: [null] }],
  ['失败编码非字符串', { succeeded: ['SPU_1'], failed: [failure(2)] }],
  ['错误码字符串', { succeeded: ['SPU_1'], failed: [{ ...failure('SPU_2'), errorCode: '1050001082' }] }],
  ['错误码非整数', { succeeded: ['SPU_1'], failed: [{ ...failure('SPU_2'), errorCode: 1.5 }] }],
  ['错误码无穷', { succeeded: ['SPU_1'], failed: [{ ...failure('SPU_2'), errorCode: Infinity }] }],
  ['错误原因非字符串', { succeeded: ['SPU_1'], failed: [{ ...failure('SPU_2'), errorMessage: {} }] }]
]) {
  test(`${name}非法回执受控报告且不伪造结果`, async () => {
    const { http, view } = await mount(reply, ['SPU_1', 'SPU_2'])
    try {
      await assert.doesNotReject(view.state.handleBatchStatus(10)); await flushProductList()
      assertSingleWrite(http); assertRefreshed(http)
      assert.ok(view.messages.some(item => item.type === 'error' && item.text.includes('契约') && item.text.includes('核对')))
      assert.ok(!view.text().includes('成功 1 项'))
      assert.equal(view.state.batchStatusBusy, false)
    } finally { view.unmount() }
  })
}
for (const [name, reply, countText] of [
  ['合法回执', { succeeded: ['SPU_1'], failed: [failure('SPU_2')] }, '成功 1 项，失败 1 项'],
  ['Boolean回执', true, null], ['系统异常', () => Promise.reject(new Error('storage failed')), null]
]) {
  test(`${name}后刷新失败单独反馈且保留写结果`, async () => {
    const { http, view } = await mount(reply, ['SPU_1', 'SPU_2'])
    try {
      http.failRefresh(new Error('read failed'))
      await assert.doesNotReject(view.state.handleBatchStatus(20)); await flushProductList()
      assertSingleWrite(http); assertRefreshed(http)
      assert.ok(view.messages.some(item => item.text.includes('刷新失败')))
      if (countText) {
        assert.ok(view.text().includes(countText)); assert.ok(view.text().includes('SPU_2：商品类型未启用'))
        assert.ok(view.messages.some(item => item.type === 'warning' && item.text.includes(countText)))
      } else assert.ok(view.messages.some(item => item.text.includes('核对')))
      assert.equal(view.state.batchStatusBusy, false); assert.equal(view.state.loading, false)
    } finally { view.unmount() }
  })
}
test('确认组件异常单独反馈且解除busy，不写不刷新', async () => {
  const { http, view } = await mount(true, ['SPU_1'], () => Promise.reject(new Error('dialog failed')))
  try {
    await view.state.handleBatchStatus(10)
    assert.equal(http.writes.length, 0)
    assert.equal(http.reads.filter(item => item.url === pageUrl).length, 1)
    assert.equal(view.state.batchStatusBusy, false)
    assert.ok(view.messages.some(item => item.type === 'error' && item.text.includes('确认')))
  } finally { view.unmount() }
})
