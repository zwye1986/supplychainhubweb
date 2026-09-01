import request from '@/config/axios'
import { DistributorMockApi, ProjectMockApi } from './mock'

export type {
  DistributorContactVO,
  DistributorInvoiceVO,
  DistributorProjectVO,
  DistributorProductVO,
  DistributorVO,
  DistributorPageParam,
  DistPlatformSkuVO,
  ProjectVO,
  ProjectPageParam,
  ProjectProductVO
} from './types'

import type {
  DistributorInvoiceVO,
  DistributorPageParam,
  DistributorProductVO,
  DistributorVO,
  ProjectPageParam,
  ProjectProductVO,
  ProjectVO
} from './types'

/** 本地 JSON 模拟开关：后端就绪后改为 false */
export const USE_DISTRIBUTOR_MOCK = true
export const USE_PROJECT_MOCK = USE_DISTRIBUTOR_MOCK

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

export const ProjectApi = {
  getProjectPage: async (params: ProjectPageParam | any) => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.getProjectPage(params)
    return await request.get({ url: '/scm/project/page', params })
  },

  getProjectNameList: async () => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.getProjectNameList()
    return await request.get({ url: '/scm/project/simple-list' })
  },

  getProjectCodeList: async () => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.getProjectCodeList()
    return await request.get({ url: '/scm/project/code-list' })
  },

  getProject: async (id: number) => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.getProject(id)
    return await request.get({ url: '/scm/project/get?id=' + id })
  },

  createProject: async (data: ProjectVO) => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.createProject(data)
    return await request.post({ url: '/scm/project/create', data })
  },

  updateProject: async (data: ProjectVO) => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.updateProject(data)
    return await request.put({ url: '/scm/project/update', data })
  },

  updateProjectStatus: async (id: number, status: number) => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.updateProjectStatus(id, status)
    return await request.put({ url: '/scm/project/update-status', data: { id, status } })
  },

  getProductPage: async (params: any) => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.getProductPage(params)
    return await request.get({ url: '/scm/project/product/page', params })
  },

  deleteProduct: async (id: number) => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.deleteProduct(id)
    return await request.delete({ url: '/scm/project/product/delete?id=' + id })
  },

  createProducts: async (projectId: number, products: ProjectProductVO[]) => {
    if (USE_PROJECT_MOCK) return ProjectMockApi.createProducts(projectId, products)
    return await request.post({
      url: '/scm/project/product/create-batch',
      data: { projectId, products }
    })
  }
}
