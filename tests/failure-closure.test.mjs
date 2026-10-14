import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import * as vue from 'vue'
import { parse, compileScript } from 'vue/compiler-sfc'
const require = createRequire(import.meta.url)
const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await vue.nextTick()
}
function evaluate(source, resolve) {
  const exports = {}
  vm.runInNewContext(
    ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    {
      exports,
      require: resolve,
      crypto: { randomUUID: () => `action-${Math.random()}` },
      setTimeout: () => 1,
      clearTimeout: () => {}
    }
  )
  return exports
}
function mount(api, permissions = ['query', 'verify', 'confirm-failure']) {
  const { descriptor } = parse(
    fs.readFileSync('src/views/supplier/order/components/FailureClosurePanel.vue', 'utf8')
  )
  const script = compileScript(descriptor, { id: 'closure' })
  const component = evaluate(script.content, (name) => {
    if (name === 'vue') return { ...vue, onBeforeUnmount: () => {} }
    if (name.includes('failure-closure')) return { CaseApi: api }
    if (name.includes('hasPermi'))
      return {
        hasPermission: (names) => names.some((name) => permissions.includes(name.split(':').at(-1)))
      }
    return require(name)
  }).default
  const props = vue.reactive({ summary: { caseNo: 'FC_1' } })
  const scope = vue.effectScope()
  const state = scope.run(() => component.setup(props, { expose: () => {}, emit: () => {} }))
  return { state, props, stop: () => scope.stop() }
}
const detail = {
  caseNo: 'FC_1',
  caseVersion: 4,
  generation: 8,
  canVerify: true,
  canConfirmFailure: false
}
test('真实 Case API 使用两步独立命令与编码路径，不附带操作人或动账金额', async () => {
  const calls = []
  const request = Object.fromEntries(
    ['get', 'post'].map((method) => [
      method,
      async (input) => {
        calls.push({ method, ...input })
        return {}
      }
    ])
  )
  const api = evaluate(
    fs.readFileSync('src/api/order/failure-closure.ts', 'utf8'),
    () => request
  ).CaseApi
  await api.detail('FC/1')
  const verify = { actionNo: 'VA_1', expectedCaseVersion: 4, expectedGeneration: 8, reason: '核实' }
  await api.verify('FC/1', verify)
  await api.action('FC/1', 'VA_1')
  await api.confirmFailure('FC/1', { ...verify, actionNo: 'CA_1', verifyActionNo: 'VA_1' })
  assert.equal(calls[0].url, '/supply-chain/fulfillment-cases/FC%2F1')
  assert.equal(calls[1].url, '/supply-chain/fulfillment-cases/FC%2F1/verify')
  assert.equal(calls[2].url, '/supply-chain/fulfillment-cases/FC%2F1/actions/VA_1')
  assert.equal(calls[3].url, '/supply-chain/fulfillment-cases/FC%2F1/confirm-failure')
  assert.equal(calls[3].data.verifyActionNo, 'VA_1')
  assert.equal(calls[3].data.actorId, undefined)
  assert.equal(calls[3].data.amount, undefined)
})
test('实际 mapper 保留 MANUAL / CANCELLED 与分值证据，不把缺失预留变为零', async () => {
  for (const status of ['MANUAL', 'CANCELLED']) {
    const closure = {
      caseNo: 'FC_1',
      reportedSupplierSettlementAmount: 20000,
      fundDisposition: null
    }
    const api = evaluate(fs.readFileSync('src/api/order/index.ts', 'utf8'), (name) => {
      if (name === '@/config/axios')
        return {
          get: async () => ({
            bOrderNo: 'BO_1',
            fulfillmentStatus: status,
            failureClosure: closure
          })
        }
      if (name === './mock') return {}
      if (name === './asset-valid-time') return {}
      return require(name)
    }).OrderApi
    const order = await api.getSupplierOrder('BO_1')
    assert.equal(order.status, status)
    assert.equal(order.failureClosures[0].reportedSupplierSettlementAmount, 20000)
    assert.equal(order.failureClosures[0].fundDisposition, null)
  }
})
test('核实 HTTP 受理保持 ACCEPTED，不提示核实成功，重复点击只提交一次', async () => {
  let release
  let calls = 0
  const api = {
    detail: async () => detail,
    verify: () => {
      calls++
      return new Promise((resolve) => {
        release = resolve
      })
    }
  }
  const mounted = mount(api)
  await flush()
  mounted.state.reason.value = '核对原单'
  const first = mounted.state.submit(false)
  await mounted.state.submit(false)
  assert.equal(calls, 1)
  release({ actionNo: 'VA_1', executionStatus: 'ACCEPTED' })
  await first
  assert.equal(mounted.state.action.value.executionStatus, 'ACCEPTED')
  assert.equal(mounted.state.confirmVisible.value, false)
  mounted.stop()
})
test('订单切换围栏丢弃迟到详情，资金缺失显示未知', async () => {
  let release
  const mounted = mount({
    detail: (no) =>
      no === 'FC_1'
        ? new Promise((resolve) => {
            release = resolve
          })
        : Promise.resolve({ ...detail, caseNo: no })
  })
  mounted.props.summary = { caseNo: 'FC_2' }
  await flush()
  release(detail)
  await flush()
  assert.equal(mounted.state.detail.value.caseNo, 'FC_2')
  assert.match(mounted.state.fundText.value, /未知/)
  mounted.stop()
})
test('关单要求独立权限、后端资格、强确认及独立编号关联核实动作', async () => {
  const commands = []
  const api = {
    detail: async () => ({ ...detail, canConfirmFailure: true, latestActionNo: 'VA_1' }),
    action: async () => ({ actionNo: 'VA_1', executionStatus: 'SUCCEEDED' }),
    confirmFailure: async (_no, command) => {
      commands.push(command)
      return { actionNo: command.actionNo, executionStatus: 'SUCCEEDED' }
    }
  }
  const mounted = mount(api)
  await flush()
  mounted.state.reason.value = '证据已核对'
  await mounted.state.submit(true)
  assert.equal(commands.length, 0)
  mounted.state.confirmation.value = '确认失败关单'
  await mounted.state.submit(true)
  assert.equal(commands.length, 1)
  assert.equal(commands[0].verifyActionNo, 'VA_1')
  assert.notEqual(commands[0].actionNo, 'VA_1')
  assert.equal(commands[0].expectedGeneration, 8)
  const denied = mount(api, ['query', 'verify'])
  await flush()
  denied.state.reason.value = '拒绝动账'
  denied.state.confirmation.value = '确认失败关单'
  await denied.state.submit(true)
  assert.equal(commands.length, 1)
  mounted.stop()
  denied.stop()
})

test('网络未知重试沿用原命令指纹，不能改原因或重置编号', async () => {
  const commands = []
  const mounted = mount({
    detail: async () => detail,
    verify: async (_no, command) => {
      commands.push({ ...command })
      throw new Error('network uncertain')
    }
  })
  await flush()
  mounted.state.reason.value = '首次核实'
  await mounted.state.submit(false)
  mounted.state.reason.value = '不能替换原指纹'
  await mounted.state.submit(false)
  assert.deepEqual(commands[0], commands[1])
  assert.equal(commands[0].reason, '首次核实')
  mounted.stop()
})

test('核实迟到返回不能覆盖切换后的 Case 或清除新页面忙状态', async () => {
  let release
  const mounted = mount({
    detail: async (no) => ({ ...detail, caseNo: no }),
    verify: () =>
      new Promise((resolve) => {
        release = resolve
      })
  })
  await flush()
  mounted.state.reason.value = '核实旧单'
  const submitting = mounted.state.submit(false)
  mounted.props.summary = { caseNo: 'FC_2' }
  await flush()
  release({ actionNo: 'old', executionStatus: 'SUCCEEDED' })
  await submitting
  assert.equal(mounted.state.detail.value.caseNo, 'FC_2')
  assert.equal(mounted.state.action.value, undefined)
  mounted.stop()
})

test('后端资格关闭或代次缺失时不能提交确认或核实', async () => {
  let calls = 0
  const mounted = mount({
    detail: async () => ({ ...detail, generation: undefined, canConfirmFailure: false }),
    verify: async () => {
      calls++
    },
    confirmFailure: async () => {
      calls++
    }
  })
  await flush()
  mounted.state.reason.value = '禁止绕过'
  mounted.state.confirmation.value = '确认失败关单'
  await mounted.state.submit(false)
  await mounted.state.submit(true)
  assert.equal(calls, 0)
  mounted.stop()
})
