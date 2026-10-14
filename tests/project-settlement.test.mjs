import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mountProductList, flushProductList as flush } from './support/product-list-sfc-harness.mjs'

function mount(status = 'DRAFT', settlement = 'BYR_B') {
  const calls = []
  const view = mountProductList(
    {
      async get(req) {
        calls.push(req)
        if (req.url.endsWith('/buyers')) return [{ buyerCode: 'BYR_A', buyerName: '关联方' }]
        return {
          projectCode: 'PRJ_1',
          projectName: '项目',
          buyerCode: 'BYR_A',
          status,
          settlementBuyerCode: settlement,
          settlementBuyerName: '结算方',
          projectType: 'OTHER',
          startDate: '2026-10-01',
          endDate: '2026-11-01'
        }
      }
    },
    undefined,
    {
      entryFile: 'views/supplier/distribution/project/form/index.vue',
      props: { modelValue: false, projectCode: 'PRJ_1', mode: 'edit' }
    }
  )
  return { ...view, calls }
}

test('结算方单独请求ACTIVE候选，启动后锁定且保留已停用原值回显', async () => {
  for (const status of ['ACTIVE', 'SUSPENDED', 'CLOSED', 'ARCHIVED']) {
    const v = mount(status)
    await v.state.loadBuyerOptions()
    await v.state.loadDetail('PRJ_1')
    await flush()
    assert.ok(v.calls.some((c) => c.url.endsWith('/buyers') && c.params.status?.includes('ACTIVE')))
    const select = v.components('ElSelect').find((c) => c.props.modelValue === 'BYR_B')
    assert.equal(select.props.disabled, true)
    assert.ok(
      v
        .components('ElOption')
        .some((c) => c.props.value === 'BYR_B' && c.props.label === '结算方' && c.props.disabled)
    )
    assert.equal(v.state.buildSavePayload().settlementBuyerCode, 'BYR_B')
    v.unmount()
  }
})

test('草稿结算方允许修改，保存提交所选编码', async () => {
  const v = mount('DRAFT', 'BYR_A')
  await v.state.loadBuyerOptions()
  await v.state.loadDetail('PRJ_1')
  await flush()
  const selects = v.components('ElSelect').filter((c) => c.props.modelValue === 'BYR_A')
  assert.equal(!!selects[1].props.disabled, false)
  v.state.formData.settlementBuyerCode = 'BYR_B'
  assert.equal(v.state.buildSavePayload().settlementBuyerCode, 'BYR_B')
  v.unmount()
})

test('已保存状态控制锁定，编辑表单的状态选择不能提前锁定或解锁结算方', async () => {
  const draft = mount('DRAFT', 'BYR_A')
  await draft.state.loadBuyerOptions()
  await draft.state.loadDetail('PRJ_1')
  draft.state.formData.status = 'ACTIVE'
  assert.equal(draft.state.settlementLocked, false)
  draft.unmount()
  const active = mount('ACTIVE')
  await active.state.loadBuyerOptions()
  await active.state.loadDetail('PRJ_1')
  active.state.formData.status = 'DRAFT'
  assert.equal(active.state.settlementLocked, true)
  active.unmount()
})
