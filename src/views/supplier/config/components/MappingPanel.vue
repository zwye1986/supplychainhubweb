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
        <el-button type="primary" plain @click="handleInitialize">
          <Icon icon="ep:magic-stick" class="mr-5px" /> 从模板初始化
        </el-button>
        <el-button @click="openAppend('STATUS')">
          <Icon icon="ep:plus" class="mr-5px" /> 追加状态映射
        </el-button>
        <el-button @click="openAppend('ERROR')">
          <Icon icon="ep:plus" class="mr-5px" /> 追加错误码映射
        </el-button>
      </el-form-item>
    </el-form>

    <el-empty v-if="!selectedConnectorNo" description="请选择一个连接器" />
    <template v-else>
      <div class="font-bold mb-8px">状态映射（{{ mappings.statusMappings?.length || 0 }}）</div>
      <el-table :data="mappings.statusMappings || []" border size="small" class="mb-16px">
        <el-table-column label="外部状态" prop="externalStatus" min-width="120" />
        <el-table-column label="外部子状态" prop="externalSubStatus" min-width="110" />
        <el-table-column label="业务阶段" min-width="100">
          <template #default="{ row }">{{ getOptionLabel(BUSINESS_PHASE_OPTIONS, row.businessPhase) }}</template>
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

      <div class="font-bold mb-8px">错误码映射（{{ mappings.errorCodeMappings?.length || 0 }}）</div>
      <el-table :data="mappings.errorCodeMappings || []" border size="small">
        <el-table-column label="外部错误码" prop="externalErrorCode" min-width="130" />
        <el-table-column label="外部子错误码" prop="externalSubCode" min-width="120" />
        <el-table-column label="错误分类" prop="errorClass" min-width="120" />
        <el-table-column label="处置动作" min-width="110">
          <template #default="{ row }">{{ getOptionLabel(ERROR_ACTION_OPTIONS, row.actionType) }}</template>
        </el-table-column>
        <el-table-column label="可重试" min-width="80">
          <template #default="{ row }">{{ row.retryable ? '是' : '否' }}</template>
        </el-table-column>
      </el-table>
    </template>

    <MappingAppendDialog ref="appendDialogRef" @success="loadMappings" />
  </div>
</template>

<script lang="ts" setup>
import { SupplierConfigApi } from '@/api/supplier/config'
import type { ConnectorListItem, MappingsView } from '@/api/supplier/config'
import MappingAppendDialog from './MappingAppendDialog.vue'
import {
  BUSINESS_PHASE_OPTIONS,
  ERROR_ACTION_OPTIONS,
  FACT_TYPE_OPTIONS,
  getOptionLabel
} from '../utils/constants'

/**
 * 映射子页（G2，§8.5）：选定连接器版本后「从模板初始化」（按 adapterType 的 mappingTemplates()）→
 * 状态映射 + 错误码映射表格（T5）+ 追加单条。初始化/追加针对最新版本，版本不可变性由后端守卫裁决。
 * 设计见 docs/superpowers/specs/2026-10-03-supplier-offer-publication-admin-design.md#85-映射子页g2。
 */
defineOptions({ name: 'MappingPanel' })

const props = defineProps<{ supplierCode: string }>()

const message = useMessage()
const loading = ref(false)
const connectors = ref<ConnectorListItem[]>([])
const selectedConnectorNo = ref('')
const mappings = ref<MappingsView>({})
const appendDialogRef = ref()

const selectedVersionId = computed<number | null>(() => {
  const row = connectors.value.find((c) => c.connectorNo === selectedConnectorNo.value)
  return row?.latestVersionId ?? row?.currentVersionId ?? null
})

const getFactTypeTag = (factType?: string) =>
  FACT_TYPE_OPTIONS.find((opt) => opt.value === factType)?.type || 'info'

const loadMappings = async () => {
  mappings.value = {}
  const versionId = selectedVersionId.value
  if (versionId == null) return
  loading.value = true
  try {
    mappings.value = (await SupplierConfigApi.getMappings(versionId)) || {}
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  } finally {
    loading.value = false
  }
}

const loadConnectors = async () => {
  if (!props.supplierCode) return
  loading.value = true
  try {
    connectors.value = (await SupplierConfigApi.listConnectors(props.supplierCode)) || []
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  } finally {
    loading.value = false
  }
}

const handleInitialize = async () => {
  const versionId = selectedVersionId.value
  if (versionId == null) {
    message.warning('该连接器尚无版本，无法初始化映射')
    return
  }
  try {
    await message.confirm('将按适配器模板初始化该版本的状态与错误码映射，确认继续？')
    const count = await SupplierConfigApi.initializeMappings({ connectorVersionId: versionId })
    message.success(`已初始化 ${count} 条映射`)
    loadMappings()
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  }
}

const openAppend = (mode: 'STATUS' | 'ERROR') => {
  const versionId = selectedVersionId.value
  if (versionId == null) {
    message.warning('该连接器尚无版本，无法追加映射')
    return
  }
  appendDialogRef.value?.open(mode, versionId)
}

onMounted(loadConnectors)
</script>
