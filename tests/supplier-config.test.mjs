import assert from 'node:assert/strict'
import test from 'node:test'

import * as configConstants from '../src/views/supplier/config/utils/constants.ts'

const {
  validateCredentialItem,
  isValidJson,
  getConnectorStatusLabel,
  getConnectorStatusType,
  getValidationStatusLabel,
  getValidationStatusType,
  getCredentialStatusLabel,
  getCredentialStatusType,
  aggregateCredentialKeys
} = configConstants

// ── 连接器生命周期状态码→标签/类型（DRAFT=0/VALIDATED=5/PUBLISHED=10/RETIRED=90）──────────
test('maps connector lifecycle status codes to labels and tag types', () => {
  assert.equal(getConnectorStatusLabel?.(0), '草稿')
  assert.equal(getConnectorStatusLabel?.(5), '已验证')
  assert.equal(getConnectorStatusLabel?.(10), '已发布')
  assert.equal(getConnectorStatusLabel?.(90), '已退役')
  assert.equal(getConnectorStatusLabel?.(undefined), '-')
  assert.equal(getConnectorStatusType?.(10), 'success')
  assert.equal(getConnectorStatusType?.(0), 'info')
})

// ── 验证结果状态码→标签/类型（0未验证/10通过/20失败/30已过期）──────────────────────────
// 与生命周期状态共用码值 10，但语义不同：生命周期 10=已发布，验证结果 10=通过。
test('maps validation result codes distinctly from lifecycle codes', () => {
  assert.equal(getValidationStatusLabel?.(0), '未验证')
  assert.equal(getValidationStatusLabel?.(10), '通过')
  assert.equal(getValidationStatusLabel?.(20), '失败')
  assert.equal(getValidationStatusLabel?.(30), '已过期')
  assert.equal(getValidationStatusType?.(10), 'success')
  assert.equal(getValidationStatusType?.(20), 'danger')
  // 防混淆：同一码值 10 在两个枚举下标签不同
  assert.notEqual(getValidationStatusLabel?.(10), getConnectorStatusLabel?.(10))
})

// ── JSON 编辑器合法性（adapter_config_json / extra_config）─────────────────────────────
test('validates JSON text for the config editor', () => {
  assert.equal(isValidJson?.('{}'), true)
  assert.equal(isValidJson?.('{"a":1}'), true)
  assert.equal(isValidJson?.(''), false)
  assert.equal(isValidJson?.('{a:1}'), false)
  assert.equal(isValidJson?.(undefined), false)
})

// ── F1-hybrid 凭据项跨字段校验（ENV vs ENVELOPE 互斥）──────────────────────────────
test('requires itemKey, providerType, maskedHint and activeSecretVersion', () => {
  assert.match(validateCredentialItem?.({}) || '', /itemKey/)
  assert.match(
    validateCredentialItem?.({ itemKey: 'USER_KEY', providerType: 'ENV' }) || '',
    /maskedHint|脱敏/
  )
})

test('accepts a complete ENV credential item with env: prefixed secretRef', () => {
  assert.equal(
    validateCredentialItem?.({
      itemKey: 'USER_KEY',
      providerType: 'ENV',
      secretRef: 'env:QNM_TEST_USERKEY',
      maskedHint: 'QNM****01',
      activeSecretVersion: 1
    }),
    null
  )
})

test('rejects ENV secretRef without env: prefix', () => {
  assert.match(
    validateCredentialItem?.({
      itemKey: 'USER_KEY',
      providerType: 'ENV',
      secretRef: 'QNM_TEST_USERKEY',
      maskedHint: 'QNM****01',
      activeSecretVersion: 1
    }) || '',
    /env:/
  )
})

test('rejects ENV item that also carries a plaintext secretValue', () => {
  assert.match(
    validateCredentialItem?.({
      itemKey: 'USER_KEY',
      providerType: 'ENV',
      secretRef: 'env:QNM_TEST_USERKEY',
      secretValue: 'should-not-be-here',
      maskedHint: 'QNM****01',
      activeSecretVersion: 1
    }) || '',
    /明文|secretValue/
  )
})

test('accepts a complete ENVELOPE credential item with plaintext secretValue', () => {
  assert.equal(
    validateCredentialItem?.({
      itemKey: 'USER_KEY',
      providerType: 'ENVELOPE',
      secretValue: 'envelope-plaintext',
      maskedHint: 'env****02',
      activeSecretVersion: 1
    }),
    null
  )
})

test('rejects ENVELOPE item missing secretValue', () => {
  assert.match(
    validateCredentialItem?.({
      itemKey: 'USER_KEY',
      providerType: 'ENVELOPE',
      maskedHint: 'env****02',
      activeSecretVersion: 1
    }) || '',
    /密钥|secretValue/
  )
})

test('rejects ENVELOPE item that also carries an env: secretRef', () => {
  assert.match(
    validateCredentialItem?.({
      itemKey: 'USER_KEY',
      providerType: 'ENVELOPE',
      secretRef: 'env:QNM_TEST_USERKEY',
      secretValue: 'envelope-plaintext',
      maskedHint: 'env****02',
      activeSecretVersion: 1
    }) || '',
    /ENVELOPE|引用|secretRef/
  )
})

test('rejects a non-positive activeSecretVersion', () => {
  assert.match(
    validateCredentialItem?.({
      itemKey: 'USER_KEY',
      providerType: 'ENV',
      secretRef: 'env:QNM_TEST_USERKEY',
      maskedHint: 'QNM****01',
      activeSecretVersion: 0
    }) || '',
    /版本号/
  )
})

// ── 凭据集/项状态码→标签/类型（CredentialStatus：10可用/20停用/90归档）──────────────────
test('maps credential status codes to labels and tag types', () => {
  assert.equal(getCredentialStatusLabel?.(10), '可用')
  assert.equal(getCredentialStatusLabel?.(20), '停用')
  assert.equal(getCredentialStatusLabel?.(90), '归档')
  assert.equal(getCredentialStatusLabel?.(undefined), '-')
  assert.equal(getCredentialStatusType?.(10), 'success')
  assert.equal(getCredentialStatusType?.(20), 'info')
})

// ── 凭据项标识候选 = 所有适配器 credentialKeys() 并集（封闭集，itemKey 校验范围）──────────
test('aggregates the union of credentialKeys across adapter types', () => {
  const union = aggregateCredentialKeys?.([
    { adapterType: 'QNM_GAME_ORDER_V1', credentialKeys: ['secretKey'] },
    { adapterType: 'HUA_SHENG_ORDER_V1', credentialKeys: ['appSecret', 'secretKey', 'privateKey'] },
    { adapterType: 'X', credentialKeys: undefined }
  ])
  assert.deepEqual(union?.slice().sort(), ['appSecret', 'privateKey', 'secretKey'])
  assert.deepEqual(aggregateCredentialKeys?.(undefined), [])
})
