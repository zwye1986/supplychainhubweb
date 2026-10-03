<template>
  <ContentWrap>
    <el-form :inline="true" class="-mb-15px search-form" label-width="80px">
      <el-form-item label="供应商">
        <el-select
          v-model="supplierCode"
          filterable
          clearable
          placeholder="请选择供应商（按 supplierCode 组织技术配置）"
          class="!w-360px"
        >
          <el-option
            v-for="item in supplierOptions"
            :key="item.code"
            :label="item.name"
            :value="item.code"
          />
        </el-select>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap>
    <el-empty v-if="!supplierCode" description="请先选择供应商，再配置连接器 / 凭据 / 能力 / 映射" />
    <el-tabs v-else v-model="activeTab">
      <el-tab-pane label="连接器" name="connector">
        <ConnectorPanel :key="`connector-${supplierCode}`" :supplier-code="supplierCode" />
      </el-tab-pane>
      <el-tab-pane label="凭据" name="credential">
        <CredentialPanel :key="`credential-${supplierCode}`" :supplier-code="supplierCode" />
      </el-tab-pane>
      <el-tab-pane label="能力" name="capability">
        <CapabilityPanel :key="`capability-${supplierCode}`" :supplier-code="supplierCode" />
      </el-tab-pane>
      <el-tab-pane label="映射" name="mapping">
        <MappingPanel :key="`mapping-${supplierCode}`" :supplier-code="supplierCode" />
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { SupplierApi } from '@/api/supplier/manage'
import ConnectorPanel from './components/ConnectorPanel.vue'
import CredentialPanel from './components/CredentialPanel.vue'
import CapabilityPanel from './components/CapabilityPanel.vue'
import MappingPanel from './components/MappingPanel.vue'

/**
 * 供应商履约技术配置（A1 新顶级技术菜单）父页。
 * 按 supplierCode 组织，含连接器 / 凭据 / 能力 / 映射 4 子页；与业务侧（供应商管理）仅通过
 * supplierCode + connectorVersionId 关联，不互相内嵌表单。
 * 设计见 docs/superpowers/specs/2026-10-03-supplier-offer-publication-admin-design.md#81-技术菜单a1新顶级菜单。
 */
defineOptions({ name: 'SupplierFulfillmentConfig' })

interface CodeNameOption {
  code: string
  name: string
}

const supplierCode = ref<string>('')
const activeTab = ref('connector')
const supplierOptions = ref<CodeNameOption[]>([])

const loadSuppliers = async () => {
  const suppliers = await SupplierApi.getSupplierNameList({ view: 'simple' }).catch(() => [])
  const list = Array.isArray(suppliers) ? suppliers : suppliers?.list || []
  supplierOptions.value = list
    .map((item: { supplierCode?: string; code?: string; supplierName?: string; name?: string }) => ({
      code: item.supplierCode || item.code || '',
      name: item.supplierName || item.name || item.supplierCode || item.code || ''
    }))
    .filter((item: CodeNameOption) => item.code)
}

onMounted(loadSuppliers)
</script>
