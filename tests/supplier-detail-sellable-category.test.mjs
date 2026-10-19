import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

const emptyComponent = { __esModule: true, default: { render: () => null } }
const labels = { EQUITY: '权益', PHYSICAL: '实物' }
const mountDetail = (get) => mountProductList({ get }, undefined, {
  entryFile: 'views/supplier/manage/detail/index.vue',
  props: { modelValue: true, supplierCode: 'SUP_001' },
  modules: {
    './InvoiceInfo.vue': emptyComponent,
    './SupplyConfig.vue': emptyComponent,
    './ProductList.vue': emptyComponent,
    '@/utils/dict': {
      getDictLabel: (type, value) => type === 'supply_chain_sellable_category' ? labels[value] || '' : ''
    }
  }
})
const categoryCell = (view) => view.components('ElDescriptionsItem')
  .find((item) => item.props.label === '可售品类')

test('从 scopes 循环提取可售品类，按编码去重并展示字典名称，悬停可查看编码', async () => {
  const view = mountDetail(async () => ({
    scopes: [
      { sellableCategory: 'EQUITY' },
      { sellableCategory: 'PHYSICAL' },
      { sellableCategory: 'EQUITY' },
      { sellableCategory: '' },
      {}
    ],
    sellableCategories: ['旧汇总字段']
  }))
  try {
    await view.exposed.reload()
    await flushProductList()
    assert.deepEqual(view.state.sellableCategories, [
      { code: 'EQUITY', name: '权益' }, { code: 'PHYSICAL', name: '实物' }
    ])
    assert.match(categoryCell(view).text, /权益.*实物/)
    assert.ok(!categoryCell(view).text.includes('旧汇总字段'))
    const tags = view.components('ElTag')
    assert.deepEqual(tags.map((tag) => tag.props.title), ['EQUITY', 'PHYSICAL'])
    assert.equal(tags.length, 2)
  } finally {
    view.unmount()
  }
})

test('未知品类保留编码，刷新为空配置时清除旧标签且不使用过期汇总字段', async () => {
  let data = { scopes: [{ sellableCategory: 'NEW_CATEGORY' }] }
  const view = mountDetail(async () => data)
  try {
    await view.exposed.reload()
    await flushProductList()
    assert.match(categoryCell(view).text, /NEW_CATEGORY/)
    data = { scopes: [], sellableCategories: ['EQUITY'] }
    await view.exposed.reload()
    await flushProductList()
    assert.equal(categoryCell(view).text.trim(), '-')
    assert.equal(view.components('ElTag').length, 0)
  } finally {
    view.unmount()
  }
})

test('旧接口没有 scopes 时兼容字符串和命名引用汇总品类', async () => {
  const view = mountDetail(async () => ({
    sellableCategories: ['EQUITY', { id: 'PHYSICAL', name: 'PHYSICAL' }, { id: 'OTHER', name: '其他品类' }]
  }))
  try {
    await view.exposed.reload()
    await flushProductList()
    assert.match(categoryCell(view).text, /权益.*实物.*其他品类/)
  } finally {
    view.unmount()
  }
})
