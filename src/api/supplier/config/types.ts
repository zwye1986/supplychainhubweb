/**
 * 供应商履约技术配置（连接器/凭据/能力/映射）接口类型。
 * 字段语义与后端 SupplierConfigurationAdminController 的 ReqVO @Schema、
 * SupplierConfigurationQueryService 投影 record 及 sc_* DDL COMMENT 对齐。
 * 设计见 docs/superpowers/specs/2026-10-03-supplier-offer-publication-admin-design.md#7-rest-契约汇总phase-1-前端使用。
 */

// ── 只读投影（T1–T6）──────────────────────────────────────────────────────────

/** T1 适配器类型目录项；capabilities/credentialKeys 为封闭集，计数来自映射模板。 */
export interface AdapterTypeView {
  /** 代码注册的适配器类型，如 QNM_GAME_ORDER_V1 */
  adapterType?: string
  /** 该适配器支持的能力封闭集（Capability 枚举名） */
  capabilities?: string[]
  /** 该适配器声明的凭据键（credentialKeys()），UI 据此渲染凭据行数 */
  credentialKeys?: string[]
  /** 状态映射模板条数 */
  statusMappingTemplateCount?: number
  /** 错误码映射模板条数 */
  errorCodeMappingTemplateCount?: number
}

/** T2 连接器列表项；currentVersionId 为 null 表示尚无已发布版本。 */
export interface ConnectorListItem {
  /** 连接器稳定业务编号 */
  connectorNo?: string
  /** 代码注册的适配器类型 */
  adapterType?: string
  /** 连接器编码（供应商内自定义） */
  connectorCode?: string
  /** 当前已发布版本 id，null 表示尚未发布 */
  currentVersionId?: number | null
  /** 连接器状态码（sc_supplier_connector.status）：10启用/20停用 */
  status?: number
  /** 最新版本 id（Phase 1 连接器与版本 1:1）；草稿态 currentVersionId 为 null 时据此驱动生命周期 */
  latestVersionId?: number | null
  /** 最新版本序号 */
  latestVersionNo?: number | null
  /** 最新版本生命周期状态码：0草稿/5已验证/10已发布/90已退役 */
  latestVersionStatus?: number | null
}

/** T3 能力启用态。 */
export interface CapabilityView {
  /** 能力编码（Capability 封闭集） */
  capabilityCode?: string
  /** 是否启用 */
  enabled?: boolean
}

/** T3 连接器版本详情；仅含非秘密连接参数与能力启用态，不含凭据明文。 */
export interface ConnectorVersionDetail {
  /** 版本主键 id */
  versionId?: number
  /** 所属连接器编号 */
  connectorNo?: string
  /** 适配器类型 */
  adapterType?: string
  /** 版本序号（不可变版本，每次发布 +1） */
  versionNo?: number
  /** 版本生命周期状态码：0草稿/5已验证/10已发布/90已退役 */
  status?: number
  /** 供应商网关基础地址 */
  baseUrl?: string
  /** 商户账号 */
  merchantAccount?: string
  /** 协议版本 */
  protocolVersion?: string
  /** 回调路径 */
  callbackPath?: string
  /** 连接超时（毫秒） */
  connectTimeoutMs?: number
  /** 读取超时（毫秒） */
  readTimeoutMs?: number
  /** 限流（次/秒） */
  rateLimit?: number
  /** 并发上限 */
  concurrencyLimit?: number
  /** 适配器配置 Schema 版本（服务端按 adapterType 生成） */
  adapterConfigSchemaVersion?: number
  /** 适配器私有配置 JSON（封闭 Schema） */
  adapterConfigJson?: string
  /** 扩展配置 JSON（AD-5，可空） */
  extraConfig?: string
  /** 验证结果状态码：0未验证/10通过/20失败/30已过期 */
  validationStatus?: number
  /** 发布时间（UTC） */
  publishedAt?: string
  /** 能力启用态列表 */
  capabilities?: CapabilityView[]
}

/** T5 单条状态映射投影。 */
export interface StatusMappingView {
  /** 映射主键 id */
  id?: number
  /** 外部状态 */
  externalStatus?: string
  /** 外部子状态 */
  externalSubStatus?: string
  /** 业务阶段：CREATE/QUERY/CALLBACK */
  businessPhase?: string
  /** 事实类型：ACCEPTED/SUCCEEDED/REJECTED/RESULT_UNKNOWN */
  factType?: string
  /** 是否终态 */
  terminal?: boolean
  /** 匹配优先级 */
  priority?: number
  /** 映射状态码 */
  status?: number
}

/** T5 单条错误码映射投影。 */
export interface ErrorCodeMappingView {
  /** 映射主键 id */
  id?: number
  /** 外部错误码 */
  externalErrorCode?: string
  /** 外部子错误码 */
  externalSubCode?: string
  /** 错误分类 */
  errorClass?: string
  /** 处置动作：REJECT/RETRY_SAFE/QUERY_FIRST/MANUAL */
  actionType?: string
  /** 是否可重试 */
  retryable?: boolean
  /** 映射状态码 */
  status?: number
}

/** T5 映射明细：状态映射 + 错误码映射。 */
export interface MappingsView {
  statusMappings?: StatusMappingView[]
  errorCodeMappings?: ErrorCodeMappingView[]
}

/** T4 凭据项投影：只含非秘密字段，secretRef 与 activeSecretVersion 刻意排除（只写不回显）。 */
export interface CredentialItemView {
  /** 凭据项主键 id */
  id?: number
  /** 凭据项键（须在适配器 credentialKeys() 并集内） */
  itemKey?: string
  /** 凭据来源类型：ENV/ENVELOPE */
  providerType?: string
  /** 脱敏提示（供后台识别，不含明文） */
  maskedHint?: string
  /** 凭据项状态码：10可用/20停用/90归档 */
  status?: number
}

/** T4 凭据集投影，含其下凭据项列表。 */
export interface CredentialSetView {
  /** 凭据集主键 id */
  id?: number
  /** 凭据集编号（供应商内唯一） */
  setCode?: string
  /** 凭据集状态码：10可用/20停用/90归档 */
  status?: number
  /** 凭据项列表 */
  items?: CredentialItemView[]
}

/** T6 凭据槽只读投影（连接器凭据引用下拉源）：secretRef 与 activeSecretVersion 刻意排除。 */
export interface CredentialSlotView {
  /** 凭据槽稳定业务编号（连接器 credentialSlotNo 绑定值） */
  slotNo?: string
  /** 密钥托管类型，如 ENV/KMS/ENVELOPE */
  providerType?: string
  /** 脱敏提示（供后台识别，不含明文） */
  maskedHint?: string
  /** 凭据槽状态码：10启用/20暂停/90已归档 */
  status?: number
}

// ── 写请求 VO ────────────────────────────────────────────────────────────────

/** 创建凭据集请求。 */
export interface CreateCredentialSetReqVO {
  /** 供应商身份编码 */
  supplierCode: string
  /** 凭据集编号，供应商内唯一 */
  setCode: string
}

/** 创建凭据项请求（F1-hybrid）；secretValue 仅入参、服务端立即信封加密、不回显不落日志。 */
export interface CreateCredentialItemReqVO {
  /** 供应商身份编码 */
  supplierCode: string
  /** 所属凭据集编号 */
  setCode: string
  /** 凭据项键，须在适配器 credentialKeys() 并集内，如 secretKey */
  itemKey: string
  /** 凭据来源类型：ENV 或 ENVELOPE */
  providerType: string
  /** ENV 时的秘密引用，须以 env: 前缀；ENVELOPE 时留空 */
  secretRef?: string
  /** ENVELOPE 时的秘密明文，仅入参、不回显不落日志；ENV 时留空 */
  secretValue?: string
  /** 脱敏提示（用于列表展示，不含明文） */
  maskedHint: string
  /** 生效密钥版本号（>= 1） */
  activeSecretVersion: number
}

/** 创建连接器草稿请求；适配器配置 Schema 版本由服务端按 adapterType 生成。 */
export interface CreateConnectorDraftReqVO {
  /** 供应商身份编码 */
  supplierCode: string
  /** 连接器编码（供应商内自定义） */
  connectorCode: string
  /** 代码注册的适配器类型，如 QNM_GAME_ORDER_V1 */
  adapterType: string
  /** 供应商网关基础地址 */
  baseUrl: string
  /** 商户账号（可空） */
  merchantAccount?: string
  /** 凭据槽编号（T6 下拉选中值，绑定 legacy sc_credential_slot） */
  credentialSlotNo: string
  /** 协议版本 */
  protocolVersion: string
  /** 回调路径（可空） */
  callbackPath?: string
  /** 连接超时（毫秒，>= 1） */
  connectTimeoutMs: number
  /** 读取超时（毫秒，>= 1） */
  readTimeoutMs: number
  /** 限流（次/秒，>= 1，可空） */
  rateLimit?: number
  /** 并发上限（>= 1，可空） */
  concurrencyLimit?: number
  /** 封闭 Schema JSON；QNM 一期固定为 {} */
  adapterConfigJson: string
}

/** 按适配器模板初始化映射请求（G2）。 */
export interface InitializeMappingsReqVO {
  /** 连接器版本 id */
  connectorVersionId: number
}

/** 追加单条错误码映射请求。 */
export interface AddErrorMappingReqVO {
  /** 连接器版本 id */
  connectorVersionId: number
  /** 外部错误码 */
  externalErrorCode: string
  /** 外部子错误码（可空） */
  externalSubCode?: string
  /** 错误分类 */
  errorClass: string
  /** 处置动作：REJECT/RETRY_SAFE/QUERY_FIRST/MANUAL */
  actionType: string
  /** 是否可重试 */
  retryable: boolean
}

/** 追加单条状态映射请求。 */
export interface AddStatusMappingReqVO {
  /** 连接器版本 id */
  connectorVersionId: number
  /** 外部状态 */
  externalStatus: string
  /** 外部子状态（可空） */
  externalSubStatus?: string
  /** 业务阶段：CREATE/QUERY/CALLBACK */
  businessPhase: string
  /** 事实类型：ACCEPTED/SUCCEEDED/REJECTED/RESULT_UNKNOWN */
  factType: string
  /** 是否终态 */
  terminal: boolean
}

/** 校验连接器草稿请求（在业务事务外验证）。 */
export interface ValidateConnectorReqVO {
  /** 连接器版本 id */
  connectorVersionId: number
  /** 声明启用的能力封闭集（来自 T1 capabilities()） */
  capabilities: string[]
  /** 校验有效分钟数（>= 1） */
  validMinutes: number
  /** 校验原因（审计） */
  reason: string
}

/** 发布连接器请求（乐观锁 expectedConnectorVersion）。 */
export interface PublishConnectorReqVO {
  /** 连接器编号 */
  connectorNo: string
  /** 连接器版本 id */
  connectorVersionId: number
  /** 期望的连接器聚合版本（乐观锁，>= 0） */
  expectedConnectorVersion: number
  /** 发布原因（审计） */
  reason: string
}

/** 退役连接器请求。 */
export interface RetireConnectorReqVO {
  /** 连接器编号 */
  connectorNo: string
  /** 连接器版本 id */
  connectorVersionId: number
  /** 退役原因（审计） */
  reason: string
}

// ── 结果记录 ─────────────────────────────────────────────────────────────────

/** 创建连接器草稿结果。 */
export interface DraftConnectorResult {
  /** 连接器编号 */
  connectorNo?: string
  /** 首个草稿版本 id */
  connectorVersionId?: number
  /** 版本序号 */
  versionNo?: number
}

/** 连接器校验结果。 */
export interface ValidationResult {
  /** 连接器版本 id */
  connectorVersionId?: number
  /** 校验通过时间 */
  validatedAt?: string
  /** 校验过期时间 */
  validationExpiresAt?: string
}

/** 连接器发布结果。 */
export interface ConnectorPublishResult {
  /** 连接器编号 */
  connectorNo?: string
  /** 已发布版本 id */
  connectorVersionId?: number
  /** 版本序号 */
  connectorVersionNo?: number
  /** 连接器聚合乐观锁版本 */
  aggregateVersion?: number
}
