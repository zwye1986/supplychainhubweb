import type { AfterSaleStatus, AfterSaleType, LogisticsStatus, OrderBizType, OrderStatus } from '@/api/order/types'

export const ORDER_BIZ_TYPE_OPTIONS: { value: OrderBizType; label: string }[] = [
  { value: 'EQUITY', label: '权益商品' },
  { value: 'DINING', label: '点餐' },
  { value: 'MOVIE', label: '电影' },
  { value: 'HEMA', label: '盒马购' }
]

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string; type: string }[] = [
  { value: 'WAIT_PAY', label: '待支付', type: 'info' },
  { value: 'WAIT_SHIP', label: '待发货', type: 'warning' },
  { value: 'SHIPPED', label: '已发货', type: 'primary' },
  { value: 'FINISHED', label: '已完成', type: 'success' },
  { value: 'AFTER_SALE', label: '售后中', type: 'danger' },
  { value: 'CLOSED', label: '已关闭', type: 'info' }
]

export const LOGISTICS_STATUS_OPTIONS: { value: LogisticsStatus; label: string; type: string }[] = [
  { value: 'UNSHIPPED', label: '未发货', type: 'info' },
  { value: 'SHIPPED', label: '已发货', type: 'primary' },
  { value: 'SIGNED', label: '已签收', type: 'success' }
]

export const AFTER_SALE_TYPE_OPTIONS: { value: AfterSaleType; label: string }[] = [
  { value: 'RETURN_REFUND', label: '退货退款' },
  { value: 'REFUND_ONLY', label: '仅退款' },
  { value: 'OTHER', label: '其他' }
]

export const AFTER_SALE_REASON_OPTIONS = [
  '不想要了',
  '质量问题',
  '商品发错货',
  '商品损坏',
  '商品降价',
  '商品质量与描述不符',
  '缺少件',
  '物流问题',
  '7天无理由退货',
  '其他'
]

export const AFTER_SALE_STATUS_OPTIONS: { value: AfterSaleStatus; label: string; type: string }[] = [
  { value: 'NONE', label: '未申请', type: 'info' },
  { value: 'WAIT_PLATFORM', label: '待平台审核', type: 'warning' },
  { value: 'WAIT_DISTRIBUTOR', label: '待分销商处理', type: 'warning' },
  { value: 'WAIT_USER_POST', label: '待用户邮寄', type: 'primary' },
  { value: 'WAIT_SUPPLIER', label: '待供应商确认', type: 'primary' },
  { value: 'WAIT_USER_CONFIRM', label: '待用户确认收货', type: 'warning' },
  { value: 'FINISHED', label: '已完成', type: 'success' },
  { value: 'REJECTED', label: '已拒绝', type: 'danger' },
  { value: 'CANCELLED', label: '已撤销', type: 'info' }
]

export const getOptionLabel = <T extends { value: any; label: string }>(options: T[], value?: any) =>
  options.find((item) => item.value === value)?.label || '-'

export const getOptionType = <T extends { value: any; type?: string }>(options: T[], value?: any) =>
  (options.find((item) => item.value === value)?.type || 'info') as any

export const formatMoney = (value?: number | null) => {
  if (value == null || Number.isNaN(Number(value))) return '¥0.00'
  return `¥${Number(value).toFixed(2)}`
}
