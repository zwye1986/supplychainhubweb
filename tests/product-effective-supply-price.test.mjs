import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

for (const [cost, expected] of [
  [null, '暂无有效供货价'],
  [0, '0.00'],
  [9500, '95.00']
]) {
  test(`平台商品有效供应价 ${cost} 显示 ${expected}`, async () => {
    const view = mountProductList({
      get: async (req) =>
        req.url.endsWith('management-page')
          ? {
              list: [
                {
                  spuCode: 'SPU_1',
                  spuName: '商品',
                  status: 10,
                  skus: [{ skuCode: 'SKU_1', status: 10, supplyPrice: cost }]
                }
              ],
              total: 1
            }
          : []
    })
    try {
      await flushProductList()
      assert.ok(view.text().includes(expected), view.text())
      if (cost !== null) assert.ok(!view.text().includes('暂无有效供货价'))
    } finally {
      view.unmount()
    }
  })
}
