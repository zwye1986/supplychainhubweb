import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

const emptyComponent = { __esModule: true, default: { render: () => null } }
const mountDetail = (data) => mountProductList({ get: async () => data }, undefined, {
  entryFile: 'views/supplier/distribution/distributor/detail/index.vue',
  props: { modelValue: true, buyerCode: 'BUY_001' },
  modules: {
    './InvoiceInfo.vue': emptyComponent,
    './ProjectList.vue': emptyComponent,
    './ProductList.vue': emptyComponent,
    './RoutingConfig.vue': emptyComponent,
    './HierarchyList.vue': emptyComponent
  }
})

test('分销商详情图片直接展示并可预览，非图片附件保留原链接，兼容大小写和带签名的图片URL', async () => {
  const licenseImages = ['https://files.example/license.JPG?token=123', '/license%2Epng']
  const view = mountDetail({
    buyerCode: 'BUY_001',
    licenseFileKeys: [licenseImages[0], '/license.pdf', licenseImages[1]],
    idFrontFileKey: '/front.jpeg',
    idBackFileKey: '/back.pdf',
    qualificationFileKeys: ['/qualification.webp', '/qualification.docx']
  })
  try {
    await view.exposed.reload()
    await flushProductList()
    const images = view.components('ElImage')
    assert.deepEqual(images.map((item) => item.props.src), [...licenseImages, '/front.jpeg', '/qualification.webp'])
    assert.deepEqual(images[0].props['preview-src-list'], licenseImages)
    assert.equal(images[1].props['initial-index'], 1)
    assert.ok(images.every((item) => item.props['preview-teleported'] === '' && item.props.fit === 'contain'))
    const links = view.components('ElLink')
    for (const [url, text] of [['/license.pdf', '附件2'], ['/back.pdf', '查看反面'], ['/qualification.docx', '附件2']]) {
      const link = links.find((item) => item.props.href === url)
      assert.equal(link.text.trim(), text)
      assert.equal(link.props.target, '_blank')
    }
  } finally { view.unmount() }
})

test('分销商没有附件时显示占位符，不渲染图片或无效下载链接', async () => {
  const view = mountDetail({ buyerCode: 'BUY_001' })
  try {
    await view.exposed.reload()
    await flushProductList()
    assert.equal(view.components('ElImage').length, 0)
    assert.equal(view.components('ElLink').length, 0)
    for (const label of ['营业执照', '身份证正面', '身份证反面', '资质文件']) {
      assert.equal(view.components('ElFormItem').find((item) => item.props?.label === label).text.trim(), '-')
    }
  } finally { view.unmount() }
})
