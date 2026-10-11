import type { ProductBatchStatusResultVO } from '@/api/product'

/** 商品列表仅批量操作 SPU；与后端批量状态接口总项数上限一致。 */
export const MAX_BATCH_STATUS_COUNT = 200
const BATCH_STATUS_ENTITY_TYPE = 'SPU'

/**
 * 将 HTTP 未知回执校验为本次 SPU 请求的完整结果，旧 Boolean 不属于有效契约。
 * 成功、失败编码必须属于冻结的请求，互不重复且完整覆盖；未通过时不能计算结果计数。
 * 设计见 docs/superpowers/specs/2026-09-11-supply-chain-product-center-design.md#4110-批量上下架接口put-supply-chainproductsbatch-status。
 */
export function isSpuBatchStatusResult(
  value: unknown,
  requestedCodes: readonly string[]
): value is ProductBatchStatusResultVO {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const result = value as Record<string, unknown>
  if (!Array.isArray(result.succeeded) || !Array.isArray(result.failed)) return false
  const requested = new Set(requestedCodes)
  const seen = new Set<string>()
  const includeCode = (code: unknown): boolean => {
    if (typeof code !== 'string' || !requested.has(code) || seen.has(code)) return false
    seen.add(code)
    return true
  }
  for (const code of result.succeeded) {
    if (!includeCode(code)) return false
  }
  for (const item of result.failed) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false
    if (
      item.entityType !== BATCH_STATUS_ENTITY_TYPE ||
      !Number.isInteger(item.errorCode) ||
      typeof item.errorMessage !== 'string' ||
      !includeCode(item.code)
    ) return false
  }
  return seen.size === requested.size
}

/**
 * 同步上架必须收到显式模式及全部原子组回执，不以旧 SPU 成功回执推断 SKU 已上架。
 * 范围由后台解析；所有组、SKU 和失败定位须完整且一致，畸形回执仅供人工核对，禁止降级重写。
 * 设计见后端 docs/superpowers/specs/2026-10-11-platform-product-batch-shelf-sync-design.md#5-结果与页面交互。
 */
export function isSpuShelfSyncResult(
  value: unknown,
  requestedCodes: readonly string[]
): value is import('@/api/product').ProductShelfSyncResultVO {
  const nonblank = (code: unknown): code is string => typeof code === 'string' && code.trim().length > 0
  if (!requestedCodes.length || !requestedCodes.every(nonblank) || new Set(requestedCodes).size !== requestedCodes.length) return false
  if (!isSpuBatchStatusResult(value, requestedCodes)) return false
  if (value.syncSkuOnShelf !== true || !Array.isArray(value.groups)) return false
  const requested = new Set(requestedCodes)
  const seenGroups = new Set<string>()
  const seenSkus = new Set<string>()
  const succeeded = new Set(value.succeeded)
  const failed = new Map(value.failed.map(item => [item.code, item]))
  for (const group of value.groups) {
    if (!group || typeof group !== 'object' || Array.isArray(group)) return false
    if (!requested.has(group.spuCode) || seenGroups.has(group.spuCode) || typeof group.succeeded !== 'boolean' || !Array.isArray(group.skuCodes)) return false
    seenGroups.add(group.spuCode)
    for (const skuCode of group.skuCodes) {
      if (!nonblank(skuCode) || seenSkus.has(skuCode)) return false
      seenSkus.add(skuCode)
    }
    if (group.succeeded) {
      if (!succeeded.has(group.spuCode) || !group.skuCodes.length || group.failedEntityType != null || group.failedEntityCode != null) return false
    } else {
      const failure = failed.get(group.spuCode)
      if (!failure || failure.failedEntityType !== group.failedEntityType || failure.failedEntityCode !== group.failedEntityCode) return false
      if (group.failedEntityType === 'SPU') {
        if (group.failedEntityCode !== group.spuCode) return false
      } else if (group.failedEntityType === 'SKU') {
        if (!nonblank(group.failedEntityCode) || !group.skuCodes.includes(group.failedEntityCode)) return false
      } else return false
    }
  }
  return seenGroups.size === requested.size
}
