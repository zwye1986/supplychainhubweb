import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

test('新增供应商品不展示商品分类查询项，打开、切换类型、搜索和重置均不传categoryId', async () => {
  const requests = []
  const view = mountProductList({
    get: async ({ url, params }) => {
      if (url.endsWith('/management-page')) {
        requests.push(params)
        return { list: [], total: 0 }
      }
      if (url.endsWith('/supply-scopes')) return [
        { categoryId: 101, productType: 'TYPE_A' },
        { categoryId: 102, productType: 'TYPE_B' }
      ]
      return []
    }
  }, undefined, {
    entryFile: 'views/supplier/manage/detail/ProductSelectDialog.vue',
    props: { supplierCode: 'SUP_001' }
  })
  try {
    await view.exposed.open()
    await flushProductList()
    assert.ok(!view.components('ElFormItem').some((item) => item.props?.label === '商品分类'))
    assert.equal(view.components('ProductCategory').length, 0)
    view.state.tabScrollRef.querySelector = () => null
    view.state.handleTabChange('TYPE_A')
    await flushProductList()
    assert.equal(requests.at(-1).tabCode, 'TYPE_A')
    view.state.queryParams.keyword = '测试商品'
    view.state.handleQuery()
    await flushProductList()
    assert.equal(requests.at(-1).keyword, '测试商品')
    view.state.resetQuery()
    await flushProductList()
    assert.equal(requests.length, 4)
    for (const params of requests) {
      assert.equal(Object.hasOwn(params, 'categoryId'), false)
      assert.equal(params.supplierCode, 'SUP_001')
      assert.equal(params.excludeAddedSupplierOffers, true)
      assert.equal(params.status, 10)
    }
    assert.equal(Object.hasOwn(view.state.queryParams, 'categoryId'), false)
  } finally {
    view.unmount()
  }
})
