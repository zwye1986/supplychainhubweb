<template>
  <el-drawer v-model="drawerVisible" title="连接器版本详情（只读）" size="640px" append-to-body>
    <div v-loading="loading">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="连接器编号">{{ detail.connectorNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="版本序号">v{{ detail.versionNo ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="适配器类型">{{ detail.adapterType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="生命周期状态">
          <el-tag :type="getConnectorStatusType(detail.status)" size="small">
            {{ getConnectorStatusLabel(detail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="验证结果">
          <el-tag :type="getValidationStatusType(detail.validationStatus)" size="small">
            {{ getValidationStatusLabel(detail.validationStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发布时间">{{ detail.publishedAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="网关基础地址" :span="2">{{ detail.baseUrl || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商户账号">{{ detail.merchantAccount || '-' }}</el-descriptions-item>
        <el-descriptions-item label="协议版本">{{ detail.protocolVersion || '-' }}</el-descriptions-item>
        <el-descriptions-item label="回调路径" :span="2">{{ detail.callbackPath || '-' }}</el-descriptions-item>
        <el-descriptions-item label="连接超时(ms)">{{ detail.connectTimeoutMs ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="读取超时(ms)">{{ detail.readTimeoutMs ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="限流(次/秒)">{{ detail.rateLimit ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="并发上限">{{ detail.concurrencyLimit ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="配置Schema版本">{{ detail.adapterConfigSchemaVersion ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="能力启用态" :span="2">
          <template v-if="detail.capabilities?.length">
            <el-tag
              v-for="cap in detail.capabilities"
              :key="cap.capabilityCode"
              class="mr-6px mb-4px"
              size="small"
              :type="cap.enabled ? 'success' : 'info'"
            >
              {{ cap.capabilityCode }}{{ cap.enabled ? '' : '（未启用）' }}
            </el-tag>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="适配器配置JSON" :span="2">
          <pre class="config-pre">{{ prettyJson(detail.adapterConfigJson) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="扩展配置JSON" :span="2">
          <pre class="config-pre">{{ prettyJson(detail.extraConfig) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      <div class="text-12px text-gray-400 mt-8px">
        版本不可变，详情仅供查看；本页不含任何凭据明文。改配置请新建连接器。
      </div>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { SupplierConfigApi } from '@/api/supplier/config'
import type { ConnectorVersionDetail } from '@/api/supplier/config'
import {
  getConnectorStatusLabel,
  getConnectorStatusType,
  getValidationStatusLabel,
  getValidationStatusType
} from '../utils/constants'

/**
 * 连接器版本详情抽屉（T3，只读）。展示公共字段 + 能力启用态 + adapter_config_json/extra_config；
 * 后端投影刻意不含 secret_ref 值或密文，故本页无凭据明文（§6.1 T3 安全契约）。
 * 设计见 docs/superpowers/specs/2026-10-03-supplier-offer-publication-admin-design.md#82-连接器子页e1。
 */
defineOptions({ name: 'ConnectorDetailDrawer' })

const message = useMessage()
const drawerVisible = ref(false)
const loading = ref(false)
const detail = ref<ConnectorVersionDetail | null>(null)

const prettyJson = (text?: string | null): string => {
  if (!text) return '-'
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

const open = async (connectorNo: string, versionId: number) => {
  drawerVisible.value = true
  loading.value = true
  detail.value = null
  try {
    detail.value = await SupplierConfigApi.getConnectorVersionDetail(connectorNo, versionId)
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  } finally {
    loading.value = false
  }
}
defineExpose({ open })
</script>

<style scoped>
.config-pre {
  margin: 0;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
}
</style>
