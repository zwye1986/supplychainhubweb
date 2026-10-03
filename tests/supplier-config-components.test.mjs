import assert from 'node:assert/strict'
import test from 'node:test'
import { mountSupplierConfig, flushSfc } from './support/supplier-config-sfc-harness.mjs'

const capabilities = ['ISSUE_ASSET', 'CREATE_RECHARGE', 'QUERY_ORDER', 'RECEIVE_CALLBACK', 'QUERY_BALANCE']
function apiStub() {
  let connectors = []
  return {
    replaceConnectors: (value) => { connectors = value },
    listConnectors: async () => [...connectors],
    listAdapterTypes: async () => [{ adapterType: 'QNM_GAME_ORDER_V1', capabilities }],
    listCredentialSlots: async () => [],
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
