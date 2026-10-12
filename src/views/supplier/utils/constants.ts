/** 分转元 */
export const centsToYuan = (cents?: number | null) => {
  if (cents === undefined || cents === null) return undefined
  return Number((Number(cents) / 100).toFixed(2))
}

/** 元转分 */
export const yuanToCents = (yuan?: number | null) => {
  if (yuan === undefined || yuan === null) return undefined
  return Math.round(Number(yuan) * 100)
}

/** 金额分格式化为元文案 */
export const formatCentsYuan = (cents?: number | null) => {
  const yuan = centsToYuan(cents)
  return yuan === undefined ? '-' : yuan.toFixed(2)
}

/** 折扣基点转百分比，10000=100% */
export const bpToPercent = (bp?: number | null) => {
  if (bp === undefined || bp === null) return undefined
  return Number((Number(bp) / 100).toFixed(2))
}

/** 百分比转折扣基点 */
export const percentToBp = (percent?: number | null) => {
  if (percent === undefined || percent === null) return undefined
  return Math.round(Number(percent) * 100)
}

/** 分销商合作状态（接口枚举名） */
export const DistributorStatusEnum = {
  NORMAL: 'ACTIVE',
  PAUSED: 'SUSPENDED',
  BLACKLIST: 'BLACKLIST'
} as const

/** 合作模式（接口枚举名，可多选） */
export const COOPERATION_MODE_OPTIONS = [
  { value: 'DIRECT', label: '直营分销' },
  { value: 'AGENT', label: '代理分销' },
  { value: 'CHANNEL', label: '渠道分销' }
]

export const getDistributorStatusType = (
  status?: string
): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    [DistributorStatusEnum.NORMAL]: 'success',
    [DistributorStatusEnum.PAUSED]: 'warning',
    [DistributorStatusEnum.BLACKLIST]: 'danger'
  }
  return (status && map[status]) || 'info'
}

export const getCooperationModeLabel = (value?: string): string => {
  if (!value) return '-'
  const aliases: Record<string, string> = {
    direct: 'DIRECT',
    agent: 'AGENT',
    channel: 'CHANNEL'
  }
  const key = aliases[value] || value
  return COOPERATION_MODE_OPTIONS.find((item) => item.value === key)?.label || value
}

/** 项目状态（接口枚举名；创建仅允许 DRAFT / ACTIVE） */
export const ProjectStatusEnum = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE'
} as const

export const PROJECT_STATUS_OPTIONS = [
  { value: ProjectStatusEnum.DRAFT, label: '草稿', type: 'info' as const },
  { value: ProjectStatusEnum.ACTIVE, label: '进行中', type: 'success' as const }
]

/** 项目类型封闭枚举 */
export const PROJECT_TYPE_OPTIONS = [
  { value: 'WELFARE', label: '企业福利' },
  { value: 'BENEFIT', label: '员工权益' },
  { value: 'CAMPAIGN', label: '专项活动' },
  { value: 'SUBSIDY', label: '补贴项目' },
  { value: 'GROUP', label: '团购项目' }
]

/** 结算方类型，本期仅 DISTRIBUTOR */
export const SettlementPartyTypeEnum = {
  DISTRIBUTOR: 'DISTRIBUTOR'
} as const

export const SETTLEMENT_PARTY_TYPE_OPTIONS = [
  { value: SettlementPartyTypeEnum.DISTRIBUTOR, label: '分销商' }
]

/** 目录模式 */
export const CATALOG_MODE_OPTIONS = [
  { value: 'MANAGED', label: '中台管理' },
  { value: 'INDEPENDENT', label: '项目独立' }
]

export const getProjectStatusLabel = (status?: string): string => {
  if (!status) return '-'
  return PROJECT_STATUS_OPTIONS.find((item) => item.value === status)?.label || status
}

export const getProjectStatusType = (
  status?: string
): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  return PROJECT_STATUS_OPTIONS.find((item) => item.value === status)?.type || 'info'
}

export const getProjectTypeLabel = (value?: string): string => {
  if (!value) return '-'
  const aliases: Record<string, string> = {
    welfare: 'WELFARE',
    benefit: 'BENEFIT',
    campaign: 'CAMPAIGN',
    subsidy: 'SUBSIDY',
    group: 'GROUP'
  }
  const key = aliases[value] || value
  return PROJECT_TYPE_OPTIONS.find((item) => item.value === key)?.label || value
}

export const getSettlementPartyTypeLabel = (value?: string): string => {
  if (!value) return '-'
  const aliases: Record<string, string> = {
    distributor: SettlementPartyTypeEnum.DISTRIBUTOR,
    platform: SettlementPartyTypeEnum.DISTRIBUTOR
  }
  const key = aliases[value] || value
  return SETTLEMENT_PARTY_TYPE_OPTIONS.find((item) => item.value === key)?.label || value
}

export const getCatalogModeLabel = (value?: string): string => {
  return CATALOG_MODE_OPTIONS.find((item) => item.value === value)?.label || value || '-'
}
