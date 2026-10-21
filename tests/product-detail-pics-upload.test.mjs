import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

const mountForm = () => mountProductList({ get: async () => [] }, undefined, {
  entryFile: 'views/supplier/product/list/form/index.vue'
})

test('SKU详情图上传中禁用完成并显示提示，确认前仅更新草稿，点击完成才回显', async () => {
  const view = mountForm()
  try {
    const sku = view.state.formData.skus[0]
    sku.detailPics = ['/original.png']
    view.state.openDetailPicsEditor(sku)
    await flushProductList()
    const upload = view.components('UploadImgs')[0]
    upload.props.onUploading(true)
    upload.props['onUpdate:modelValue'](['/original.png', '/uploaded.png'])
    await flushProductList()
    assert.deepEqual(sku.detailPics, ['/original.png'])
    assert.ok(view.text().includes('图片上传中，请等待全部上传成功后点击完成。'))
    let finish = view.allButtons().find((button) => button.text.trim() === '完成')
    assert.equal(finish.props.disabled, true)
    finish.props.onClick()
    assert.equal(view.state.detailPicsDialogVisible, true)
    assert.deepEqual(sku.detailPics, ['/original.png'])
    const dialog = view.components('ElDialog')[1]
    assert.equal(dialog.props['close-on-click-modal'], false)
    assert.equal(dialog.props['close-on-press-escape'], false)
    upload.props.onUploading(false)
    await flushProductList()
    finish = view.allButtons().find((button) => button.text.trim() === '完成')
    assert.equal(finish.props.disabled, false)
    assert.deepEqual(sku.detailPics, ['/original.png'])
    finish.props.onClick()
    assert.equal(view.state.detailPicsDialogVisible, false)
    assert.deepEqual(sku.detailPics, ['/original.png', '/uploaded.png'])
  } finally {
    view.unmount()
  }
})

test('关闭详情图弹窗不提交新增或删除，重新打开及切换SKU时使用各自已确认的图片', async () => {
  const view = mountForm()
  try {
    const first = view.state.formData.skus[0]
    first.detailPics = ['/first.png']
    view.state.openDetailPicsEditor(first)
    view.state.detailPicsDraft = ['/unconfirmed.png']
    view.state.detailPicsDialogVisible = false
    await flushProductList()
    assert.deepEqual(first.detailPics, ['/first.png'])
    view.state.openDetailPicsEditor(first)
    assert.deepEqual(view.state.detailPicsDraft, ['/first.png'])
    view.state.detailPicsDraft = []
    view.state.confirmDetailPics()
    assert.deepEqual(first.detailPics, [])
    view.state.addSku()
    const second = view.state.formData.skus[1]
    view.state.openDetailPicsEditor(second)
    assert.deepEqual(view.state.detailPicsDraft, [])
    view.state.detailPicsDraft = ['/second.png']
    view.state.confirmDetailPics()
    assert.deepEqual(second.detailPics, ['/second.png'])
    assert.deepEqual(first.detailPics, [])
  } finally {
    view.unmount()
  }
})

const mountUpload = () => {
  const models = []
  const states = []
  const view = mountProductList({}, undefined, {
    entryFile: 'components/UploadFile/src/UploadImgs.vue',
    props: { modelValue: ['/existing.png'], 'onUpdate:modelValue': (urls) => models.push(urls), onUploading: (value) => states.push(value) },
    modules: {
      'element-plus': { ElNotification: () => {} },
      '@/components/ImageViewer': { createImageViewer: () => {} },
      '@/components/UploadFile/src/useUpload': { useUpload: () => ({ uploadUrl: '/upload', httpRequest: async () => {} }) }
    }
  })
  return { view, models, states }
}
const pending = (uid) => ({ uid, name: `${uid}.png`, url: `blob:${uid}`, status: 'uploading', percentage: 25 })

test('多图乱序上传只在全部结束后返回正式URL，保留选择顺序，不提交临时blob地址', () => {
  const { view, models, states } = mountUpload()
  try {
    view.state.fileList.push(pending(1), pending(2))
    assert.deepEqual(states, [true])
    view.state.uploadSuccess({ data: '/second.png' }, { uid: 2 })
    assert.equal(models.length, 0)
    assert.equal(view.state.uploading, true)
    view.state.uploadSuccess({ data: '/first.png' }, { uid: 1 })
    assert.deepEqual(models, [['/existing.png', '/first.png', '/second.png']])
    assert.deepEqual(states, [true, false])
  } finally {
    view.unmount()
  }
})

for (const failureFirst of [false, true]) {
  test(`多图部分失败不会卡住完成或丢失成功图片，失败${failureFirst ? '先' : '后'}返回`, () => {
    const { view, models, states } = mountUpload()
    try {
      view.state.fileList.push(pending(1), pending(2))
      const success = () => view.state.uploadSuccess({ data: '/success.png' }, { uid: 1 })
      const failure = () => {
        // Element Plus 在 on-error 前移除失败文件。
        view.state.fileList = view.state.fileList.filter((file) => file.uid !== 2)
        view.state.uploadError()
      }
      if (failureFirst) { failure(); success() } else { success(); failure() }
      assert.deepEqual(models, [['/existing.png', '/success.png']])
      assert.deepEqual(states, [true, false])
      view.state.fileList.push(pending(3))
      view.state.uploadSuccess({ data: '/retry.png' }, { uid: 3 })
      assert.deepEqual(models.at(-1), ['/existing.png', '/success.png', '/retry.png'])
    } finally {
      view.unmount()
    }
  })
}

test('上传成功响应缺少正式URL时按失败处理，不回写临时图片', () => {
  const { view, models } = mountUpload()
  try {
    view.state.fileList.push(pending(1))
    view.state.uploadSuccess({ data: null }, { uid: 1 })
    assert.equal(view.state.uploading, false)
    assert.deepEqual(models, [['/existing.png']])
  } finally {
    view.unmount()
  }
})
