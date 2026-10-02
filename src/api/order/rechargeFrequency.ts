import request from '@/config/axios'
import type { FrequencySafeError } from '@/config/axios/service'

/** 应用NumberSerializer仅在超出JS安全范围时输出字符串，ID/CAS字段不得转Number。 */
export type WireLong = number | string
/** 应用TimestampLocalDateTimeSerializer输出epoch millis。 */
export type WireTime = number
export type FrequencyView = 'WAITING' | 'OCCUPANCIES' | 'BACKLOGS'
export const FREQUENCY_PERMISSIONS = {
  query: 'supply-chain:recharge-frequency:query',
  retry: 'supply-chain:recharge-frequency:retry',
  release: 'supply-chain:recharge-frequency:release',
  order: 'supply-chain:order:query'
} as const
export const FREQUENCY_POLICY = {
  successMinimumHoldSeconds: 5,
  occupiedAlertSeconds: 1800,
  backlogThreshold: 5
} as const
export const FREQUENCY_ERROR_CODES = {
  notFound: 1050001151,
  versionConflict: 1050001152,
  stateDisallowed: 1050001153,
  unsafeRelease: 1050001154,
  successWindow: 1050001155,
  idempotencyConflict: 1050001156,
  invalidParameter: 1050001157
} as const
/** 只认已确定的领域拒绝；系统/网络/超时不能凭message判断CAS或结束意图。 */
export const isDeterminedFrequencyError = (error: unknown): error is FrequencySafeError => {
  const value = error as FrequencySafeError | null
  return (
    value?.kind === 'business' &&
    Object.values(FREQUENCY_ERROR_CODES).includes(
      value.code as (typeof FREQUENCY_ERROR_CODES)[keyof typeof FREQUENCY_ERROR_CODES]
    )
  )
}
export const DISPLAY_STATUSES: Record<string, string> = {
  BLOCKED: '迁移阻塞，需核实风险订单',
  SUCCESS_HOLD: '成功最短占用窗口中',
  SUCCEEDED: '已成功',
  FAILED: '已失败',
  MANUAL: '人工处理',
  RESULT_UNKNOWN: '结果未知，请先查单核实',
  EXECUTING: '执行中',
  PENDING_ROUTING: '待路由',
  ROUTING: '路由中',
  FULFILLING: '履约中'
}
export const RELEASE_BLOCKED_REASONS: Record<string, string> = {
  MIGRATION_BLOCKED: '迁移阻塞，需核实全部风险订单',
  SUCCESS_WINDOW: '尚未到成功最短占用截止时间',
  UNCONFIRMED_SEND_RISK: '存在未确认发送风险，请先查单核实'
}

export interface FrequencyPageParams {
  pageNo: number
  pageSize: number
  /** 分销商内部主键。 */
  buyerId?: WireLong
  /** 采购项目内部主键；存量订单可空。 */
  projectId?: WireLong
  /** 平台SPU永久业务编码。 */
  platformSpuCode?: string
  /** 供应链总订单号。 */
  orderNo?: string
  /** 采购商侧C端订单号，CARD场景必填。 */
  buyerOrderNo?: string
  /** GET为ISO本地时间；POST按应用反序列化器提交epoch millis。 */
  enqueuedFrom?: string | WireTime
  enqueuedTo?: string | WireTime
}
export interface FrequencyPage<T> {
  list: T[]
  total: WireLong
  /** 本次查询观察时间，Asia/Shanghai，来自数据库时钟。 */
  observedAt: WireTime
}
export interface FrequencyStatistics {
  /** 全中台WAITING订单数。 */
  waitingOrderCount: WireLong
  /** 持有占用或迁移阻塞的队列数。 */
  occupiedQueueCount: WireLong
  /** WAITING数严格超过积压阈值的队列数。 */
  overThresholdQueueCount: WireLong
  /** 从原占用取得时间严格超过告警时长的队列数。 */
  overdueQueueCount: WireLong
  /** 成功最短占用秒数，按原acquiredAt计算。 */
  successMinimumHoldSeconds: WireLong
  /** 持续占用告警阈值秒数。 */
  occupiedAlertSeconds: WireLong
  /** 队列积压阈值，严格超过才告警。 */
  backlogThreshold: WireLong
  observedAt: WireTime
}
interface QueueIdentity {
  /** 直充限频队列内部主键。 */
  queueId: WireLong
  /** 充值手机号脱敏展示值。 */
  maskedMobile: string
  /** 平台SPU永久业务编码。 */
  platformSpuCode: string
  /** 平台SPU标准名称。 */
  platformSpuName: string | null
}
export interface WaitingOrder extends QueueIdentity {
  /** 直充限频队列项内部主键。 */
  entryId: WireLong
  /** 乐观锁版本。 */
  version: WireLong
  /** 供应链总订单号。 */
  orderNo: string
  /** 采购商侧C端订单号，CARD场景必填。 */
  buyerOrderNo: string | null
  /** 分销商内部主键。 */
  buyerId: WireLong
  /** 采购商永久业务编码。 */
  buyerCode: string | null
  /** 采购商标准名称。 */
  buyerName: string | null
  /** 采购项目内部主键；存量订单可空。 */
  projectId: WireLong | null
  /** 采购项目全局永久编码。 */
  projectCode: string | null
  /** 采购项目名称。 */
  projectName: string | null
  /** 首次入队时间，Asia/Shanghai。 */
  enqueuedAt: WireTime
  /** 截至observedAt已等待秒数，不小于零。 */
  waitSeconds: WireLong
  /** 本订单首次入队分配的队列序号。 */
  queueSequence: WireLong
}
export interface Occupancy extends QueueIdentity {
  /** 供应链总订单号；迁移阻塞可空。 */
  holderOrderNo: string | null
  /** 占用展示状态；按迁移阻塞、可信终态及窗口、当前操作事实优先级映射。 */
  displayStatus: string | null
  /** 当前占用取得时间，Asia/Shanghai。 */
  acquiredAt: WireTime | null
  /** 本次成功最短占用截止时间，Asia/Shanghai。 */
  minimumHoldUntil: WireTime | null
  /** 截至observedAt已占用秒数；迁移无取得时间时为空。 */
  heldSeconds: WireLong | null
  /** 是否严格超过持续占用告警时长。 */
  overdue: boolean
  /** 每次取得新占用递增的占用代次。 */
  generation: WireLong
  /** 乐观锁版本。 */
  version: WireLong
  /** 只读展示是否具备可信释放资格；命令事务仍再次校验。 */
  canRelease: boolean
  /** 无可信释放资格的稳定原因码。 */
  releaseBlockedReason: string | null
  /** 迁移阻塞队列的待核实供应链总订单号列表。 */
  riskOrderNos: string[] | null
}
export interface Backlog extends QueueIdentity {
  /** 本队列WAITING项数量。 */
  waitingCount: WireLong
  /** 本队列WAITING项最早首次入队时间，Asia/Shanghai。 */
  earliestEnqueuedAt: WireTime | null
  /** WAITING项数量是否严格超过积压阈值。 */
  overThreshold: boolean
}
export interface RetryPayload {
  /** 管理操作幂等号。 */
  actionNo: string
  /** 请求预期的乐观锁版本。 */
  expectedVersion: WireLong
  /** 管理操作原因。 */
  reason: string
}
export interface ReleasePayload extends RetryPayload {
  /** 供应链总订单号。 */
  expectedHolderOrderNo: string
  /** 请求预期的占用代次。 */
  expectedGeneration: WireLong
}
export interface FrequencyActionResult {
  actionNo: string
  resultCode: 'RETRY_SCHEDULED' | 'RELEASED'
  message: string
}
export interface FrequencyRows {
  WAITING: WaitingOrder
  OCCUPANCIES: Occupancy
  BACKLOGS: Backlog
}
const base = '/supply-chain/recharge-frequency'
const endpoints: Record<FrequencyView, string> = {
  WAITING: '/waiting-orders',
  OCCUPANCIES: '/occupancies',
  BACKLOGS: '/backlogs'
}
/**
 * 内部运营真实接口；精确手机号只进入POST正文，绝不放URL、缓存、复制或导出。
 * 设计：docs/superpowers/specs/2026-09-30-direct-recharge-mobile-spu-frequency-design.md#7-管理端契约与权限
 */
export const RechargeFrequencyApi = {
  statistics: () =>
    request.get<FrequencyStatistics>({ url: `${base}/statistics`, frequencySafeErrors: true }),
  page: <V extends FrequencyView>(view: V, params: FrequencyPageParams, mobile?: string) =>
    mobile
      ? request.post<FrequencyPage<FrequencyRows[V]>>({
          url: `${base}/search`,
          data: { ...params, mobile, view },
          frequencySafeErrors: true
        })
      : request.get<FrequencyPage<FrequencyRows[V]>>({
          url: `${base}${endpoints[view]}`,
          params,
          frequencySafeErrors: true
        }),
  retry: (entryId: WireLong, data: Readonly<RetryPayload>) =>
    request.post<FrequencyActionResult>({
      url: `${base}/entries/${entryId}/retry`,
      data,
      frequencySafeErrors: true
    }),
  release: (queueId: WireLong, data: Readonly<ReleasePayload>) =>
    request.post<FrequencyActionResult>({
      url: `${base}/queues/${queueId}/release`,
      data,
      frequencySafeErrors: true
    })
}
