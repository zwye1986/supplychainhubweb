import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { test } from 'node:test'
import { parse, compileScript } from 'vue/compiler-sfc'
import ts from 'typescript'
import * as vue from 'vue'

const utilityPath = 'src/views/supplier/distribution/utils/catalogSaveResult.ts'
const compile = (source) =>
  ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText
const utility = { exports: {} }
vm.runInNewContext(compile(fs.readFileSync(utilityPath, 'utf8')), utility)
const loadUtility = (path) => {
  const context = { exports: {} }
  vm.runInNewContext(compile(fs.readFileSync(path, 'utf8')), context)
  return context.exports
}
const distPrice = loadUtility(
  'src/views/supplier/distribution/distributor/detail/distributionPrice.ts'
)
const projectPrice = loadUtility('src/views/supplier/distribution/project/detail/projectPricing.ts')

test('扫描关闭的待就绪目录不承诺自动发布', () => {
  const hint = utility.exports.buildCatalogSaveMessage({
    saveState: 'COMMITTED',
    automaticRecoveryEnabled: false,
    catalogResults: [
      { refreshOutcome: 'DEFERRED', savedCode: 'BPD_1', reasonCode: 'QUALIFICATION_UNKNOWN' }
    ]
  })
  assert.match(hint.content, /扫描已关闭/)
  assert.doesNotMatch(hint.content, /条件满足后后台自动发布/)
})

test('仅网络无响应显示未确认，明确业务错误不误报', () => {
  assert.equal(utility.exports.isCatalogSaveUncertainError(new Error('timeout')), true)
  assert.equal(utility.exports.isCatalogSaveUncertainError('error'), false)
  assert.equal(
    utility.exports.isCatalogSaveUncertainError({
      message: 'bad request',
      response: { status: 400 }
    }),
    false
  )
})

for (const [outcome, fragment] of [
  ['UPDATED', '目录已发布'],
  ['UNCHANGED', '目录已发布'],
  ['DEFERRED', '条件满足后后台自动发布'],
  ['FAILED', '后台将自动重试'],
  ['SKIPPED_MANUAL', '手工管理'],
  ['PAUSED', '不自动恢复'],
  ['TERMINAL', '不可恢复']
]) {
  test(`${outcome} 保存提示保持真实结果`, () => {
    const hint = utility.exports.buildCatalogSaveMessage({
      saveState: 'COMMITTED',
      automaticRecoveryEnabled: true,
      catalogResults: [{ refreshOutcome: outcome, savedCode: 'BPD_1', reasonCode: 'FIXTURE' }]
    })
    assert.ok(hint.content.includes(fragment))
  })
}

for (const [scope, name, entry, apiMethod] of [
  ['distributor', 'ProductSelectDialog', 'handleSubmit', 'createBuyerProducts'],
  ['project', 'ProductSelectDialog', 'handleSubmit', 'createProducts'],
  ['distributor', 'ProductList', 'submitAdjust', 'saveBuyerProductPricing'],
  ['project', 'ProductList', 'submitAdjust', 'saveProductPricing']
]) {
  test(`${scope}/${name} 网络超时提示未确认且不重复请求`, async () => {
    const filename = `src/views/supplier/distribution/${scope}/detail/${name}.vue`
    const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename })
    const compiled = compile(compileScript(descriptor, { id: 'save-result-test' }).content)
    const notices = [],
      calls = [],
      events = []
    const api = {
      [apiMethod]: async () => {
        calls.push(apiMethod)
        throw new Error('timeout')
      }
    }
    const sandbox = {
      exports: {},
      ...vue,
      watch: () => {},
      useMessage: () =>
        Object.fromEntries(
          ['success', 'warning', 'error', 'info'].map((type) => [
            type,
            (content) => notices.push({ type, content })
          ])
        ),
      useI18n: () => ({ t: (value) => value }),
      require: (name) =>
        name === 'vue'
          ? vue
          : name === '@/api/supplier/distribution'
            ? { DistributorApi: api, ProjectApi: api }
            : name.endsWith('/catalogSaveResult')
              ? utility.exports
              : name.endsWith('/distributionPrice')
                ? distPrice
                : name.endsWith('/projectPricing')
                  ? projectPrice
                  : {}
    }
    vm.runInNewContext(compiled, sandbox, { filename })
    const component = sandbox.exports.default.setup(
      { buyerCode: 'BYR_1', projectCode: 'PRJ_1' },
      { expose() {}, emit: (...args) => events.push(args) }
    )
    if (entry === 'handleSubmit') {
      const price = distPrice.createEmptyDistPrice()
      component.selectedList.value = [{ platformSkuCode: 'SKU_1', price }]
      component.skuFormRefs.set('SKU_1', { validate: async () => true })
    } else {
      component.adjustRow.value = { buyerProductCode: 'BPD_1', listingCode: 'PLT_1' }
      component.adjustFormRef.value = { validate: async () => true }
    }
    await component[entry]()
    assert.equal(calls.length, 1)
    assert.ok(notices.some((item) => item.content.includes('保存结果未确认')))
    assert.equal(events.length, 0)
    assert.equal((component.submitting || component.adjustSaving).value, false)
  })
}
