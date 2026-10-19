import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

const labels = { API_DIRECT: 'API直发', DROP_SHIP: '一件代发' }
const options = Object.entries(labels).map(([value, label]) => ({ value, label }))

for (const [description, supplyModes, expected] of [
  ['字符串编码', ['API_DIRECT'], ['API直发']],
  ['name为枚举编码', [{ id: 1, name: 'API_DIRECT' }], ['API直发']],
  ['id为枚举编码', [{ id: 'DROP_SHIP' }], ['一件代发']],
  ['接口中文名称', [{ id: 1, name: '接口供货名称' }], ['接口供货名称']],
  ['未知编码', ['UNKNOWN_MODE'], ['UNKNOWN_MODE']],
  ['空模式', [], []]
]) {
  test(`供应商列表供货模式展示名称：${description}`, async () => {
    const view = mountProductList({
      get: async ({ params }) => params?.view === 'simple' ? [] : {
        list: [{ supplierCode: 'SUP_001', supplierName: '供应商甲', supplyModes }], total: 1
      }
    }, undefined, {
      entryFile: 'views/supplier/manage/index.vue',
      modules: {
        '@/utils/dict': {
          getDictLabel: (type, value) => type === 'supply_chain_supply_mode' ? labels[value] || '' : '',
          getStrDictOptions: (type) => type === 'supply_chain_supply_mode' ? options : []
        }
      }
    })
    try {
      await flushProductList()
      const column = view.components('ElTableColumn').find((item) => item.props.label === '供货模式')
      for (const name of expected) assert.ok(column.text.includes(name), column.text)
      if (!expected.length) assert.equal(column.text.trim(), '-')
      assert.deepEqual(view.components('ElOption').filter((item) => labels[item.props.value])
        .map((item) => item.props.label), options.map((item) => item.label))
    } finally {
      view.unmount()
    }
  })
}
