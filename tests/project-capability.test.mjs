import assert from 'node:assert/strict'
import { test } from 'node:test'
import { reactive } from 'vue'
import { mountProductList, flushProductList as flush } from './support/product-list-sfc-harness.mjs'

const rows = (status = 'NOT_ENABLED', version = null) =>
  ['STANDARD_PRODUCT', 'O2O', 'INSTORE'].map((capabilityCode) => ({
    capabilityCode,
    status,
    version,
    lastOperatorId: null,
    lastChangedAt: null
  }))
function mount(options = {}) {
  const calls = []
  const notices = []
  let current = rows(options.status, options.version)
  const props = reactive({ projectCode: 'PRJ_1', active: options.active ?? true })
  const http = {
    async get(req) {
      calls.push(['get', req.url])
      if (req.url.endsWith('/credentials')) return { appId: null, credentials: [] }
      if (options.readError) throw new Error('offline')
      if (options.read) return options.read(req)
      return current
    },
    async post(req) {
      calls.push(['post', req.url, req.data])
      if (options.writeError) throw options.writeError
      if (options.write) return options.write(req)
      current = rows(req.url.endsWith('/enable') ? 'ENABLED' : 'DISABLED', 0)
      return { changed: true }
    }
  }
  const view = mountProductList(http, undefined, {
    entryFile: 'views/supplier/distribution/project/detail/ProjectApplicationCredentials.vue',
    props,
    modules: {
      '@/hooks/web/useMessage': {
        useMessage: () =>
          Object.fromEntries(
            ['warning', 'error', 'success'].map((type) => [
              type,
              (text) => notices.push({ type, text })
            ])
          )
      },
      '@/utils/permission': {
        checkPermi: (values) =>
          options.permissions === undefined || values.some((v) => options.permissions.includes(v))
      }
    }
  })
  return { ...view, calls, notices, props }
}
const button = (view, text) => view.allButtons().find((b) => b.text.trim() === text)

test('首次开启提交null版本并查询，不自动授予其他能力', async () => {
  const v = mount()
  await flush()
  assert.ok(v.text().includes('未开通'))
  await button(v, '开启标准商品').props.onClick()
  await flush()
  assert.deepEqual(
    v.calls.filter((c) => c[0] === 'post'),
    [
      [
        'post',
        '/supply-chain/projects/PRJ_1/capabilities/standard-product/enable',
        { expectedVersion: null }
      ]
    ]
  )
  assert.ok(v.text().includes('已开启'))
  v.unmount()
})
test('关闭显式弹框、原因校验、trim和当前版本', async () => {
  const v = mount({ status: 'ENABLED', version: 7, active: false })
  await flush()
  button(v, '关闭标准商品').props.onClick()
  await flush()
  assert.equal(v.state.disableVisible, true)
  assert.ok(button(v, '确认关闭').props.disabled)
  v.state.disableReason = '  停止接入  '
  await flush()
  await button(v, '确认关闭').props.onClick()
  await flush()
  assert.deepEqual(v.calls.filter((c) => c[0] === 'post')[0][2], {
    expectedVersion: 7,
    confirmed: true,
    reason: '停止接入'
  })
  assert.ok(v.text().includes('禁止新下单和卡密读取，仅保留订单摘要查询'))
  v.unmount()
})
test('暂停禁止开启，查询失败无可写默认值，无编辑权限无按钮', async () => {
  for (const options of [
    { active: false },
    { readError: true },
    { permissions: ['supply-chain:project:query'] }
  ]) {
    const v = mount(options)
    await flush()
    const enable = button(v, '开启标准商品')
    assert.ok(!enable || enable.props.disabled)
    v.unmount()
  }
})
test('写失败含版本冲突重新查询不重试不显示成功', async () => {
  const v = mount({ writeError: { code: 1050001179 } })
  await flush()
  await button(v, '开启标准商品').props.onClick()
  await flush()
  assert.equal(v.calls.filter((c) => c[0] === 'post').length, 1)
  assert.equal(v.calls.filter((c) => c[1].endsWith('/capabilities')).length, 2)
  assert.ok(v.notices.some((n) => n.type === 'warning'))
  assert.ok(!v.notices.some((n) => n.type === 'success'))
  v.unmount()
})
test('切换项目后关闭弹框失效，不对新项目写入', async () => {
  const v = mount({ status: 'ENABLED', version: 2 })
  await flush()
  button(v, '关闭标准商品').props.onClick()
  await flush()
  v.setProps({ projectCode: 'PRJ_2' })
  await flush()
  assert.equal(v.state.disableVisible, false)
  await v.state.submitDisable()
  await flush()
  assert.equal(v.calls.filter((c) => c[0] === 'post').length, 0)
  v.unmount()
})

test('旧项目查询晚响应不覆盖新项目，卸载使写响应失效', async () => {
  let finishRead
  const v = mount({
    read: (req) =>
      req.url.includes('PRJ_1')
        ? new Promise((resolve) => {
            finishRead = resolve
          })
        : rows('DISABLED', 8)
  })
  await flush()
  v.setProps({ projectCode: 'PRJ_2' })
  await flush()
  finishRead(rows('ENABLED', 1))
  await flush()
  assert.equal(v.state.standardCapability.version, 8)
  assert.equal(v.state.standardCapability.status, 'DISABLED')
  v.unmount()

  let finishWrite
  const w = mount({
    write: () =>
      new Promise((resolve) => {
        finishWrite = resolve
      })
  })
  await flush()
  const pending = button(w, '开启标准商品').props.onClick()
  w.unmount()
  finishWrite({ changed: true })
  await pending
  await flush()
  assert.equal(w.notices.length, 0)
  assert.equal(w.calls.filter((c) => c[1].endsWith('/capabilities')).length, 1)
})

test('防连点与写成功后读失败不伪成功，未知响应不可写', async () => {
  let finishWrite
  let reads = 0
  const v = mount({
    read: () => {
      if (++reads > 1) throw new Error('offline')
      return rows()
    },
    write: () =>
      new Promise((resolve) => {
        finishWrite = resolve
      })
  })
  await flush()
  const pending = button(v, '开启标准商品').props.onClick()
  await button(v, '开启标准商品').props.onClick()
  assert.equal(v.calls.filter((c) => c[0] === 'post').length, 1)
  finishWrite({ changed: true })
  await pending
  await flush()
  assert.ok(!button(v, '开启标准商品'))
  assert.ok(!v.notices.some((n) => n.type === 'success'))
  v.unmount()
  const invalid = mount({ read: () => rows('UNKNOWN', 1) })
  await flush()
  assert.ok(!button(invalid, '开启标准商品'))
  invalid.unmount()
})
