import request from '@/config/axios'
import { PricingMockApi } from './mock'
import type { PricingPageParam, PricingTemplateVO } from './types'

export type {
  ChannelMarkupVO,
  DistPriceVO,
  FormulaVO,
  PricingPageParam,
  PricingTemplateVO,
  RegionMarkupVO,
  ServiceFeeVO,
  TemplateScene
} from './types'

export const USE_PRICING_MOCK = true

export const PricingApi = {
  getList: async (params: PricingPageParam) => {
    if (USE_PRICING_MOCK) return PricingMockApi.getList(params)
    return await request.get({ url: '/supply-chain/pricing-templates', params })
  },
  getTemplate: async (id: number) => {
    if (USE_PRICING_MOCK) return PricingMockApi.getTemplate(id)
    return await request.get({ url: `/supply-chain/pricing-templates/${id}` })
  },
  saveTemplate: async (data: PricingTemplateVO) => {
    if (USE_PRICING_MOCK) return PricingMockApi.saveTemplate(data)
    if (data.id) return await request.put({ url: `/supply-chain/pricing-templates/${data.id}`, data })
    return await request.post({ url: '/supply-chain/pricing-templates', data })
  },
  deleteTemplate: async (id: number) => {
    if (USE_PRICING_MOCK) return PricingMockApi.deleteTemplate(id)
    return await request.delete({ url: `/supply-chain/pricing-templates/${id}` })
  }
}
