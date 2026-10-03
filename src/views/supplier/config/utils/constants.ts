/**
 * 供应商履约技术配置（连接器/凭据/能力/映射）前端纯逻辑与展示常量。
 *
 * 本模块必须保持「无 @/ 值导入」，以便用 Node 内置测试运行器（node --test）直接对纯逻辑做单测；
 * 类型只用 `import type` 或就地定义（类型在 node 类型擦除后不产生运行时依赖）。
 * 设计见 docs/superpowers/specs/2026-10-03-supplier-offer-publication-admin-design.md#8-前端设计supplychainhubweb。
 */

/**
 * 连接器聚合乐观锁初值：createConnectorDraft 落 connector.version=0，validate/映射只动版本行与映射表
 * （不动聚合），故 Phase 1 首次 publish 的 expectedConnectorVersion 恒为 0。用命名常量避免魔法值（AGENTS.md §7）。
 * 设计见 docs/superpowers/specs/2026-10-03-supplier-offer-publication-admin-design.md#82-连接器子页e1。
 */
export const INITIAL_CONNECTOR_VERSION = 0

/** 连接器生命周期状态码；对齐后端 ConnectorVersionStatus 与 sc_connector_version.status DDL COMMENT。 */
export const ConnectorStatusEnum = {
  DRAFT: 0,
  VALIDATED: 5,
  PUBLISHED: 10,
  RETIRED: 90
} as const

export const CONNECTOR_STATUS_OPTIONS: { value: number; label: string; type: TagType }[] = [
  { value: ConnectorStatusEnum.DRAFT, label: '草稿', type: 'info' },
  { value: ConnectorStatusEnum.VALIDATED, label: '已验证', type: 'warning' },
  { value: ConnectorStatusEnum.PUBLISHED, label: '已发布', type: 'success' },
  { value: ConnectorStatusEnum.RETIRED, label: '已退役', type: 'info' }
]

/** 验证结果状态码；对齐 sc_connector_version.validation_status DDL COMMENT：0未验证/10通过/20失败/30已过期。 */
export const ValidationStatusEnum = {
  UNVALIDATED: 0,
  PASSED: 10,
  FAILED: 20,
  EXPIRED: 30
} as const

export const VALIDATION_STATUS_OPTIONS: { value: number; label: string; type: TagType }[] = [
  { value: ValidationStatusEnum.UNVALIDATED, label: '未验证', type: 'info' },
  { value: ValidationStatusEnum.PASSED, label: '通过', type: 'success' },
  { value: ValidationStatusEnum.FAILED, label: '失败', type: 'danger' },
  { value: ValidationStatusEnum.EXPIRED, label: '已过期', type: 'warning' }
]

/** 凭据来源类型；ENV=环境变量引用（不落密文），ENVELOPE=信封加密明文（只写不回显）。 */
export const CredentialProviderEnum = {
  ENV: 'ENV',
  ENVELOPE: 'ENVELOPE'
} as const

export const CREDENTIAL_PROVIDER_OPTIONS: { value: string; label: string }[] = [
  { value: CredentialProviderEnum.ENV, label: '环境变量引用（env:）' },
  { value: CredentialProviderEnum.ENVELOPE, label: '信封加密明文（只写不回显）' }
]

/** 凭据集/项状态码；对齐后端 CredentialStatus 与 sc_credential_set/item.status DDL COMMENT：10可用/20停用/90归档。 */
export const CredentialStatusEnum = {
  ACTIVE: 10,
  DISABLED: 20,
  ARCHIVED: 90
} as const

export const CREDENTIAL_STATUS_OPTIONS: { value: number; label: string; type: TagType }[] = [
  { value: CredentialStatusEnum.ACTIVE, label: '可用', type: 'success' },
  { value: CredentialStatusEnum.DISABLED, label: '停用', type: 'info' },
  { value: CredentialStatusEnum.ARCHIVED, label: '归档', type: 'info' }
]

/** 错误码映射处置动作；对齐后端 AddErrorMappingReqVO.actionType。 */
export const ERROR_ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: 'REJECT', label: '拒绝' },
  { value: 'RETRY_SAFE', label: '安全重试' },
  { value: 'QUERY_FIRST', label: '先查询' },
  { value: 'MANUAL', label: '人工处理' }
]

/** 状态映射业务阶段；对齐后端 AddStatusMappingReqVO.businessPhase。 */
export const BUSINESS_PHASE_OPTIONS: { value: string; label: string }[] = [
  { value: 'CREATE', label: '创建' },
  { value: 'QUERY', label: '查询' },
  { value: 'CALLBACK', label: '回调' }
]

/** 状态映射事实类型；对齐后端 AddStatusMappingReqVO.factType。 */
export const FACT_TYPE_OPTIONS: { value: string; label: string; type: TagType }[] = [
  { value: 'ACCEPTED', label: '已受理', type: 'warning' },
  { value: 'SUCCEEDED', label: '已成功', type: 'success' },
  { value: 'REJECTED', label: '已拒绝', type: 'danger' },
  { value: 'RESULT_UNKNOWN', label: '结果未知', type: 'info' }
]

type TagType = 'success' | 'warning' | 'info' | 'danger' | 'primary'

const findOption = <T extends { value: any; label: string; type?: TagType }>(
  options: T[],
  value?: any
) => options.find((item) => item.value === value)

export const getConnectorStatusLabel = (code?: number): string =>
  findOption(CONNECTOR_STATUS_OPTIONS, code)?.label || '-'

export const getConnectorStatusType = (code?: number): TagType =>
  (findOption(CONNECTOR_STATUS_OPTIONS, code)?.type || 'info') as TagType

export const getValidationStatusLabel = (code?: number): string =>
  findOption(VALIDATION_STATUS_OPTIONS, code)?.label || '-'

export const getValidationStatusType = (code?: number): TagType =>
  (findOption(VALIDATION_STATUS_OPTIONS, code)?.type || 'info') as TagType

export const getCredentialStatusLabel = (code?: number): string =>
  findOption(CREDENTIAL_STATUS_OPTIONS, code)?.label || '-'

export const getCredentialStatusType = (code?: number): TagType =>
  (findOption(CREDENTIAL_STATUS_OPTIONS, code)?.type || 'info') as TagType

/**
 * 凭据项标识候选 = 所有已注册适配器 credentialKeys() 的并集（封闭集）。
 * 因建项请求体不含 adapterType，itemKey 落在并集内即被接受（§6.3 定案），精确到适配器的校验推迟到发布/上架。
 * 结构化入参避免 @/ 值导入，保持本模块可被 node --test 直接加载。
 */
export const aggregateCredentialKeys = (
  adapterTypes?: { credentialKeys?: string[] }[] | null
): string[] => {
  const keys = new Set<string>()
  for (const view of adapterTypes || []) {
    for (const key of view.credentialKeys || []) keys.add(key)
  }
  return [...keys]
}

export const getOptionLabel = <T extends { value: any; label: string }>(
  options: T[],
  value?: any
): string => options.find((item) => item.value === value)?.label || '-'

/** adapter_config_json / extra_config 提交前的 JSON 合法性校验（空串视为非法，需至少 `{}`）。 */
export const isValidJson = (text?: string | null): boolean => {
  if (text == null) return false
  const trimmed = text.trim()
  if (!trimmed) return false
  try {
    JSON.parse(trimmed)
    return true
  } catch {
    return false
  }
}

/**
 * 新建凭据项表单入参（UI 形态，区别于后端只写字段：ENVELOPE 的 secretValue 仅入参、永不回显）。
 * 设计见 docs/superpowers/specs/2026-10-03-supplier-offer-publication-admin-design.md#83-凭据子页f1-hybrid。
 */
export interface CredentialItemForm {
  itemKey?: string
  providerType?: string
  secretRef?: string
  secretValue?: string
  maskedHint?: string
  activeSecretVersion?: number | null
}

/**
 * F1-hybrid 凭据项跨字段即时校验（保存前）；后端仍为最终裁决，这里只做前端提示。
 * 关键护栏：ENV 必须 `env:` 前缀且不得带明文；ENVELOPE 必须带明文且不得带 `env:` 引用；
 * 无论何种来源都不得回显密文/明文，maskedHint 与 activeSecretVersion 必填。
 * 返回首个错误文案，全部通过返回 null。
 */
export const validateCredentialItem = (form: CredentialItemForm): string | null => {
  const itemKey = form.itemKey?.trim()
  if (!itemKey) return '请填写凭据项标识 itemKey'

  const providerType = form.providerType
  if (providerType !== CredentialProviderEnum.ENV && providerType !== CredentialProviderEnum.ENVELOPE) {
    return '请选择凭据来源类型（ENV / ENVELOPE）'
  }

  const maskedHint = form.maskedHint?.trim()
  if (!maskedHint) return '请填写脱敏提示 maskedHint（用于列表展示，不含明文）'

  const activeSecretVersion = form.activeSecretVersion
  if (activeSecretVersion == null || activeSecretVersion < 1) {
    return '请填写生效密钥版本号（>= 1）'
  }

  const secretRef = form.secretRef?.trim()
  const secretValue = form.secretValue?.trim()

  if (providerType === CredentialProviderEnum.ENV) {
    if (!secretRef) return 'ENV 来源需填写以 env: 开头的引用，例如 env:QNM_TEST_USERKEY'
    if (!secretRef.startsWith('env:')) return 'ENV 来源的 secretRef 必须以 env: 前缀开头'
    if (secretValue) return 'ENV 来源不应填写明文密钥值 secretValue（密文由服务端从环境注入）'
    return null
  }

  // ENVELOPE
  if (!secretValue) return 'ENVELOPE 来源需填写密钥明文 secretValue（提交后仅保存加密信封，不回显）'
  if (secretRef) return 'ENVELOPE 来源不应填写 env: 引用 secretRef（明文由服务端信封加密）'
  return null
}
