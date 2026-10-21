import request from '@/config/axios'

/** 与后端MerchantQuotaPlatform闭集一致；不是Connector或供应商档案标识。 */
export const MERCHANT_QUOTA_PLATFORMS = ['RENYUE', 'QNM', 'SZ_CARD'] as const
export type MerchantQuotaPlatform = (typeof MERCHANT_QUOTA_PLATFORMS)[number]
export interface QuotaChange {
  /** 每秒成功准入上限 */
  rateLimitPerSecond: number
  /** 同步调用并发占用上限 */
  concurrencyLimit: number
  /** 配置变更原因 */
  reason: string
}
export interface MerchantQuota {
  id: string
  platformCode: MerchantQuotaPlatform
  /** 非秘密供应商商户账号，原值精确匹配 */
  merchantAccount: string
  rateLimitPerSecond: number
  concurrencyLimit: number
  /** 乐观锁版本号；保持十进制字符串，禁止转Number */
  version: string
  updatedBy: string
  updatedAt: number
  changeReason: string
}
export interface QuotaAudit {
  id: string
  /** 变更前每秒成功准入上限；首次创建为空 */
  beforeRateLimitPerSecond: number | null
  afterRateLimitPerSecond: number
  /** 变更前同步调用并发占用上限；首次创建为空 */
  beforeConcurrencyLimit: number | null
  afterConcurrencyLimit: number
  quotaVersion: string
  operatorId: string
  reason: string
  occurredAt: number
}
export interface QuotaHistory {
  list: QuotaAudit[]
  total: number
  /** 最早真实操作版本；null或大于0表示此前历史未记录 */
  firstRecordedVersion: string | null
}
const BASE = '/supply-chain/merchant-quotas'
/** 设计见后端docs/superpowers/specs/2026-10-19-merchant-quota-admin-design.md#3-管理接口。 */
export const MerchantQuotaApi = {
  page: (params: {
    platformCode?: string
    merchantAccount?: string
    pageNo: number
    pageSize: number
  }) => request.get<{ list: MerchantQuota[]; total: number }>({ url: BASE, params }),
  get: (id: string) => request.get<MerchantQuota>({ url: `${BASE}/${id}` }),
  create: (data: QuotaChange & { platformCode: MerchantQuotaPlatform; merchantAccount: string }) =>
    request.post({ url: BASE, data }),
  update: (id: string, data: QuotaChange & { expectedVersion: string }) =>
    request.put({ url: `${BASE}/${id}`, data }),
  history: (id: string, params: { pageNo: number; pageSize: number }) =>
    request.get<QuotaHistory>({ url: `${BASE}/${id}/history`, params })
}
