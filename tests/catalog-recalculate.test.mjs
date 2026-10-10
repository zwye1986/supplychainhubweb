import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { test } from 'node:test'
import { parse, compileScript } from 'vue/compiler-sfc'
import ts from 'typescript'
import * as vue from 'vue'

// 编译真实组件script setup，仅隔离网络和UI消息，不复制重算业务逻辑。
const filename = 'src/views/supplier/distribution/distributor/detail/ProductList.vue'
const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename })
const script = compileScript(descriptor, { id: 'catalog-recalculate-test' }).content
const compiled = ts.transpileModule(script, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText

function setup(response, error) {
  const notices = []
  const calls = []
  const api = {
    async recalculateAcceptanceCatalog(...args) {
      calls.push(['recalculate', ...args])
      if (error) throw error
      return response
    },
    async getBuyerProductPage() {
      calls.push(['reload'])
      return { list: [], total: 0 }
    }
  }
  const sandbox = {
    exports: {},
    ...vue,
    watch: () => {}, // 不触发与测试无关的初始页面请求。
    useMessage: () =>
      Object.fromEntries(
        ['success', 'warning', 'error'].map((type) => [
          type,
          (content) => notices.push({ type, content })
        ])
      ),
    require: (name) => {
      if (name === 'vue') return vue
      if (name === '@/api/supplier/distribution') return { DistributorApi: api }
      return {}
    }
  }
  vm.runInNewContext(compiled, sandbox, { filename })
  const component = sandbox.exports.default.setup({ buyerCode: 'BYR_1' }, { expose() {} })
  return { component, notices, calls }
}

for (const [state, availability, reason] of [
  ['DRAFT', 'UNKNOWN', 'DEFERRED_PRICE'],
  ['DRAFT', 'UNKNOWN', 'SELECTED_SUPPLY_UNKNOWN'],
  ['PUBLISHED', 'UNAVAILABLE', 'SUPPLIER_NOT_ACTIVE'],
  ['SUSPENDED', 'AVAILABLE', 'SUSPENDED'],
  ['RETIRED', 'AVAILABLE', 'RETIRED']
]) {
  test(`后端 ${state}/${reason} 不能显示绿色成功`, async () => {
    const { component, notices, calls } = setup({
      acceptanceListingNo: 'LST_1',
      publicationState: state,
      availabilityStatus: availability,
      reason
    })
    await component.handleRecalculate({ buyerProductCode: 'BPD_1' })
    assert.equal(notices[0].type, 'warning')
    assert.ok(notices[0].content.includes(reason))
    assert.deepEqual(calls, [['recalculate', 'BYR_1', 'BPD_1'], ['reload']])
    assert.equal(component.recalculatingCode.value, null)
  })
}

test('已发布且供给CONFIRMED显示成功', async () => {
  const { component, notices } = setup({
    acceptanceListingNo: 'LST_1',
    publicationState: 'PUBLISHED',
    availabilityStatus: 'AVAILABLE',
    reason: 'CONFIRMED'
  })
  await component.handleRecalculate({ buyerProductCode: 'BPD_1' })
  assert.equal(notices[0].type, 'success')
})

test('缺失响应不默认为成功', async () => {
  const { component, notices } = setup(undefined)
  await component.handleRecalculate({ buyerProductCode: 'BPD_1' })
  assert.equal(notices[0].type, 'warning')
})

test('请求异常释放loading且不刷新列表', async () => {
  const { component, notices, calls } = setup(null, new Error('网络失败'))
  await component.handleRecalculate({ canonicalBuyerSkuCode: 'BPD_1' })
  assert.deepEqual(notices, [{ type: 'error', content: '网络失败' }])
  assert.equal(calls.length, 1)
  assert.equal(component.recalculatingCode.value, null)
})

test('重算响应类型字段与RefreshResult一致', () => {
  const source = ts.createSourceFile(
    'types.ts',
    fs.readFileSync('src/api/supplier/distribution/types.ts', 'utf8'),
    ts.ScriptTarget.Latest
  )
  const declaration = source.statements.find(
    (node) =>
      ts.isInterfaceDeclaration(node) && node.name.text === 'AcceptanceCatalogRecalculateRespVO'
  )
  assert.deepEqual(
    declaration.members.map((member) => member.name.text).sort(),
    [
      'acceptanceListingNo',
      'publicationState',
      'availabilityStatus',
      'reason',
      'sourceBuyerPricingVersionId',
      'lastEvaluatedAt',
      'nextEvaluateAt'
    ].sort()
  )
})
