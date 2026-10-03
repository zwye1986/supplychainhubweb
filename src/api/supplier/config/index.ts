import request from '@/config/axios'

export type {
  AdapterTypeView,
  ConnectorListItem,
  ConnectorVersionDetail,
  CapabilityView,
  StatusMappingView,
  ErrorCodeMappingView,
  MappingsView,
  CredentialItemView,
  CredentialSetView,
  CredentialSlotView,
  CreateCredentialSetReqVO,
  CreateCredentialItemReqVO,
  CreateConnectorDraftReqVO,
  InitializeMappingsReqVO,
  AddErrorMappingReqVO,
  AddStatusMappingReqVO,
  ValidateConnectorReqVO,
  PublishConnectorReqVO,
  RetireConnectorReqVO,
  DraftConnectorResult,
  ValidationResult,
  ConnectorPublishResult
} from './types'

import type {
  AdapterTypeView,
  ConnectorListItem,
  ConnectorVersionDetail,
  MappingsView,
  CredentialSetView,
  CredentialSlotView,
  CreateCredentialSetReqVO,
  CreateCredentialItemReqVO,
  CreateConnectorDraftReqVO,
  InitializeMappingsReqVO,
  AddErrorMappingReqVO,
  AddStatusMappingReqVO,
  ValidateConnectorReqVO,
  PublishConnectorReqVO,
  RetireConnectorReqVO,
  DraftConnectorResult,
  ValidationResult,
  ConnectorPublishResult
} from './types'

/** 技术菜单统一 URL 前缀；权限 H2 全 supply-chain:admin（后端类级 @PreAuthorize）。 */
const BASE = '/supply-chain/supplier-config'

/**
 * 供应商履约技术配置（连接器/凭据/能力/映射）接口。
 * 设计见 docs/superpowers/specs/2026-10-03-supplier-offer-publication-admin-design.md#8-前端设计supplychainhubweb。
 */
export const SupplierConfigApi = {
  /** T1 列出代码注册的适配器类型目录：GET /adapter-types */
  listAdapterTypes: async () => {
    return await request.get<AdapterTypeView[]>({ url: `${BASE}/adapter-types` })
  },

  /** T2 列出某供应商的连接器：GET /{supplierCode}/connectors */
  listConnectors: async (supplierCode: string) => {
    return await request.get<ConnectorListItem[]>({ url: `${BASE}/${supplierCode}/connectors` })
  },

  /** T3 查询连接器版本详情（只读，不含凭据明文）：GET /connectors/{connectorNo}/versions/{versionId} */
  getConnectorVersionDetail: async (connectorNo: string, versionId: number) => {
    return await request.get<ConnectorVersionDetail>({
      url: `${BASE}/connectors/${connectorNo}/versions/${versionId}`
    })
  },

  /** T4 列出某供应商的凭据集与凭据项（只回 maskedHint，绝不回 secretRef/密文）：GET /{supplierCode}/credential-sets */
  listCredentialSets: async (supplierCode: string) => {
    return await request.get<CredentialSetView[]>({ url: `${BASE}/${supplierCode}/credential-sets` })
  },

  /** T5 查询连接器版本的状态与错误码映射明细：GET /connectors/versions/{versionId}/mappings */
  getMappings: async (versionId: number) => {
    return await request.get<MappingsView>({ url: `${BASE}/connectors/versions/${versionId}/mappings` })
  },

  /** T6 列出平台级可用凭据槽（连接器凭据引用下拉源，脱敏）：GET /credential-slots */
  listCredentialSlots: async () => {
    return await request.get<CredentialSlotView[]>({ url: `${BASE}/credential-slots` })
  },

  /** 创建凭据集：POST /credential-sets，返回凭据集 id */
  createCredentialSet: async (data: CreateCredentialSetReqVO) => {
    return await request.post<number>({ url: `${BASE}/credential-sets`, data })
  },

  /** 向凭据集添加凭据项（F1-hybrid，ENVELOPE 明文只写不回显）：POST /credential-items */
  createCredentialItem: async (data: CreateCredentialItemReqVO) => {
    return await request.post<boolean>({ url: `${BASE}/credential-items`, data })
  },

  /** 创建连接器及首个草稿版本：POST /connectors/drafts */
  createConnectorDraft: async (data: CreateConnectorDraftReqVO) => {
    return await request.post<DraftConnectorResult>({ url: `${BASE}/connectors/drafts`, data })
  },

  /** 按适配器模板初始化连接器草稿映射（G2）：POST /connectors/mappings/initialize，返回初始化行数 */
  initializeMappings: async (data: InitializeMappingsReqVO) => {
    return await request.post<number>({ url: `${BASE}/connectors/mappings/initialize`, data })
  },

  /** 追加单条错误码映射：POST /connectors/error-mappings */
  addErrorMapping: async (data: AddErrorMappingReqVO) => {
    return await request.post<boolean>({ url: `${BASE}/connectors/error-mappings`, data })
  },

  /** 追加单条状态映射：POST /connectors/status-mappings */
  addStatusMapping: async (data: AddStatusMappingReqVO) => {
    return await request.post<boolean>({ url: `${BASE}/connectors/status-mappings`, data })
  },

  /** 在业务事务外校验连接器草稿（声明能力）：POST /connectors/validate */
  validateConnector: async (data: ValidateConnectorReqVO) => {
    return await request.post<ValidationResult>({ url: `${BASE}/connectors/validate`, data })
  },

  /** 发布已校验的连接器不可变版本（乐观锁）：POST /connectors/publish */
  publishConnector: async (data: PublishConnectorReqVO) => {
    return await request.post<ConnectorPublishResult>({ url: `${BASE}/connectors/publish`, data })
  },

  /** 退役连接器已发布版本：PUT /connectors/retire */
  retireConnector: async (data: RetireConnectorReqVO) => {
    return await request.put<boolean>({ url: `${BASE}/connectors/retire`, data })
  }
}
