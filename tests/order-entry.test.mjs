import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import ts from 'typescript'
import { mountProductList, flushProductList as flush } from './support/product-list-sfc-harness.mjs'

const base = '/supply-chain/orders/entry/projects'
const entryFile = 'views/supplier/order/platform/OrderEntryDialog.vue'
const project = (code) => ({
  projectCode: code,
  projectName: `项目${code}`,
  buyerName: '分销商甲',
  settlementBuyerName: '结算方乙'
})
const product = (schema = 'VOUCHER_DELIVERY_TARGET', version = 1, code = 'SKU_CARD') => ({
  listingCode: `PL_${code}`,
  platformSkuCode: code,
  skuName: '标准商品',
  targetSchemaCode: schema,
  targetSchemaVersion: version
})
const receipt = (status = 'ACCEPTED') => ({
  requestId: 'REQ_1',
  buyerOrderNo: 'ADMIN_1',
  receiptStatus: status,
  receiptVersion: 7,
  orderNo: status === 'ACCEPTED' ? 'ORDER_1' : null,
  orderStatus: null,
  rejectionCode: status.startsWith('REJECTED') ? 'NO_ROUTE' : null,
  idempotentReplay: false,
  acceptedAt: null
})
function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
function boundary(options = {}) {
  const reads = [],
    writes = []
  return {
    reads,
    writes,
    get: async (input) => {
      reads.push(input)
      if (input.url === base)
        return options.projects?.(input) || { list: [project('P1'), project('P2')], total: 45 }
      if (input.url.startsWith(`${base}/`))
        return (
          options.products?.(input) || {
            list: [product(options.schema, options.version)],
            total: 42
          }
        )
      return { list: [], total: 0 }
    },
    post: async (input) => {
      writes.push(input)
      return options.reply ? options.reply(input) : receipt()
    }
  }
}
function button(view, label) {
  const found = view.allButtons().find((item) => item.text.trim() === label)
  assert.ok(found, `应渲染可操作按钮：${label}`)
  return found
}
async function click(view, label) {
  await button(view, label).props.onClick()
  await flush()
}
async function update(view, name, label, value) {
  const control = view.components(name).find((item) => item.props?.['aria-label'] === label)
  assert.ok(control, `应渲染输入控件：${label}`)
  control.props['onUpdate:modelValue'](value)
  control.props.onChange?.(value)
  await flush()
}
async function mount(options = {}, confirm, extra = {}) {
  const http = boundary(options)
  const view = mountProductList(http, confirm, { entryFile, ...extra })
  view.exposed.open()
  await flush()
  return { view, http }
}
async function choose(view, projectCode = 'P1', sku = 'SKU_CARD') {
  await update(view, 'ElSelect', '录入项目', projectCode)
  await update(view, 'ElSelect', '录入商品', sku)
}

test('真实 API 编码路径、候选分页与严格 v2 正文，不走 mock', async () => {
  const calls = []
  const exports = {}
  const request = Object.fromEntries(
    ['get', 'post'].map((method) => [
      method,
      async (input) => {
        calls.push({ method, ...input })
        return receipt()
      }
    ])
  )
  const js = ts.transpileModule(fs.readFileSync('src/api/order/entry.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS }
  }).outputText
  new Function('exports', 'require', js)(exports, () => request)
  await exports.OrderEntryApi.projects({ projectName: '测试', pageNo: 2, pageSize: 20 })
  await exports.OrderEntryApi.products('P/1', { pageNo: 3, pageSize: 20 })
  const data = {
    buyerOrderNo: 'ADMIN_1',
    platformSkuCode: 'SKU_CARD',
    quantity: 1,
    target: { deliveryMode: 'BUYER_ASSET_QUERY' }
  }
  await exports.OrderEntryApi.create('P/1', data)
  assert.deepEqual(calls, [
    { method: 'get', url: base, params: { projectName: '测试', pageNo: 2, pageSize: 20 } },
    { method: 'get', url: `${base}/P%2F1/products`, params: { pageNo: 3, pageSize: 20 } },
    { method: 'post', url: `${base}/P%2F1`, data }
  ])
})
test('真实券按钮提交数量1及服务端目标，回执不是发券成功，详情事件可操作', async () => {
  const events = []
  const { view, http } = await mount({}, undefined, {
    props: {
      onSuccess: (no) => events.push(['success', no]),
      onDetail: (no) => events.push(['detail', no])
    }
  })
  try {
    await choose(view)
    assert.match(view.text(), /分销商甲/)
    assert.match(view.text(), /结算方乙/)
    assert.ok(view.components('ElOption').some((item) => item.props.label.includes('SKU_CARD')))
    const no = view.components('ElInput').find((item) => item.props['aria-label'] === '项目订单号')
      .props.modelValue
    assert.match(no, /^ADMIN_[0-9a-f-]{36}$/)
    await click(view, '提交订单')
    assert.equal(http.writes.length, 1)
    assert.deepEqual(http.writes[0], {
      url: `${base}/P1`,
      data: {
        buyerOrderNo: no,
        platformSkuCode: 'SKU_CARD',
        quantity: 1,
        target: { deliveryMode: 'BUYER_ASSET_QUERY' }
      }
    })
    assert.match(view.confirmations[0], /真实资金预留与供应商履约/)
    assert.match(view.text(), /ACCEPTED/)
    assert.match(view.text(), /不代表.*履约成功/)
    assert.match(view.text(), /ORDER_1/)
    assert.deepEqual(events, [['success', 'ORDER_1']])
    await click(view, '查看订单详情')
    assert.deepEqual(events.at(-1), ['detail', 'ORDER_1'])
  } finally {
    view.unmount()
  }
})
test('外部账号与项目订单号长度对齐严格HTTP契约，输入目标变化清旧CAS回执', async () => {
  const { view, http } = await mount({
    schema: 'ACCOUNT_BOUND_BENEFIT_TARGET',
    reply: () => receipt('REJECTED_RETRYABLE')
  })
  try {
    await choose(view)
    await update(view, 'ElSelect', '账号类型', 'EXTERNAL_ACCOUNT')
    const input = view.components('ElInput').find((item) => item.props['aria-label'] === '履约账号')
    assert.equal(Number(input.props.maxlength), 128)
    const orderInput = view
      .components('ElInput')
      .find((item) => item.props['aria-label'] === '项目订单号')
    assert.equal(Number(orderInput.props.maxlength), 128)
    await update(view, 'ElInput', '履约账号', 'a'.repeat(128))
    await click(view, '提交订单')
    assert.equal(http.writes[0].data.target.accountValue.length, 128)
    await update(view, 'ElInput', '履约账号', 'another-account')
    assert.doesNotMatch(view.text(), /NO_ROUTE/)
    await click(view, '提交订单')
    assert.equal(http.writes.at(-1).data.previousReceiptVersion, undefined)
  } finally {
    view.unmount()
  }
})
test('未知结果关闭再打开仍保持原单；显式重新生成只在新单时改变编号', async () => {
  const { view, http } = await mount({
    reply: () => {
      throw new Error('timeout')
    }
  })
  try {
    await choose(view)
    const input = () =>
      view.components('ElInput').find((item) => item.props['aria-label'] === '项目订单号').props
        .modelValue
    const firstNo = input()
    await click(view, '重新生成')
    assert.notEqual(input(), firstNo)
    await click(view, '提交订单')
    const attempted = structuredClone(http.writes[0])
    await click(view, '重新生成')
    assert.equal(input(), attempted.data.buyerOrderNo)
    await click(view, '关闭')
    view.exposed.open()
    await flush()
    assert.equal(input(), attempted.data.buyerOrderNo)
    await click(view, '同号查询或续跑')
    assert.deepEqual(http.writes[1], attempted)
  } finally {
    view.unmount()
  }
})
test('retryable缺失或不安全版本禁止CAS，异常回执提示未知而非受理成功', async () => {
  for (const version of [0, null, undefined, Number.MAX_SAFE_INTEGER + 1]) {
    const { view, http } = await mount({
      reply: () => ({ ...receipt('REJECTED_RETRYABLE'), receiptVersion: version })
    })
    try {
      await choose(view)
      await click(view, '提交订单')
      assert.equal(button(view, '条件修复后原单重试').props.disabled, true)
      await click(view, '条件修复后原单重试')
      assert.equal(http.writes.length, 1)
    } finally {
      view.unmount()
    }
  }
  const { view } = await mount({ reply: () => ({ receiptStatus: 'SUCCESS' }) })
  try {
    await choose(view)
    await click(view, '提交订单')
    assert.ok(view.components('ElAlert').some((item) => /结果.*未知/.test(item.props.title)))
    assert.doesNotMatch(view.text(), /ACCEPTED/)
  } finally {
    view.unmount()
  }
})
test('切商品清账号和旧回执，不把券目标或CAS版本带入另一SKU', async () => {
  const { view, http } = await mount({
    products: () => ({
      list: [product(), product('DIRECT_RECHARGE_TARGET', 1, 'SKU_RECHARGE')],
      total: 2
    }),
    reply: () => receipt('REJECTED_RETRYABLE')
  })
  try {
    await choose(view)
    await click(view, '提交订单')
    await update(view, 'ElSelect', '录入商品', 'SKU_RECHARGE')
    assert.doesNotMatch(view.text(), /NO_ROUTE/)
    assert.equal(button(view, '提交订单').props.disabled, true)
    await update(view, 'ElInput', '履约账号', '13800138000')
    await click(view, '提交订单')
    assert.deepEqual(http.writes.at(-1).data.target, {
      accountType: 'MOBILE',
      accountValue: '13800138000'
    })
    assert.equal(http.writes.at(-1).data.previousReceiptVersion, undefined)
    await update(view, 'ElSelect', '录入商品', 'SKU_CARD')
    assert.equal(
      view.components('ElInput').some((item) => item.props['aria-label'] === '履约账号'),
      false
    )
  } finally {
    view.unmount()
  }
})
for (const schema of ['DIRECT_RECHARGE_TARGET', 'ACCOUNT_BOUND_BENEFIT_TARGET']) {
  for (const accountType of ['MOBILE', 'EXTERNAL_ACCOUNT']) {
    test(`${schema} 按 Schema 显示账号并提交 ${accountType} 封闭目标`, async () => {
      const { view, http } = await mount({ schema })
      try {
        await choose(view)
        assert.equal(button(view, '提交订单').props.disabled, true)
        await update(view, 'ElSelect', '账号类型', accountType)
        await update(
          view,
          'ElInput',
          '履约账号',
          accountType === 'MOBILE' ? '13800138000' : 'external-user'
        )
        await click(view, '提交订单')
        assert.deepEqual(http.writes[0].data.target, {
          accountType,
          accountValue: accountType === 'MOBILE' ? '13800138000' : 'external-user'
        })
      } finally {
        view.unmount()
      }
    })
  }
}
for (const [schema, version] of [
  [null, 1],
  ['UNKNOWN', 1],
  ['VOUCHER_DELIVERY_TARGET', 2]
]) {
  test(`缺失/不支持 Schema ${schema}/${version} 禁止真实提交`, async () => {
    const { view, http } = await mount({ schema, version })
    try {
      await choose(view)
      assert.equal(button(view, '提交订单').props.disabled, true)
      await click(view, '提交订单')
      assert.equal(http.writes.length, 0)
      assert.ok(view.components('ElAlert').some((item) => /维护商品/.test(item.props.title)))
    } finally {
      view.unmount()
    }
  })
}
test('项目与商品候选真实分页；名称搜索重置页码，搜索乱序不会覆盖最新结果', async () => {
  const old = deferred()
  const { view, http } = await mount({
    projects: (input) =>
      input.params.projectName === '旧'
        ? old.promise
        : { list: [project(input.params.projectName || 'P1')], total: 45 }
  })
  try {
    const pager = view.components('Pagination')[0]
    pager.props['onUpdate:page'](2)
    await pager.props.onPagination()
    await flush()
    assert.equal(http.reads.at(-1).params.pageNo, 2)
    await update(view, 'ElInput', '项目名称搜索', '旧')
    const pending = button(view, '搜索项目').props.onClick()
    await update(view, 'ElInput', '项目名称搜索', '新')
    await click(view, '搜索项目')
    old.resolve({ list: [project('旧')], total: 1 })
    await pending
    await flush()
    assert.ok(view.components('ElOption').some((item) => item.props.value === '新'))
    assert.ok(!view.components('ElOption').some((item) => item.props.value === '旧'))
    assert.equal(http.reads.at(-1).params.pageNo, 1)
    await update(view, 'ElSelect', '录入项目', '新')
    const productPager = view.components('Pagination')[1]
    assert.equal(productPager.props.total, 42)
    productPager.props['onUpdate:page'](3)
    await productPager.props.onPagination()
    await flush()
    assert.equal(http.reads.at(-1).params.pageNo, 3)
  } finally {
    view.unmount()
  }
})
test('切项目清商品、账号、旧回执，旧项目异步商品不能覆盖新项目', async () => {
  const old = deferred()
  const { view } = await mount({ schema: 'DIRECT_RECHARGE_TARGET' })
  try {
    await choose(view)
    await update(view, 'ElInput', '履约账号', '13800138000')
    await click(view, '提交订单')
    await update(view, 'ElSelect', '录入项目', 'P2')
    assert.doesNotMatch(view.text(), /ACCEPTED/)
    assert.equal(
      view.components('ElSelect').find((item) => item.props['aria-label'] === '录入商品').props
        .modelValue,
      ''
    )
    await update(view, 'ElSelect', '录入商品', 'SKU_CARD')
    assert.equal(
      view.components('ElInput').find((item) => item.props['aria-label'] === '履约账号').props
        .modelValue,
      ''
    )
  } finally {
    view.unmount()
  }
  const mounted = await mount({
    products: (input) =>
      input.url.includes('/P1/')
        ? old.promise
        : { list: [product(undefined, 1, 'NEW_SKU')], total: 1 }
  })
  try {
    await update(mounted.view, 'ElSelect', '录入项目', 'P1')
    await update(mounted.view, 'ElSelect', '录入项目', 'P2')
    old.resolve({ list: [product(undefined, 1, 'OLD_SKU')], total: 1 })
    await flush()
    assert.ok(mounted.view.components('ElOption').some((item) => item.props.value === 'NEW_SKU'))
    assert.ok(!mounted.view.components('ElOption').some((item) => item.props.value === 'OLD_SKU'))
  } finally {
    mounted.view.unmount()
  }
})
test('确认取消不写入，确认和写入在途重复点击被抑制且禁关闭', async () => {
  const cancelled = await mount({}, async () => {
    throw new Error('cancel')
  })
  try {
    await choose(cancelled.view)
    await click(cancelled.view, '提交订单')
    assert.equal(cancelled.http.writes.length, 0)
  } finally {
    cancelled.view.unmount()
  }
  const confirmation = deferred(),
    write = deferred()
  const { view, http } = await mount({ reply: () => write.promise }, () => confirmation.promise)
  try {
    await choose(view)
    const first = button(view, '提交订单').props.onClick()
    await flush()
    await click(view, '提交订单')
    assert.equal(view.confirmations.length, 1)
    assert.equal(button(view, '提交订单').props.disabled, true)
    assert.equal(button(view, '关闭').props.disabled, true)
    assert.equal(view.components('ElDialog')[0].props['show-close'], false)
    confirmation.resolve()
    await flush()
    await click(view, '提交订单')
    assert.equal(http.writes.length, 1)
    write.resolve(receipt())
    await first
    await flush()
  } finally {
    view.unmount()
  }
})
test('CAS超时后丢弃旧版本，用原号原参数取得权威回执', async () => {
  let attempts = 0
  const { view, http } = await mount({
    reply: () => {
      attempts++
      if (attempts === 2) throw new Error('CAS timeout')
      return receipt(attempts === 1 ? 'REJECTED_RETRYABLE' : 'ACCEPTED')
    }
  })
  try {
    await choose(view)
    await click(view, '提交订单')
    await click(view, '条件修复后原单重试')
    assert.ok(!view.allButtons().some((item) => item.text.trim() === '条件修复后原单重试'))
    await click(view, '同号查询或续跑')
    assert.deepEqual(http.writes[2], http.writes[0])
    assert.match(view.text(), /ACCEPTED/)
  } finally {
    view.unmount()
  }
})

test('网络未知结果保留原号、原参数，显式同号重试不携带 CAS', async () => {
  const { view, http } = await mount({
    reply: () => {
      throw new Error('timeout')
    }
  })
  try {
    await choose(view)
    await click(view, '提交订单')
    const first = structuredClone(http.writes[0])
    assert.ok(view.components('ElAlert').some((item) => /结果.*未知/.test(item.props.title)))
    await click(view, '同号查询或续跑')
    assert.deepEqual(http.writes[1], first)
    assert.equal(http.writes[1].data.previousReceiptVersion, undefined)
  } finally {
    view.unmount()
  }
})
for (const status of ['PROCESSING', 'REJECTED_RETRYABLE', 'REJECTED_FINAL']) {
  test(`${status} 明确回执不刷新成功；retryable 仅显式原单 version CAS`, async () => {
    const successes = []
    const { view, http } = await mount({ reply: () => receipt(status) }, undefined, {
      props: { onSuccess: (no) => successes.push(no) }
    })
    try {
      await choose(view)
      await click(view, '提交订单')
      assert.match(view.text(), new RegExp(status))
      assert.deepEqual(successes, [])
      assert.equal(http.writes.length, 1)
      if (status === 'REJECTED_RETRYABLE') {
        assert.match(view.text(), /NO_ROUTE/)
        await click(view, '条件修复后原单重试')
        assert.deepEqual(http.writes[1].data, { ...http.writes[0].data, previousReceiptVersion: 7 })
        await update(view, 'ElInput', '项目订单号', 'CHANGED_NO')
        assert.doesNotMatch(view.text(), /NO_ROUTE/)
        await click(view, '提交订单')
        assert.equal(http.writes.at(-1).data.previousReceiptVersion, undefined)
      } else if (status === 'PROCESSING') {
        await click(view, '同号查询或续跑')
        assert.deepEqual(http.writes[1], http.writes[0])
      } else assert.ok(!view.allButtons().some((item) => item.text.includes('原单重试')))
    } finally {
      view.unmount()
    }
  })
}
test('平台真实录入按钮权限、成功刷新及详情连接', async () => {
  const http = boundary(),
    opens = []
  const view = mountProductList(http, undefined, {
    entryFile: 'views/supplier/order/platform/index.vue',
    modules: { '@/utils/download': { __esModule: true, default: {} } },
    onOpen: (name, args) => opens.push([name, args])
  })
  try {
    await flush()
    assert.equal(view.components('ElDialog').at(-1).props.modelValue, false)
    await click(view, '录入订单')
    assert.equal(view.components('ElDialog').at(-1).props.modelValue, true)
    assert.ok(
      view.permissions.some(
        (value) =>
          JSON.stringify(value) ===
          JSON.stringify(['supply-chain:admin', 'supply-chain:order:create'])
      )
    )
    await choose(view)
    await click(view, '提交订单')
    assert.equal(http.reads.filter((item) => item.url === '/supply-chain/order-views').length, 2)
    await click(view, '查看订单详情')
    assert.deepEqual(opens.at(-1), ['index.vue', ['ORDER_1']])
  } finally {
    view.unmount()
  }
})
