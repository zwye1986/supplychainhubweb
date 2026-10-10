import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import { test } from 'node:test'
import ts from 'typescript'
import * as vue from 'vue'
import { parse, compileScript } from 'vue/compiler-sfc'

const require = createRequire(import.meta.url)
const { renderToString } = createRequire(require.resolve('vue'))('@vue/server-renderer')
function evaluate(file, imports = require) {
  const exports = {}
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText
  vm.runInNewContext(js, { exports, require: imports })
  return exports
}
function orderApi(card) {
  return evaluate('src/api/order/index.ts', (name) => {
    if (name === '@/config/axios')
      return { get: async () => ({ items: [{ qty: 1, cardInfos: [card] }] }) }
    if (name === './mock') return { OrderMockApi: {} }
    if (name === './asset-valid-time') return evaluate('src/api/order/asset-valid-time.ts')
    return require(name)
  }).OrderApi
}
async function mapped(card) {
  return (await orderApi(card).getOrder('SC_1')).items[0].cardInfos[0]
}
for (const [state, raw, expected] of [
  ['ABSENT', undefined, '供应商未提供'],
  ['NULL', null, '供应商未提供'],
  ['VALUE', '', '供应商未提供'],
  ['VALUE', '长期有效', '长期有效'],
  ['VALUE', '  长期有效 \n', '  长期有效 \n'],
  ['VALUE', '  ', '  '],
  ['VALUE', '2026/10/10起一年（以供应商说明为准）', '2026/10/10起一年（以供应商说明为准）']
]) {
  test(`实际订单接口映射保留 ${state}/${JSON.stringify(raw)}`, async () => {
    const card = await mapped({
      cardCode: ' CODE ',
      cardSecret: ' PASS ',
      validTimeState: state,
      ...(raw === undefined ? {} : { validTimeRaw: raw }),
      validUntil: '2099-01-01'
    })
    assert.equal(card.expireTime, expected)
    assert.equal(card.cardNo, ' CODE ')
    assert.equal(card.password, ' PASS ')
  })
}
test('旧响应保持日期范围格式及无日期占位行为', async () => {
  assert.equal(
    (await mapped({ validFrom: '2026-10-10T10:00:00', validUntil: '2026-10-11T11:00:00' }))
      .expireTime,
    '2026-10-10 10:00:00 ~ 2026-10-11 11:00:00'
  )
  assert.equal((await mapped({})).expireTime, '')
})
for (const card of [
  { validTimeState: 'VALUE' },
  { validTimeState: 'VALUE', validTimeRaw: null },
  { validTimeState: 'VALUE', validTimeRaw: 201 },
  { validTimeState: 'OTHER', validTimeRaw: '长期有效' },
  { validTimeState: 'NULL', validTimeRaw: '' },
  { validTimeState: 'ABSENT', validTimeRaw: '长期有效' }
]) {
  test(`坏响应拒绝 ${JSON.stringify(card)}`, async () => {
    await assert.rejects(mapped(card), /供应商有效期响应无效/)
  })
}

test('真实卡密详情SFC展示原文与缺值文案，并以文本渲染供应商内容', async () => {
  const cards = await Promise.all([
    mapped({
      cardCode: ' CODE ',
      cardSecret: ' PASS ',
      validTimeState: 'VALUE',
      validTimeRaw: ' 长期有效 <b>原文</b> '
    }),
    mapped({ validTimeState: 'NULL', validTimeRaw: null })
  ])
  const { descriptor } = parse(
    fs.readFileSync('src/views/supplier/order/components/ExclusiveOrderInfo.vue', 'utf8')
  )
  const script = compileScript(descriptor, { id: 'task7', inlineTemplate: true })
  const exports = {}
  const js = ts.transpileModule(script.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS }
  }).outputText
  vm.runInNewContext(js, { exports, require, computed: vue.computed })
  const app = vue.createSSRApp(exports.default, {
    order: { bizType: 'VIRTUAL_CARD', items: [{ cardInfos: cards }] }
  })
  app.component('ElTable', {
    setup(props, { slots, attrs }) {
      vue.provide('rows', attrs.data)
      return () => vue.h('div', slots.default?.())
    }
  })
  app.component('ElTableColumn', {
    setup(props, { slots }) {
      const rows = vue.inject('rows')
      return () =>
        vue.h(
          'div',
          rows.map((row) => slots.default?.({ row }))
        )
    }
  })
  const html = await renderToString(app)
  assert.match(html, / CODE /)
  assert.match(html, / PASS /)
  assert.match(html, / 长期有效 &lt;b&gt;原文&lt;\/b&gt; /)
  assert.match(html, /供应商未提供/)
  assert.doesNotMatch(html, /<b>原文<\/b>/)
})
