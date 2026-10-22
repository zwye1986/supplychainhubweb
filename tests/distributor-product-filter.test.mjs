import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

test('全部商品保留档案类型外的已关联SKU，类型筛选与分页切换后可恢复', async () => {
  const requests = []
  const products = [
    { buyerProductCode: 'BPD_13', skuName: '优惠卡券测试', productType: 'EQUITY_PRODUCT' },
    { buyerProductCode: 'BPD_14', skuName: '优惠卡券测试02', productType: 'EQUITY_PRODUCT' }
  ]
  const view = mountProductList(
    {
      get: async (request) => {
        requests.push(request)
        const rows = products.filter(
          (row) =>
            !request.params.productType?.length ||
            request.params.productType.includes(row.productType)
        )
        return { list: rows, total: rows.length }
      }
    },
    undefined,
    {
      entryFile: 'views/supplier/distribution/distributor/detail/ProductList.vue',
      props: {
        buyerCode: 'BYR_011',
        productTypeItems: [
          { id: 'MOVIE', name: '电影票' },
          { id: 'DINING', name: '生活点餐' }
        ]
      }
    }
  )
  try {
    await flushProductList()
    assert.equal(view.state.total, 2)
    assert.equal(requests.at(-1).url, '/supply-chain/buyers/BYR_011/products')
    assert.equal(Object.hasOwn(requests.at(-1).params, 'productType'), false)
    assert.match(view.text(), /优惠卡券测试02/)

    view.state.queryParams.pageNo = 3
    view.state.handleTagChange('MOVIE')
    await flushProductList()
    assert.deepEqual(requests.at(-1).params.productType, ['MOVIE'])
    assert.equal(requests.at(-1).params.pageNo, 1)
    assert.equal(view.state.total, 0)

    view.state.handleTagChange('')
    await flushProductList()
    assert.equal(Object.hasOwn(requests.at(-1).params, 'productType'), false)
    assert.equal(view.state.total, 2)

    view.state.queryParams.pageNo = 2
    await view.state.getList()
    assert.equal(requests.at(-1).params.pageNo, 2)
    assert.equal(Object.hasOwn(requests.at(-1).params, 'productType'), false)
  } finally {
    view.unmount()
  }
})
