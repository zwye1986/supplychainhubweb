/**
 * 合作商品「上架即发布」（B1）业务侧前端纯逻辑与展示常量。
 *
 * 本模块必须保持「无 @/ 值导入」，以便用 Node 内置测试运行器（node --test）直接对纯逻辑做单测；
 * 类型只用 `import type` 或就地定义（类型在 node 类型擦除后不产生运行时依赖）。
 * 设计见 docs/superpowers/specs/2026-10-03-supplier-offer-publication-admin-design.md#86-业务侧b1f1。
 */

/**
 * i-b 履约就绪度三态；对齐后端 OfferListItem.fulfillmentStatus 与 FulfillmentStatus 枚举。
 * NOT_CONFIGURED＝尚无已发布履约版本；STALE＝身份列与当前版本冻结值漂移；READY＝一致可履约。
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
  { value: FulfillmentStatusEnum.STALE, label: '过期', type: 'warning' }
]

const findOption = (value?: string) =>
  FULFILLMENT_STATUS_OPTIONS.find((item) => item.value === value)

export const getFulfillmentStatusLabel = (status?: string): string =>
  findOption(status)?.label || '-'

export const getFulfillmentStatusType = (status?: string): TagType =>
  (findOption(status)?.type || 'info') as TagType

/**
 * 上架动作按钮文案（§8.6）：就绪态为「重新上架」（带新 expectedOfferVersion 取代旧版本，k1），
 * 未配置/过期态为「上架」。状态缺失（旧数据）按未配置处理，仍可上架。
 */
export const getOnShelfActionLabel = (status?: string): string =>
  status === FulfillmentStatusEnum.READY ? '重新上架' : '上架'

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
