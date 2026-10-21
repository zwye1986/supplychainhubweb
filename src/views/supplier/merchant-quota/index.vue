<template>
  <ContentWrap>
    <el-alert type="info" :closable="false" class="mb-16px">
      按平台与精确商户账号共享额度，跨供应商档案和连接器生效；调额不取消已有调用，也不重置速率窗口。
    </el-alert>
    <el-form :inline="true" @submit.prevent="search">
      <el-form-item label="平台">
        <el-select v-model="query.platformCode" clearable placeholder="全部平台" class="!w-180px">
          <el-option
            v-for="code in MERCHANT_QUOTA_PLATFORMS"
            :key="code"
            :label="code"
            :value="code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="商户账号">
        <el-input
          v-model="query.merchantAccount"
          maxlength="128"
          clearable
          placeholder="原值精确匹配（含大小写与空格）"
          class="!w-320px"
          @keyup.enter="search"
        />
      </el-form-item>
      <el-form-item>
        <el-button :disabled="!canQuery" @click="search">查询</el-button>
        <el-button v-if="canCreate" type="primary" :disabled="saving" @click="openCreate"
          >新增额度</el-button
        >
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap v-loading="loading">
    <el-alert
      v-if="listError"
      type="error"
      :closable="false"
      title="额度列表读取失败，请重试查询"
      class="mb-16px"
    />
    <el-table :data="rows" row-key="id">
      <el-table-column prop="platformCode" label="平台" width="110" />
      <el-table-column label="商户账号（精确原值）" min-width="210">
        <template #default="{ row }"
          ><span class="quota-account">{{ row.merchantAccount }}</span></template
        >
      </el-table-column>
      <el-table-column prop="rateLimitPerSecond" label="每秒准入上限" width="130" />
      <el-table-column prop="concurrencyLimit" label="同步并发上限" width="130" />
      <el-table-column prop="version" label="版本" min-width="100" show-overflow-tooltip />
      <el-table-column prop="updatedBy" label="更新人ID" min-width="100" show-overflow-tooltip />
      <el-table-column label="更新时间" width="175"
        ><template #default="{ row }">{{ displayTime(row.updatedAt) }}</template></el-table-column
      >
      <el-table-column label="操作" fixed="right" width="130">
        <template #default="{ row }">
          <el-button v-if="canUpdate" link type="primary" :disabled="saving" @click="openEdit(row)"
            >调整</el-button
          >
          <el-button v-if="canQuery" link type="primary" @click="openHistory(row)">历史</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:page="query.pageNo"
      v-model:limit="query.pageSize"
      :total="total"
      @pagination="load"
    />
  </ContentWrap>
  <el-dialog
    v-if="editorVisible"
    v-model="editorVisible"
    :title="editingId ? '调整商户额度' : '新增商户额度'"
    width="min(640px, calc(100vw - 32px))"
    :close-on-click-modal="false"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    @close="closeEditor"
  >
    <el-form v-loading="editorLoading" label-width="145px" :disabled="saving">
      <el-form-item label="平台" required>
        <el-select v-model="form.platformCode" :disabled="!!editingId" placeholder="请选择平台">
          <el-option
            v-for="code in MERCHANT_QUOTA_PLATFORMS"
            :key="code"
            :label="code"
            :value="code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="精确商户账号" required
        ><el-input
          v-model="form.merchantAccount"
          :disabled="!!editingId"
          maxlength="128"
          placeholder="保留原值，身份创建后不可修改"
      /></el-form-item>
      <el-form-item label="每秒成功准入上限" required
        ><el-input-number
          v-model="form.rateLimitPerSecond"
          :min="1"
          :max="MAX_LIMIT"
          :precision="0"
          :value-on-clear="undefined"
          placeholder="请输入"
      /></el-form-item>
      <el-form-item label="同步调用并发上限" required
        ><el-input-number
          v-model="form.concurrencyLimit"
          :min="1"
          :max="MAX_LIMIT"
          :precision="0"
          :value-on-clear="undefined"
          placeholder="请输入"
      /></el-form-item>
      <el-form-item v-if="editingId" label="当前版本"
        ><span>{{ form.expectedVersion }}</span></el-form-item
      >
      <el-form-item label="变更原因" required
        ><el-input
          v-model="form.reason"
          type="textarea"
          :rows="3"
          maxlength="255"
          show-word-limit
          placeholder="说明本次配置依据，不能为空"
      /></el-form-item>
    </el-form>
    <el-alert
      v-if="editorInvalid"
      type="warning"
      :closable="false"
      title="当前表单不可提交，请核对列表并重新打开；已填写内容暂时保留。"
    />
    <template #footer
      ><el-button :disabled="saving" @click="closeEditor">关闭</el-button
      ><el-button type="primary" :loading="saving" :disabled="!canSubmit" @click="save"
        >保存</el-button
      ></template
    >
  </el-dialog>
  <el-drawer
    v-if="historyVisible"
    v-model="historyVisible"
    title="商户额度变更历史"
    size="min(100%, 1040px)"
    @close="closeHistory"
  >
    <p class="quota-account mb-16px">{{ historyIdentity }}</p>
    <el-alert
      v-if="historyLoaded && history.firstRecordedVersion !== '0'"
      type="warning"
      :closable="false"
      class="mb-16px"
      ><strong>此前历史未记录</strong>，仅展示本次功能上线后的真实操作，不补造创建记录。</el-alert
    >
    <el-alert
      v-if="historyError"
      type="error"
      :closable="false"
      title="历史读取失败，请关闭后重新打开"
    />
    <el-table v-loading="historyLoading" :data="history.list">
      <el-table-column prop="quotaVersion" label="版本" min-width="80" />
      <el-table-column label="每秒准入上限" min-width="140"
        ><template #default="{ row }"
          >{{ row.beforeRateLimitPerSecond ?? '未配置' }} →
          {{ row.afterRateLimitPerSecond }}</template
        ></el-table-column
      >
      <el-table-column label="同步并发上限" min-width="140"
        ><template #default="{ row }"
          >{{ row.beforeConcurrencyLimit ?? '未配置' }} → {{ row.afterConcurrencyLimit }}</template
        ></el-table-column
      >
      <el-table-column prop="operatorId" label="操作人ID" min-width="100" />
      <el-table-column prop="reason" label="变更原因" min-width="180" />
      <el-table-column label="操作时间" width="175"
        ><template #default="{ row }">{{ displayTime(row.occurredAt) }}</template></el-table-column
      >
    </el-table>
    <Pagination
      v-model:page="historyPage.pageNo"
      v-model:limit="historyPage.pageSize"
      :total="history.total"
      @pagination="loadHistory"
    />
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { MerchantQuotaApi, MERCHANT_QUOTA_PLATFORMS } from '@/api/supplier/merchant-quota'
import type {
  MerchantQuota,
  MerchantQuotaPlatform,
  QuotaHistory
} from '@/api/supplier/merchant-quota'
import { checkPermi } from '@/utils/permission'
import { useMessage } from '@/hooks/web/useMessage'
import dayjs from 'dayjs'

/**
 * 共享额度独立管理：不绑定supplierCode；身份精确、调额CAS、历史不回填。
 * 设计见后端docs/superpowers/specs/2026-10-19-merchant-quota-admin-design.md#4-页面与部署。
 */
defineOptions({ name: 'MerchantQuota' })
const MAX_LIMIT = 2147483647 // 与数据库INT正整数范围一致，不是建议生产额度。
const message = useMessage()
const canQuery = computed(() =>
  checkPermi(['supply-chain:admin', 'supply-chain:merchant-quota:query'])
)
const canCreate = computed(() =>
  checkPermi(['supply-chain:admin', 'supply-chain:merchant-quota:create'])
)
const canUpdate = computed(() =>
  checkPermi(['supply-chain:admin', 'supply-chain:merchant-quota:update'])
)
const query = reactive({ platformCode: '', merchantAccount: '', pageNo: 1, pageSize: 10 })
const rows = ref<MerchantQuota[]>([]),
  total = ref(0),
  loading = ref(false),
  listError = ref(false)
let listSequence = 0,
  editorSequence = 0,
  historySequence = 0
const displayTime = (value?: number) =>
  value == null ? '—' : dayjs(value).format('YYYY-MM-DD HH:mm:ss')
const load = async () => {
  const sequence = ++listSequence
  if (!canQuery.value) return
  loading.value = true
  listError.value = false
  try {
    const result = await MerchantQuotaApi.page({
      ...query,
      platformCode: query.platformCode || undefined,
      merchantAccount: query.merchantAccount || undefined
    })
    if (sequence !== listSequence) return
    rows.value = result.list
    total.value = result.total
  } catch {
    if (sequence === listSequence) {
      rows.value = []
      total.value = 0
      listError.value = true
    }
  } finally {
    if (sequence === listSequence) loading.value = false
  }
}
const search = () => {
  query.pageNo = 1
  return load()
}
const editorVisible = ref(false),
  editorLoading = ref(false),
  editorReady = ref(false),
  editorInvalid = ref(false),
  saving = ref(false)
const editingId = ref<string>()
const emptyForm = () => ({
  platformCode: '' as MerchantQuotaPlatform | '',
  merchantAccount: '',
  rateLimitPerSecond: undefined as number | undefined,
  concurrencyLimit: undefined as number | undefined,
  expectedVersion: undefined as string | undefined,
  reason: ''
})
const form = reactive(emptyForm())
const validLimit = (value?: number) =>
  value !== undefined && Number.isInteger(value) && value > 0 && value <= MAX_LIMIT
const canSubmit = computed(
  () =>
    editorVisible.value &&
    editorReady.value &&
    !editorInvalid.value &&
    !saving.value &&
    (editingId.value ? canUpdate.value : canCreate.value) &&
    !!form.platformCode &&
    !!form.merchantAccount.trim() &&
    form.merchantAccount.length <= 128 &&
    validLimit(form.rateLimitPerSecond) &&
    validLimit(form.concurrencyLimit) &&
    !!form.reason.trim() &&
    form.reason.length <= 255
)
const openCreate = () => {
  if (!canCreate.value || saving.value) return
  ++editorSequence
  editingId.value = undefined
  Object.assign(form, emptyForm())
  editorLoading.value = false
  editorReady.value = true
  editorInvalid.value = false
  editorVisible.value = true
}
const openEdit = async (row: MerchantQuota) => {
  if (!canUpdate.value || !canQuery.value || saving.value) return
  const sequence = ++editorSequence
  editingId.value = row.id
  Object.assign(form, emptyForm())
  editorReady.value = false
  editorInvalid.value = false
  editorVisible.value = true
  editorLoading.value = true
  try {
    const current = await MerchantQuotaApi.get(row.id)
    if (sequence !== editorSequence) return
    Object.assign(form, {
      platformCode: current.platformCode,
      merchantAccount: current.merchantAccount,
      rateLimitPerSecond: current.rateLimitPerSecond,
      concurrencyLimit: current.concurrencyLimit,
      expectedVersion: current.version,
      reason: ''
    })
    editorReady.value = true
  } catch {
    if (sequence === editorSequence) editorInvalid.value = true
  } finally {
    if (sequence === editorSequence) editorLoading.value = false
  }
}
const closeEditor = () => {
  if (saving.value) return
  ++editorSequence
  editorVisible.value = false
  editorReady.value = false
}
const save = async () => {
  if (!canSubmit.value) return
  const sequence = editorSequence
  const id = editingId.value
  const change = {
    rateLimitPerSecond: form.rateLimitPerSecond!,
    concurrencyLimit: form.concurrencyLimit!,
    reason: form.reason
  }
  saving.value = true
  try {
    if (id) await MerchantQuotaApi.update(id, { ...change, expectedVersion: form.expectedVersion! })
    else
      await MerchantQuotaApi.create({
        ...change,
        platformCode: form.platformCode as MerchantQuotaPlatform,
        merchantAccount: form.merchantAccount
      })
    if (sequence !== editorSequence) return
    editorVisible.value = false
    editorReady.value = false
    message.success('额度配置已保存')
    await load()
  } catch {
    if (sequence !== editorSequence) return
    // 现有HTTP层可能只拒绝字符串error，不能据此断言未提交；任何失败均禁止原表单重放。
    editorInvalid.value = true
    message.warning('保存未确认或版本已变化，请核对当前额度与历史后重新打开，勿重复提交')
    await load()
  } finally {
    if (sequence === editorSequence) saving.value = false
  }
}
const historyVisible = ref(false),
  historyLoading = ref(false),
  historyLoaded = ref(false),
  historyError = ref(false)
const historyId = ref<string>(),
  historyIdentity = ref('')
const history = ref<QuotaHistory>({ list: [], total: 0, firstRecordedVersion: null })
const historyPage = reactive({ pageNo: 1, pageSize: 10 })
const loadHistory = async () => {
  if (!historyId.value || !canQuery.value) return
  const sequence = ++historySequence
  historyLoading.value = true
  historyLoaded.value = false
  historyError.value = false
  try {
    const result = await MerchantQuotaApi.history(historyId.value, { ...historyPage })
    if (sequence !== historySequence) return
    history.value = result
    historyLoaded.value = true
  } catch {
    if (sequence === historySequence) {
      history.value = { list: [], total: 0, firstRecordedVersion: null }
      historyError.value = true
    }
  } finally {
    if (sequence === historySequence) historyLoading.value = false
  }
}
const openHistory = (row: MerchantQuota) => {
  if (!canQuery.value) return
  historyId.value = row.id
  historyIdentity.value = `${row.platformCode} / ${row.merchantAccount}`
  historyPage.pageNo = 1
  history.value = { list: [], total: 0, firstRecordedVersion: null }
  historyVisible.value = true
  return loadHistory()
}
const closeHistory = () => {
  ++historySequence
  historyVisible.value = false
  historyId.value = undefined
}
onMounted(load)
onBeforeUnmount(() => {
  ++listSequence
  ++editorSequence
  ++historySequence
})
</script>

<style scoped>
.quota-account {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
