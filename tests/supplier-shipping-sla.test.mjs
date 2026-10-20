import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

const emptyComponent = { __esModule: true, default: { render: () => null } }

test('供应商自定义发货时效输入框展示天单位，不改变输入值', () => {
  const source = fs.readFileSync(new URL('../src/views/supplier/manage/form/index.vue', import.meta.url), 'utf8')
  assert.match(source, /<el-input[^>]*v-model="formData.shippingSlaCustom"[^>]*>\s*<template #append>天<\/template>\s*<\/el-input>/)
})

for (const [custom, expected] of [['3', '自定义 / 3天'], [' 5 ', '自定义 / 5天'], ['7天', '自定义 / 7天'], ['', '自定义']]) {
  test(`供应商详情自定义发货时效 ${JSON.stringify(custom)} 展示单位天`, async () => {
    const view = mountProductList({
      get: async () => ({ shippingSlaCode: 'CUSTOM', shippingSlaCustom: custom })
    }, undefined, {
      entryFile: 'views/supplier/manage/detail/index.vue',
      props: { modelValue: true, supplierCode: 'SUP_001' },
      modules: {
        './InvoiceInfo.vue': emptyComponent,
        './SupplyConfig.vue': emptyComponent,
        './ProductList.vue': emptyComponent,
        '@/utils/dict': {
          getDictLabel: (type, value) => type === 'supply_chain_shipping_sla_code' && value === 'CUSTOM' ? '自定义' : ''
        }
      }
    })
    try {
      await view.exposed.reload()
      await flushProductList()
      const field = view.components('ElFormItem').find((item) => item.props.label === '发货时效')
      assert.equal(field.text.trim(), expected)
      assert.equal(view.state.supplier.shippingSlaCustom, custom)
    } finally {
      view.unmount()
    }
  })
}
