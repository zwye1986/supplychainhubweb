export type OrderBizType =
  'VIRTUAL_CARD' | 'VIRTUAL_RECHARGE' | 'DINING' | 'MOVIE' | 'HEMA' | 'INSTORE'
export type FulfillmentStatus =
  'WAITING' | 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'MANUAL' | 'CANCELLED'
export type SettlementStatus = 'PENDING' | 'MATCHED' | 'MISMATCH' | 'MANUAL'
export type SupplierAttemptOrderType = 'CARD' | 'O2O' | 'INSTORE'
export type PlatformOrderStatus =
  'WAIT_PAY' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CLOSED' | 'MANUAL'
export type SupplierOrderStatus =
  'WAIT_PAY' | 'CLOSED' | 'WAIT_SHIP' | 'SHIPPED' | 'FINISHED' | 'FAILED' | 'MANUAL' | 'CANCELLED'
export type OrderStatus = PlatformOrderStatus | SupplierOrderStatus
export type SupplyMode = 'DROP_SHIP' | 'BATCH' | 'STORE_PICKUP' | 'API_DIRECT' | 'H5_DIRECT'
export type LogisticsStatus = 'UNSHIPPED' | 'SHIPPED' | 'SIGNED'
export type RouteResult = 'SUCCESS' | 'FAILED'
export type RouteFailReason =
  'API_TIMEOUT' | 'PRICE_OVER_THRESHOLD' | 'STOCK_SHORT' | 'SUPPLIER_REJECT' | 'API_ERROR'
export type AfterSaleType = 'RETURN_REFUND' | 'REFUND_ONLY' | 'OTHER'
export type AfterSaleStatus =
  | 'NONE'
  | 'WAIT_PLATFORM'
  | 'WAIT_DISTRIBUTOR'
  | 'WAIT_USER_POST'
  | 'WAIT_SUPPLIER'
  | 'WAIT_USER_CONFIRM'
  | 'FINISHED'
  | 'REJECTED'
  | 'CANCELLED'

/** 华昇有效期三态；原文不保证日期格式。设计：后端生产闭环设计 §7.2。 */
export type SupplierValidTime =
  | { validTimeState: 'VALUE'; validTimeRaw: string }
  | { validTimeState: 'ABSENT' | 'NULL'; validTimeRaw?: null }
  | { validTimeState?: null; validTimeRaw?: null }

export type OrderCardAssetView = {
  cardCode?: string
  cardSecret?: string
  validFrom?: string
  validUntil?: string
} & SupplierValidTime

export interface CardInfoVO {
  cardNo?: string
  password?: string
  expireTime?: string
}

export interface RechargeInfoVO {
  account?: string
  result?: string
  voucherNo?: string
  assetNo?: string
}

export interface OrderItemVO {
  id?: number
  name: string
  picUrl?: string
  skuCode: string
  spec?: string
  qty: number
  afterSaleQty?: number
  supplyPrice: number
  distPrice?: number
  projectPrice?: number
  salePrice: number
  serviceFee: number
  couponAmount: number
  orderType: OrderBizType
  supplierName?: string
  distSubOrderNo?: string
  logisticsStatus?: LogisticsStatus
  afterSaleType?: AfterSaleType
  afterSaleStatus?: AfterSaleStatus
  ticketCode?: string
  pickupCode?: string
  ticketCodes?: string[]
  pickupCodes?: string[]
  cardInfos?: CardInfoVO[]
  rechargeInfo?: RechargeInfoVO
  rechargeInfos?: RechargeInfoVO[]
}

export interface PackageTraceVO {
  time: string
  content: string
}

export interface SupplierOrderRefVO {
  supplierOrderNo: string
  supplierName?: string
  status?: OrderStatus
}

export interface RouteStepVO {
  index: number
  supplierName: string
  result: RouteResult
  time: string
  supplyPrice: number
  assignQty: number
  failReason?: RouteFailReason
  remark?: string
  request?: string | Record<string, any>
  response?: string | Record<string, any>
}

export interface OrderRouteRecordVO {
  orderNo: string
  productName: string
  qty?: number
  status?: RouteResult | ''
  productType: OrderBizType
  tryCount: number
  failCount: number
  finalSupplierName?: string
  supplierOrderNo?: string
  durationSec?: number
  steps: RouteStepVO[]
}

export interface OrderVO {
  terminalReasonCode?: string
  failureClosures?: import('./failure-closure').FailureClosure[]
  id?: number
  orderNo: string
  supplierOrderNo?: string
  buyerOrderNo?: string
  relatedPlatformOrderNo?: string
  distributorOrderNo?: string
  parentOrderNo?: string
  bizType: OrderBizType
  status: OrderStatus
  amount: number
  qty: number
  supplierName?: string
  distributorName?: string
  projectName?: string
  buyerId?: string
  buyerName?: string
  buyerMobile?: string
  buyerGroup?: string
  receiverName?: string
  receiverMobile?: string
  receiverAddress?: string
  payMethod?: string
  payTradeNo?: string
  goodsAmount?: number
  freightAmount?: number
  serviceFee?: number
  couponAmount?: number
  distGoodsAmount?: number
  distFreightAmount?: number
  distFeeAmount?: number
  projectPayAmount?: number
  projectGoodsAmount?: number
  projectFreightAmount?: number
  distributorPayAmount?: number
  distributorGoodsAmount?: number
  distributorFreightAmount?: number
  supplyMode?: SupplyMode
  deliveryMode?: string
  shipTime?: string
  remark?: string
  finishTime?: string
  createTime?: string
  pushTime?: string
  confirmTime?: string
  items: OrderItemVO[]
  traces?: PackageTraceVO[]
  supplierOrders?: SupplierOrderRefVO[]
  source?: 'PLATFORM' | 'SUPPLIER'
}

export interface AfterSaleVO {
  id?: number
  afterSaleNo: string
  orderNo: string
  itemId?: number
  type: AfterSaleType
  status: AfterSaleStatus
  reason?: string
  qty: number
  description?: string
  pics?: string[]
  refundToDistributor?: number
  refundToUser?: number
  refundCash?: number
  refundBalance?: number
  refundFreight?: number
  refundServiceFee?: number
  applyTime?: string
  auditRemark?: string
  order?: OrderVO
  item?: OrderItemVO
  timeline?: { status: string; time?: string; operator?: string; remark?: string; done?: boolean }[]
}

export interface OrderPageParam {
  pageNo?: number
  pageSize?: number
  bizType?: OrderBizType | ''
  bizTypes?: OrderBizType[]
  source?: 'PLATFORM' | 'SUPPLIER'
  orderNo?: string
  status?: OrderStatus
  statuses?: OrderStatus[]
  createFrom?: string
  createTo?: string
  supplierOrderNo?: string
  distributorOrderNo?: string
  supplierNames?: string[]
  distributorNames?: string[]
  supplierName?: string
  distributorName?: string
  productName?: string
  buyerKeyword?: string
  receiverKeyword?: string
  supplyMode?: SupplyMode
}

/** 供应商履约尝试（GET /supply-chain/supplier-orders） */
export interface SupplierOrderView {
  failureClosure?: import('./failure-closure').FailureClosure
  bOrderNo: string
  attemptNo?: number
  active?: boolean
  orderNo?: string
  orderType?: SupplierAttemptOrderType | string
  buyerCode?: string
  buyerName?: string
  buyerOrderNo?: string
  supplierCode?: string
  supplierName?: string
  skuCode?: string
  skuName?: string
  billno?: string
  externalOrderNo?: string
  requestedQuantity?: number
  fulfilledQuantity?: number
  /** 供应商结算单价，单位分 */
  supplierSettlementUnitPrice?: number
  /** 预计供应商结算金额，单位分 */
  expectedSupplierSettlementAmount?: number
  currency?: string
  fulfillmentStatus?: FulfillmentStatus | string
  settlementStatus?: SettlementStatus | string
  createdAt?: string
  updatedAt?: string
  startedAt?: string
  completedAt?: string
}

export interface SupplierOrderPageParam {
  pageNo?: number
  pageSize?: number
  bOrderNo?: string
  orderNo?: string
  buyerCode?: string
  supplierCode?: string
  fulfillmentStatus?: string
  createdFrom?: string
  createdTo?: string
}

/**
 * order-views 内的供应商摘要，不是 supplier-orders 的完整履约尝试。
 * supplierOrderNo 为平台 B 端履约尝试编号，用于供应商详情跳转，不是供应商外部订单号。
 * 设计：后端 docs/superpowers/specs/2026-09-23-order-frontend-alignment-and-routing-prd-model-design.md §3.2.1。
 */
export interface OrderSupplierSummaryView {
  supplierOrderNo: string
  supplierName?: string
  status?: SupplierOrderStatus
  amount?: number
  qty?: number
  createdAt?: string
  failureClosure?: import('./failure-closure').FailureClosure
}

/** 平台订单视图（GET /supply-chain/order-views），金额单位为分 */
export interface OrderView {
  terminalReasonCode?: string
  orderNo: string
  /** 采购商侧C端订单号，CARD场景必填 */
  distributorOrderNo?: string
  relatedPlatformOrderNo?: string
  bizType: OrderBizType
  status: PlatformOrderStatus
  amount?: number
  qty?: number
  supplierName?: string
  distributorName?: string
  projectName?: string
  buyerMobile?: string
  buyerName?: string
  payMethod?: string
  payTradeNo?: string
  receiverName?: string
  receiverPhone?: string
  receiverAddress?: string
  couponAmount?: number
  freightAmount?: number
  goodsAmount?: number
  serviceFee?: number
  salePrice?: number
  distPrice?: number
  distributorPayAmount?: number
  projectPayAmount?: number
  items?: OrderItemView[]
  supplierOrders?: OrderSupplierSummaryView[]
  traces?: any[]
  createdAt?: string
  supplyMode?: string
  shipTime?: string
  deliveryMode?: string
}

export interface OrderItemView {
  skuCode?: string
  skuName?: string
  qty?: number
  salePrice?: number
  distPrice?: number
  cardInfos?: OrderCardAssetView[]
  rechargeInfo?: { accountValue?: string; voucherCode?: string; assetNo?: string }[]
  ticketCode?: string[]
  pickupCode?: string[]
}

export interface OrderRouteRecordView {
  orderNo: string
  productName?: string
  productType?: string
  tryCount?: number
  failCount?: number
  status?: RouteResult | ''
  finalSupplierName?: string
  supplierOrderNo?: string
  durationSec?: number
  steps?: {
    attemptNo?: number
    supplierName?: string
    result?: RouteResult
    time?: string
    supplyPrice?: number
    assignQty?: number
    failReason?: RouteFailReason
    remark?: string
    request?: string
    response?: string
  }[]
}

export interface AfterSalePageParam extends Omit<OrderPageParam, 'statuses'> {
  types?: AfterSaleType[]
  statuses?: AfterSaleStatus[]
  applyFrom?: string
  applyTo?: string
}
