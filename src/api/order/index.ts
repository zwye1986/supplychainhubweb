import dayjs from 'dayjs'
import qs from 'qs'
import request from '@/config/axios'
import { OrderMockApi } from './mock'
import { mapCardAsset } from './asset-valid-time'
import type {
  AfterSalePageParam,
  AfterSaleVO,
  OrderItemVO,
  OrderPageParam,
  OrderRouteRecordVO,
  OrderRouteRecordView,
  OrderView,
  OrderVO,
  SupplierOrderPageParam,
  SupplierOrderView
} from './types'

export type {
  AfterSalePageParam,
  AfterSaleStatus,
  AfterSaleType,
  AfterSaleVO,
  FulfillmentStatus,
  OrderBizType,
  OrderItemVO,
  OrderPageParam,
  OrderRouteRecordVO,
  OrderStatus,
  OrderVO,
  PlatformOrderStatus,
  RouteFailReason,
  RouteStepVO,
  SettlementStatus,
  SupplierAttemptOrderType,
  SupplierOrderPageParam,
  SupplierOrderStatus,
  SupplierOrderView,
  SupplyMode
} from './types'

/** 售后接口尚未提供，仍走内存 Mock */
const USE_AFTER_SALE_MOCK = true

const centsToYuan = (cents?: number | null) => {
  if (cents === undefined || cents === null || Number.isNaN(Number(cents))) return undefined
  return Number((Number(cents) / 100).toFixed(2))
}

const formatDateTime = (value?: string | null) => {
  if (!value) return undefined
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : value
}

const serializeQuery = (query: Record<string, unknown>) =>
  qs.stringify(query, { arrayFormat: 'repeat', skipNulls: true, allowDots: true })

const compactText = (value?: string) => {
  const text = value?.trim()
  return text || undefined
}

const compactList = (values?: Array<string | undefined | null>) => {
  const list = values?.map((item) => item?.trim()).filter((item): item is string => Boolean(item))
  return list?.length ? list : undefined
}

const buildOrderViewQuery = (params: OrderPageParam, withPage = true) => {
  const query: Record<string, unknown> = {}
  if (withPage) {
    query.pageNo = params.pageNo || 1
    query.pageSize = params.pageSize || 20
  }
  const orderNo = compactText(params.orderNo)
  const productName = compactText(params.productName)
  const buyerKeyword = compactText(params.buyerKeyword)
  const supplierOrderNo = compactText(params.supplierOrderNo)
  const distributorOrderNo = compactText(params.distributorOrderNo)
  if (orderNo) query.orderNo = orderNo
  if (productName) query.productName = productName
  if (buyerKeyword) query.buyerKeyword = buyerKeyword
  if (supplierOrderNo) query.supplierOrderNo = supplierOrderNo
  if (distributorOrderNo) query.distributorOrderNo = distributorOrderNo
  if (params.createFrom) query.createFrom = params.createFrom
  if (params.createTo) query.createTo = params.createTo
  const bizTypes = compactList(params.bizType ? [params.bizType] : params.bizTypes)
  const statuses = compactList(params.statuses)
  const supplierNames = compactList(params.supplierNames)
  const distributorNames = compactList(params.distributorNames)
  if (bizTypes) query.bizTypes = bizTypes
  if (statuses) query.statuses = statuses
  if (supplierNames) query.supplierNames = supplierNames
  if (distributorNames) query.distributorNames = distributorNames
  return query
}

const buildSupplierOrderQuery = (params: SupplierOrderPageParam) => {
  const query: Record<string, unknown> = {
    pageNo: params.pageNo || 1,
    pageSize: params.pageSize || 20
  }
  const bOrderNo = compactText(params.bOrderNo)
  const orderNo = compactText(params.orderNo)
  const buyerCode = compactText(params.buyerCode)
  const supplierCode = compactText(params.supplierCode)
  const fulfillmentStatus = compactText(params.fulfillmentStatus)
  if (bOrderNo) query.bOrderNo = bOrderNo
  if (orderNo) query.orderNo = orderNo
  if (buyerCode) query.buyerCode = buyerCode
  if (supplierCode) query.supplierCode = supplierCode
  if (fulfillmentStatus) query.fulfillmentStatus = fulfillmentStatus
  if (params.createdFrom) query.createdFrom = params.createdFrom
  if (params.createdTo) query.createdTo = params.createdTo
  return query
}

const mapOrderView = (view: OrderView): OrderVO => {
  const bizType = view.bizType || 'VIRTUAL_CARD'
  const supplierOrders = (view.supplierOrders || [])
    .filter((item) => item.supplierOrderNo)
    .map((item) => ({
      supplierOrderNo: item.supplierOrderNo,
      supplierName: item.supplierName
    }))
  const itemCount = view.items?.length || 0
  const items: OrderItemVO[] = (view.items || []).map((item) => {
    const rechargeInfos = (item.rechargeInfo || []).map((row) => ({
      account: row.accountValue,
      voucherNo: row.voucherCode,
      assetNo: row.assetNo
    }))
    return {
      name: item.skuName || '',
      skuCode: item.skuCode || '',
      qty: Number(item.qty || 0),
      // 只展示后端冻结事实，不把缺值变成零价或以当前商品价格替代历史价格。
      // 设计：后端 docs/superpowers/specs/2026-09-23-order-frontend-alignment-and-routing-prd-model-design.md §3.2.2。
      supplyPrice: centsToYuan(item.supplyPrice),
      baseDistPrice: centsToYuan(item.baseDistPrice),
      projectPrice: centsToYuan(item.projectPrice),
      distPrice: centsToYuan(item.distPrice),
      salePrice: centsToYuan(item.salePrice) ?? 0,
      serviceFee: itemCount === 1 ? (centsToYuan(view.serviceFee) ?? 0) : 0,
      couponAmount: itemCount === 1 ? (centsToYuan(view.couponAmount) ?? 0) : 0,
      orderType: bizType,
      supplierName: view.supplierName,
      ticketCodes: item.ticketCode || [],
      pickupCodes: item.pickupCode || [],
      ticketCode: item.ticketCode?.[0],
      pickupCode: item.pickupCode?.[0],
      cardInfos: (item.cardInfos || []).map((card) => mapCardAsset(card, formatDateTime)),
      rechargeInfos,
      rechargeInfo: rechargeInfos[0]
    }
  })
  const status = view.status || 'PROCESSING'
  const distributorPayAmount = centsToYuan(view.distributorPayAmount)
  return {
    orderNo: view.orderNo,
    terminalReasonCode: view.terminalReasonCode,
    // 成功总单不再展示历史失败尝试的处置；保留 supplierOrders 供历史查询。
    // 设计：后端 docs/superpowers/specs/2026-09-21-supplier-order-admin-readonly-design.md §8.2。
    failureClosures:
      status === 'SUCCESS'
        ? []
        : (view.supplierOrders || [])
            .map((item) => item.failureClosure)
            .filter((item): item is NonNullable<typeof item> => !!item),
    relatedPlatformOrderNo: view.relatedPlatformOrderNo,
    supplierOrderNo: supplierOrders[0]?.supplierOrderNo,
    buyerOrderNo: view.distributorOrderNo,
    distributorOrderNo: view.distributorOrderNo,
    bizType,
    status,
    amount: centsToYuan(view.amount) ?? 0,
    qty: Number(view.qty || 0),
    supplierName: view.supplierName,
    distributorName: view.distributorName,
    projectName: view.projectName,
    buyerName: view.buyerName,
    buyerMobile: view.buyerMobile,
    receiverName: view.receiverName,
    receiverMobile: view.receiverPhone,
    receiverAddress: view.receiverAddress,
    payMethod: view.payMethod,
    payTradeNo: view.payTradeNo,
    goodsAmount: centsToYuan(view.goodsAmount),
    freightAmount: centsToYuan(view.freightAmount),
    serviceFee: centsToYuan(view.serviceFee),
    couponAmount: centsToYuan(view.couponAmount),
    // 项目与分销商展示同一采购结算金额；不构造没有冻结依据的商品/运费拆分。
    projectPayAmount: distributorPayAmount,
    distributorPayAmount,
    supplyMode: view.supplyMode as OrderVO['supplyMode'],
    deliveryMode: view.deliveryMode,
    shipTime: formatDateTime(view.shipTime),
    createTime: formatDateTime(view.createdAt),
    items,
    traces: (view.traces || []).map((item: any) =>
      typeof item === 'string'
        ? { time: '', content: item }
        : {
            time: formatDateTime(item?.time || item?.createdAt) || '',
            content: item?.content || item?.desc || item?.message || item?.remark || ''
          }
    ),
    supplierOrders
  }
}

const mapRouteRecord = (view: OrderRouteRecordView): OrderRouteRecordVO => ({
  orderNo: view.orderNo,
  productName: view.productName || '',
  productType: (view.productType || 'VIRTUAL_CARD') as OrderRouteRecordVO['productType'],
  status: view.status || '',
  tryCount: view.tryCount || 0,
  failCount: view.failCount || 0,
  finalSupplierName: view.finalSupplierName,
  supplierOrderNo: view.supplierOrderNo,
  durationSec: view.durationSec,
  steps: (view.steps || []).map((step) => ({
    index: step.attemptNo || 0,
    supplierName: step.supplierName || '-',
    result: step.result || 'FAILED',
    time: formatDateTime(step.time) || '',
    supplyPrice: centsToYuan(step.supplyPrice) ?? 0,
    assignQty: Number(step.assignQty || 0),
    failReason: step.failReason,
    remark: step.remark,
    request: step.request,
    response: step.response
  }))
})

/** 供应商履约单映射成页面使用的订单字段，文案仍按原订单字段展示 */
const mapSupplierOrder = (view: SupplierOrderView): OrderVO => {
  const qty = Number(view.requestedQuantity || 0)
  const supplyPrice = centsToYuan(view.supplierSettlementUnitPrice) ?? 0
  const bizType = view.bizType || ''
  const succeeded = ['SUCCEEDED', 'FINISHED'].includes(view.fulfillmentStatus || '')
  return {
    orderNo: view.bOrderNo,
    failureClosures: !succeeded && view.failureClosure ? [view.failureClosure] : [],
    supplierOrderNo: view.bOrderNo,
    relatedPlatformOrderNo: view.orderNo,
    createTime: formatDateTime(view.createdAt),
    shipTime: formatDateTime(view.completedAt),
    supplierName: view.supplierName,
    buyerName: view.buyerName,
    bizType,
    supplyMode: view.supplyMode ?? undefined,
    status: (view.fulfillmentStatus || 'WAIT_PAY') as OrderVO['status'],
    amount: centsToYuan(view.expectedSupplierSettlementAmount) ?? 0,
    qty,
    items: [
      {
        name: view.skuName || '',
        skuCode: view.skuCode || '',
        qty,
        supplyPrice,
        salePrice: supplyPrice,
        serviceFee: 0,
        couponAmount: 0,
        orderType: bizType,
        supplierName: view.supplierName
      }
    ]
  }
}

export const OrderApi = {
  getOrderPage: async (params: OrderPageParam) => {
    const data = await request.get<{ list: OrderView[]; total: number }>({
      url: '/supply-chain/order-views',
      params: buildOrderViewQuery(params),
      paramsSerializer: serializeQuery
    })
    return {
      list: (data?.list || []).map(mapOrderView),
      total: data?.total || 0
    }
  },
  exportOrders: async (params: OrderPageParam) => {
    return await request.download({
      url: '/supply-chain/order-views/export',
      params: buildOrderViewQuery(params, false),
      paramsSerializer: serializeQuery
    })
  },
  getOrder: async (orderNo: string) => {
    const data = await request.get<OrderView>({ url: `/supply-chain/order-views/${orderNo}` })
    return mapOrderView(data)
  },
  getRouteRecord: async (orderNo: string) => {
    const data = await request.get<OrderRouteRecordView>({
      url: `/supply-chain/order-views/${orderNo}/route-record`
    })
    return mapRouteRecord(data)
  },
  getSupplierOrderPage: async (params: SupplierOrderPageParam) => {
    const data = await request.get<{ list: SupplierOrderView[]; total: number }>({
      url: '/supply-chain/supplier-orders',
      params: buildSupplierOrderQuery(params)
    })
    return {
      list: (data?.list || []).map(mapSupplierOrder),
      total: data?.total || 0
    }
  },
  getSupplierOrder: async (bOrderNo: string) => {
    const data = await request.get<SupplierOrderView>({
      url: `/supply-chain/supplier-orders/${bOrderNo}`
    })
    return mapSupplierOrder(data)
  },
  shipOrder: async (orderNo: string, data: any) => {
    return OrderMockApi.shipOrder(orderNo, data)
  },
  getAfterSalePage: async (params: AfterSalePageParam) => {
    if (USE_AFTER_SALE_MOCK) return OrderMockApi.getAfterSalePage(params)
    return await request.get({ url: '/supply-chain/after-sales', params })
  },
  getAfterSale: async (afterSaleNo: string) => {
    if (USE_AFTER_SALE_MOCK) return OrderMockApi.getAfterSale(afterSaleNo)
    return await request.get({ url: `/supply-chain/after-sales/${afterSaleNo}` })
  },
  createAfterSale: async (data: Partial<AfterSaleVO>) => {
    if (USE_AFTER_SALE_MOCK) return OrderMockApi.createAfterSale(data)
    return await request.post({ url: '/supply-chain/after-sales', data })
  },
  auditAfterSale: async (afterSaleNo: string, data: any) => {
    if (USE_AFTER_SALE_MOCK) return OrderMockApi.auditAfterSale(afterSaleNo, data)
    return await request.put({ url: `/supply-chain/after-sales/${afterSaleNo}/audit`, data })
  }
}
