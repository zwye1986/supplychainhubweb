export type OrderBizType = 'VIRTUAL_CARD' | 'VIRTUAL_RECHARGE' | 'DINING' | 'MOVIE' | 'HEMA'
export type OrderStatus = 'WAIT_PAY' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CLOSED'
export type LogisticsStatus = 'UNSHIPPED' | 'SHIPPED' | 'SIGNED'
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

export interface OrderVO {
  id?: number
  orderNo: string
  supplierOrderNo?: string
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
  remark?: string
  finishTime?: string
  createTime?: string
  pushTime?: string
  confirmTime?: string
  items: OrderItemVO[]
  traces?: PackageTraceVO[]
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
}

export interface AfterSalePageParam extends OrderPageParam {
  types?: AfterSaleType[]
  statuses?: AfterSaleStatus[]
  applyFrom?: string
  applyTo?: string
}
