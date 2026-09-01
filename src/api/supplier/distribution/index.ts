import request from '@/config/axios'
import { DistributorMockApi } from './mock'

export type {
  DistributorContactVO,
  DistributorInvoiceVO,
  DistributorProjectVO,
  DistributorProductVO,
  DistributorVO,
  DistributorPageParam,
  DistPlatformSkuVO
} from './types'

import type {
  DistributorInvoiceVO,
  DistributorPageParam,
  DistributorProductVO,
  DistributorVO
} from './types'

/** 本地 JSON 模拟开关：后端就绪后改为 false */
export const USE_DISTRIBUTOR_MOCK = true

export const DistributorApi = {
  getDistributorPage: async (params: DistributorPageParam | any) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.getDistributorPage(params)
    return await request.get({ url: '/scm/distributor/page', params })
  },

  getDistributorNameList: async () => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.getDistributorNameList()
    return await request.get({ url: '/scm/distributor/simple-list' })
  },

  getDistributorCodeList: async () => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.getDistributorCodeList()
    return await request.get({ url: '/scm/distributor/code-list' })
  },

  getParentOptions: async (excludeId?: number) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.getParentOptions(excludeId)
    return await request.get({
      url: '/scm/distributor/parent-options',
      params: { excludeId }
    })
  },

  getDistributor: async (id: number) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.getDistributor(id)
    return await request.get({ url: '/scm/distributor/get?id=' + id })
  },

  createDistributor: async (data: DistributorVO) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.createDistributor(data)
    return await request.post({ url: '/scm/distributor/create', data })
  },

  updateDistributor: async (data: DistributorVO) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.updateDistributor(data)
    return await request.put({ url: '/scm/distributor/update', data })
  },

  updateDistributorStatus: async (id: number, status: number) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.updateDistributorStatus(id, status)
    return await request.put({ url: '/scm/distributor/update-status', data: { id, status } })
  },

  getInvoice: async (distributorId: number) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.getInvoice(distributorId)
    return await request.get({
      url: '/scm/distributor/invoice/get?distributorId=' + distributorId
    })
  },

  saveInvoice: async (data: DistributorInvoiceVO) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.saveInvoice(data)
    return await request.post({ url: '/scm/distributor/invoice/save', data })
  },

  getProjectList: async (distributorId: number) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.getProjectList(distributorId)
    return await request.get({
      url: '/scm/distributor/project/list?distributorId=' + distributorId
    })
  },

  getProductPage: async (params: any) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.getProductPage(params)
    return await request.get({ url: '/scm/distributor/product/page', params })
  },

  deleteProduct: async (id: number) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.deleteProduct(id)
    return await request.delete({ url: '/scm/distributor/product/delete?id=' + id })
  },

  createProducts: async (distributorId: number, products: DistributorProductVO[]) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.createProducts(distributorId, products)
    return await request.post({
      url: '/scm/distributor/product/create-batch',
      data: { distributorId, products }
    })
  },

  getChildren: async (distributorId: number) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.getChildren(distributorId)
    return await request.get({
      url: '/scm/distributor/children?distributorId=' + distributorId
    })
  },

  getPlatformSkuPage: async (params: any) => {
    if (USE_DISTRIBUTOR_MOCK) return DistributorMockApi.getPlatformSkuPage(params)
    return await request.get({ url: '/scm/distributor/platform-sku/page', params })
  }
}
