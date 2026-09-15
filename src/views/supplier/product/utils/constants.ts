import { PRODUCT_STATUS } from '@/api/product/types'
import { getDictObj } from '@/utils/dict'

/** 商品类型字典 */
export const PRODUCT_TYPE_DICT = 'supply_chain_product_type'
/** 可售品类字典 */
export const SELLABLE_CATEGORY_DICT = 'supply_chain_sellable_category'
/** 商品分类字典 */
export const PRODUCT_CLASSIFICATION_DICT = 'supply_chain_product_classification'

export const FULFILLMENT_TYPE_OPTIONS = [
  { value: 'CARD_CODE_SECRET', label: '卡号卡密' },
  { value: 'DIRECT_RECHARGE', label: '虚拟直充' }
]

export const UNSHELVE_MODE_OPTIONS = [
  { value: 'MANUAL_UNSHELVE', label: '手动下架' },
  { value: 'SYSTEM_UNSHELVE', label: '系统下架' }
]

export const DELIVERY_TYPE_OPTIONS = [
  { value: 'VIRTUAL', label: '虚拟发货' },
  { value: 'EXPRESS', label: '物流快递' },
  { value: 'PICKUP', label: '自提核销' }
]

export const LIMIT_PERIOD_OPTIONS = [
  { value: 'LIFETIME', label: '终身' },
  { value: 'YEAR', label: '每年' },
  { value: 'MONTH', label: '每月' },
  { value: 'WEEK', label: '每周' },
  { value: 'DAY', label: '每天' }
]

export const PRODUCT_STATUS_OPTIONS = [
  { value: PRODUCT_STATUS.DRAFT, label: '草稿', type: 'info' },
  { value: PRODUCT_STATUS.ON_SHELF, label: '已上架', type: 'success' },
  { value: PRODUCT_STATUS.OFF_SHELF, label: '已下架', type: 'warning' }
]

export const ADJUST_MODE_OPTIONS = [
  { value: 'MARKET', label: '按照销售建议价=市场价' },
  { value: 'CUSTOM', label: '自定义设置' },
  { value: 'FIXED', label: '固定值' }
]

export const getProductStatusLabel = (value?: number) =>
  PRODUCT_STATUS_OPTIONS.find((item) => item.value === value)?.label || '-'

export const getProductStatusType = (value?: number) => {
  const color = getDictObj('supply_chain_product_status', value)?.colorType
  if (color) return color
  return (PRODUCT_STATUS_OPTIONS.find((item) => item.value === value)?.type || 'info') as any
}

export const getFulfillmentTypeLabel = (value?: string) =>
  FULFILLMENT_TYPE_OPTIONS.find((item) => item.value === value)?.label || value || '-'

export const getOffShelfLabel = (value?: string) =>
  UNSHELVE_MODE_OPTIONS.find((item) => item.value === value)?.label || value || '-'

export const getLimitPeriodLabel = (value?: string) =>
  LIMIT_PERIOD_OPTIONS.find((item) => item.value === value)?.label || value || '-'

export const getDeliveryTypeLabel = (value?: string) =>
  DELIVERY_TYPE_OPTIONS.find((item) => item.value === value)?.label || value || '-'
