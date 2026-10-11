import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'
const success = () => ({ syncSkuOnShelf: true, succeeded: ['SPU_1'], failed: [], groups: [{ spuCode: 'SPU_1', skuCodes: ['SKU_1', 'SKU_HIDDEN'], succeeded: true }] })
const refused = () => ({ syncSkuOnShelf: true, succeeded: [], failed: [{ entityType: 'SPU', code: 'SPU_1', errorCode: 42, errorMessage: '<img src=x>规格校验失败', failedEntityType: 'SKU', failedEntityCode: 'SKU_1' }], groups: [{ spuCode: 'SPU_1', skuCodes: ['SKU_1'], succeeded: false, failedEntityType: 'SKU', failedEntityCode: 'SKU_1' }] })
async function mount(reply) {
  const writes = [], reads = []
  const view = mountProductList({ get: async req => { reads.push(req); return req.url.endsWith('management-page') ? { list: [], total: 0 } : [] }, put: async req => { writes.push(req); return reply } })
  await flushProductList()
  view.state.list = [{ spuCode: 'SPU_1', spuName: '商品', status: '20', skus: [{ skuCode: 'SKU_1', status: '0' }] }]
  view.state.handleSelectionChange([{ spuCode: 'SPU_1' }, { spuCode: 'SPU_1' }]); await flushProductList()
  return { view, writes, reads }
}
test('同步上架冻结去重SPU并由后端展开隐藏SKU，确认恢复主动下架规格，成功报告两层数量', async () => {
  const { view, writes } = await mount(success())
  try {
    await view.state.handleBatchStatus(10); await flushProductList()
    assert.deepEqual(writes[0].data, { spuCodes: ['SPU_1'], skuCodes: [], targetStatus: 10, unshelveMode: undefined, syncSkuOnShelf: true })
    assert.ok(view.confirmations[0].includes('全部未归档')); assert.ok(view.confirmations[0].includes('单独下架'))
    assert.ok(view.messages.some(item => item.type === 'success' && item.text.includes('1 个商品') && item.text.includes('2 个规格')))
    assert.ok(view.text().includes('成功 1 个商品组')); assert.ok(view.text().includes('2 个规格'))
  } finally { view.unmount() }
})
test('同步失败反馈具体SKU及原因，按父商品组回滚计数，文本渲染防注入', async () => {
  const { view } = await mount(refused())
  try {
    await view.state.handleBatchStatus(10); await flushProductList()
    assert.ok(view.text().includes('[SKU] SKU_1')); assert.ok(view.text().includes('SPU_1'))
    assert.ok(view.text().includes('<img src=x>规格校验失败')); assert.ok(view.text().includes('失败 1 个商品组'))
    assert.equal(view.state.batchStatusResultVisible, true)
  } finally { view.unmount() }
})
const mutations = [
  ['旧receipt', r => { delete r.syncSkuOnShelf; delete r.groups }], ['false marker', r => { r.syncSkuOnShelf = false }], ['字符串marker', r => { r.syncSkuOnShelf = 'true' }],
  ['groups缺失', r => { delete r.groups }], ['groups非数组', r => { r.groups = {} }], ['groups含非法项', r => { r.groups = [null] }], ['缺组', r => { r.groups = [] }], ['重复组', r => { r.groups.push(r.groups[0]) }],
  ['未知组', r => { r.groups[0].spuCode = 'OTHER' }], ['成功空scope', r => { r.groups[0].skuCodes = [] }], ['scope空白', r => { r.groups[0].skuCodes = ['  '] }],
  ['scope重复', r => { r.groups[0].skuCodes = ['SKU_1', 'SKU_1'] }], ['scope非数组', r => { r.groups[0].skuCodes = {} }], ['scope非字符串', r => { r.groups[0].skuCodes = [42] }],
  ['组成功与顶层不一致', r => { r.groups[0].succeeded = false }], ['组成功非布尔', r => { r.groups[0].succeeded = 'true' }],
  ['成功含失败定位', r => { r.groups[0].failedEntityCode = 'SKU_1' }]
]
for (const [name, mutate] of mutations) test(`${name}拒绝宣称同步成功且仅写一次刷新一次`, async () => {
  const reply = success(); mutate(reply)
  const { view, writes, reads } = await mount(reply)
  try {
    await view.state.handleBatchStatus(10); await flushProductList()
    assert.equal(writes.length, 1); assert.equal(reads.filter(req => req.url.endsWith('management-page')).length, 2)
    assert.ok(view.messages.some(item => item.type === 'error' && item.text.includes('契约')))
    assert.equal(view.state.batchStatusResultVisible, false)
  } finally { view.unmount() }
})
for (const [name, mutate] of [
  ['缺SKU失败定位', r => { delete r.failed[0].failedEntityCode }], ['SKU定位不在scope', r => { r.groups[0].failedEntityCode = r.failed[0].failedEntityCode = 'OTHER' }],
  ['顶层/组定位不一致', r => { r.groups[0].failedEntityType = 'SPU'; r.groups[0].failedEntityCode = 'SPU_1' }],
  ['父定位不等于parent', r => { r.groups[0].failedEntityType = r.failed[0].failedEntityType = 'SPU'; r.groups[0].failedEntityCode = r.failed[0].failedEntityCode = 'OTHER' }],
  ['错误码字符串', r => { r.failed[0].errorCode = '42' }], ['错误消息非字符串', r => { r.failed[0].errorMessage = {} }]
]) test(`${name}拒绝畸形失败回执`, async () => {
  const reply = refused(); mutate(reply)
  const { view } = await mount(reply)
  try { await view.state.handleBatchStatus(10); assert.equal(view.state.batchStatusResultVisible, false); assert.ok(view.messages.some(item => item.text.includes('契约'))) } finally { view.unmount() }
})
test('SKU编码跨SPU组重复拒绝', async () => {
  const reply = success(); reply.succeeded.push('SPU_2'); reply.groups.push({ spuCode: 'SPU_2', skuCodes: ['SKU_1'], succeeded: true })
  const { view } = await mount(reply)
  try { view.state.handleSelectionChange([{ spuCode: 'SPU_1' }, { spuCode: 'SPU_2' }]); await view.state.handleBatchStatus(10); assert.equal(view.state.batchStatusResultVisible, false) } finally { view.unmount() }
})
for (const status of [0, '0', 20, '20', 10, '10']) test(`SKU行状态${status}独立操作真实API，父状态阻断可见且操作列不合并`, async () => {
  const { view, writes } = await mount(true)
  try {
    view.state.list[0].skus[0].status = status; await flushProductList()
    const label = Number(status) === 10 ? '下架' : '上架'
    const button = view.allButtons().find(item => item.text.trim() === label)
    assert.ok(view.text().includes('SPU：已下架')); assert.ok(view.text().includes('SKU：')); assert.ok(view.text().includes('父商品未上架'))
    assert.ok(button, `缺少SKU${label}按钮`); await button.props.onClick(); await flushProductList()
    assert.equal(writes[0].url, '/supply-chain/products/skus/SKU_1/status')
    assert.deepEqual(writes[0].data, { targetStatus: Number(status) === 10 ? 20 : 10 })
    assert.equal(view.state.spanMethod({ row: { _rowspan: 2 }, columnIndex: 16 }), undefined)
  } finally { view.unmount() }
})
for (const status of [0, '0', 10, '10', 20, '20']) test(`真实编辑加载/保存保留已有SKU独立状态${status}，新增SKU省略状态继承父商品`, async () => {
  const writes = []
  const detail = { spuCode: 'SPU_1', status: 10, skus: [{ skuCode: 'SKU_1', skuName: '规格', status, faceValue: 100, marketPrice: 200 }] }
  const view = mountProductList({ get: async req => req.url.endsWith('/spus/SPU_1') ? detail : [], put: async req => { writes.push(req); return true } }, undefined, { entryFile: 'views/supplier/product/list/form/index.vue' })
  try {
    await view.state.open('SPU_1'); await flushProductList()
    assert.equal(view.state.formData.skus[0].status, Number(status))
    view.state.addSku(); await view.state.submitForm()
    assert.equal(writes.length, 1); assert.equal(writes[0].data.skus[0].status, Number(status))
    assert.equal(Object.hasOwn(writes[0].data.skus[1], 'status'), false)
  } finally { view.unmount() }
})

test('同步成功兼容后端显式null失败定位，父失败允许空scope', async () => {
  const reply = success(); reply.groups[0].failedEntityType = null; reply.groups[0].failedEntityCode = null
  const first = await mount(reply)
  try { await first.view.state.handleBatchStatus(10); assert.equal(first.view.state.batchStatusResultVisible, true) } finally { first.view.unmount() }
  const parentFailure = refused(); parentFailure.failed[0].failedEntityType = parentFailure.groups[0].failedEntityType = 'SPU'; parentFailure.failed[0].failedEntityCode = parentFailure.groups[0].failedEntityCode = 'SPU_1'; parentFailure.groups[0].skuCodes = []
  const second = await mount(parentFailure)
  try { await second.view.state.handleBatchStatus(10); assert.equal(second.view.state.batchStatusResultVisible, true); assert.ok(second.view.text().includes('[SPU] SPU_1')) } finally { second.view.unmount() }
})
test('批量下架保持旧请求shape并接受后端false模式及空groups', async () => {
  const { view, writes } = await mount({ syncSkuOnShelf: false, groups: [], succeeded: ['SPU_1'], failed: [] })
  try { await view.state.handleBatchStatus(20); assert.deepEqual(writes[0].data, { spuCodes: ['SPU_1'], skuCodes: [], targetStatus: 20, unshelveMode: undefined }); assert.ok(view.messages.some(item => item.type === 'success' && item.text.includes('成功 1 项'))) } finally { view.unmount() }
})

for (const [name, groups] of [
  ['groups非数组', {}], ['groups含null项', [null]], ['groups含缺少规格范围的项', [{ succeeded: true }]]
]) test(`普通下架忽略额外${name}，仅显示旧成功回执且写一次刷新一次`, async () => {
  const reply = { syncSkuOnShelf: false, groups, succeeded: ['SPU_1'], failed: [] }
  const { view, writes, reads } = await mount(reply)
  try {
    await view.state.handleBatchStatus(20); await flushProductList()
    assert.equal(writes.length, 1)
    assert.equal(reads.filter(req => req.url.endsWith('management-page')).length, 2)
    assert.equal(view.state.batchStatusBusy, false)
    assert.equal(view.state.batchStatusResultVisible, true)
    assert.ok(view.text().includes('成功 1 项，失败 0 项'))
    assert.deepEqual(view.messages, [{ type: 'success', text: '批量下架完成：成功 1 项，失败 0 项' }])
  } finally { view.unmount() }
})

test('批量下架拒绝同步模式回执，禁止误报SKU同步上架', async () => {
  const { view, writes, reads } = await mount(success())
  try {
    await view.state.handleBatchStatus(20); await flushProductList()
    assert.equal(view.state.batchStatusResultVisible, false)
    assert.ok(view.messages.some(item => item.type === 'error' && item.text.includes('契约')))
    assert.equal(writes.length, 1); assert.equal(reads.filter(req => req.url.endsWith('management-page')).length, 2)
  } finally { view.unmount() }
})
