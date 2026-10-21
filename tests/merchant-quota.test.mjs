import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mountProductList, flushProductList as flush } from './support/product-list-sfc-harness.mjs'

const row = {
  id: '9007199254740993',
  platformCode: 'RENYUE',
  merchantAccount: ' Merchant ',
  rateLimitPerSecond: 11,
  concurrencyLimit: 4,
  version: '9007199254740993',
  updatedBy: '71',
  updatedAt: 1792375200000,
  changeReason: '历史配置'
}
const base = '/supply-chain/merchant-quotas'
function mount(options = {}) {
  const calls = [],
    notices = []
  const http = {
    async get(req) {
      calls.push(['get', req.url, req.params])
      if (options.read) return options.read(req)
      if (req.url.endsWith('/history'))
        return { list: [], total: 0, firstRecordedVersion: options.firstVersion ?? null }
      if (req.url === base) return { list: [row], total: 1 }
      return { ...row }
    },
    async post(req) {
      calls.push(['post', req.url, req.data])
      if (options.writeError) throw options.writeError
      return { id: '17', version: '0' }
    },
    async put(req) {
      calls.push(['put', req.url, req.data])
      if (options.writeError) throw options.writeError
      return { id: row.id, version: '9007199254740994' }
    }
  }
  const view = mountProductList(http, undefined, {
    entryFile: 'views/supplier/merchant-quota/index.vue',
    modules: {
      '@/utils/permission': {
        checkPermi: (values) =>
          values.some((v) => (options.permissions ?? ['supply-chain:admin']).includes(v))
      },
      '@/hooks/web/useMessage': {
        useMessage: () =>
          Object.fromEntries(
            ['warning', 'error', 'success'].map((type) => [
              type,
              (text) => notices.push({ type, text })
            ])
          )
      }
    }
  })
  return { ...view, calls, notices }
}
const button = (v, text) => v.allButtons().find((b) => b.text.trim() === text)
const input = (v, placeholder) =>
  v.components('ElInput').find((field) => field.props.placeholder === placeholder)
const reason = (v) => v.components('ElInput').find((field) => field.props.type === 'textarea')
const model = async (field, value) => {
  field.props['onUpdate:modelValue'](value)
  await flush()
}

test('新建没有默认额度，必填原因，保留精确账号且不发送操作人', async () => {
  const v = mount()
  await flush()
  button(v, '新增额度').props.onClick()
  await flush()
  assert.deepEqual(
    v.components('ElInputNumber').map((field) => field.props.modelValue),
    [undefined, undefined]
  )
  assert.ok(button(v, '保存').props.disabled)
  await model(
    v.components('ElSelect').find((field) => field.props.placeholder === '请选择平台'),
    'QNM'
  )
  await model(input(v, '保留原值，身份创建后不可修改'), ' Exact ')
  await model(v.components('ElInputNumber')[0], 7)
  await model(v.components('ElInputNumber')[1], 2)
  await model(reason(v), '   ')
  assert.ok(button(v, '保存').props.disabled)
  await model(reason(v), '核查后创建')
  await button(v, '保存').props.onClick()
  await flush()
  assert.deepEqual(
    v.calls.filter((c) => c[0] === 'post'),
    [
      [
        'post',
        base,
        {
          platformCode: 'QNM',
          merchantAccount: ' Exact ',
          rateLimitPerSecond: 7,
          concurrencyLimit: 2,
          reason: '核查后创建'
        }
      ]
    ]
  )
  assert.ok(v.notices.some((n) => n.type === 'success'))
  v.unmount()
})

test('只查询权限没有新增调整入口，调整携带原始字符串版本且不提交身份', async () => {
  const read = mount({ permissions: ['supply-chain:merchant-quota:query'] })
  await flush()
  assert.equal(button(read, '新增额度'), undefined)
  assert.equal(button(read, '调整'), undefined)
  assert.equal(read.calls.filter((c) => c[0] !== 'get').length, 0)
  read.unmount()
  const v = mount()
  await flush()
  await button(v, '调整').props.onClick()
  await flush()
  assert.equal(reason(v).props.modelValue, '')
  assert.equal(input(v, '保留原值，身份创建后不可修改').props.disabled, true)
  await model(v.components('ElInputNumber')[0], 7)
  await model(v.components('ElInputNumber')[1], 2)
  await model(reason(v), '核查后降额')
  await button(v, '保存').props.onClick()
  await flush()
  assert.deepEqual(
    v.calls.filter((c) => c[0] === 'put'),
    [
      [
        'put',
        `${base}/${row.id}`,
        {
          rateLimitPerSecond: 7,
          concurrencyLimit: 2,
          expectedVersion: '9007199254740993',
          reason: '核查后降额'
        }
      ]
    ]
  )
  v.unmount()
})

test('详情读取失败不能留下可写默认值', async () => {
  const v = mount({
    read: (req) =>
      req.url === base ? { list: [row], total: 1 } : Promise.reject(new Error('offline'))
  })
  await flush()
  await button(v, '调整').props.onClick()
  await flush()
  await model(v.components('ElInputNumber')[0], 7)
  await model(v.components('ElInputNumber')[1], 2)
  await model(reason(v), '禁止误写')
  assert.ok(button(v, '保存').props.disabled)
  await button(v, '保存').props.onClick()
  assert.equal(v.calls.filter((c) => c[0] === 'put').length, 0)
  v.unmount()
})

test('冲突或不确定失败保留输入但使表单失效，不重放且不报成功', async () => {
  for (const error of [{ code: 1050001183 }, 'error', new Error('network')]) {
    const v = mount({ writeError: error })
    await flush()
    await button(v, '调整').props.onClick()
    await flush()
    await model(reason(v), '保留我的原因')
    await button(v, '保存').props.onClick()
    await flush()
    assert.ok(button(v, '保存').props.disabled)
    assert.equal(reason(v).props.modelValue, '保留我的原因')
    await button(v, '保存').props.onClick()
    assert.equal(v.calls.filter((c) => c[0] === 'put').length, 1)
    assert.ok(!v.notices.some((n) => n.type === 'success'))
    assert.ok(v.notices.some((n) => n.type === 'warning'))
    v.unmount()
  }
})

test('存量无记录或首条版本大于零提示此前历史未记录，不把空页当成完整历史', async () => {
  for (const version of [null, '9', '0']) {
    const v = mount({ firstVersion: version })
    await flush()
    await button(v, '历史').props.onClick()
    await flush()
    assert.equal(v.text().includes('此前历史未记录'), version !== '0')
    assert.ok(v.calls.some((c) => c[1] === `${base}/${row.id}/history`))
    v.unmount()
  }
})

test('晚返回详情不能覆盖新建表单，晚返回列表不能覆盖新筛选结果', async () => {
  let finishDetail, finishList
  const v = mount({
    read: (req) => {
      if (req.url === base && !req.params.merchantAccount)
        return new Promise((resolve) => {
          finishList = resolve
        })
      if (req.url === base) return { list: [{ ...row, merchantAccount: 'Current' }], total: 1 }
      return new Promise((resolve) => {
        finishDetail = resolve
      })
    }
  })
  await flush()
  await model(input(v, '原值精确匹配（含大小写与空格）'), 'Current')
  await button(v, '查询').props.onClick()
  await flush()
  finishList({ list: [row], total: 99 })
  await flush()
  assert.equal(v.components('Pagination')[0].props.total, 1)
  assert.ok(v.text().includes('Current'))
  assert.ok(!v.text().includes(row.merchantAccount))
  const pending = button(v, '调整').props.onClick()
  await flush()
  button(v, '关闭').props.onClick()
  await flush()
  button(v, '新增额度').props.onClick()
  await flush()
  finishDetail(row)
  await pending
  await flush()
  assert.equal(input(v, '保留原值，身份创建后不可修改').props.modelValue, '')
  assert.deepEqual(
    v.components('ElInputNumber').map((field) => field.props.modelValue),
    [undefined, undefined]
  )
  v.unmount()
})

// 仅经抽屉公开close事件及列表按钮切换，不读取组件私有setupState。
for (const reopenSame of [false, true]) {
  test(`历史${reopenSame ? '关闭重开' : '切换商户'}后，旧成功或失败不能覆盖当前记录与历史完整度`, async () => {
    for (const oldFails of [false, true]) {
      const other = { ...row, id: '9007199254740995', merchantAccount: 'CurrentMerchant' }
      const requests = []
      const v = mount({
        read: (req) => {
          if (req.url === base) return { list: [row, other], total: 2 }
          return new Promise((resolve, reject) => requests.push({ resolve, reject }))
        }
      })
      await flush()
      const oldRequest = v
        .allButtons()
        .filter((b) => b.text.trim() === '历史')[0]
        .props.onClick()
      await flush()
      v.components('ElDrawer')[0].props.onClose()
      await flush()
      const currentRequest = v
        .allButtons()
        .filter((b) => b.text.trim() === '历史')
        [reopenSame ? 0 : 1].props.onClick()
      await flush()
      requests[1].resolve({
        list: [{ quotaVersion: '0', reason: '当前真实创建' }],
        total: 1,
        firstRecordedVersion: '0'
      })
      await currentRequest
      await flush()
      if (oldFails) requests[0].reject(new Error('old request failed'))
      else
        requests[0].resolve({
          list: [{ quotaVersion: '9', reason: '过期历史' }],
          total: 99,
          firstRecordedVersion: '9'
        })
      await oldRequest
      await flush()
      assert.deepEqual(v.components('ElTable')[1].props.data, [
        { quotaVersion: '0', reason: '当前真实创建' }
      ])
      assert.equal(v.components('Pagination')[1].props.total, 1)
      assert.ok(!v.text().includes('此前历史未记录'))
      assert.ok(
        !v
          .components('ElAlert')
          .some((alert) => alert.props.title === '历史读取失败，请关闭后重新打开')
      )
      assert.equal(v.calls.at(-1)[1], `${base}/${reopenSame ? row.id : other.id}/history`)
      v.unmount()
    }
  })
}
