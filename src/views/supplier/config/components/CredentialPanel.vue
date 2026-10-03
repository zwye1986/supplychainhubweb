<template>
  <div>
    <div class="mb-12px">
      <el-button type="primary" plain @click="handleCreateSet">
        <Icon icon="ep:plus" class="mr-5px" /> 新建凭据集
      </el-button>
      <el-button @click="loadAll">
        <Icon icon="ep:refresh" class="mr-5px" /> 刷新
      </el-button>
    </div>
    <el-table v-loading="loading" :data="list" border row-key="id">
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="p-12px">
            <el-table :data="row.items || []" size="small" border>
              <el-table-column label="凭据项标识" prop="itemKey" min-width="150" />
              <el-table-column label="来源类型" prop="providerType" min-width="110" />
              <el-table-column label="脱敏提示" prop="maskedHint" min-width="150" />
              <el-table-column label="状态" min-width="90">
                <template #default="scope">
                  <el-tag :type="getCredentialStatusType(scope.row.status)" size="small">
                    {{ getCredentialStatusLabel(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <div class="text-12px text-gray-400 mt-6px">
              列表永不展示 secret_ref 值或密文；如需变更密钥请新建凭据项。
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="凭据集编号" prop="setCode" min-width="180" show-overflow-tooltip />
      <el-table-column label="状态" min-width="100">
        <template #default="{ row }">
          <el-tag :type="getCredentialStatusType(row.status)" size="small">
            {{ getCredentialStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="凭据项数" min-width="90">
        <template #default="{ row }">{{ row.items?.length || 0 }}</template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="130">
        <template #default="{ row }">
          <el-button link type="primary" @click="openItemDialog(row.setCode)">新建凭据项</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && !list.length" description="该供应商暂无凭据集" />

    <CredentialItemDialog
      ref="itemDialogRef"
      :supplier-code="supplierCode"
      :set-code="activeSetCode"
      :item-keys="itemKeys"
      @success="loadSets"
    />
  </div>
</template>

<script lang="ts" setup>
import { SupplierConfigApi } from '@/api/supplier/config'
import type { CredentialSetView } from '@/api/supplier/config'
import CredentialItemDialog from './CredentialItemDialog.vue'
import {
  aggregateCredentialKeys,
  getCredentialStatusLabel,
  getCredentialStatusType
} from '../utils/constants'

/**
 * 凭据子页（F1-hybrid，§8.3）：凭据集列表（T4，只回 maskedHint）+ 新建集/项。
 * itemKey 候选为所有适配器 credentialKeys() 并集（§6.3 封闭集）；ENVELOPE 明文只写不回显。
 * 列表/详情永不展示 secret_ref 值或密文（后端投影已排除，前端亦无字段承载）。
 * 设计见 docs/superpowers/specs/2026-10-03-supplier-offer-publication-admin-design.md#83-凭据子页f1-hybrid。
 */
defineOptions({ name: 'CredentialPanel' })

const props = defineProps<{ supplierCode: string }>()

const message = useMessage()
const loading = ref(false)
const list = ref<CredentialSetView[]>([])
const itemKeys = ref<string[]>([])
const activeSetCode = ref('')
const itemDialogRef = ref()

const loadSets = async () => {
  if (!props.supplierCode) return
  loading.value = true
  try {
    list.value = (await SupplierConfigApi.listCredentialSets(props.supplierCode)) || []
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  } finally {
    loading.value = false
  }
}

const loadAdapterKeys = async () => {
  const types = await SupplierConfigApi.listAdapterTypes().catch(() => [])
  itemKeys.value = aggregateCredentialKeys(types || [])
}

const loadAll = () => {
  loadAdapterKeys()
  loadSets()
}

const handleCreateSet = async () => {
  try {
    const { value } = await message.prompt('请输入凭据集编号（供应商内唯一）', '新建凭据集')
    const setCode = value?.trim()
    if (!setCode) {
      message.warning('凭据集编号不能为空')
      return
    }
    await SupplierConfigApi.createCredentialSet({ supplierCode: props.supplierCode, setCode })
    message.success('凭据集创建成功')
    loadSets()
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  }
}

const openItemDialog = (setCode: string) => {
  activeSetCode.value = setCode
  nextTick(() => itemDialogRef.value?.open())
}

onMounted(loadAll)
</script>
