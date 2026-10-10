import type { CardInfoVO, OrderCardAssetView } from './types'

const NOT_PROVIDED = '供应商未提供'
const INVALID_RESPONSE = '供应商有效期响应无效'

/**
 * 授权资产到页面值的唯一映射：保留供应商原文与卡密，旧资产继续使用日期范围。
 * 设计：docs/superpowers/specs/2026-10-09-huasheng-type201-production-closure-design.md#72-task7授权查询与有效期展示契约。
 */
export function mapCardAsset(
  card: OrderCardAssetView,
  formatDateTime: (value?: string | null) => string | undefined
): CardInfoVO {
  let expireTime: string
  switch (card.validTimeState) {
    case 'VALUE':
      if (typeof card.validTimeRaw !== 'string') throw new Error(INVALID_RESPONSE)
      expireTime = card.validTimeRaw === '' ? NOT_PROVIDED : card.validTimeRaw
      break
    case 'ABSENT':
    case 'NULL':
      if (card.validTimeRaw != null) throw new Error(INVALID_RESPONSE)
      expireTime = NOT_PROVIDED
      break
    case undefined:
    case null:
      if (card.validTimeRaw != null) throw new Error(INVALID_RESPONSE)
      expireTime = [formatDateTime(card.validFrom), formatDateTime(card.validUntil)]
        .filter(Boolean)
        .join(' ~ ')
      break
    default:
      throw new Error(INVALID_RESPONSE)
  }
  return { cardNo: card.cardCode, password: card.cardSecret, expireTime }
}
