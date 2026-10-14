import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mountProductList, flushProductList } from './support/product-list-sfc-harness.mjs'

const formula = (base = 'SUPPLY_PRICE', operator = 'ADD') => ({
  mode: 'CUSTOM',
  base,
  percentage: 105.25,
  operator,
  operand: operator === 'DIVIDE' ? 1.25 : 2.5
})
const config = () => ({
  distributionInherited: false,
  distributionRule: formula(),
  salesInherited: false,
  salesRule: formula('MARKET_PRICE', 'MULTIPLY'),
  serviceFeeInherited: false,
  serviceFeeRule: {
    percentage: 1.25,
    operator: 'ADD',
    operand: 0.25,
    hideCopy: false,
    copy: '服务费说明'
  },
  hideInherited: false,
  hideRule: { distributionThresholdPercent: 2, salesThresholdPercent: 5 },
  taxInherited: false,
  taxMetadata: { taxIncluded: true, taxRateCode: 'RATE_6', taxRateLabel: '6%' }
})
const row = (pricing = config(), extra = {}) => ({
  buyerProductCode: 'BPD_1',
  spuName: '测试商品',
  pricingRule: '等于市场价',
  displayThresholdPercent: 7,
  taxIncluded: false,
  currentPricingVersionId: 42,
  pricingStatus: 'READY',
  buyerPricingConfig: pricing,
  ...extra
})
const copy = (value) => JSON.parse(JSON.stringify(value))
async function mount(item) {
  const requests = []
  let readFailure = false
  const view = mountProductList(
    {
      get: async () => {
        if (readFailure) throw new Error('read failed')
        return { list: [item], total: 1 }
      },
      put: async (request) => {
        requests.push(copy(request))
        return { saveState: 'COMMITTED', catalogResults: [] }
      }
    },
    undefined,
    {
      entryFile: 'views/supplier/distribution/distributor/detail/ProductList.vue',
      props: { buyerCode: 'BYR_1' },
      realDetails: ['DistributionPriceForm.vue']
    }
  )
  await flushProductList()
  return {
    view,
    requests,
    failRead: () => {
      readFailure = true
    }
  }
}
async function save(item, edit = () => {}) {
  const instance = await mount(item)
  try {
    instance.view.state.openAdjust(item)
    await flushProductList()
    edit(instance.view.state.adjustPrice)
    await flushProductList()
    await instance.view.state.submitAdjust()
    assert.equal(instance.requests.length, 1)
    assert.equal(instance.requests[0].url, '/supply-chain/buyers/BYR_1/products/pricing')
    return instance.requests[0].data
  } finally {
    instance.view.unmount()
  }
}
for (const legacy of [null, 7])
  test(`真实列表与API往返原始阈值2，忽略旧列${legacy}`, async () => {
    const data = await save(row(config(), { displayThresholdPercent: legacy }))
    assert.equal(data.distributionHideThresholdPercent, 2)
    assert.equal(data.salesHideThresholdPercent, 5)
  })
for (const value of [0, 2.25, 100])
  test(`分销隐藏明确覆盖${value}不变为继承`, async () => {
    const original = config()
    original.hideRule.distributionThresholdPercent = value
    const data = await save(row(original))
    assert.equal(data.hideInherited, false)
    assert.equal(data.distributionHideThresholdPercent, value)
  })
for (const thresholds of [
  { distributionThresholdPercent: 2, salesThresholdPercent: 5 },
  { distributionThresholdPercent: null, salesThresholdPercent: 5 },
  { distributionThresholdPercent: null, salesThresholdPercent: null },
  {}
])
  test(`隐藏组保留双阈值及空覆盖${JSON.stringify(thresholds)}`, async () => {
    const original = config()
    original.hideRule = thresholds
    const data = await save(row(original))
    assert.equal(data.hideInherited, false)
    assert.equal(
      data.distributionHideThresholdPercent ?? null,
      thresholds.distributionThresholdPercent ?? null
    )
    assert.equal(data.salesHideThresholdPercent ?? null, thresholds.salesThresholdPercent ?? null)
  })
test('改变可见阈值保留销售价服务费及销售区阈值', async () => {
  const original = config()
  const data = await save(row(original), (price) => {
    price.distributionHideThresholdPercent = 3
  })
  assert.equal(data.distributionHideThresholdPercent, 3)
  assert.equal(data.salesHideThresholdPercent, 5)
  assert.equal(data.salesInherited, false)
  assert.deepEqual(data.salesRule, original.salesRule)
  assert.equal(data.serviceFeeInherited, false)
  assert.deepEqual(data.serviceFeeRule, original.serviceFeeRule)
})
for (const base of ['MARKET_PRICE', 'SUGGESTED_SALE_PRICE', 'SUPPLY_PRICE'])
  for (const operator of ['ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE'])
    test(`公式结构往返${base}/${operator}`, async () => {
      const original = config()
      original.distributionRule = formula(base, operator)
      const data = await save(row(original))
      assert.deepEqual(data.distributionRule, original.distributionRule)
    })
test('DIRECT_MARKET_PRICE原始公式回显', async () => {
  const original = config()
  original.distributionRule = { mode: 'DIRECT_MARKET_PRICE' }
  const data = await save(row(original, { pricingRule: '销售建议价 × 5% - 3' }))
  assert.deepEqual(data.distributionRule, original.distributionRule)
})
test('非零上游隐藏/价格/税务不冻结为本层覆盖，真实验证跳过继承组', async () => {
  const original = config()
  original.distributionInherited = true
  original.distributionRule = null
  original.hideInherited = true
  original.hideRule = { distributionThresholdPercent: 9, salesThresholdPercent: 8 }
  original.taxInherited = true
  original.taxMetadata = null
  const data = await save(row(original))
  assert.equal(data.distributionInherited, true)
  assert.equal(data.hideInherited, true)
  assert.equal(data.taxInherited, true)
  assert.equal(data.taxIncluded, undefined)
  assert.equal(data.taxRateCode, undefined)
})
test('继承未编辑销售价服务费时保留继承标记', async () => {
  const original = config()
  original.salesInherited = true
  original.salesRule = null
  original.serviceFeeInherited = true
  original.serviceFeeRule = null
  const data = await save(row(original))
  assert.equal(data.salesInherited, true)
  assert.equal(data.serviceFeeInherited, true)
})
test('不含税覆盖始终提交NON_TAXABLE', async () => {
  const data = await save(row(), (price) => {
    price.taxIncluded = false
    price.taxRateCode = ''
  })
  assert.equal(data.taxInherited, false)
  assert.equal(data.taxIncluded, false)
  assert.equal(data.taxRateCode, 'NON_TAXABLE')
})
for (const status of ['RECALCULATING', 'DEPENDENCY_MISSING', 'MARGIN_HIDDEN', 'CALCULATION_FAILED'])
  test(`合法非READY配置${status}仍可编辑`, async () => {
    const data = await save(row(config(), { pricingStatus: status }))
    assert.equal(data.distributionHideThresholdPercent, 2)
  })
const invalidCases = [
  [
    '缺少新增字段',
    (item) => {
      delete item.currentPricingVersionId
      delete item.pricingStatus
      delete item.buyerPricingConfig
    }
  ],
  [
    '只有目录来源版本',
    (item) => {
      delete item.currentPricingVersionId
      item.sourceBuyerPricingVersionId = 42
    }
  ],
  [
    '缺少状态',
    (item) => {
      delete item.pricingStatus
    }
  ],
  [
    '未知状态',
    (item) => {
      item.pricingStatus = 'NEW_STATUS'
    }
  ],
  [
    '版本字符串非法',
    (item) => {
      item.currentPricingVersionId = '42.1'
    }
  ],
  [
    '版本零',
    (item) => {
      item.currentPricingVersionId = 0
    }
  ],
  [
    '版本负数',
    (item) => {
      item.currentPricingVersionId = -1
    }
  ],
  [
    '版本不安全数值',
    (item) => {
      item.currentPricingVersionId = 9007199254740992
    }
  ],
  [
    '有版本无配置',
    (item) => {
      item.buyerPricingConfig = null
    }
  ],
  [
    '无版本READY',
    (item) => {
      item.currentPricingVersionId = null
    }
  ],
  [
    '缺少继承标记',
    (item) => {
      delete item.buyerPricingConfig.salesInherited
    }
  ],
  [
    '标记字符串',
    (item) => {
      item.buyerPricingConfig.hideInherited = 'false'
    }
  ],
  [
    '缺少销售覆盖',
    (item) => {
      item.buyerPricingConfig.salesRule = null
    }
  ],
  [
    '缺少服务费覆盖',
    (item) => {
      item.buyerPricingConfig.serviceFeeRule = null
    }
  ],
  [
    '缺少隐藏覆盖',
    (item) => {
      item.buyerPricingConfig.hideRule = null
    }
  ],
  [
    '税務类型错误',
    (item) => {
      item.buyerPricingConfig.taxMetadata.taxIncluded = 'true'
    }
  ],
  [
    '阈值类型错误',
    (item) => {
      item.buyerPricingConfig.hideRule.salesThresholdPercent = '5'
    }
  ],
  [
    '公式百分比类型错误',
    (item) => {
      item.buyerPricingConfig.distributionRule.percentage = '5'
    }
  ],
  [
    '公式无除数',
    (item) => {
      item.buyerPricingConfig.distributionRule.operator = 'DIVIDE'
      item.buyerPricingConfig.distributionRule.operand = 0
    }
  ]
]
for (const [label, mutate] of invalidCases)
  test(`${label}阻止编辑保存及HTTP请求`, async () => {
    const item = row()
    mutate(item)
    const { view, requests } = await mount(item)
    try {
      view.state.openAdjust(item)
      await flushProductList()
      await view.state.submitAdjust()
      assert.equal(requests.length, 0)
      assert.ok(view.messages.some((notice) => /重新读取|配置|快照/.test(notice.text)))
      assert.ok(
        view.allButtons().findLast((button) => button.text.trim() === '确 定').props.disabled
      )
    } finally {
      view.unmount()
    }
  })
test('打开合法配置后读失败使编辑快照失效', async () => {
  const item = row()
  const { view, requests, failRead } = await mount(item)
  try {
    view.state.openAdjust(item)
    await flushProductList()
    failRead()
    await view.state.getList()
    await flushProductList()
    await view.state.submitAdjust()
    assert.equal(requests.length, 0)
    assert.ok(view.allButtons().findLast((button) => button.text.trim() === '确 定').props.disabled)
  } finally {
    view.unmount()
  }
})
test('合法配置在打开后与列表原始数据隔离', async () => {
  const item = row()
  const { view, requests } = await mount(item)
  try {
    view.state.openAdjust(item)
    await flushProductList()
    item.buyerPricingConfig.salesRule.operand = 999
    item.buyerPricingConfig.hideRule.salesThresholdPercent = 99
    await view.state.submitAdjust()
    assert.equal(requests[0].data.salesRule.operand, 2.5)
    assert.equal(requests[0].data.salesHideThresholdPercent, 5)
  } finally {
    view.unmount()
  }
})
test('确认UNPRICED显示初始化并全组默认继承，不带入旧列', async () => {
  const item = row(null, { currentPricingVersionId: null, pricingStatus: 'UNPRICED' })
  const { view, requests } = await mount(item)
  try {
    view.state.openAdjust(item)
    await flushProductList()
    assert.ok(view.components('ElAlert').some((alert) => /尚未定价/.test(alert.props.title)))
    await view.state.submitAdjust()
    assert.equal(requests.length, 1)
    for (const group of ['distribution', 'sales', 'serviceFee', 'hide', 'tax'])
      assert.equal(requests[0].data[`${group}Inherited`], true)
  } finally {
    view.unmount()
  }
})
test('大版本十进制字符串保持精确且可保存', async () => {
  const item = row(config(), { currentPricingVersionId: '9007199254740993' })
  const { view, requests } = await mount(item)
  try {
    view.state.openAdjust(item)
    await flushProductList()
    assert.equal(view.state.adjustRow.currentPricingVersionId, '9007199254740993')
    await view.state.submitAdjust()
    assert.equal(requests.length, 1)
  } finally {
    view.unmount()
  }
})
test('真实编辑表单显示三组继承开关，覆盖公式与税务仍执行校验', async () => {
  const item = row()
  const { view, requests } = await mount(item)
  try {
    view.state.openAdjust(item)
    await flushProductList()
    assert.equal(view.components('ElSwitch').length, 3)
    view.state.adjustPrice.distributionRule.percentage = undefined
    await flushProductList()
    await assert.rejects(() => view.state.submitAdjust(), /百分比/)
    assert.equal(requests.length, 0)
    view.state.adjustPrice.distributionRule.percentage = 100
    view.state.adjustPrice.taxIncluded = undefined
    await flushProductList()
    await assert.rejects(() => view.state.submitAdjust(), /是否含税/)
    assert.equal(requests.length, 0)
  } finally {
    view.unmount()
  }
})
test('共享创建表单不显示编辑继承开关且保留原有必填校验', async () => {
  const model = { distributionRule: {}, taxRateCode: '' }
  const view = mountProductList({}, undefined, {
    entryFile: 'views/supplier/distribution/distributor/detail/DistributionPriceForm.vue',
    props: { modelValue: model }
  })
  try {
    await flushProductList()
    assert.equal(view.components('ElSwitch').length, 0)
    const form = view.components('ElForm')[0]
    await assert.rejects(
      () =>
        new Promise((resolve, reject) =>
          form.props.rules['distributionRule.mode'][0].validator({}, undefined, (error) =>
            error ? reject(error) : resolve()
          )
        ),
      /调价方式/
    )
  } finally {
    view.unmount()
  }
})

test('共享新增选品真实表单与API保留原创建请求映射', async () => {
  const requests = []
  const view = mountProductList(
    {
      post: async (request) => {
        requests.push(copy(request))
        return { saveState: 'COMMITTED', catalogResults: [] }
      }
    },
    undefined,
    {
      entryFile: 'views/supplier/distribution/distributor/detail/ProductSelectDialog.vue',
      props: { buyerCode: 'BYR_1' },
      realDetails: ['DistributionPriceForm.vue']
    }
  )
  try {
    view.state.selectedList = [
      {
        platformSkuCode: 'SKU_1',
        platformSkuName: '测试规格',
        price: {
          distributionRule: { mode: 'DIRECT_MARKET_PRICE' },
          taxIncluded: false,
          taxRateCode: '',
          distributionHideThresholdPercent: 0
        }
      }
    ]
    await flushProductList()
    await view.state.handleSubmit()
    assert.equal(requests.length, 1)
    assert.equal(requests[0].url, '/supply-chain/buyers/BYR_1/products')
    assert.deepEqual(requests[0].data.items, [
      {
        platformSkuCode: 'SKU_1',
        pricing: {
          distributionInherited: false,
          distributionRule: { mode: 'DIRECT_MARKET_PRICE' },
          salesInherited: true,
          serviceFeeInherited: true,
          hideInherited: false,
          distributionHideThresholdPercent: 0,
          taxInherited: false,
          taxIncluded: false
        }
      }
    ])
    assert.equal(view.components('ElSwitch').length, 0)
  } finally {
    view.unmount()
  }
})

test('异步表单验证时列表读失败也阻止保存', async () => {
  const item = row()
  const { view, requests, failRead } = await mount(item)
  try {
    view.state.openAdjust(item)
    await flushProductList()
    let release
    view.state.adjustFormRef.validate = () =>
      new Promise((resolve) => {
        release = resolve
      })
    const saving = view.state.submitAdjust()
    failRead()
    await view.state.getList()
    release()
    await saving
    assert.equal(requests.length, 0)
  } finally {
    view.unmount()
  }
})

test('异步验证期间切换编辑商品不能把新配置写入旧商品', async () => {
  const item = row()
  const { view, requests } = await mount(item)
  try {
    view.state.openAdjust(item)
    await flushProductList()
    let release
    view.state.adjustFormRef.validate = () =>
      new Promise((resolve) => {
        release = resolve
      })
    const saving = view.state.submitAdjust()
    view.state.openAdjust(row(config(), { buyerProductCode: 'BPD_2' }))
    release()
    await saving
    assert.equal(requests.length, 0)
  } finally {
    view.unmount()
  }
})

const malformedInheritedCases = [
  [
    '继承分销公式为字符串',
    (value) => {
      value.distributionInherited = true
      value.distributionRule = 'broken'
    }
  ],
  [
    '继承销售公式为数组',
    (value) => {
      value.salesInherited = true
      value.salesRule = []
    }
  ],
  [
    '继承分销公式百分比为字符串',
    (value) => {
      value.distributionInherited = true
      value.distributionRule.percentage = '105.25'
    }
  ],
  [
    '继承销售公式基数为数字',
    (value) => {
      value.salesInherited = true
      value.salesRule.base = 1
    }
  ],
  [
    '继承服务费为数组',
    (value) => {
      value.serviceFeeInherited = true
      value.serviceFeeRule = []
    }
  ],
  [
    '继承服务费隐藏标记为字符串',
    (value) => {
      value.serviceFeeInherited = true
      value.serviceFeeRule.hideCopy = 'false'
    }
  ],
  [
    '继承服务费缺少隐藏标记',
    (value) => {
      value.serviceFeeInherited = true
      delete value.serviceFeeRule.hideCopy
    }
  ],
  [
    '继承服务费文案为数字',
    (value) => {
      value.serviceFeeInherited = true
      value.serviceFeeRule.copy = 123
    }
  ],
  [
    '继承隐藏规则为字符串',
    (value) => {
      value.hideInherited = true
      value.hideRule = 'broken'
    }
  ],
  [
    '继承隐藏阈值为字符串',
    (value) => {
      value.hideInherited = true
      value.hideRule.salesThresholdPercent = '5'
    }
  ],
  [
    '继承税务规则为数组',
    (value) => {
      value.taxInherited = true
      value.taxMetadata = []
    }
  ],
  [
    '继承税务含税标记为数字',
    (value) => {
      value.taxInherited = true
      value.taxMetadata.taxIncluded = 1
    }
  ],
  [
    '继承税务税率文案为数字',
    (value) => {
      value.taxInherited = true
      value.taxMetadata.taxRateLabel = 6
    }
  ],
  [
    '覆盖税率为空白',
    (value) => {
      value.taxMetadata.taxRateCode = '   '
    }
  ]
]
for (const [label, mutate] of malformedInheritedCases)
  test(`${label}阻止编辑和API请求`, async () => {
    const original = config()
    mutate(original)
    const item = row(original)
    const { view, requests } = await mount(item)
    try {
      view.state.openAdjust(item)
      await flushProductList()
      await view.state.submitAdjust()
      assert.equal(requests.length, 0)
      assert.ok(view.messages.some((notice) => /配置不完整/.test(notice.text)))
    } finally {
      view.unmount()
    }
  })
for (const value of [null, undefined, '', '   '])
  test(`服务费展示文案${String(value)}无效时拒绝未编辑覆盖`, async () => {
    const original = config()
    original.serviceFeeRule.copy = value
    const item = row(original)
    const { view, requests } = await mount(item)
    try {
      view.state.openAdjust(item)
      await flushProductList()
      await view.state.submitAdjust()
      assert.equal(requests.length, 0)
    } finally {
      view.unmount()
    }
  })
test('继承组未使用的合法可空字段仍可原样编辑', async () => {
  const original = config()
  original.distributionInherited = true
  original.distributionRule = {
    mode: null,
    base: null,
    percentage: null,
    operator: null,
    operand: null
  }
  original.salesInherited = true
  original.salesRule = { mode: null, base: null, percentage: null, operator: null, operand: null }
  original.serviceFeeInherited = true
  original.serviceFeeRule = {
    percentage: null,
    operator: null,
    operand: null,
    hideCopy: true,
    copy: null
  }
  original.hideInherited = true
  original.hideRule = { distributionThresholdPercent: null, salesThresholdPercent: null }
  original.taxInherited = true
  original.taxMetadata = { taxIncluded: null, taxRateCode: null, taxRateLabel: null }
  const data = await save(row(original))
  for (const group of ['distribution', 'sales', 'serviceFee', 'hide', 'tax'])
    assert.equal(data[`${group}Inherited`], true)
})
test('隐藏服务费文案时允许原始文案为空', async () => {
  const original = config()
  original.serviceFeeRule.hideCopy = true
  original.serviceFeeRule.copy = null
  const data = await save(row(original))
  assert.equal(data.serviceFeeInherited, false)
  assert.equal(data.serviceFeeRule.hideCopy, true)
  assert.equal(data.serviceFeeRule.copy, null)
})
test('真实表单拒绝含税覆盖的空白税率且不调用保存API', async () => {
  const item = row()
  const { view, requests } = await mount(item)
  try {
    view.state.openAdjust(item)
    await flushProductList()
    view.state.adjustPrice.taxRateCode = '   '
    await flushProductList()
    await assert.rejects(() => view.state.submitAdjust(), /请选择税率/)
    assert.equal(requests.length, 0)
  } finally {
    view.unmount()
  }
})

test('即使表单壳放行空白税率，实际请求序列化仍阻止保存', async () => {
  const item = row()
  const { view, requests } = await mount(item)
  try {
    view.state.openAdjust(item)
    await flushProductList()
    view.state.adjustPrice.taxRateCode = '   '
    view.state.adjustFormRef.validate = async () => {}
    await view.state.submitAdjust()
    assert.equal(requests.length, 0)
    assert.ok(view.messages.some((notice) => /配置不完整/.test(notice.text)))
  } finally {
    view.unmount()
  }
})

test('合法大百分比10000000.29在真实快照及API序列化中保留两位小数', async () => {
  const original = config()
  original.distributionRule.percentage = 10000000.29
  const data = await save(row(original))
  assert.equal(data.distributionRule.percentage, 10000000.29)
})
for (const [label, mutate] of [
  [
    '百分比0.30000000000000004超出两位小数',
    (value) => {
      value.distributionRule.percentage = 0.30000000000000004
    }
  ],
  [
    '科学记数百分比1e-12超出两位小数',
    (value) => {
      value.distributionRule.percentage = 1e-12
    }
  ],
  [
    '科学记数系数1e-12超出四位小数',
    (value) => {
      value.distributionRule.operator = 'MULTIPLY'
      value.distributionRule.operand = 1e-12
    }
  ],
  [
    '科学记数隐藏阈值1e-12超出两位小数',
    (value) => {
      value.hideRule.distributionThresholdPercent = 1e-12
    }
  ]
])
  test(`${label}的快照拒绝编辑和API请求`, async () => {
    const original = config()
    mutate(original)
    const item = row(original)
    const { view, requests } = await mount(item)
    try {
      view.state.openAdjust(item)
      await flushProductList()
      await view.state.submitAdjust()
      assert.equal(requests.length, 0)
    } finally {
      view.unmount()
    }
  })
test('合法正科学记数百分比1e21在API请求保持数值', async () => {
  const original = config()
  original.distributionRule.percentage = 1e21
  const data = await save(row(original))
  assert.equal(data.distributionRule.percentage, 1e21)
})
test('表单验证通过时序列化独立拒绝超精度小数', async () => {
  const item = row()
  const { view, requests } = await mount(item)
  try {
    view.state.openAdjust(item)
    await flushProductList()
    view.state.adjustPrice.distributionRule.percentage = 0.30000000000000004
    view.state.adjustFormRef.validate = async () => {}
    await view.state.submitAdjust()
    assert.equal(requests.length, 0)
  } finally {
    view.unmount()
  }
})
