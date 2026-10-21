import assert from 'node:assert/strict'
import test from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

for (const { name, codeKey, code, entryFile, invoiceUrl } of [
  {
    name: '供应商', codeKey: 'supplierCode', code: 'SUP_001',
    entryFile: 'views/supplier/manage/detail/InvoiceInfo.vue',
    invoiceUrl: '/supply-chain/suppliers/SUP_001/invoice'
  },
  {
    name: '分销商', codeKey: 'buyerCode', code: 'BUY_001',
    entryFile: 'views/supplier/distribution/distributor/detail/InvoiceInfo.vue',
    invoiceUrl: '/supply-chain/buyers/BUY_001/invoice'
  }
]) {
const enterprise = () => ({
  [codeKey]: code, persisted: true, titleType: 'ENTERPRISE',
  invoiceTitle: '企业抬头', socialCreditCode: '91310000123456789X', phone: '02112345678',
  bankName: '企业开户行', bankAccount: '622200001111', invoiceAddress: '企业开票地址'
})
const personal = {
  invoiceTitle: '张三', phone: '13800000000', bankName: '个人开户行',
  bankAccount: '622200002222', invoiceAddress: '个人开票地址'
}
async function mountInvoice({ data = enterprise(), failSave = false, dictionary = true } = {}) {
  const writes = []
  const view = mountProductList({
    get: async () => data,
    put: async (request) => {
      writes.push(request)
      if (failSave) throw new Error('保存失败')
      return { ...request.data, [codeKey]: code, persisted: true }
    }
  }, undefined, {
    entryFile,
    props: { [codeKey]: code },
    modules: {
      '@/utils/dict': {
        // 模拟字典只有企业，缺少个人选项。
        getDictLabel: (_type, value) => dictionary && value === 'ENTERPRISE' ? '企业字典名称' : ''
      }
    }
  })
  await flushProductList()
  return { view, writes }
}
const switchType = async (view, value) => {
  const group = view.components('ElRadioGroup')[0]
  group.props['onUpdate:modelValue'](value)
  group.props.onChange(value)
  await flushProductList()
}

test(`${name}开票信息在字典缺少个人时仍可选择企业和个人，名称优先使用字典`, async () => {
  const { view } = await mountInvoice()
  try {
    view.state.handleEdit()
    await flushProductList()
    assert.equal(view.components('ElAlert').length, 0)
    assert.deepEqual(view.components('ElRadio').map((item) => [item.props.value, item.text.trim()]), [
      ['ENTERPRISE', '企业字典名称'], ['PERSONAL', '个人']
    ])
    await switchType(view, 'PERSONAL')
    assert.equal(view.state.formData.titleType, 'PERSONAL')
    assert.ok(!view.components('ElFormItem').some((item) => item.props?.prop === 'socialCreditCode'))
    for (const name of ['开户行', '开户账号', '电话', '开票地址']) {
      assert.ok(view.components('ElFormItem').some((item) => item.props?.label === name))
    }
    assert.ok(view.components('ElInput').every((item) => !item.props.disabled))
    assert.equal(view.state.formRules.socialCreditCode.length, 0)
    assert.equal(view.state.formRules.bankName[0].required, true)
    assert.equal(view.state.formRules.bankAccount[0].required, true)
  } finally { view.unmount() }
})

test(`${name}企业和个人草稿分别保留，反复切换恢复未保存的抬头、信用代码和银行等字段`, async () => {
  const { view, writes } = await mountInvoice()
  try {
    view.state.handleEdit()
    view.state.formData.invoiceTitle = '企业未保存的抬头'
    view.state.formData.bankAccount = '企业未保存的账号'
    await flushProductList()
    await switchType(view, 'PERSONAL')
    Object.assign(view.state.formData, personal)
    await switchType(view, 'ENTERPRISE')
    assert.equal(view.state.formData.invoiceTitle, '企业未保存的抬头')
    assert.equal(view.state.formData.bankAccount, '企业未保存的账号')
    assert.equal(view.state.formData.socialCreditCode, enterprise().socialCreditCode)
    assert.equal(view.state.formData.bankName, enterprise().bankName)
    assert.equal(view.state.formRules.socialCreditCode[0].required, true)
    await switchType(view, 'PERSONAL')
    for (const [key, value] of Object.entries(personal)) assert.equal(view.state.formData[key], value)
    assert.equal(writes.length, 0)
  } finally { view.unmount() }
})

test(`${name}个人保存提交银行、账号等全部公共字段，不提交企业信用代码，保存后只读显示个人`, async () => {
  const { view, writes } = await mountInvoice()
  try {
    view.state.handleEdit()
    await flushProductList()
    await switchType(view, 'PERSONAL')
    Object.assign(view.state.formData, personal)
    await view.state.handleSave()
    await flushProductList()
    assert.equal(writes[0].url, invoiceUrl)
    assert.deepEqual(JSON.parse(JSON.stringify(writes[0].data)), { titleType: 'PERSONAL', ...personal })
    assert.equal(view.state.isEditing, false)
    const type = view.components('ElFormItem').find((item) => item.props?.prop === 'titleType')
    assert.equal(type.text.trim(), '个人')
    assert.ok(view.text().includes(personal.bankName))
  } finally { view.unmount() }
})

test(`${name}取消编辑恢复原始企业数据并丢弃两类草稿，下一次编辑不串入旧草稿`, async () => {
  const { view } = await mountInvoice({ dictionary: false })
  try {
    view.state.handleEdit()
    await flushProductList()
    await switchType(view, 'PERSONAL')
    Object.assign(view.state.formData, personal)
    view.state.handleCancel()
    await flushProductList()
    assert.equal(view.state.formData.titleType, 'ENTERPRISE')
    assert.equal(view.state.formData.invoiceTitle, enterprise().invoiceTitle)
    assert.equal(view.state.formData.socialCreditCode, enterprise().socialCreditCode)
    view.state.handleEdit()
    await flushProductList()
    await switchType(view, 'PERSONAL')
    assert.equal(view.state.formData.invoiceTitle, '')
    assert.equal(view.state.formData.bankAccount, '')
  } finally { view.unmount() }
})

test(`${name}加载已保存个人记录仍可编辑银行字段，保存失败不丢失草稿且能恢复企业草稿`, async () => {
  const { view } = await mountInvoice({ data: { ...enterprise(), ...personal, titleType: 'PERSONAL' }, failSave: true })
  try {
    view.state.handleEdit()
    await flushProductList()
    await switchType(view, 'ENTERPRISE')
    Object.assign(view.state.formData, enterprise())
    await switchType(view, 'PERSONAL')
    assert.equal(view.state.formData.bankAccount, personal.bankAccount)
    await assert.rejects(view.state.handleSave(), /保存失败/)
    assert.equal(view.state.isEditing, true)
    assert.equal(view.state.saving, false)
    await switchType(view, 'ENTERPRISE')
    assert.equal(view.state.formData.socialCreditCode, enterprise().socialCreditCode)
    assert.equal(view.state.formData.invoiceTitle, enterprise().invoiceTitle)
  } finally { view.unmount() }
})
}
