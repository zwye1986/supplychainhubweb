import assert from 'node:assert/strict'
import test from 'node:test'
import { mountSupplierConfig, flushSfc } from './support/supplier-config-sfc-harness.mjs'

const capabilities = ['ISSUE_ASSET', 'CREATE_RECHARGE', 'QUERY_ORDER', 'RECEIVE_CALLBACK', 'QUERY_BALANCE']

test('capability panel explains codes while preserving enabled states and historical capabilities', async () => {
  const api = apiStub()
  api.replaceConnectors([{ connectorNo: 'CON_A', latestVersionId: 1 }])
  api.listAdapterTypes = async () => [{
    adapterType: 'QNM_GAME_ORDER_V1', capabilities,
    capabilityDescriptions: { QUERY_ORDER: '后端定义的查询订单说明', CREATE_RECHARGE: '后端定义的充值说明' }
  }]
  api.getConnectorVersionDetail = async () => ({
    adapterType: 'QNM_GAME_ORDER_V1',
    capabilities: [
      { capabilityCode: 'QUERY_ORDER', enabled: true },
      { capabilityCode: 'LEGACY_CAPABILITY', enabled: true }
    ]
  })
  const view = mountSupplierConfig(api, 'components/CapabilityPanel.vue', { supplierCode: 'SPL_A' })
  try {
    await flushSfc()
    const state = view.root.setupState
    state.selectedConnectorNo = 'CON_A'
    await state.loadDetail()
    await flushSfc()
    assert.deepEqual({ ...state.capabilityRows.find(row => row.code === 'QUERY_ORDER') }, {
      code: 'QUERY_ORDER', description: '后端定义的查询订单说明', enabled: true
    })
    assert.equal(state.capabilityRows.find(row => row.code === 'CREATE_RECHARGE').enabled, false)
    assert.equal(state.capabilityRows.find(row => row.code === 'CREATE_RECHARGE').description, '后端定义的充值说明')
    assert.equal(state.capabilityRows.find(row => row.code === 'ISSUE_ASSET').description, '暂无中文说明')
    assert.deepEqual({ ...state.capabilityRows.find(row => row.code === 'LEGACY_CAPABILITY') }, {
      code: 'LEGACY_CAPABILITY', description: '暂无中文说明', enabled: true
    })
    const columns = view.find('ElTable').subTree.children.map(vnode => vnode.props)
    assert.deepEqual(columns.map(column => column.label), ['能力编码', '能力说明', '启用态'])
    assert.equal(columns[1].prop, 'description')
  } finally { view.unmount() }
})

function apiStub() {
  let connectors = []
  return {
    replaceConnectors: (value) => { connectors = value },
    listConnectors: async () => [...connectors],
    listAdapterTypes: async () => [{ adapterType: 'QNM_GAME_ORDER_V1', capabilities }],
    listCredentialSlots: async () => [],
    listCredentialSets: async () => [],
    getMappings: async (versionId) => ({ statusMappings: [{ externalStatus: `version-${versionId}` }] }),
    getConnectorVersionDetail: async (_no, versionId) => ({ versionId, adapterType: 'QNM_GAME_ORDER_V1', capabilities: [] })
  }
}

test('new connector becomes selectable in mapping and capability panels without reselecting supplier', async () => {
  const api = apiStub()
  const view = mountSupplierConfig(api)
  try {
    view.root.setupState.supplierCode = 'SPL_REVIEW'
    await flushSfc()
    const mapping = view.find('MappingPanel').setupState
    const capability = view.find('CapabilityPanel').setupState
    assert.equal(mapping.connectors.length, 0)
    api.replaceConnectors([{ connectorNo: 'CON_NEW', latestVersionId: 1 }])
    view.find('ConnectorFormDialog').emit('success')
    await flushSfc()
    assert.equal(mapping.connectors[0]?.connectorNo, 'CON_NEW')
    assert.equal(capability.connectors[0]?.connectorNo, 'CON_NEW')
  } finally { view.unmount() }
})

test('tab activation refreshes selected version details and clears removed connector selection', async () => {
  const api = apiStub()
  api.replaceConnectors([{ connectorNo: 'CON_A', latestVersionId: 1 }])
  const view = mountSupplierConfig(api)
  try {
    view.root.setupState.supplierCode = 'SPL_REVIEW'
    await flushSfc()
    const mapping = view.find('MappingPanel').setupState
    const capability = view.find('CapabilityPanel').setupState
    mapping.selectedConnectorNo = capability.selectedConnectorNo = 'CON_A'
    await mapping.loadMappings(); await capability.loadDetail()
    api.replaceConnectors([{ connectorNo: 'CON_A', latestVersionId: 2 }])
    view.find('ElTabs').emit('tab-change', 'mapping')
    await flushSfc()
    assert.equal(mapping.mappings.statusMappings[0].externalStatus, 'version-2')
    assert.equal(capability.detail.versionId, 2)
    api.replaceConnectors([])
    view.find('ElTabs').emit('tab-change', 'capability')
    await flushSfc()
    assert.equal(mapping.selectedConnectorNo, '')
    assert.equal(capability.selectedConnectorNo, '')
    assert.equal(capability.detail, null)
  } finally { view.unmount() }
})

test('validation defaults to the entire adapter capability contract', async () => {
  const api = apiStub()
  let submitted
  api.validateConnector = async (request) => { submitted = request }
  const view = mountSupplierConfig(api, 'components/ConnectorValidateDialog.vue', {
    adapterTypes: [{ adapterType: 'QNM_GAME_ORDER_V1', capabilities }]
  })
  try {
    const state = view.root.setupState
    view.root.exposed.open({ connectorNo: 'CON_A', latestVersionId: 1, adapterType: 'QNM_GAME_ORDER_V1' })
    await flushSfc()
    assert.deepEqual([...state.formData.capabilities], capabilities)
    state.formRef = { validate: async () => true }
    await state.submitForm()
    assert.deepEqual([...submitted.capabilities], capabilities)
    state.formData.capabilities = ['CREATE_RECHARGE']
    submitted = undefined
    await state.submitForm()
    assert.equal(submitted, undefined)
    assert.ok(view.messages.length > 0)
  } finally { view.unmount() }
})

test('validation refuses to submit when adapter metadata is unavailable', async () => {
  const api = apiStub()
  let called = false
  api.validateConnector = async () => { called = true }
  const view = mountSupplierConfig(api, 'components/ConnectorValidateDialog.vue', { adapterTypes: [] })
  try {
    view.root.exposed.open({ latestVersionId: 1, adapterType: 'QNM_GAME_ORDER_V1' })
    await flushSfc()
    view.root.setupState.formRef = { validate: async () => true }
    await view.root.setupState.submitForm()
    assert.equal(called, false)
    assert.ok(view.messages.length > 0)
  } finally { view.unmount() }
})

const setAdapter = { adapterType: 'TEST_SET', credentialBindingMode: 'CREDENTIAL_SET', credentialKeys: ['appSecret', 'privateKey', 'callbackPublicKey'] }
test('real connector form offers only complete active supplier sets and clears references on adapter switch', async () => {
  const view = mountSupplierConfig(apiStub(), 'components/ConnectorFormDialog.vue', {
    supplierCode: 'SPL_A', adapterTypes: [setAdapter, { adapterType: 'QNM', credentialBindingMode: 'SINGLE_SLOT' }], credentialSlots: [],
    credentialSets: [
      { setCode: 'COMPLETE', status: 10, items: setAdapter.credentialKeys.map(itemKey => ({ itemKey, status: 10 })) },
      { setCode: 'MISSING', status: 10, items: [{ itemKey: 'appSecret', status: 10 }] },
      { setCode: 'DISABLED', status: 20, items: setAdapter.credentialKeys.map(itemKey => ({ itemKey, status: 10 })) },
      { setCode: 'EXTRA', status: 10, items: [...setAdapter.credentialKeys, 'unexpected'].map(itemKey => ({ itemKey, status: 10 })) }
    ]
  })
  try {
    view.root.exposed.open(); const state = view.root.setupState
    state.formData.adapterType = 'TEST_SET'; await flushSfc()
    assert.equal(state.bindingMode, 'CREDENTIAL_SET')
    assert.deepEqual(state.availableSets.map(row => row.setCode), ['COMPLETE'])
    state.formData.credentialSetCode = 'COMPLETE'; state.formData.credentialSlotNo = 'OLD_SLOT'
    state.formData.adapterType = 'QNM'; await flushSfc()
    assert.equal(state.formData.credentialSetCode, '')
    assert.equal(state.formData.credentialSlotNo, '')
    state.formData.credentialSlotNo = 'SLOT'; view.root.props.supplierCode = 'SPL_B'; await flushSfc()
    assert.equal(state.formData.credentialSlotNo, '')
  } finally { view.unmount() }
})
test('real SET connector form submits set code and non-secret JSON without legacy slot', async () => {
  const api = apiStub(); let submitted
  api.createConnectorDraft = async request => { submitted = request }
  const view = mountSupplierConfig(api, 'components/ConnectorFormDialog.vue', {
    supplierCode: 'SPL_A', adapterTypes: [setAdapter], credentialSlots: [], credentialSets: []
  })
  try {
    view.root.exposed.open(); const state = view.root.setupState
    state.formData.adapterType = 'TEST_SET'; await flushSfc()
    state.formData.credentialSetCode = 'COMPLETE'; state.formData.extraConfig = '{"expireTime":60}'
    state.formRef = { validate: async () => true }; await state.submitForm()
    assert.equal(submitted.credentialSetCode, 'COMPLETE'); assert.equal(submitted.credentialSlotNo, undefined)
    assert.equal(submitted.extraConfig, '{"expireTime":60}')
  } finally { view.unmount() }
})
test('connector panel loads credential sets for current supplier and ignores late old supplier response', async () => {
  const api = apiStub(); const requested = []
  api.listCredentialSets = async code => { requested.push(code); return [{ setCode: code, status: 10 }] }
  const view = mountSupplierConfig(api, 'components/ConnectorPanel.vue', { supplierCode: 'SPL_A' })
  try {
    await flushSfc(); assert.equal(view.root.setupState.credentialSets[0].setCode, 'SPL_A')
    view.root.props.supplierCode = 'SPL_B'; await flushSfc()
    assert.equal(view.root.setupState.credentialSets[0].setCode, 'SPL_B')
    assert.deepEqual(requested, ['SPL_A', 'SPL_B'])
  } finally { view.unmount() }
})

test('real credential dialog supports multiline long PEM and clears entered secret after successful write', async () => {
  const api = apiStub(); let submitted
  api.createCredentialItem = async request => { submitted = request }
  const view = mountSupplierConfig(api, 'components/CredentialItemDialog.vue', { supplierCode: 'SPL_A', setCode: 'SET', itemKeys: ['privateKey'] })
  try {
    view.root.exposed.open(); const state = view.root.setupState
    state.formData.providerType = 'ENVELOPE'; state.formData.itemKey = 'privateKey'; state.formData.maskedHint = 'masked'
    const pem = '-----BEGIN PRIVATE KEY-----\n' + 'A'.repeat(1700) + '\n-----END PRIVATE KEY-----'
    state.formData.secretValue = pem; await flushSfc()
    const input = view.find('ElInput').vnode.props
    assert.equal(input.type, 'textarea'); assert.equal(input.maxlength, '8192')
    state.formRef = { validate: async () => true }; await state.submitForm()
    assert.equal(submitted.secretValue, pem); assert.equal(submitted.secretRef, undefined)
    assert.equal(state.formData.secretValue, '')
  } finally { view.unmount() }
})

test('late old supplier credential-set response cannot overwrite new supplier options', async () => {
  const api = apiStub(); let oldResponse
  api.listCredentialSets = code => code === 'SPL_A'
    ? new Promise(resolve => { oldResponse = resolve })
    : Promise.resolve([{ setCode: 'NEW_SET', status: 10 }])
  const view = mountSupplierConfig(api, 'components/ConnectorPanel.vue', { supplierCode: 'SPL_A' })
  try {
    await flushSfc(); view.root.props.supplierCode = 'SPL_B'; await flushSfc()
    oldResponse([{ setCode: 'OLD_SET', status: 10 }]); await flushSfc()
    assert.deepEqual(view.root.setupState.credentialSets.map(set => set.setCode), ['NEW_SET'])
  } finally { view.unmount() }
})
