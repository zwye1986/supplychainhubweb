import assert from 'node:assert/strict'
import test from 'node:test'
import { mountSupplierConfig, flushSfc } from './support/supplier-config-sfc-harness.mjs'

const huashengDescription =
  '华昇采用封闭十行状态模板；错误码映射为空，失败与未知结果由协议事实裁决，不能通过填表触发退款或切供。'
const mapping = (id = 1, override = {}) => ({
  connectorVersionId: id,
  versionNo: 3,
  versionStatus: 0,
  currentPublishedVersionId: 8,
  initializeAllowed: true,
  statusAppendAllowed: true,
  errorAppendAllowed: true,
  mappingDescription: '通用映射规则',
  statusMappings: [],
  errorCodeMappings: [],
  ...override
})
function apiStub(getMappings = async (id) => mapping(id)) {
  const writes = []
  return {
    writes,
    listConnectors: async () => [
      { connectorNo: 'A', latestVersionId: 1 },
      { connectorNo: 'B', latestVersionId: 2 }
    ],
    getMappings,
    initializeMappings: async (request) => {
      writes.push(request)
      return 10
    },
    addStatusMapping: async (request) => {
      writes.push(request)
    },
    addErrorMapping: async (request) => {
      writes.push(request)
    }
  }
}
async function panel(api) {
  const view = mountSupplierConfig(api, 'components/MappingPanel.vue', { supplierCode: 'SUP_A' })
  await flushSfc()
  view.root.setupState.selectedConnectorNo = 'A'
  await view.root.setupState.loadMappings()
  await flushSfc()
  return view
}
const disabledButtons = (view) =>
  view
    .findAll('ElButton')
    .slice(0, 3)
    .map((item) => item.vnode.props.disabled)

test('real mapping panel shows loaded version, draft warning and server closed-template explanation', async () => {
  const view = await panel(
    apiStub(async (id) =>
      mapping(id, {
        initializeAllowed: false,
        statusAppendAllowed: false,
        errorAppendAllowed: false,
        mappingDescription: huashengDescription,
        statusMappings: Array.from({ length: 10 }, (_, i) => ({ externalStatus: String(i) }))
      })
    )
  )
  try {
    assert.match(view.text(), /查看版本.*v3.*1/)
    assert.match(view.text(), /草稿/)
    assert.match(view.text(), /当前已发布版本.*8/)
    assert.match(view.text(), /草稿尚未生效/)
    assert.ok(view.text().includes(huashengDescription))
    assert.match(view.text(), /状态映射（10）.*错误码映射（0）/)
    assert.deepEqual(disabledButtons(view), [true, true, true])
  } finally {
    view.unmount()
  }
})

for (const [name, result] of [
  ['missing management rules', { statusMappings: [], errorCodeMappings: [] }],
  ['mismatched version identity', mapping(9)],
  [
    'published version',
    mapping(1, {
      versionStatus: 10,
      initializeAllowed: false,
      statusAppendAllowed: false,
      errorAppendAllowed: false
    })
  ],
  [
    'validated version',
    mapping(1, {
      versionStatus: 5,
      initializeAllowed: false,
      statusAppendAllowed: false,
      errorAppendAllowed: false
    })
  ],
  [
    'closed adapter',
    mapping(1, { initializeAllowed: false, statusAppendAllowed: false, errorAppendAllowed: false })
  ]
]) {
  test(`real panel disables and guards all writes for ${name}`, async () => {
    const api = apiStub(async () => result)
    const view = await panel(api)
    try {
      assert.deepEqual(disabledButtons(view), [true, true, true])
      await view.root.setupState.handleInitialize()
      view.root.setupState.openAppend('STATUS')
      view.root.setupState.openAppend('ERROR')
      assert.deepEqual(api.writes, [])
      assert.equal(view.find('MappingAppendDialog').setupState.dialogVisible, false)
    } finally {
      view.unmount()
    }
  })
}

test('real panel keeps generic adapter initialization and append working by server rules', async () => {
  const api = apiStub()
  const view = await panel(api)
  try {
    assert.deepEqual(disabledButtons(view), [false, false, false])
    await view.root.setupState.handleInitialize()
    assert.equal(api.writes[0].connectorVersionId, 1)
    view.root.setupState.openAppend('STATUS')
    assert.equal(view.find('MappingAppendDialog').setupState.dialogVisible, true)
  } finally {
    view.unmount()
  }
})

test('initialization rechecks loaded selection after confirmation', async () => {
  const api = apiStub()
  const view = await panel(api)
  try {
    let confirm
    // 原 setup 已取得 message；通过共享确认 promise 控制真实按钮的异步边界。
    view.root.setupState.message.confirm = () =>
      new Promise((resolve) => {
        confirm = resolve
      })
    const pending = view.root.setupState.handleInitialize()
    view.root.setupState.selectedConnectorNo = 'B'
    confirm(true)
    await pending
    assert.deepEqual(api.writes, [])
  } finally {
    view.unmount()
  }
})

test('late connector mapping response cannot overwrite newer selected version', async () => {
  const api = apiStub()
  const view = await panel(api)
  try {
    let oldResponse
    api.getMappings = (id) =>
      id === 1
        ? new Promise((resolve) => {
            oldResponse = resolve
          })
        : Promise.resolve(mapping(2))
    const old = view.root.setupState.loadMappings()
    await flushSfc()
    assert.deepEqual(disabledButtons(view), [true, true, true])
    view.root.setupState.selectedConnectorNo = 'B'
    await view.root.setupState.loadMappings()
    oldResponse(mapping(1, { mappingDescription: '旧响应' }))
    await old
    assert.equal(view.root.setupState.mappings.connectorVersionId, 2)
  } finally {
    view.unmount()
  }
})

for (const outcome of ['success', 'failure']) {
  test(`old initialization ${outcome} cannot notify or reload a newer selection`, async () => {
    const api = apiStub()
    let finishOld
    api.initializeMappings = () =>
      new Promise((resolve, reject) => {
        finishOld = () => (outcome === 'success' ? resolve(10) : reject(new Error('旧初始化失败')))
      })
    const view = await panel(api)
    try {
      const state = view.root.setupState
      const oldRequest = state.handleInitialize()
      await flushSfc()
      state.selectedConnectorNo = 'B'
      await state.loadMappings()
      const currentMapping = state.mappings
      finishOld()
      await oldRequest
      await flushSfc()
      assert.equal(state.mappings, currentMapping)
      assert.equal(state.mappings.connectorVersionId, 2)
      assert.deepEqual(view.messages, [])
    } finally {
      view.unmount()
    }
  })
}

test('supplier switch clears loaded rules and ignores late old list and mapping responses', async () => {
  const api = apiStub()
  const view = await panel(api)
  try {
    let oldList, oldMapping
    api.listConnectors = (code) =>
      code === 'SUP_A'
        ? new Promise((resolve) => {
            oldList = resolve
          })
        : Promise.resolve([{ connectorNo: 'NEW', latestVersionId: 7 }])
    let firstMapping = true
    api.getMappings = (id) => {
      if (!firstMapping) return Promise.resolve(mapping(id))
      firstMapping = false
      return new Promise((resolve) => {
        oldMapping = resolve
      })
    }
    const old = view.root.setupState.loadMappings()
    const reload = view.root.setupState.reload()
    view.root.props.supplierCode = 'SUP_B'
    await flushSfc()
    oldMapping(mapping(1))
    oldList([{ connectorNo: 'A', latestVersionId: 1 }])
    await Promise.all([old, reload])
    await flushSfc()
    assert.equal(view.root.setupState.selectedConnectorNo, '')
    assert.deepEqual(
      view.root.setupState.connectors.map((row) => row.connectorNo),
      ['NEW']
    )
    assert.equal(view.root.setupState.mappings.connectorVersionId, undefined)
    assert.deepEqual(api.writes, [])
  } finally {
    view.unmount()
  }
})

test('real append dialog renders backend error classes as closed select and links retryable to action', async () => {
  const view = mountSupplierConfig(apiStub(), 'components/MappingAppendDialog.vue', {
    connectorVersionId: 1,
    statusAppendAllowed: true,
    errorAppendAllowed: true
  })
  try {
    view.root.exposed.open('ERROR', 1)
    await flushSfc()
    assert.deepEqual(
      view
        .findAll('ElOption')
        .slice(0, 4)
        .map((item) => item.vnode.props.value),
      ['BUSINESS_REJECTED', 'RETRYABLE', 'RESULT_UNKNOWN', 'MANUAL_REQUIRED']
    )
    assert.equal(view.findAll('ElSelect').length, 2)
    const state = view.root.setupState
    state.formData.actionType = 'RETRY_SAFE'
    await flushSfc()
    assert.equal(state.formData.retryable, true)
    assert.ok([true, ''].includes(view.find('ElSwitch').vnode.props.disabled))
    state.formData.actionType = 'QUERY_FIRST'
    await flushSfc()
    assert.equal(state.formData.retryable, false)
  } finally {
    view.unmount()
  }
})

test('append dialog guards open and submit against missing or revoked loaded rules', async () => {
  const api = apiStub()
  const view = mountSupplierConfig(api, 'components/MappingAppendDialog.vue', {
    connectorVersionId: 1
  })
  try {
    view.root.exposed.open('ERROR', 1)
    await flushSfc()
    assert.equal(view.root.setupState.dialogVisible, false)
    view.root.props.errorAppendAllowed = true
    view.root.exposed.open('ERROR', 1)
    await flushSfc()
    assert.equal(view.root.setupState.dialogVisible, true)
    view.root.setupState.formRef = { validate: async () => true }
    view.root.props.errorAppendAllowed = false
    await view.root.setupState.submitForm()
    assert.deepEqual(api.writes, [])
  } finally {
    view.unmount()
  }
})

test('append dialog rechecks version after asynchronous validation before writing', async () => {
  const api = apiStub()
  const view = mountSupplierConfig(api, 'components/MappingAppendDialog.vue', {
    connectorVersionId: 1,
    statusAppendAllowed: true
  })
  try {
    view.root.exposed.open('STATUS', 1)
    await flushSfc()
    let validate
    view.root.setupState.formRef = {
      validate: () =>
        new Promise((resolve) => {
          validate = resolve
        })
    }
    const pending = view.root.setupState.submitForm()
    view.root.props.connectorVersionId = 2
    validate(true)
    await pending
    assert.deepEqual(api.writes, [])
  } finally {
    view.unmount()
  }
})

test('generic dialog submits backend enums and enforced retryable value', async () => {
  const api = apiStub()
  const view = mountSupplierConfig(api, 'components/MappingAppendDialog.vue', {
    connectorVersionId: 1,
    errorAppendAllowed: true
  })
  try {
    view.root.exposed.open('ERROR', 1)
    await flushSfc()
    Object.assign(view.root.setupState.formData, {
      externalErrorCode: 'E',
      errorClass: 'RETRYABLE',
      actionType: 'RETRY_SAFE',
      retryable: false
    })
    await flushSfc()
    view.root.setupState.formRef = { validate: async () => true }
    await view.root.setupState.submitForm()
    assert.equal(api.writes[0].errorClass, 'RETRYABLE')
    assert.equal(api.writes[0].retryable, true)
  } finally {
    view.unmount()
  }
})

for (const field of [
  'connectorVersionId',
  'versionNo',
  'versionStatus',
  'currentPublishedVersionId',
  'initializeAllowed',
  'statusAppendAllowed',
  'errorAppendAllowed',
  'mappingDescription'
]) {
  test(`missing ${field} in management projection closes every write entry`, async () => {
    const result = mapping()
    delete result[field]
    const api = apiStub(async () => result)
    const view = await panel(api)
    try {
      assert.deepEqual(disabledButtons(view), [true, true, true])
      await view.root.setupState.handleInitialize()
      assert.deepEqual(api.writes, [])
    } finally {
      view.unmount()
    }
  })
}

test('generic status dialog still submits status mapping from the loaded draft', async () => {
  const api = apiStub()
  const view = mountSupplierConfig(api, 'components/MappingAppendDialog.vue', {
    connectorVersionId: 1,
    statusAppendAllowed: true
  })
  try {
    view.root.exposed.open('STATUS', 1)
    await flushSfc()
    Object.assign(view.root.setupState.formData, {
      externalStatus: 'OK',
      businessPhase: 'QUERY',
      factType: 'SUCCEEDED',
      terminal: true
    })
    view.root.setupState.formRef = { validate: async () => true }
    await view.root.setupState.submitForm()
    assert.deepEqual(api.writes[0], {
      connectorVersionId: 1,
      externalStatus: 'OK',
      externalSubStatus: undefined,
      businessPhase: 'QUERY',
      factType: 'SUCCEEDED',
      terminal: true
    })
  } finally {
    view.unmount()
  }
})

for (const outcome of ['success', 'failure']) {
  test(`old append ${outcome} cannot close or notify the newer opened form`, async () => {
    const api = apiStub()
    let finishOld
    api.addStatusMapping = () =>
      new Promise((resolve, reject) => {
        finishOld = () => (outcome === 'success' ? resolve() : reject(new Error('旧版本请求失败')))
      })
    let emitted = 0
    const view = mountSupplierConfig(api, 'components/MappingAppendDialog.vue', {
      connectorVersionId: 1,
      statusAppendAllowed: true,
      onSuccess: () => {
        emitted++
      }
    })
    try {
      view.root.exposed.open('STATUS', 1)
      await flushSfc()
      const state = view.root.setupState
      state.formRef = { validate: async () => true }
      const oldRequest = state.submitForm()
      await flushSfc()
      assert.equal(state.formLoading, true)
      view.root.props.connectorVersionId = 2
      await flushSfc()
      view.root.exposed.open('STATUS', 2)
      await flushSfc()
      state.formData.externalStatus = '新表单未提交'
      finishOld()
      await oldRequest
      await flushSfc()
      assert.equal(state.dialogVisible, true)
      assert.equal(state.formData.externalStatus, '新表单未提交')
      assert.equal(state.formLoading, false)
      assert.equal(emitted, 0)
      assert.deepEqual(view.messages, [])
    } finally {
      view.unmount()
    }
  })

  test(`old append ${outcome} finally cannot clear the newer request loading`, async () => {
    const api = apiStub()
    const attempts = []
    api.addStatusMapping = (request) =>
      new Promise((resolve, reject) => {
        attempts.push({ request, resolve, reject })
      })
    let emitted = 0
    const view = mountSupplierConfig(api, 'components/MappingAppendDialog.vue', {
      connectorVersionId: 1,
      statusAppendAllowed: true,
      onSuccess: () => {
        emitted++
      }
    })
    try {
      view.root.exposed.open('STATUS', 1)
      await flushSfc()
      const state = view.root.setupState
      state.formRef = { validate: async () => true }
      const oldRequest = state.submitForm()
      await flushSfc()
      view.root.props.connectorVersionId = 2
      await flushSfc()
      view.root.exposed.open('STATUS', 2)
      await flushSfc()
      state.formRef = { validate: async () => true }
      const newRequest = state.submitForm()
      await flushSfc()
      assert.equal(attempts.length, 2)
      assert.equal(attempts[1].request.connectorVersionId, 2)
      if (outcome === 'success') attempts[0].resolve()
      else attempts[0].reject(new Error('旧版本请求失败'))
      await oldRequest
      await flushSfc()
      assert.equal(state.formLoading, true)
      assert.equal(state.dialogVisible, true)
      assert.equal(emitted, 0)
      assert.deepEqual(view.messages, [])
      attempts[1].resolve()
      await newRequest
      await flushSfc()
      assert.equal(state.formLoading, false)
      assert.equal(state.dialogVisible, false)
      assert.equal(emitted, 1)
    } finally {
      view.unmount()
    }
  })
}
