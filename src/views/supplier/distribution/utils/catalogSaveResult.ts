import type {
  BuyerSelectionCatalogSaveRespVO,
  CatalogRefreshResultVO
} from '@/api/supplier/distribution/types'

export type CatalogSaveMessageType = 'success' | 'warning' | 'error' | 'info'

export interface CatalogSaveMessage {
  type: CatalogSaveMessageType
  content: string
}

const names = (items: CatalogRefreshResultVO[]): string =>
  items.map((item) => item.savedCode || item.listingNo || '未知目录').join('、')

const reasons = (items: CatalogRefreshResultVO[]): string =>
  items
    .map((item) => item.reasonCode)
    .filter((code): code is string => !!code)
    .join('、')

/**
 * 选品/定价保存后的结果提示：保存与逐目录刷新两个维度分开。
 * 契约见设计 §5.3「前端唯一改动」与后端 BuyerSelectionCatalogSaveRespVO。
 * - 网络超时/响应缺失：结果未确认，提示查询现有列表，不判断回滚、不自动重发非幂等选品。
 * - 已保存、已发布且本次评估通过：提示目录已发布，不说全部项目可下单。
 * - 已保存、待就绪：真实原因＋条件满足后后台自动发布。
 * - 刷新失败且扫描启用：后台将自动重试，当前可售未确认；扫描关闭时不得承诺自动重试。
 * - MANUAL／暂停／退役：明确状态，不说自动恢复可售。
 */
export function buildCatalogSaveMessage(
  saveResult?: BuyerSelectionCatalogSaveRespVO | null
): CatalogSaveMessage {
  if (!saveResult || saveResult.saveState !== 'COMMITTED') {
    return { type: 'info', content: '保存结果未确认，请查询现有列表核对选品/价格' }
  }
  const results = saveResult.catalogResults ?? []
  if (results.length === 0) {
    return { type: 'success', content: '已保存' }
  }
  const failed = results.filter((item) => item.refreshOutcome === 'FAILED')
  const published = results.filter(
    (item) => item.refreshOutcome === 'UPDATED' || item.refreshOutcome === 'UNCHANGED'
  )
  const paused = results.filter((item) => item.refreshOutcome === 'PAUSED')
  const terminal = results.filter((item) => item.refreshOutcome === 'TERMINAL')
  const manual = results.filter((item) => item.refreshOutcome === 'SKIPPED_MANUAL')
  const pending = results.filter((item) => item.refreshOutcome === 'DEFERRED')

  if (failed.length > 0) {
    const retry = saveResult.automaticRecoveryEnabled
      ? '后台将自动重试'
      : '扫描已关闭，暂无自动重试'
    const publishedHint = published.length > 0 ? `；其余 ${published.length} 个目录已发布` : ''
    return {
      type: 'warning',
      content: `已保存，但 ${failed.length} 个目录刷新失败（${names(failed)}）：${retry}，当前可售未确认${publishedHint}`
    }
  }
  if (paused.length > 0) {
    return { type: 'warning', content: `已保存；目录已暂停（${names(paused)}），不自动恢复可售` }
  }
  if (terminal.length > 0) {
    return { type: 'warning', content: `已保存；目录已退役（${names(terminal)}），不可恢复` }
  }
  if (manual.length > 0) {
    return { type: 'info', content: `已保存；目录为手工管理（${names(manual)}），不自动恢复可售` }
  }
  if (pending.length > 0) {
    const reasonHint = reasons(pending) ? `：${reasons(pending)}` : ''
    const recoveryHint = saveResult.automaticRecoveryEnabled
      ? '条件满足后后台自动发布'
      : '扫描已关闭，暂无自动发布'
    return {
      type: 'warning',
      content: `已保存，待就绪（${names(pending)}）${reasonHint}；${recoveryHint}`
    }
  }
  return { type: 'success', content: '已保存，目录已发布' }
}

/** 无响应网络故障不能判定保存回滚；有明确业务错误时沿已有全局提示，不新增误导信息。见设计 §5.3。 */
export function isCatalogSaveUncertainError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    (!('response' in error) || !error.response)
  )
}
