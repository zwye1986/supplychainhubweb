/**
 * 合作商品独立上下架与履约配置展示常量。
 *
 * 本模块必须保持「无 @/ 值导入」，以便用 Node 内置测试运行器（node --test）直接对纯逻辑做单测；
 * 类型只用 `import type` 或就地定义（类型在 node 类型擦除后不产生运行时依赖）。
 * 设计见 docs/superpowers/specs/2026-10-11-supplier-offer-lifecycle-design.md#2-单一读模型与前端契约。
 */

/**
 * i-b 履约就绪度三态；对齐后端 OfferListItem.fulfillmentStatus 与 FulfillmentStatus 枚举。
 * NOT_CONFIGURED＝尚无已发布履约版本；STALE＝有待发布变更；READY＝配置与冻结版本一致。发布资格另由后端canPublish判断。
 */
export const FulfillmentStatusEnum = {
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  STALE: 'STALE',
  READY: 'READY'
} as const

export type FulfillmentStatus = (typeof FulfillmentStatusEnum)[keyof typeof FulfillmentStatusEnum]

type TagType = 'success' | 'warning' | 'info' | 'danger' | 'primary'

export const FULFILLMENT_STATUS_OPTIONS: { value: string; label: string; type: TagType }[] = [
  { value: FulfillmentStatusEnum.READY, label: '就绪', type: 'success' },
  { value: FulfillmentStatusEnum.NOT_CONFIGURED, label: '未配置', type: 'info' },
  { value: FulfillmentStatusEnum.STALE, label: '待发布变更', type: 'warning' }
]

const findOption = (value?: string) =>
  FULFILLMENT_STATUS_OPTIONS.find((item) => item.value === value)

export const getFulfillmentStatusLabel = (status?: string): string =>
  findOption(status)?.label || '-'

export const getFulfillmentStatusType = (status?: string): TagType =>
  (findOption(status)?.type || 'info') as TagType

/** 合作商品生命周期与后端OfferStatus契约一致，不能用履约配置状态替代。 */
export const OfferStatusEnum = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  SUSPENDED: 'SUSPENDED',
  RETIRED: 'RETIRED'
} as const

/**
 * 固定生命周期文案不依赖系统字典，避免字典缺失时状态列空白。
 * 状态仅表示合作商品上下架，不替代履约就绪度；未知状态保留原码用于排查，不推断为已下架。
 * 设计见 docs/superpowers/specs/2026-10-11-supplier-offer-lifecycle-design.md#2-单一读模型与前端契约。
 */
const OFFER_STATUS_OPTIONS: { value: string; label: string; type: TagType }[] = [
  { value: OfferStatusEnum.DRAFT, label: '草稿', type: 'info' },
  { value: OfferStatusEnum.PUBLISHED, label: '已上架', type: 'success' },
  { value: OfferStatusEnum.SUSPENDED, label: '已下架', type: 'info' },
  { value: OfferStatusEnum.RETIRED, label: '已移除', type: 'info' }
]

export const getOfferStatusLabel = (status?: string | null): string =>
  OFFER_STATUS_OPTIONS.find((item) => item.value === status)?.label || status || '-'

export const getOfferStatusType = (status?: string | null): TagType =>
  OFFER_STATUS_OPTIONS.find((item) => item.value === status)?.type || 'info'

/** 状态缺失或未知不推断为下架，避免旧数据误显示发布操作。 */
export const getOnShelfActionLabel = (status?: string): '上架' | '下架' | undefined => {
  if (status === OfferStatusEnum.PUBLISHED) return '下架'
  if (status === OfferStatusEnum.SUSPENDED) return '上架'
  return undefined
}

/** externalSkuCode 最大长度；对齐后端 f1 身份列与 DraftReqVO @Schema。 */
export const EXTERNAL_SKU_CODE_MAX_LENGTH = 128

/**
 * f1 选品必填 externalSkuCode 即时校验（保存前）；后端 requireExternalSkuCode 为最终裁决。
 * 规则：去空白后非空、长度 <= 128。返回首个错误文案，通过返回 null。
 */
export const validateExternalSkuCode = (value?: string | null): string | null => {
  const trimmed = value?.trim()
  if (!trimmed) return '请填写供应商商品编码 externalSkuCode（下单时据此定位履约商品）'
  if (trimmed.length > EXTERNAL_SKU_CODE_MAX_LENGTH) {
    return `供应商商品编码长度不得超过 ${EXTERNAL_SKU_CODE_MAX_LENGTH} 个字符`
  }
  return null
}
