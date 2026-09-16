import request from '@/config/axios'
import { ProductMockApi } from './mock'

export type {
  AdjustMode,
  BrandPageParam,
  BrandSaveReqVO,
  BrandStatusValue,
  CategorySaveReqVO,
  CategoryStatusValue,
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

export { BRAND_STATUS, CATEGORY_STATUS, PRODUCT_STATUS } from './types'

import type {
  BrandPageParam,
  BrandSaveReqVO,
  CategorySaveReqVO,
  ProductCategoryVO,
  ProductManagementPageParam,
  ProductTypeVO,
  SpuDetail,
  SpuSaveReqVO
} from './types'

/** 商品类型接口未就绪时走前端 mock */
export const USE_PRODUCT_MOCK = true

const normalizeCategoryTree = (nodes: ProductCategoryVO[] = []): ProductCategoryVO[] =>
  nodes.map((node) => {
    const children = node.children?.length ? normalizeCategoryTree(node.children) : undefined
    return { ...node, children }
  })

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
  getCategoryList: async () => {
    const data = await request.get({ url: '/supply-chain/categories/management-tree' })
    return normalizeCategoryTree(Array.isArray(data) ? data : [])
  },
  getCategory: async (categoryCode: string) => {
    return await request.get({ url: `/supply-chain/categories/${categoryCode}` })
  },
  createCategory: async (data: CategorySaveReqVO) => {
    return await request.post({ url: '/supply-chain/categories', data })
  },
  updateCategory: async (categoryCode: string, data: CategorySaveReqVO) => {
    return await request.put({ url: `/supply-chain/categories/${categoryCode}`, data })
  },
  deleteCategory: async (categoryCode: string) => {
    return await request.delete({ url: `/supply-chain/categories/${categoryCode}` })
  },
  changeCategoryStatus: async (categoryCode: string, targetStatus: number) => {
    return await request.put({
      url: `/supply-chain/categories/${categoryCode}/status`,
      data: { targetStatus }
    })
  }
}

export const ProductBrandApi = {
  getBrandPage: async (params: BrandPageParam) => {
    return await request.get({ url: '/supply-chain/brands', params })
  },
  getBrandList: async (params?: { keyword?: string; status?: number }) => {
    const data = await request.get({
      url: '/supply-chain/brands',
      params: { pageNo: 1, pageSize: 100, ...params }
    })
    return data?.list || []
  },
  getBrand: async (brandCode: string) => {
    return await request.get({ url: `/supply-chain/brands/${brandCode}` })
  },
  createBrand: async (data: BrandSaveReqVO) => {
    return await request.post({ url: '/supply-chain/brands', data })
  },
  updateBrand: async (brandCode: string, data: BrandSaveReqVO) => {
    return await request.put({ url: `/supply-chain/brands/${brandCode}`, data })
  },
  deleteBrand: async (brandCode: string) => {
    return await request.delete({ url: `/supply-chain/brands/${brandCode}` })
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
