import type {
  AfterSaleStatus,
  AfterSaleType,
  LogisticsStatus,
  OrderBizType,
  OrderStatus,
  RouteFailReason,
  SupplyMode
} from '@/api/order/types'

export const ORDER_TAB_OPTIONS: { value: OrderBizType | ''; label: string }[] = [
  { value: '', label: '全部订单' },
  { value: 'VIRTUAL_CARD', label: '虚拟卡密' },
  { value: 'VIRTUAL_RECHARGE', label: '虚拟直充' },
  { value: 'DINING', label: '点餐' },
  { value: 'MOVIE', label: '电影' }
]

export const ORDER_BIZ_TYPE_OPTIONS: { value: OrderBizType; label: string }[] = [
  { value: 'VIRTUAL_CARD', label: '虚拟卡密' },
  { value: 'VIRTUAL_RECHARGE', label: '虚拟直充' },
  { value: 'DINING', label: '点餐' },
  { value: 'MOVIE', label: '电影' },
  { value: 'HEMA', label: '盒马购' }
]

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string; type: string }[] = [
  { value: 'WAIT_PAY', label: '待支付', type: 'info' },
  { value: 'PROCESSING', label: '处理中', type: 'warning' },
  { value: 'SUCCESS', label: '成功', type: 'success' },
  { value: 'FAILED', label: '失败', type: 'danger' },
  { value: 'CLOSED', label: '已关闭', type: 'info' }
]

export const PLATFORM_STATUS_FILTER_OPTIONS = ORDER_STATUS_OPTIONS.filter((item) => item.value !== 'CLOSED')

export const SUPPLIER_STATUS_OPTIONS: { value: OrderStatus; label: string; type: string }[] = [
  { value: 'WAIT_PAY', label: '待支付', type: 'info' },
  { value: 'CLOSED', label: '已关闭', type: 'info' },
  { value: 'WAIT_SHIP', label: '待发货', type: 'warning' },
  { value: 'SHIPPED', label: '已发货', type: 'primary' },
  { value: 'FINISHED', label: '已完成', type: 'success' },
  { value: 'FAILED', label: '失败', type: 'danger' }
]

export const SUPPLY_MODE_OPTIONS: { value: SupplyMode; label: string }[] = [
  { value: 'DROP_SHIP', label: '一件代发' },
  { value: 'BATCH', label: '批量发货' },
  { value: 'STORE_PICKUP', label: '门店自提' },
  { value: 'API_DIRECT', label: 'API直发' },
  { value: 'H5_DIRECT', label: 'H5直发' }
]

export const ROUTE_FAIL_REASON_OPTIONS: { value: RouteFailReason; label: string }[] = [
  { value: 'API_TIMEOUT', label: 'API响应超时（>3s）' },
  { value: 'PRICE_OVER_THRESHOLD', label: '价格高于路由阈值' },
  { value: 'STOCK_SHORT', label: '库存不足' },
  { value: 'SUPPLIER_REJECT', label: '供应商拒单' },
  { value: 'API_ERROR', label: '接口返回异常' }
]

export const LOGISTICS_STATUS_OPTIONS: { value: LogisticsStatus; label: string; type: string }[] = [
  { value: 'UNSHIPPED', label: '未发货', type: 'info' },
  { value: 'SHIPPED', label: '已发货', type: 'primary' },
  { value: 'SIGNED', label: '已签收', type: 'success' }
]

export const SUPPLIER_LOGISTICS_STATUS_OPTIONS: { value: LogisticsStatus; label: string; type: string }[] = [
  { value: 'UNSHIPPED', label: '待发货', type: 'info' },
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

export const MOCK_DISTRIBUTORS = [
  { code: '18-001', name: '华东福利分销中心' },
  { code: '18-002', name: '苏州企业购分销商' },
  { code: '18-003', name: '华南积分商城' }
]

export const MOCK_SUPPLIERS = [
  { code: 'SUP-001', name: '腾讯会员供应商' },
  { code: 'SUP-002', name: '猫眼票务' },
  { code: 'SUP-003', name: '百胜餐饮' },
  { code: 'SUP-004', name: '京东慧采' },
  { code: 'SUP-005', name: '盒马鲜生' }
]

export const getOptionLabel = <T extends { value: any; label: string }>(options: T[], value?: any) =>
  options.find((item) => item.value === value)?.label || '-'

export const getOptionType = <T extends { value: any; type?: string }>(options: T[], value?: any) =>
  (options.find((item) => item.value === value)?.type || 'info') as any

export const formatMoney = (value?: number | null) => {
  if (value == null || Number.isNaN(Number(value))) return '¥0.00'
  return `¥${Number(value).toFixed(2)}`
}

export const formatAmount = (value?: number | null) => {
  if (value == null || Number.isNaN(Number(value))) return '0.00'
  return Number(value).toFixed(2)
}

export const isUnpaidStatus = (status?: OrderStatus) => status === 'WAIT_PAY' || status === 'CLOSED'

export const canRefund = (status?: OrderStatus) => status === 'SUCCESS' || status === 'FAILED'
export const canResend = (status?: OrderStatus) => status === 'FAILED'
export const canRouteRecord = (status?: OrderStatus) =>
  status === 'CLOSED' || status === 'PROCESSING' || status === 'SUCCESS' || status === 'FAILED'
export const canSupplierRefund = (status?: OrderStatus) => status === 'WAIT_SHIP' || status === 'SHIPPED'
