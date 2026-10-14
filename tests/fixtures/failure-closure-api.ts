export const hasPermission = () => true
export const CaseApi = {
  detail: async (caseNo: string) => ({
    caseNo,
    caseVersion: 2,
    generation: 3,
    orderNo: 'SO_FIXTURE',
    bOrderNo: 'BO_FIXTURE',
    canVerify: caseNo === 'manual',
    canConfirmFailure: caseNo === 'confirmable',
    latestActionNo: caseNo === 'manual' ? undefined : caseNo,
    terminalReasonNote: caseNo === 'cancelled' ? '供应商返回已取消' : undefined,
    fundDisposition:
      caseNo === 'manual'
        ? null
        : {
            remainingAmount: caseNo === 'cancelled' ? 0 : 9600,
            committedAmount: 0,
            releasedAmount: caseNo === 'cancelled' ? 9600 : 0
          }
  }),
  action: async (_caseNo: string, actionNo: string) => ({
    actionNo,
    executionStatus: actionNo === 'verifying' ? 'STARTED' : 'SUCCEEDED',
    externalSupplierStatus: actionNo === 'verifying' ? undefined : 'CANCEL',
    verifyConclusion: actionNo === 'verifying' ? undefined : 'TRUSTED_FAILURE',
    freshUntil: '2026-10-13T15:05:00',
    completionSummary: '仅 fixture；未调用真实供应商'
  }),
  verify: async () => ({ actionNo: 'verifying', executionStatus: 'ACCEPTED' }),
  confirmFailure: async () => ({ actionNo: 'cancelled', executionStatus: 'SUCCEEDED' })
}
