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
