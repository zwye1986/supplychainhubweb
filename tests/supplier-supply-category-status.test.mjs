import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

const scope = { sellableCategory: 'DISABLED', productType: 'TYPE_1', productClassification: 'CAT_1', supplyModes: ['API_DIRECT'] }

test('供货配置可售品类仅展示status为0的选项，兼容数值和字符串状态，不修改已有配置', async () => {
  const requests = []
  const view = mountProductList({
    get: async (request) => {
      requests.push(request)
      if (request.url === '/system/dict-data/page') return { list: [
        { value: 'EQUITY', label: '权益', status: 0 },
        { value: 'PHYSICAL', label: '实物', status: '0' },
        { value: 'DISABLED', label: '停用品类', status: 1 },
        { value: 'DISABLED_STRING', label: '停用品类二', status: '1' },
        { value: 'MISSING', label: '未知状态' },
        { value: 'NULL', label: '空状态', status: null },
        { value: 'EMPTY', label: '空字符串状态', status: '' }
      ], total: 7 }
      return [scope]
    }
  }, undefined, {
    entryFile: 'views/supplier/manage/detail/SupplyConfig.vue',
    props: { supplierCode: 'SUP_001' }
  })
  try {
    await flushProductList()
    assert.deepEqual(requests.find((request) => request.url === '/system/dict-data/page')?.params, {
      pageNo: 1, pageSize: 100, dictType: 'supply_chain_sellable_category', status: 0
    })
    assert.ok(!requests.some((request) => request.url.startsWith('/system/dict-data/type')))
    assert.deepEqual(view.components('ElOption').map((item) => [item.props.value, item.props.label]), [
      ['EQUITY', '权益'], ['PHYSICAL', '实物']
    ])
    assert.equal(view.state.list[0].sellableCategory, 'DISABLED')
    assert.equal(view.state.sellableCategoriesLoading, false)
  } finally {
    view.unmount()
  }
})

test('可售品类加载失败时不回退到包含停用品类的缓存', async () => {
  const view = mountProductList({
    get: async ({ url }) => {
      if (url === '/system/dict-data/page') throw new Error('读取失败')
      return [scope]
    }
  }, undefined, {
    entryFile: 'views/supplier/manage/detail/SupplyConfig.vue',
    props: { supplierCode: 'SUP_001' },
    modules: {
      '@/utils/dict': { getStrDictOptions: (type) => type === 'supply_chain_sellable_category'
        ? [{ value: 'DISABLED', label: '停用品类' }] : [] }
    }
  })
  try {
    await flushProductList()
    assert.equal(view.components('ElOption').length, 0)
    assert.equal(view.state.sellableCategoriesLoading, false)
    assert.ok(view.messages.some((message) => message.text.includes('可售品类加载失败')))
  } finally {
    view.unmount()
  }
})

test('可售品类超过一页时继续读取后续页，不遗漏启用品类', async () => {
  const pages = []
  const view = mountProductList({
    get: async ({ url, params }) => {
      if (url !== '/system/dict-data/page') return [scope]
      pages.push(params.pageNo)
      const count = params.pageNo === 1 ? 100 : 1
      return {
        list: Array.from({ length: count }, (_, index) => ({
          value: `CAT_${(params.pageNo - 1) * 100 + index}`, label: `品类${index}`, status: 0
        })),
        total: 101
      }
    }
  }, undefined, {
    entryFile: 'views/supplier/manage/detail/SupplyConfig.vue',
    props: { supplierCode: 'SUP_001' }
  })
  try {
    await flushProductList()
    assert.deepEqual(pages, [1, 2])
    assert.equal(view.components('ElOption').length, 101)
    assert.ok(view.components('ElOption').some((item) => item.props.value === 'CAT_100'))
  } finally {
    view.unmount()
  }
})

test('可售品类按字典sort升序排列，相同sort按ID升序，不沿用分页接口倒序', async () => {
  const view = mountProductList({
    get: async ({ url }) => url === '/system/dict-data/page' ? {
      list: [
        { id: 40, value: 'LAST', label: '最后', sort: 20, status: 0 },
        { id: 30, value: 'SECOND', label: '第二', sort: '10', status: 0 },
        { id: 20, value: 'FIRST', label: '第一', sort: 10, status: 0 },
        { id: 10, value: 'DISABLED', label: '停用', sort: 0, status: 1 }
      ],
      total: 4
    } : [scope]
  }, undefined, {
    entryFile: 'views/supplier/manage/detail/SupplyConfig.vue',
    props: { supplierCode: 'SUP_001' }
  })
  try {
    await flushProductList()
    assert.deepEqual(view.components('ElOption').map((item) => item.props.value), ['FIRST', 'SECOND', 'LAST'])
  } finally {
    view.unmount()
  }
})
