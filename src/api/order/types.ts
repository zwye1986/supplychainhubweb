export type OrderBizType = 'VIRTUAL_CARD' | 'VIRTUAL_RECHARGE' | 'DINING' | 'MOVIE' | 'HEMA'
export type PlatformOrderStatus = 'WAIT_PAY' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CLOSED'
export type SupplierOrderStatus = 'WAIT_PAY' | 'CLOSED' | 'WAIT_SHIP' | 'SHIPPED' | 'FINISHED' | 'FAILED'
export type OrderStatus = PlatformOrderStatus | SupplierOrderStatus
export type SupplyMode = 'DROP_SHIP' | 'BATCH' | 'STORE_PICKUP' | 'API_DIRECT' | 'H5_DIRECT'
export type LogisticsStatus = 'UNSHIPPED' | 'SHIPPED' | 'SIGNED'
export type RouteResult = 'SUCCESS' | 'FAILED'
export type RouteFailReason = 'API_TIMEOUT' | 'PRICE_OVER_THRESHOLD' | 'STOCK_SHORT' | 'SUPPLIER_REJECT' | 'API_ERROR'
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

export interface CardInfoVO {
  cardNo?: string
  password?: string
  expireTime?: string
}

export interface RechargeInfoVO {
  account?: string
  result?: string
  voucherNo?: string
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
  logisticsStatus: LogisticsStatus
  afterSaleType?: AfterSaleType
  afterSaleStatus: AfterSaleStatus
  ticketCode?: string
  pickupCode?: string
  cardInfos?: CardInfoVO[]
  rechargeInfo?: RechargeInfoVO
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
  request?: Record<string, any>
  response?: Record<string, any>
}

export interface OrderRouteRecordVO {
  orderNo: string
  productName: string
  qty: number
  status: RouteResult
  productType: OrderBizType
  tryCount: number
  failCount: number
  finalSupplierName?: string
  supplierOrderNo?: string
  durationSec: number
  steps: RouteStepVO[]
}

export interface OrderVO {
  id?: number
  orderNo: string
  supplierOrderNo?: string
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

export interface AfterSalePageParam extends Omit<OrderPageParam, 'statuses'> {
  types?: AfterSaleType[]
  statuses?: AfterSaleStatus[]
  applyFrom?: string
  applyTo?: string
}
