import request from '@/config/axios'
import { ProductMockApi } from './mock'

export type {
  AdjustMode,
  FormulaVO,
  ProductBrandVO,
  ProductCategoryVO,
  ProductManagementPageParam,
  ProductManagementSkuItem,
  ProductManagementSpuItem,
  ProductStatusValue,
  ProductTypeVO,
  SkuDetail,
  SkuItemSaveReqVO,
  SpuDetail,
  SpuSaveReqVO,
  SupplierSimpleInfo
} from './types'

export { PRODUCT_STATUS } from './types'

import type {
  ProductBrandVO,
  ProductCategoryVO,
  ProductManagementPageParam,
  ProductTypeVO,
  SpuDetail,
  SpuSaveReqVO
} from './types'

/** 类型 / 分类 / 品牌接口未就绪时走前端 mock */
export const USE_PRODUCT_MOCK = true

export const ProductTypeApi = {
  getTypeList: async (params?: { keyword?: string }) => {
    if (USE_PRODUCT_MOCK) return ProductMockApi.getTypeList(params)
    return await request.get({ url: '/supply-chain/product-types', params })
  },
  getType: async (id: number) => {
    if (USE_PRODUCT_MOCK) return ProductMockApi.getType(id)
    return await request.get({ url: `/supply-chain/product-types/${id}` })
  },
  createType: async (data: ProductTypeVO) => {
    if (USE_PRODUCT_MOCK) return ProductMockApi.createType(data)
    return await request.post({ url: '/supply-chain/product-types', data })
  },
  updateType: async (data: ProductTypeVO) => {
    if (USE_PRODUCT_MOCK) return ProductMockApi.updateType(data)
    return await request.put({ url: `/supply-chain/product-types/${data.id}`, data })
  },
  deleteType: async (id: number) => {
    if (USE_PRODUCT_MOCK) return ProductMockApi.deleteType(id)
    return await request.delete({ url: `/supply-chain/product-types/${id}` })
  }
}

export const ProductCategoryApi = {
  getCategoryList: async (params?: { name?: string; status?: number }) => {
    if (USE_PRODUCT_MOCK) return ProductMockApi.getCategoryList(params)
    return await request.get({ url: '/supply-chain/product-categories', params })
  },
  getCategory: async (id: number) => {
    if (USE_PRODUCT_MOCK) return ProductMockApi.getCategory(id)
    return await request.get({ url: `/supply-chain/product-categories/${id}` })
  },
  createCategory: async (data: ProductCategoryVO) => {
    if (USE_PRODUCT_MOCK) return ProductMockApi.createCategory(data)
    return await request.post({ url: '/supply-chain/product-categories', data })
  },
  updateCategory: async (data: ProductCategoryVO) => {
    if (USE_PRODUCT_MOCK) return ProductMockApi.updateCategory(data)
    return await request.put({ url: `/supply-chain/product-categories/${data.id}`, data })
  },
  deleteCategory: async (id: number) => {
    if (USE_PRODUCT_MOCK) return ProductMockApi.deleteCategory(id)
    return await request.delete({ url: `/supply-chain/product-categories/${id}` })
  }
}

export const ProductBrandApi = {
  getBrandList: async (params?: { keyword?: string }) => {
    if (USE_PRODUCT_MOCK) return ProductMockApi.getBrandList(params)
    return await request.get({ url: '/supply-chain/product-brands', params })
  },
  getBrand: async (id: number) => {
    if (USE_PRODUCT_MOCK) return ProductMockApi.getBrand(id)
    return await request.get({ url: `/supply-chain/product-brands/${id}` })
  },
  createBrand: async (data: ProductBrandVO) => {
    if (USE_PRODUCT_MOCK) return ProductMockApi.createBrand(data)
    return await request.post({ url: '/supply-chain/product-brands', data })
  },
  updateBrand: async (data: ProductBrandVO) => {
    if (USE_PRODUCT_MOCK) return ProductMockApi.updateBrand(data)
    return await request.put({ url: `/supply-chain/product-brands/${data.id}`, data })
  },
  deleteBrand: async (id: number) => {
    if (USE_PRODUCT_MOCK) return ProductMockApi.deleteBrand(id)
    return await request.delete({ url: `/supply-chain/product-brands/${id}` })
  }
}

/** 详情转复合保存请求，供编辑 / 定价回写 */
export const toSpuSaveReq = (detail: SpuDetail): SpuSaveReqVO => ({
  spuCode: detail.spuCode,
  spuName: detail.spuName || '',
  brandId: detail.brandId as number,
  sellableCategory: detail.sellableCategory || '',
  productType: detail.productType || '',
  productClassification: detail.productClassification || '',
  deliveryType: detail.deliveryType,
  status: detail.status,
  skus: (detail.skus || []).map((sku) => ({
    skuCode: sku.skuCode,
    skuName: sku.skuName,
    fulfillmentType: sku.fulfillmentType,
    faceValue: sku.faceValue ?? 0,
    marketPrice: sku.marketPrice,
    suggestedSalePrice: sku.suggestedSalePrice,
    userLimitEnabled: sku.userLimitEnabled,
    userLimitPeriod: sku.userLimitPeriod,
    userLimitQuantity: sku.userLimitQuantity,
    phoneBindLimitEnabled: sku.phoneBindLimitEnabled,
    phoneBindLimitPeriod: sku.phoneBindLimitPeriod,
    phoneBindLimitQuantity: sku.phoneBindLimitQuantity
  }))
})

export const ProductApi = {
  getProductPage: async (params: ProductManagementPageParam) => {
    return await request.get({ url: '/supply-chain/products/management-page', params })
  },
  getProduct: async (spuCode: string) => {
    return await request.get({ url: `/supply-chain/products/spus/${spuCode}` })
  },
  createProduct: async (data: SpuSaveReqVO) => {
    return await request.post({ url: '/supply-chain/products/spus', data })
  },
  updateProduct: async (spuCode: string, data: SpuSaveReqVO) => {
    return await request.put({ url: `/supply-chain/products/spus/${spuCode}`, data })
  },
  deleteProduct: async (spuCode: string) => {
    return await request.delete({ url: `/supply-chain/products/spus/${spuCode}` })
  },
  changeProductStatus: async (spuCode: string, targetStatus: number) => {
    return await request.put({
      url: `/supply-chain/products/spus/${spuCode}/status`,
      data: { targetStatus }
    })
  }
}
