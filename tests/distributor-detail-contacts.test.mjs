import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

const emptyComponent = { __esModule: true, default: { render: () => null } }
const mountDetail = (get) => mountProductList({ get }, undefined, {
  entryFile: 'views/supplier/distribution/distributor/detail/index.vue',
  props: { modelValue: true, buyerCode: 'BUY_001' },
  modules: {
    './InvoiceInfo.vue': emptyComponent,
    './ProjectList.vue': emptyComponent,
    './ProductList.vue': emptyComponent,
    './RoutingConfig.vue': emptyComponent,
    './HierarchyList.vue': emptyComponent
  }
})

test('分销商详情联系信息按姓名、手机号、邮箱展示为居中带边框的多行表格', async () => {
  const contacts = [
    { id: 1, name: '张三', mobile: '13245670895', email: '' },
    { id: 2, name: '李四', mobile: '13800000000', email: 'li@example.com' }
  ]
  const view = mountDetail(async () => ({ buyerCode: 'BUY_001', contacts }))
  try {
    await view.exposed.reload()
    await flushProductList()
    const table = view.components('ElTable')[0]
    assert.equal(table.props.border, '')
    assert.equal(table.props['header-cell-class-name'], '!font-400')
    assert.deepEqual(table.props.data, contacts)
    const columns = view.components('ElTableColumn')
    assert.deepEqual(columns.map((item) => item.props.label), ['姓名', '手机号', '邮箱'])
    assert.ok(columns.every((item) => item.props.align === 'center'))
    assert.match(columns[0].text, /张三.*李四/)
    assert.match(columns[1].text, /13245670895.*13800000000/)
    assert.match(columns[2].text, /-.*li@example.com/)
  } finally { view.unmount() }
})

test('分销商详情刷新为无联系人时清除旧联系信息', async () => {
  let contacts = [{ name: '张三', mobile: '13800000000' }]
  const view = mountDetail(async () => ({ buyerCode: 'BUY_001', contacts }))
  try {
    await view.exposed.reload()
    await flushProductList()
    contacts = undefined
    await view.exposed.reload()
    await flushProductList()
    assert.deepEqual(view.components('ElTable')[0].props.data, [])
    assert.ok(!view.components('ElTableColumn')[0].text.includes('张三'))
  } finally { view.unmount() }
})
