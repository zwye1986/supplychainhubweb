import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

test('新增商品类型编码禁用且不提交编码，编辑时继续禁用', async () => {
  const view = mountProductList({
    get: async () => ({ typeCode: 'CARD', typeName: '虚拟卡券', status: 10 })
  }, undefined, { entryFile: 'views/supplier/product/type/TypeForm.vue' })
  try {
    await view.exposed.open()
    await flushProductList()
    const codeInput = () => view.components('ElInput').find((input) => input.props.maxlength === '30')
    assert.equal(codeInput().props.disabled, '')
    assert.equal(codeInput().props.placeholder, '系统自动生成')
    assert.equal('typeCode' in view.state.buildSavePayload(), false)
    await view.exposed.open('CARD')
    await flushProductList()
    assert.equal(codeInput().props.disabled, '')
    assert.equal(view.state.formData.typeCode, 'CARD')
  } finally {
    view.unmount()
  }
})

for (const [counts, expected] of [
  [{ spuCount: 12, skuCount: 28 }, ['12', '28']],
  [{ spuCount: 0, skuCount: 0 }, ['0', '0']],
  [{}, ['0', '0']]
]) {
  test(`商品类型数量按数字在上、标签在下展示：${expected.join('/')}`, async () => {
    const view = mountProductList({
      get: async () => ({
        list: [{ typeCode: 'CARD', typeName: '虚拟卡券', ...counts }],
        total: 1
      })
    }, undefined, { entryFile: 'views/supplier/product/type/index.vue' })
    try {
      await flushProductList()
      const nodes = []
      const visit = (node) => {
        if (node.tag === 'span' && node.parent?.props.class?.includes('flex-col')) nodes.push(node)
        for (const child of node.children || []) visit(child)
      }
      visit(view.container)
      assert.deepEqual(nodes.map((node) => node.text), [expected[0], 'SPU数', expected[1], 'SKU数'])
      for (const index of [0, 2]) {
        assert.match(nodes[index].props.class, /text-24px/)
        assert.match(nodes[index].props.class, /font-700/)
        assert.match(nodes[index + 1].props.class, /text-gray-400/)
        assert.match(nodes[index].parent.props.class, /flex-col/)
      }
    } finally {
      view.unmount()
    }
  })
}
