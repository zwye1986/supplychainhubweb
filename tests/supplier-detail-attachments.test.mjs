import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

const emptyComponent = { __esModule: true, default: { render: () => null } }
const mountDetail = (data) => mountProductList({ get: async () => data }, undefined, {
  entryFile: 'views/supplier/manage/detail/index.vue',
  props: { modelValue: true, supplierCode: 'SUP_001' },
  modules: {
    './InvoiceInfo.vue': emptyComponent,
    './SupplyConfig.vue': emptyComponent,
    './ProductList.vue': emptyComponent
  }
})

test('供应商详情图片显示缩略图并支持预览，混合附件只将图片加入预览列表', async () => {
  const licenseImages = ['https://files.example/license.JPG?token=123', '/license%2Epng']
  const view = mountDetail({
    licenseFileKeys: [licenseImages[0], '/license.pdf', licenseImages[1]],
    idFrontFileKey: '/id-front.jpeg',
    idBackFileKey: '/id-back.webp',
    qualificationFileKeys: ['/qualification.png', '/qualification.docx']
  })
  try {
    await view.exposed.reload()
    await flushProductList()
    const images = view.components('ElImage')
    assert.equal(images.length, 5)
    assert.deepEqual(images[0].props['preview-src-list'], licenseImages)
    assert.deepEqual(images[1].props['preview-src-list'], licenseImages)
    assert.equal(images[1].props['initial-index'], 1)
    assert.ok(images.every((image) => image.props.fit === 'contain' && image.props['preview-teleported'] === ''))
    assert.deepEqual(images.slice(2).map((image) => image.props.src), ['/id-front.jpeg', '/id-back.webp', '/qualification.png'])
    const links = view.components('ElLink')
    assert.ok(links.some((link) => link.props.href === '/license.pdf' && link.text.trim() === '附件2'))
    assert.ok(links.some((link) => link.props.href === '/qualification.docx' && link.text.trim() === '附件2'))
  } finally {
    view.unmount()
  }
})

test('身份证非图片文件保留查看正反面的链接，无附件时展示占位', async () => {
  const view = mountDetail({ idFrontFileKey: '/front.pdf', idBackFileKey: '/back.pdf' })
  try {
    await view.exposed.reload()
    await flushProductList()
    assert.equal(view.components('ElImage').length, 0)
    for (const [href, label] of [['/front.pdf', '查看正面'], ['/back.pdf', '查看反面']]) {
      const link = view.components('ElLink').find((item) => item.props.href === href)
      assert.equal(link.text.trim(), label)
      assert.equal(link.props.target, '_blank')
    }
    for (const label of ['营业执照', '资质文件']) {
      assert.equal(view.components('ElFormItem').find((item) => item.props.label === label).text.trim(), '-')
    }
  } finally {
    view.unmount()
  }
})
