import request from '@/config/axios'

export type {
  BrandPageParam,
  BrandSaveReqVO,
  BrandStatusValue,
  CategoryListParam,
  CategorySaveReqVO,
  CategoryStatusValue,
  FormulaRuleBase,
  FormulaRuleMode,
  FormulaRuleOperator,
  FormulaRuleReqVO,
  FormulaVO,
  PlatformPricingDetail,
  PlatformSkuBatchPricingReqVO,
  ProductBatchStatusFailedItemVO,
  ProductBatchStatusResultVO,
  ProductBrandVO,
  ProductCategoryVO,
  ProductManagementPageParam,
  ProductManagementSkuItem,
  ProductManagementSpuItem,
  ProductStatusValue,
  ProductTypePageParam,
  ProductTypeSaveReqVO,
  ProductTypeStatusValue,
  ProductTypeVO,
  ServiceFeeRuleReqVO,
  SkuDetail,
  SkuItemSaveReqVO,
  SpuDetail,
  SpuSaveReqVO,
  SuggestedSalePriceRule,
  SupplierSimpleInfo
} from './types'

export {
  BRAND_STATUS,
  CATEGORY_STATUS,
  PRODUCT_STATUS,
  PRODUCT_TYPE_STATUS,
  PRICING_TAX_RATE_CODES
} from './types'

import type {
  BrandPageParam,
  BrandSaveReqVO,
  CategoryListParam,
  CategorySaveReqVO,
  PlatformPricingDetail,
  PlatformSkuBatchPricingReqVO,
  ProductCategoryVO,
  ProductManagementPageParam,
  ProductTypePageParam,
  ProductTypeSaveReqVO,
  ProductTypeVO,
  SpuDetail,
  SpuSaveReqVO
} from './types'

const normalizeCategoryTree = (nodes: ProductCategoryVO[] = []): ProductCategoryVO[] =>
  nodes.map((node) => {
    const children = node.children?.length ? normalizeCategoryTree(node.children) : undefined
    return { ...node, children }
  })

let productTypeListInflight: Promise<ProductTypeVO[]> | null = null
let categoryListInflight: Promise<ProductCategoryVO[]> | null = null

export const ProductTypeApi = {
  getTypePage: async (params: ProductTypePageParam) => {
    return await request.get({ url: '/supply-chain/product-types', params })
  },
  getTypeList: async (params?: Omit<ProductTypePageParam, 'pageNo' | 'pageSize'>) => {
    const requestList = async () => {
      const data = await ProductTypeApi.getTypePage({ pageNo: 1, pageSize: 200, ...params })
      return ((data?.list || []) as ProductTypeVO[]).filter((item) => !!item.typeCode)
    }
    if (params && Object.keys(params).length) return await requestList()
    if (!productTypeListInflight) {
      productTypeListInflight = requestList().catch((error) => {
        productTypeListInflight = null
        throw error
      })
    }
    return await productTypeListInflight
  },
  getType: async (typeCode: string) => {
    return await request.get({ url: `/supply-chain/product-types/${encodeURIComponent(typeCode)}` })
  },
  createType: async (data: ProductTypeSaveReqVO) => {
    return await request.post({ url: '/supply-chain/product-types', data })
  },
  updateType: async (typeCode: string, data: ProductTypeSaveReqVO) => {
    return await request.put({
      url: `/supply-chain/product-types/${encodeURIComponent(typeCode)}`,
      data
    })
  },
  deleteType: async (typeCode: string) => {
    return await request.delete({
      url: `/supply-chain/product-types/${encodeURIComponent(typeCode)}`
    })
  },
  changeTypeStatus: async (typeCode: string, targetStatus: number) => {
    return await request.put({
      url: `/supply-chain/product-types/${encodeURIComponent(typeCode)}/status`,
      data: { targetStatus }
    })
  }
}

export const ProductCategoryApi = {
  getCategoryList: async (params?: CategoryListParam) => {
    const requestList = async () => {
      const data = await request.get({ url: '/supply-chain/categories/management-tree', params })
      return normalizeCategoryTree(Array.isArray(data) ? data : [])
    }
    const hasParams =
      params && Object.values(params).some((value) => value !== undefined && value !== '')
    if (hasParams) return await requestList()
    if (!categoryListInflight) {
      categoryListInflight = requestList().finally(() => {
        categoryListInflight = null
      })
    }
    return await categoryListInflight
  },
  getCategory: async (categoryCode: string) => {
    return await request.get({ url: `/supply-chain/categories/${categoryCode}` })
  },
  createCategory: async (data: CategorySaveReqVO) => {
    const result = await request.post({ url: '/supply-chain/categories', data })
    categoryListInflight = null
    return result
  },
  updateCategory: async (categoryCode: string, data: CategorySaveReqVO) => {
    const result = await request.put({ url: `/supply-chain/categories/${categoryCode}`, data })
    categoryListInflight = null
    return result
  },
  deleteCategory: async (categoryCode: string) => {
    const result = await request.delete({ url: `/supply-chain/categories/${categoryCode}` })
    categoryListInflight = null
    return result
  },
  changeCategoryStatus: async (categoryCode: string, targetStatus: number) => {
    const result = await request.put({
      url: `/supply-chain/categories/${categoryCode}/status`,
      data: { targetStatus }
    })
    categoryListInflight = null
    return result
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
  primaryCategoryId: detail.primaryCategoryId as number,
  productClassification: detail.productClassification || '',
  fulfillmentType: detail.fulfillmentType || '',
  deliveryType: detail.deliveryType,
  status: detail.status,
  skus: (detail.skus || []).map((sku) => ({
    skuCode: sku.skuCode,
    skuName: sku.skuName,
    faceValue: sku.faceValue ?? 0,
    marketPrice: sku.marketPrice,
    suggestedSalePriceRule: sku.suggestedSalePriceRule,
    picUrl: sku.picUrl,
    detailPics: sku.detailPics,
    description: sku.description,
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
    const query = { ...params } as Record<string, unknown>
    if (Array.isArray(params.categoryId)) {
      const ids = params.categoryId.filter((id) => id != null && `${id}` !== '')
      query.categoryId = ids.length ? ids.join(',') : undefined
    }
    return await request.get({ url: '/supply-chain/products/management-page', params: query })
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
  },
  /**
   * 批量变更商品上下架状态。
   * 后端逐项独立事务：任一项失败仅回滚该项，已成功项保持结果。
   * 返回未知 HTTP 数据，由调用方校验完整回执后呈现；异常和旧 Boolean 均不自动重发写请求。
   * 用户核对当前状态后可主动重新选择失败项；前后端必须同批发布。
   * 设计见 docs/superpowers/specs/2026-09-11-supply-chain-product-center-design.md#4110
   */
  batchChangeProductStatus: async (
    spuCodes: string[],
    skuCodes: string[],
    targetStatus: number,
    unshelveMode?: string
  ): Promise<unknown> => {
    return await request.put({
      url: '/supply-chain/products/batch-status',
      data: { spuCodes, skuCodes, targetStatus, unshelveMode }
    })
  },
  /** 批量保存商品 SKU 默认定价，单事务全量成功或回滚 */
  batchSkuPricing: async (data: PlatformSkuBatchPricingReqVO) => {
    return await request.put({ url: '/supply-chain/products/skus/pricing', data })
  },
  /** 查询商品 SKU 当前完整默认定价；未定价返回 UNPRICED */
  getSkuPricing: async (skuCode: string): Promise<PlatformPricingDetail> => {
    return await request.get({
      url: `/supply-chain/products/skus/${encodeURIComponent(skuCode)}/pricing`
    })
  }
}
