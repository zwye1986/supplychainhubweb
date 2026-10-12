<template>
  <div v-loading="loading">
    <el-form :inline="true" class="mb-8px">
      <el-form-item label="连接器">
        <el-select
          v-model="selectedConnectorNo"
          filterable
          clearable
          placeholder="请选择连接器管理映射"
          class="!w-320px"
          @change="loadMappings"
        >
          <el-option
            v-for="item in connectors"
            :key="item.connectorNo"
            :label="`${item.connectorCode || item.connectorNo}（v${item.latestVersionNo ?? '-'}）`"
            :value="item.connectorNo!"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="selectedVersionId != null">
        <el-button type="primary" plain :disabled="!canInitialize" @click="handleInitialize">
          <Icon icon="ep:magic-stick" class="mr-5px" /> 从模板初始化
        </el-button>
        <el-button :disabled="!canStatusAppend" @click="openAppend('STATUS')">
          <Icon icon="ep:plus" class="mr-5px" /> 追加状态映射
        </el-button>
        <el-button :disabled="!canErrorAppend" @click="openAppend('ERROR')">
          <Icon icon="ep:plus" class="mr-5px" /> 追加错误码映射
        </el-button>
      </el-form-item>
    </el-form>

    <el-empty v-if="!selectedConnectorNo" description="请选择一个连接器" />
    <template v-else>
      <template v-if="hasLoadedMappings">
        <div class="mb-8px">
          查看版本：v{{ mappings.versionNo }}（ID：{{ mappings.connectorVersionId }}）
          <el-tag :type="getConnectorStatusType(mappings.versionStatus)" size="small">
            {{ getConnectorStatusLabel(mappings.versionStatus) }}
          </el-tag>
          <span class="ml-12px"
            >当前已发布版本 ID：{{ mappings.currentPublishedVersionId ?? '无' }}</span
          >
        </div>
        <el-alert
          v-if="mappings.versionStatus === ConnectorStatusEnum.DRAFT"
          title="草稿尚未生效，派单仍使用当前已发布版本；须验证并发布后才生效。"
          type="warning"
          :closable="false"
          class="mb-8px"
        />
        <div v-if="mappings.mappingDescription" class="mb-16px">{{
          mappings.mappingDescription
        }}</div>
      </template>
      <div class="font-bold mb-8px">状态映射（{{ mappings.statusMappings?.length || 0 }}）</div>
      <el-table :data="mappings.statusMappings || []" border size="small" class="mb-16px">
        <el-table-column label="外部状态" prop="externalStatus" min-width="120" />
        <el-table-column label="外部子状态" prop="externalSubStatus" min-width="110" />
        <el-table-column label="业务阶段" min-width="100">
          <template #default="{ row }">{{
            getOptionLabel(BUSINESS_PHASE_OPTIONS, row.businessPhase)
          }}</template>
        </el-table-column>
        <el-table-column label="事实类型" min-width="110">
          <template #default="{ row }">
            <el-tag :type="getFactTypeTag(row.factType)" size="small">
              {{ getOptionLabel(FACT_TYPE_OPTIONS, row.factType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="终态" min-width="80">
          <template #default="{ row }">{{ row.terminal ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="优先级" prop="priority" min-width="80" />
      </el-table>

      <div class="font-bold mb-8px"
        >错误码映射（{{ mappings.errorCodeMappings?.length || 0 }}）</div
      >
      <el-table :data="mappings.errorCodeMappings || []" border size="small">
        <el-table-column label="外部错误码" prop="externalErrorCode" min-width="130" />
        <el-table-column label="外部子错误码" prop="externalSubCode" min-width="120" />
        <el-table-column label="错误分类" prop="errorClass" min-width="120" />
        <el-table-column label="处置动作" min-width="110">
          <template #default="{ row }">{{
            getOptionLabel(ERROR_ACTION_OPTIONS, row.actionType)
          }}</template>
        </el-table-column>
        <el-table-column label="可重试" min-width="80">
          <template #default="{ row }">{{ row.retryable ? '是' : '否' }}</template>
        </el-table-column>
      </el-table>
    </template>

    <MappingAppendDialog
      ref="appendDialogRef"
      :connector-version-id="hasLoadedMappings ? mappings.connectorVersionId : null"
      :status-append-allowed="canStatusAppend"
      :error-append-allowed="canErrorAppend"
      @success="loadMappings"
    />
  </div>
</template>

<script lang="ts" setup>
import { SupplierConfigApi } from '@/api/supplier/config'
import type { ConnectorListItem, MappingsView } from '@/api/supplier/config'
import MappingAppendDialog from './MappingAppendDialog.vue'
import {
  BUSINESS_PHASE_OPTIONS,
  ConnectorStatusEnum,
  getConnectorStatusLabel,
  getConnectorStatusType,
  ERROR_ACTION_OPTIONS,
  FACT_TYPE_OPTIONS,
  getOptionLabel
} from '../utils/constants'

/**
 * 映射子页：展示实际加载版本与后端映射管理规则，草稿操作不等于派单版本已生效。
 * 写入入口仅信任当前供应商、连接器和版本对应的完整 allowed 投影，缺失或加载中默认不可写。
 * 设计见 docs/superpowers/specs/2026-10-12-huasheng-fulfillment-hardening-design.md#32-前端展示与竞态。
 */
defineOptions({ name: 'MappingPanel' })

const props = defineProps<{ supplierCode: string; configurationRevision?: number }>()

const message = useMessage()
const connectorLoading = ref(false)
const mappingLoading = ref(false)
const loading = computed(() => connectorLoading.value || mappingLoading.value)
const connectors = ref<ConnectorListItem[]>([])
const selectedConnectorNo = ref('')
const mappings = ref<MappingsView>({})
const appendDialogRef = ref()

const selectedVersionId = computed<number | null>(() => {
  const row = connectors.value.find((c) => c.connectorNo === selectedConnectorNo.value)
  return row?.latestVersionId ?? row?.currentVersionId ?? null
})

let mappingRequest = 0
let connectorRequest = 0
const loadedSupplierCode = ref('')
const loadedConnectorNo = ref('')

const hasLoadedMappings = computed(
  () =>
    !loading.value &&
    loadedSupplierCode.value === props.supplierCode &&
    loadedConnectorNo.value === selectedConnectorNo.value &&
    selectedVersionId.value != null &&
    mappings.value.connectorVersionId === selectedVersionId.value
)
const hasManagementRules = computed(
  () =>
    hasLoadedMappings.value &&
    typeof mappings.value.versionNo === 'number' &&
    Object.values(ConnectorStatusEnum).some((status) => status === mappings.value.versionStatus) &&
    (mappings.value.currentPublishedVersionId === null ||
      typeof mappings.value.currentPublishedVersionId === 'number') &&
    typeof mappings.value.mappingDescription === 'string' &&
    Array.isArray(mappings.value.statusMappings) &&
    Array.isArray(mappings.value.errorCodeMappings) &&
    typeof mappings.value.initializeAllowed === 'boolean' &&
    typeof mappings.value.statusAppendAllowed === 'boolean' &&
    typeof mappings.value.errorAppendAllowed === 'boolean'
)
const canInitialize = computed(
  () => hasManagementRules.value && mappings.value.initializeAllowed === true
)
const canStatusAppend = computed(
  () => hasManagementRules.value && mappings.value.statusAppendAllowed === true
)
const canErrorAppend = computed(
  () => hasManagementRules.value && mappings.value.errorAppendAllowed === true
)

const getFactTypeTag = (factType?: string) =>
  FACT_TYPE_OPTIONS.find((opt) => opt.value === factType)?.type || 'info'

/**
 * 请求序号与三重身份同时校验，切换供应商/连接器/版本后旧响应不能恢复写入资格。
 * 设计见 docs/superpowers/specs/2026-10-12-huasheng-fulfillment-hardening-design.md#32-前端展示与竞态。
 */
const loadMappings = async () => {
  const request = ++mappingRequest
  const supplierCode = props.supplierCode
  const connectorNo = selectedConnectorNo.value
  const versionId = selectedVersionId.value
  mappings.value = {}
  loadedSupplierCode.value = ''
  loadedConnectorNo.value = ''
  mappingLoading.value = false
  if (versionId == null) return
  const isCurrent = () =>
    request === mappingRequest &&
    supplierCode === props.supplierCode &&
    connectorNo === selectedConnectorNo.value &&
    versionId === selectedVersionId.value
  mappingLoading.value = true
  try {
    const result = await SupplierConfigApi.getMappings(versionId)
    if (!isCurrent()) return
    mappings.value = result || {}
    loadedSupplierCode.value = supplierCode
    loadedConnectorNo.value = connectorNo
  } catch (error: any) {
    if (isCurrent() && error?.message) message.error(error.message)
  } finally {
    if (request === mappingRequest) mappingLoading.value = false
  }
}

const loadConnectors = async () => {
  const request = ++connectorRequest
  const supplierCode = props.supplierCode
  const isCurrent = () => request === connectorRequest && supplierCode === props.supplierCode
  connectors.value = []
  if (!supplierCode) {
    connectorLoading.value = false
    return true
  }
  connectorLoading.value = true
  try {
    const result = await SupplierConfigApi.listConnectors(supplierCode)
    if (!isCurrent()) return false
    connectors.value = result || []
    return true
  } catch (error: any) {
    if (isCurrent() && error?.message) message.error(error.message)
    return isCurrent()
  } finally {
    if (request === connectorRequest) connectorLoading.value = false
  }
}

const handleInitialize = async () => {
  if (!canInitialize.value) {
    message.warning('当前版本不允许初始化映射，请确认已加载规则且草稿两张映射表均为空')
    return
  }
  const versionId = mappings.value.connectorVersionId!
  const supplierCode = props.supplierCode
  const connectorNo = selectedConnectorNo.value
  const request = mappingRequest
  const isCurrent = () =>
    request === mappingRequest &&
    supplierCode === props.supplierCode &&
    connectorNo === selectedConnectorNo.value &&
    versionId === selectedVersionId.value
  try {
    await message.confirm('将按适配器模板初始化该版本的状态与错误码映射，确认继续？')
    if (!canInitialize.value || !isCurrent()) return
    const count = await SupplierConfigApi.initializeMappings({ connectorVersionId: versionId })
    if (!isCurrent()) return
    message.success(`已初始化 ${count} 条映射`)
    await loadMappings()
  } catch (error: any) {
    if (isCurrent() && error?.message) message.error(error.message)
  }
}

const openAppend = (mode: 'STATUS' | 'ERROR') => {
  if (!(mode === 'STATUS' ? canStatusAppend.value : canErrorAppend.value)) {
    message.warning('当前版本不允许追加该类映射，请确认已加载规则且版本仍为可追加草稿')
    return
  }
  appendDialogRef.value?.open(mode, mappings.value.connectorVersionId)
}

/**
 * 生命周期变更时立即失效旧映射投影；仅当前列表响应可继续加载映射，避免旧 reload 回写新选择。
 * 设计见 docs/superpowers/specs/2026-10-12-huasheng-fulfillment-hardening-design.md#32-前端展示与竞态。
 */
const reload = async () => {
  ++mappingRequest
  mappings.value = {}
  mappingLoading.value = false
  if (!(await loadConnectors())) return
  if (!connectors.value.some((row) => row.connectorNo === selectedConnectorNo.value)) {
    selectedConnectorNo.value = ''
  }
  await loadMappings()
}
watch(() => props.configurationRevision, reload)
watch(
  () => props.supplierCode,
  () => {
    selectedConnectorNo.value = ''
    reload()
  },
  { immediate: true }
)
</script>
