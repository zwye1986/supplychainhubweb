import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

const customRule = {
  mode: 'CUSTOM', base: 'MARKET_PRICE', percentage: 0.5, operator: 'ADD', operand: 0
}
const equalRule = {
  mode: 'EQUAL_MARKET_PRICE', base: null, percentage: null,
  operator: null, operand: null, fixedPriceCents: null, basePriceSnapshotCents: null
}

const cases = [
  ['自定义公式拼接后端结果而非前端试算', { suggestedSalePriceRule: customRule, suggestedSalePrice: 10000 }, '市场价*0.5%+0元=100.00'],
  ['直接等于市场价兼容空规则字段', { suggestedSalePriceRule: equalRule, suggestedSalePrice: 9600 }, '市场价=96.00'],
  ['零金额不回退其他价格', { suggestedSalePriceRule: equalRule, suggestedSalePrice: 0, suggestedSalePriceCents: 9600 }, '市场价=0.00'],
  ['兼容分金额字段', { suggestedSalePriceRule: equalRule, suggestedSalePriceCents: 9600 }, '市场价=96.00'],
  ['空金额不伪造计算结果', { suggestedSalePriceRule: customRule, suggestedSalePrice: null }, '市场价*0.5%+0元'],
  ['没有规则仅展示实际金额', { suggestedSalePrice: 9600 }, '96.00'],
  ['规则与金额均为空', { suggestedSalePriceRule: null, suggestedSalePrice: null }, '-'],
  ['固定金额', { suggestedSalePriceRule: { mode: 'FIXED', fixedPriceCents: 9600 }, suggestedSalePrice: 9600 }, '96.00元=96.00'],
  ['不完整规则不显示null公式', { suggestedSalePriceRule: { ...equalRule, mode: 'CUSTOM' }, suggestedSalePrice: 9600 }, '96.00'],
  ['百分比零值', { suggestedSalePriceRule: { ...customRule, percentage: 0 }, suggestedSalePrice: 0 }, '市场价*0%+0元=0.00']
]

for (const entry of ['list', 'detail']) {
  for (const [name, fields, expected] of cases) {
    test(`商品${entry === 'list' ? '列表' : '详情'}销售建议价：${name}`, async () => {
      const sku = { skuCode: 'SKU_001_001', skuName: '月卡', marketPrice: 10000, ...fields }
      const detail = { spuCode: 'SPU_001', spuName: '商品', status: 10, skus: [sku] }
      const view = mountProductList({
        get: async (req) => req.url.endsWith('/management-page')
          ? { list: [detail], total: 1 }
          : req.url.endsWith('/spus/SPU_001') ? detail : []
      }, undefined, {
        entryFile: entry === 'list'
          ? 'views/supplier/product/list/index.vue'
          : 'views/supplier/product/list/detail/index.vue'
      })
      try {
        if (entry === 'detail') await view.exposed.open('SPU_001')
        await flushProductList()
        const column = view.components('ElTableColumn').find((item) => item.props.label === '销售建议价（元）')
        assert.equal(column.text.trim(), expected)
      } finally {
        view.unmount()
      }
    })
  }
}
