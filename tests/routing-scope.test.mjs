import assert from 'node:assert/strict'
import test from 'node:test'

import * as routingConstants from '../src/views/supplier/routing/rule/utils/constants.ts'

const getRoutingScopeError = routingConstants.getRoutingScopeError

test('accepts distributor and project scope across all product types and suppliers', () => {
  assert.equal(getRoutingScopeError?.('SPECIFIED', 'SPECIFIED', 'ALL', 'ALL'), null)
})

test('retains existing product type and global scopes', () => {
  assert.equal(getRoutingScopeError?.('ALL', 'ALL', 'SPECIFIED', 'ALL'), null)
  assert.equal(getRoutingScopeError?.('ALL', 'ALL', 'ALL', 'ALL'), null)
})

test('reports unsupported mixed scope before submitting', () => {
  assert.match(
    getRoutingScopeError?.('SPECIFIED', 'SPECIFIED', 'ALL', 'SPECIFIED') || '',
    /范围组合/
  )
})
