import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

const emptyComponent = { __esModule: true, default: { render: () => null } }
const mountDetail = (contacts) => mountProductList({
  get: async () => ({ supplierCode: 'SUP_001', contacts })
}, undefined, {
  entryFile: 'views/supplier/manage/detail/index.vue',
  props: { modelValue: true, supplierCode: 'SUP_001' },
  modules: {
    './InvoiceInfo.vue': emptyComponent,
    './SupplyConfig.vue': emptyComponent,
    './ProductList.vue': emptyComponent
  }
})

test('供应商基础信息按姓名、手机号、邮箱三列表格展示多名联系人', async () => {
  const contacts = [
    { id: 1, name: '张三', mobile: '13245870895', email: 'zhang@example.com' },
    { id: 2, name: '李四', mobile: '13800000000', email: '' }
  ]
  const view = mountDetail(contacts)
  try {
    await view.exposed.reload()
    await flushProductList()
    assert.equal(view.components('ElTable')[0].props.border, '')
    assert.deepEqual(view.components('ElTable')[0].props.data, contacts)
    const columns = view.components('ElTableColumn')
    assert.deepEqual(columns.map((column) => column.props.label), ['姓名', '手机号', '邮箱'])
    assert.ok(columns.every((column) => column.props.align === 'center'))
    assert.match(columns[0].text, /张三.*李四/)
    assert.match(columns[1].text, /13245870895.*13800000000/)
    assert.match(columns[2].text, /zhang@example.com.*-/)
  } finally {
    view.unmount()
  }
})

test('供应商缺少联系人时使用空列表，不残留旧联系信息', async () => {
  const view = mountDetail(undefined)
  try {
    await view.exposed.reload()
    await flushProductList()
    assert.deepEqual(view.components('ElTable')[0].props.data, [])
  } finally {
    view.unmount()
  }
})
