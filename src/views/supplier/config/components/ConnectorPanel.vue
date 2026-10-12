<template>
  <div>
    <div class="mb-12px">
      <el-button type="primary" plain @click="openCreate">
        <Icon icon="ep:plus" class="mr-5px" /> 新建连接器
      </el-button>
      <el-button @click="loadAll">
        <Icon icon="ep:refresh" class="mr-5px" /> 刷新
      </el-button>
    </div>
    <el-table v-loading="loading" :data="list" border>
      <el-table-column label="连接器编码" prop="connectorCode" min-width="150" show-overflow-tooltip />
      <el-table-column label="连接器编号" prop="connectorNo" min-width="180" show-overflow-tooltip />
      <el-table-column label="适配器类型" prop="adapterType" min-width="170" show-overflow-tooltip />
      <el-table-column label="最新版本" min-width="130">
        <template #default="{ row }">
          <span class="mr-6px">v{{ row.latestVersionNo ?? '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="110">
        <template #default="{ row }">
          <el-tag v-if="row.currentVersionId != null" type="success" size="small">已发布</el-tag>
          <span v-else class="text-gray-400">未发布</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="230">
        <template #default="{ row }">
          <el-button
            v-if="row.latestVersionStatus === ConnectorStatusEnum.DRAFT"
            link
            type="primary"
            @click="openValidate(row)"
          >
            校验
          </el-button>
          <el-button
            v-if="row.latestVersionStatus === ConnectorStatusEnum.VALIDATED"
            link
            type="primary"
            @click="handlePublish(row)"
          >
            发布
          </el-button>
          <el-button
            v-if="row.latestVersionStatus === ConnectorStatusEnum.PUBLISHED"
            link
            type="danger"
            @click="handleRetire(row)"
          >
            退役
          </el-button>
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && !list.length" description="该供应商暂无连接器，请先新建" />

    <ConnectorFormDialog
      ref="formDialogRef"
      :supplier-code="supplierCode"
      :adapter-types="adapterTypes"
      :credential-slots="credentialSlots"
      :credential-sets="credentialSets"
      @success="handleChanged"
    />
    <ConnectorValidateDialog ref="validateDialogRef" :adapter-types="adapterTypes" @success="handleChanged" />
    <ConnectorDetailDrawer ref="detailDrawerRef" />
  </div>
</template>

<script lang="ts" setup>
import { SupplierConfigApi } from '@/api/supplier/config'
import type { AdapterTypeView, ConnectorListItem, CredentialSlotView, CredentialSetView } from '@/api/supplier/config'
import ConnectorFormDialog from './ConnectorFormDialog.vue'
import ConnectorValidateDialog from './ConnectorValidateDialog.vue'
import ConnectorDetailDrawer from './ConnectorDetailDrawer.vue'
import {
  ConnectorStatusEnum,
  INITIAL_CONNECTOR_VERSION,
  getConnectorStatusLabel,
  getConnectorStatusType
} from '../utils/constants'

/**
 * 连接器子页（E1，§8.2）：列表（T2）+ 生命周期编排。生命周期按钮按 latestVersionStatus 显隐
 * （草稿0→校验 / 已验证5→发布 / 已发布10→退役 / 详情恒在）；发布带乐观锁 expectedConnectorVersion=0
 * （Phase 1 首次发布，INITIAL_CONNECTOR_VERSION），发布/退役原因经 message.prompt 采集入审计。
 * 非法跃迁由后端守卫拒绝，错误经 axios 拦截器透传（本页不重复 toast）。
 * 设计见 docs/superpowers/specs/2026-10-03-supplier-offer-publication-admin-design.md#82-连接器子页e1。
 */
defineOptions({ name: 'ConnectorPanel' })

const props = defineProps<{ supplierCode: string }>()
const emit = defineEmits<{ changed: [] }>()

const message = useMessage()
const loading = ref(false)
const list = ref<ConnectorListItem[]>([])
const adapterTypes = ref<AdapterTypeView[]>([])
const credentialSlots = ref<CredentialSlotView[]>([])
const credentialSets = ref<CredentialSetView[]>([])
const formDialogRef = ref()
const validateDialogRef = ref()
const detailDrawerRef = ref()

const loadConnectors = async () => {
  if (!props.supplierCode) return
  loading.value = true
  try {
    list.value = (await SupplierConfigApi.listConnectors(props.supplierCode)) || []
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  } finally {
    loading.value = false
  }
}

/** 生命周期写入完成后通知父页刷新能力与映射，见供给发布详细设计 §15.2。 */
const handleChanged = async () => {
  await loadConnectors()
  emit('changed')
}

/** 适配器目录（T1）与凭据槽（T6）为平台级、与供应商无关，只需加载一次。 */
const loadLookups = async () => {
  const [types, slots] = await Promise.all([
    SupplierConfigApi.listAdapterTypes().catch(() => []),
    SupplierConfigApi.listCredentialSlots().catch(() => [])
  ])
  adapterTypes.value = types || []
  credentialSlots.value = slots || []
}

/** 集下拉仅属于当前供应商；迟到响应不得覆盖切换后的数据。 */
const loadCredentialSets = async () => {
  const supplierCode = props.supplierCode
  credentialSets.value = []
  if (!supplierCode) return
  try {
    const sets = await SupplierConfigApi.listCredentialSets(supplierCode)
    if (props.supplierCode === supplierCode) credentialSets.value = sets || []
  } catch (error: any) {
    if (props.supplierCode === supplierCode && error?.message) message.error(error.message)
  }
}
const loadAll = () => {
  loadLookups()
  loadConnectors()
  loadCredentialSets()
}
watch(() => props.supplierCode, () => {
  list.value = []
  loadConnectors()
  loadCredentialSets()
})

const openCreate = () => formDialogRef.value?.open()
const openValidate = (row: ConnectorListItem) => validateDialogRef.value?.open(row)

const openDetail = (row: ConnectorListItem) => {
  const versionId = row.latestVersionId ?? row.currentVersionId
  if (versionId == null || !row.connectorNo) {
    message.warning('该连接器尚无版本，无法查看详情')
    return
  }
  detailDrawerRef.value?.open(row.connectorNo, versionId)
}

const handlePublish = async (row: ConnectorListItem) => {
  const versionId = row.latestVersionId
  if (versionId == null || !row.connectorNo) {
    message.warning('该连接器尚无可发布版本')
    return
  }
  try {
    const { value } = await message.prompt('请输入发布原因（审计）', '发布连接器')
    await SupplierConfigApi.publishConnector({
      connectorNo: row.connectorNo,
      connectorVersionId: versionId,
      expectedConnectorVersion: INITIAL_CONNECTOR_VERSION,
      reason: value
    })
    message.success('连接器发布成功')
    await handleChanged()
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  }
}

const handleRetire = async (row: ConnectorListItem) => {
  const versionId = row.currentVersionId ?? row.latestVersionId
  if (versionId == null || !row.connectorNo) {
    message.warning('该连接器尚无已发布版本，无法退役')
    return
  }
  try {
    const { value } = await message.prompt('请输入退役原因（审计）', '退役连接器')
    await SupplierConfigApi.retireConnector({
      connectorNo: row.connectorNo,
      connectorVersionId: versionId,
      reason: value
    })
    message.success('连接器已退役')
    await handleChanged()
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  }
}

onMounted(loadAll)
</script>
