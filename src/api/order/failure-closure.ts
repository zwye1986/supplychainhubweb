import request from '@/config/axios'

/** 金额始终为分；缺失预留是未知，不是零。后端失败关单设计 §6/8。 */
export interface FailureClosure {
  caseNo?: string
  terminalReasonCode?: string
  terminalReasonNote?: string
  externalSupplierStatus?: string
  expectedSupplierSettlementAmount?: number | null
  reportedSupplierSettlementAmount?: number | null
  supplierSettlementDifferenceAmount?: number | null
  fundDisposition?: {
    remainingAmount: number
    committedAmount: number
    releasedAmount: number
  } | null
}
export interface CaseDetail extends FailureClosure {
  caseNo: string
  caseVersion: number
  generation: number
  reasonCode?: string
  orderNo: string
  bOrderNo: string
  latestActionNo?: string
  latestActionStatus?: string
  latestVerifyConclusion?: string
  canVerify: boolean
  canConfirmFailure: boolean
}
export interface CaseAction {
  actionNo: string
  executionStatus: string
  verifyConclusion?: string
  externalSupplierStatus?: string
  validNotCreatedCount?: number
  freshUntil?: string
  actualCaseVersion?: number
  actualGeneration?: number
  completionSummary?: string
}
export interface CaseCommand {
  actionNo: string
  expectedCaseVersion: number
  expectedGeneration: number
  reason: string
  verifyActionNo?: string
}
const path = (caseNo: string) => `/supply-chain/fulfillment-cases/${encodeURIComponent(caseNo)}`
export const CaseApi = {
  detail: (caseNo: string): Promise<CaseDetail> => request.get({ url: path(caseNo) }),
  action: (caseNo: string, actionNo: string): Promise<CaseAction> =>
    request.get({ url: `${path(caseNo)}/actions/${encodeURIComponent(actionNo)}` }),
  verify: (caseNo: string, data: CaseCommand): Promise<CaseAction> =>
    request.post({ url: `${path(caseNo)}/verify`, data }),
  confirmFailure: (caseNo: string, data: CaseCommand): Promise<CaseAction> =>
    request.post({ url: `${path(caseNo)}/confirm-failure`, data })
}
