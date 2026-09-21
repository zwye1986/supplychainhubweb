import request from '@/config/axios'
import { OrderMockApi } from './mock'
import type { AfterSalePageParam, AfterSaleVO, OrderPageParam } from './types'

export type {
  AfterSalePageParam,
  AfterSaleStatus,
  AfterSaleType,
  AfterSaleVO,
  OrderBizType,
  OrderItemVO,
  OrderPageParam,
  OrderRouteRecordVO,
  OrderStatus,
  OrderVO,
  PlatformOrderStatus,
  RouteFailReason,
  RouteStepVO,
  SupplierOrderStatus,
  SupplyMode
} from './types'

export const USE_ORDER_MOCK = true

export const OrderApi = {
  getOrderPage: async (params: OrderPageParam) => {
    if (USE_ORDER_MOCK) return OrderMockApi.getOrderPage(params)
    return await request.get({ url: '/supply-chain/orders', params })
  },
  exportOrders: async (params: OrderPageParam) => {
    if (USE_ORDER_MOCK) return OrderMockApi.exportOrders(params)
    return await request.download({ url: '/supply-chain/orders/export', params })
  },
  getOrder: async (orderNo: string, source?: 'PLATFORM' | 'SUPPLIER') => {
    if (USE_ORDER_MOCK) return OrderMockApi.getOrder(orderNo, source)
    return await request.get({ url: `/supply-chain/orders/${orderNo}`, params: { source } })
  },
  getRouteRecord: async (orderNo: string) => {
    if (USE_ORDER_MOCK) return OrderMockApi.getRouteRecord(orderNo)
    return await request.get({ url: `/supply-chain/orders/${orderNo}/route-record` })
  },
  shipOrder: async (orderNo: string, data: any) => {
    if (USE_ORDER_MOCK) return OrderMockApi.shipOrder(orderNo, data)
    return await request.post({ url: `/supply-chain/orders/${orderNo}/ship`, data })
  },
  getAfterSalePage: async (params: AfterSalePageParam) => {
    if (USE_ORDER_MOCK) return OrderMockApi.getAfterSalePage(params)
    return await request.get({ url: '/supply-chain/after-sales', params })
  },
  getAfterSale: async (afterSaleNo: string) => {
    if (USE_ORDER_MOCK) return OrderMockApi.getAfterSale(afterSaleNo)
    return await request.get({ url: `/supply-chain/after-sales/${afterSaleNo}` })
  },
  createAfterSale: async (data: Partial<AfterSaleVO>) => {
    if (USE_ORDER_MOCK) return OrderMockApi.createAfterSale(data)
    return await request.post({ url: '/supply-chain/after-sales', data })
  },
  auditAfterSale: async (afterSaleNo: string, data: any) => {
    if (USE_ORDER_MOCK) return OrderMockApi.auditAfterSale(afterSaleNo, data)
    return await request.put({ url: `/supply-chain/after-sales/${afterSaleNo}/audit`, data })
  }
}
