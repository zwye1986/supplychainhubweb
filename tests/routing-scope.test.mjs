import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

// 执行当前真实RuleForm的保存入口，不恢复已删除的utils/constants模块。
// 设计见后端docs/superpowers/specs/2026-10-15-renyue-qnm-szcard-detailed-design.md §10.4。
async function saveScope(modes) {
  const [distributorMode, projectMode, productTypeMode, supplierMode] = modes
  const writes = []
  const rule = {
    ruleCode: 'RULE_SCOPE',
    name: '范围合同验证',
    distributorMode,
    distributorCodes: distributorMode === 'SPECIFIED' ? ['DIST_01'] : [],
    projectMode,
    projectCodes: projectMode === 'SPECIFIED' ? ['PROJECT_02'] : [],
    productTypeMode,
    productTypeCodes: productTypeMode === 'SPECIFIED' ? ['TYPE_03'] : [],
    supplierMode,
    supplierCodes: supplierMode === 'SPECIFIED' ? ['SUPPLIER_04', 'SUPPLIER_05'] : [],
    routeMode: 'AUTO',
    status: 'ENABLED'
  }
  const view = mountProductList(
    {
      get: async ({ url }) => (url === '/supply-chain/routing-rules/RULE_SCOPE' ? rule : []),
      put: async (input) => {
        writes.push(input)
        return input.data
      }
    },
    undefined,
    {
      entryFile: 'views/supplier/routing/rule/RuleForm.vue',
      modules: {
        vuedraggable: { __esModule: true, default: { setup: () => () => null } }
      }
    }
  )
  try {
    await view.exposed.open('RULE_SCOPE')
    await flushProductList()
    const save = view.allButtons().find((button) => button.text.trim() === '确定')
    assert.ok(save, '真实表单必须提供保存按钮')
    await save.props.onClick()
    await flushProductList()
    return { writes, messages: view.messages }
  } finally {
    view.unmount()
  }
}

test('七级合法范围通过真实表单及API保存，保留各维度业务编码', async () => {
  const supported = [
    ['SPECIFIED', 'SPECIFIED', 'SPECIFIED', 'SPECIFIED'],
    ['SPECIFIED', 'SPECIFIED', 'SPECIFIED', 'ALL'],
    ['SPECIFIED', 'ALL', 'SPECIFIED', 'ALL'],
    ['ALL', 'SPECIFIED', 'SPECIFIED', 'ALL'],
    ['ALL', 'ALL', 'SPECIFIED', 'ALL'],
    ['SPECIFIED', 'SPECIFIED', 'ALL', 'ALL'],
    ['ALL', 'ALL', 'ALL', 'ALL']
  ]
  for (const modes of supported) {
    const { writes, messages } = await saveScope(modes)
    assert.equal(writes.length, 1, modes.join(':'))
    assert.equal(writes[0].url, '/supply-chain/routing-rules/RULE_SCOPE')
    const body = writes[0].data
    assert.deepEqual(
      [body.distributorMode, body.projectMode, body.productTypeMode, body.supplierMode],
      modes
    )
    assert.deepEqual(body.distributorCodes, modes[0] === 'SPECIFIED' ? ['DIST_01'] : [])
    assert.deepEqual(body.projectCodes, modes[1] === 'SPECIFIED' ? ['PROJECT_02'] : [])
    assert.deepEqual(body.productTypeCodes, modes[2] === 'SPECIFIED' ? ['TYPE_03'] : [])
    assert.deepEqual(
      body.supplierCodes,
      modes[3] === 'SPECIFIED' ? ['SUPPLIER_04', 'SUPPLIER_05'] : []
    )
    assert.ok(messages.some((message) => message.type === 'success'))
  }
})

test('不支持的混合范围提示原因且不发送保存请求', async () => {
  const { writes, messages } = await saveScope(['SPECIFIED', 'SPECIFIED', 'ALL', 'SPECIFIED'])
  assert.deepEqual(writes, [])
  assert.ok(messages.some((message) => message.type === 'warning' && /范围组合/.test(message.text)))
})
