import request from '@/config/axios'
import type { ProjectDetail, ProjectListingListItem } from '@/api/supplier/distribution/types'

export interface OrderEntryPageParams {
  pageNo: number
  pageSize: number
}

export interface OrderEntryProduct extends ProjectListingListItem {
  /** 履约目标 Schema 编码，仅取平台 SKU 主数据，不按商品名称推测 */
  targetSchemaCode?: string | null
  /** 履约目标 Schema 版本 */
  targetSchemaVersion?: number | null
}

/** 管理端严格 v2 正文，不接收价格、采购商身份、供应商或凭证。 */
export interface OrderEntryCommand {
  buyerOrderNo: string
  platformSkuCode: string
  quantity: 1
  target: Record<string, string>
  previousReceiptVersion?: number
}

/** 对齐 ProjectStandardOrderCreateRespDTO；受理回执不等于订单履约成功。 */
export interface OrderEntryReceipt {
  requestId: string
  buyerOrderNo: string
  receiptStatus: 'ACCEPTED' | 'PROCESSING' | 'REJECTED_RETRYABLE' | 'REJECTED_FINAL'
  receiptVersion: number
  orderNo: string | null
  orderStatus: string | null
  rejectionCode: string | null
  idempotentReplay: boolean
  acceptedAt: string | null
}

const base = '/supply-chain/orders/entry/projects'
const projectPath = (code: string) => `${base}/${encodeURIComponent(code)}`

/** 详见 docs/superpowers/specs/2026-10-14-admin-order-entry-design.md#3-http-契约（后端仓库）。 */
export const OrderEntryApi = {
  projects: (params: OrderEntryPageParams & { projectName?: string }) =>
    request.get<{ list: ProjectDetail[]; total: number }>({ url: base, params }),
  products: (code: string, params: OrderEntryPageParams) =>
    request.get<{ list: OrderEntryProduct[]; total: number }>({
      url: `${projectPath(code)}/products`,
      params
    }),
  create: (code: string, data: OrderEntryCommand) =>
    request.post<OrderEntryReceipt>({ url: projectPath(code), data })
}
