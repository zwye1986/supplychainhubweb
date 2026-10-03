<template>
  <div v-loading="loading">
    <el-alert
      class="mb-12px"
      type="info"
      :closable="false"
      show-icon
      title="能力在连接器「校验」步骤声明（§6.4），本页仅供查看启用态。如需变更能力，请前往「连接器」子页对草稿版本重新校验。"
    />
    <el-form :inline="true" class="mb-8px">
      <el-form-item label="连接器">
        <el-select
          v-model="selectedConnectorNo"
          filterable
          clearable
          placeholder="请选择连接器查看能力启用态"
          class="!w-320px"
          @change="loadDetail"
        >
          <el-option
            v-for="item in connectors"
            :key="item.connectorNo"
            :label="`${item.connectorCode || item.connectorNo}（v${item.latestVersionNo ?? '-'}）`"
            :value="item.connectorNo!"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <el-empty v-if="!selectedConnectorNo" description="请选择一个连接器" />
    <template v-else>
      <el-descriptions v-if="detail" :column="2" border class="mb-12px">
        <el-descriptions-item label="适配器类型">{{ detail.adapterType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="版本状态">
          <el-tag :type="getConnectorStatusType(detail.status)" size="small">
            {{ getConnectorStatusLabel(detail.status) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <el-table :data="capabilityRows" border>
        <el-table-column label="能力编码" prop="code" min-width="200" />
        <el-table-column label="启用态" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '已启用' : '未启用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!capabilityRows.length" description="该连接器版本尚未声明能力（草稿未校验）" />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { SupplierConfigApi } from '@/api/supplier/config'
import type {
  AdapterTypeView,
  ConnectorListItem,
  ConnectorVersionDetail
} from '@/api/supplier/config'
import { getConnectorStatusLabel, getConnectorStatusType } from '../utils/constants'

/**
 * 能力子页（§8.4）：只读展示连接器版本的能力启用态（T3 capabilities + T1 该适配器能力全集对照）。
 * 能力勾选实际发生在校验步骤（§6.4），本页仅可视化 + 引导到连接器子页校验，不提供写入口。
 * 设计见 docs/superpowers/specs/2026-10-03-supplier-offer-publication-admin-design.md#84-能力子页。
 */
defineOptions({ name: 'CapabilityPanel' })

const props = defineProps<{ supplierCode: string; configurationRevision?: number }>()

const message = useMessage()
const loading = ref(false)
const connectors = ref<ConnectorListItem[]>([])
const adapterTypes = ref<AdapterTypeView[]>([])
const selectedConnectorNo = ref('')
const detail = ref<ConnectorVersionDetail | null>(null)

interface CapabilityRow {
  code: string
  enabled: boolean
}

/** 以适配器能力全集为基底，叠加版本已启用态；未在全集内的历史能力也补列，避免遗漏。 */
const capabilityRows = computed<CapabilityRow[]>(() => {
  const enabledCodes = new Set(
    (detail.value?.capabilities || []).filter((c) => c.enabled).map((c) => c.capabilityCode!)
  )
  const catalog =
    adapterTypes.value.find((t) => t.adapterType === detail.value?.adapterType)?.capabilities || []
  const codes = new Set<string>([...catalog, ...(detail.value?.capabilities || []).map((c) => c.capabilityCode!)])
  return [...codes].filter(Boolean).map((code) => ({ code, enabled: enabledCodes.has(code) }))
})

const versionIdOf = (connectorNo: string): number | null => {
  const row = connectors.value.find((c) => c.connectorNo === connectorNo)
  return row?.latestVersionId ?? row?.currentVersionId ?? null
}

const loadDetail = async () => {
  detail.value = null
  if (!selectedConnectorNo.value) return
  const versionId = versionIdOf(selectedConnectorNo.value)
  if (versionId == null) {
    message.warning('该连接器尚无版本')
    return
  }
  loading.value = true
  try {
    detail.value = await SupplierConfigApi.getConnectorVersionDetail(selectedConnectorNo.value, versionId)
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  } finally {
    loading.value = false
  }
}

const loadBase = async () => {
  if (!props.supplierCode) return
  loading.value = true
  try {
    const [connectorList, types] = await Promise.all([
      SupplierConfigApi.listConnectors(props.supplierCode).catch(() => []),
      SupplierConfigApi.listAdapterTypes().catch(() => [])
    ])
    connectors.value = connectorList || []
    adapterTypes.value = types || []
  } finally {
    loading.value = false
  }
}

/**
 * 生命周期变更或标签激活后重新读取列表及当前详情；有效选择保留，已移除选择清空。
 * 设计见 docs/superpowers/specs/2026-10-03-supplier-offer-publication-admin-design.md#152-技术子页刷新。
 */
const reload = async () => {
  await loadBase()
  if (!connectors.value.some((row) => row.connectorNo === selectedConnectorNo.value)) {
    selectedConnectorNo.value = ''
  }
  await loadDetail()
}
watch(() => props.configurationRevision, reload)
onMounted(reload)
</script>
