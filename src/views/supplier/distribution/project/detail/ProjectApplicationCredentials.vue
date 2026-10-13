<template>
  <div v-loading="loading">
    <h3>应用凭证</h3>
    <el-alert
      class="mb-16px"
      type="info"
      :closable="false"
      title="每个项目只有一个 AppID；AppKey 仅在开通或轮换成功时显示一次，请立即交给项目方妥善保存。"
    />
    <div class="mb-16px flex items-center justify-between">
      <div
        >APPID：<span class="font-600">{{ credentials.appId || '尚未开通' }}</span></div
      >
      <div class="flex gap-8px">
        <el-button v-if="!credentials.appId" type="primary" :disabled="!active" @click="enable">
          开通应用
        </el-button>
        <template v-else>
          <el-button type="primary" :disabled="!active" @click="rotate">轮换 AppKey</el-button>
          <el-button type="danger" plain :disabled="!hasActiveCredential" @click="revoke">
            吊销活动密钥
          </el-button>
        </template>
      </div>
    </div>
    <el-table :data="credentials.credentials" border empty-text="暂无凭证版本">
      <el-table-column prop="keyVersion" label="版本" width="80" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column prop="maskedHint" label="脱敏提示" min-width="150" />
      <el-table-column prop="validFrom" label="生效时间" min-width="180" />
      <el-table-column prop="validTo" label="失效时间" min-width="180">
        <template #default="scope">{{ scope.row.validTo || '-' }}</template>
      </el-table-column>
    </el-table>

    <section v-loading="capabilityLoading" class="mt-24px">
      <h3>接入能力</h3>
      <el-alert
        class="mb-16px"
        type="info"
        :closable="false"
        title="开通应用不自动授予接入能力；开启能力不等于商品可售，仍需配置凭证、商品、价格和路由。"
      />
      <el-alert
        v-if="capabilityError"
        class="mb-16px"
        type="warning"
        :closable="false"
        :title="capabilityError"
      />
      <el-button
        v-if="canQuery"
        :disabled="capabilityLoading || capabilityWriting"
        @click="reloadCapabilities"
        >刷新能力状态</el-button
      >
      <el-table :data="capabilities" border empty-text="接入能力状态尚未确认">
        <el-table-column label="能力" min-width="140">
          <template #default="{ row }">{{ capabilityNames[row.capabilityCode] }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }"
            ><el-tag :type="row.status === 'ENABLED' ? 'success' : 'info'">{{
              capabilityStatuses[row.status]
            }}</el-tag></template
          >
        </el-table-column>
        <el-table-column label="最近操作人ID" width="140">
          <template #default="{ row }">{{ row.lastOperatorId ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="最近操作时间" min-width="180">
          <template #default="{ row }">{{ row.lastChangedAt ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" min-width="160">
          <template #default="{ row }">
            <template v-if="row.capabilityCode === 'STANDARD_PRODUCT' && canEdit">
              <el-button
                v-if="row.status === 'ENABLED'"
                type="danger"
                plain
                :disabled="capabilityLoading || capabilityWriting"
                @click="openDisable"
                >关闭标准商品</el-button
              >
              <el-button
                v-else
                type="primary"
                :disabled="!active || capabilityLoading || capabilityWriting"
                @click="enableStandardProduct"
                >开启标准商品</el-button
              >
            </template>
            <span v-else>只读</span>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="standardCapability?.status === 'DISABLED'" class="mt-8px text-gray-500"
        >已关闭：禁止新下单和卡密读取，仅保留订单摘要查询；不取消在途订单。</div
      >
      <div v-if="!active" class="mt-8px text-gray-500"
        >项目未启用，不能开启能力；已开启能力仍可关闭。</div
      >
    </section>
    <el-dialog
      v-model="disableVisible"
      title="关闭标准商品接入能力"
      width="560px"
      :close-on-click-modal="false"
      :close-on-press-escape="!capabilityWriting"
      :show-close="!capabilityWriting"
      @closed="disableReason = ''"
    >
      <el-alert
        class="mb-16px"
        type="warning"
        :closable="false"
        title="停止新下单和卡密读取，保留已开通项目的订单摘要查询；不取消在途订单。"
      />
      <el-form label-position="top">
        <el-form-item label="关闭原因（必填，1～256字）">
          <el-input
            v-model="disableReason"
            type="textarea"
            :rows="3"
            maxlength="256"
            show-word-limit
            :disabled="capabilityWriting"
            placeholder="请输入关闭原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="capabilityWriting" @click="disableVisible = false">取消</el-button>
        <el-button
          type="danger"
          :loading="capabilityWriting"
          :disabled="!validDisableReason || capabilityWriting"
          @click="submitDisable"
          >确认关闭</el-button
        >
      </template>
    </el-dialog>

    <el-dialog
      v-model="issuedVisible"
      title="保存项目应用密钥"
      width="560px"
      destroy-on-close
      @close="clearIssued"
    >
      <el-alert
        class="mb-16px"
        type="warning"
        :closable="false"
        title="关闭后无法再次查看本次 AppKey。请确认已安全交付给项目方。"
      />
      <el-descriptions v-if="issued" :column="1" border>
        <el-descriptions-item label="APPID">{{ issued.appId }}</el-descriptions-item>
        <el-descriptions-item label="密钥版本">{{ issued.keyVersion }}</el-descriptions-item>
        <el-descriptions-item label="APPKEY">
          <span class="break-all">{{ issued.appKey }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="copyIssued">复制 APPID 与 APPKEY</el-button>
        <el-button type="primary" @click="issuedVisible = false">已保存，关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useMessage } from '@/hooks/web/useMessage'
import { checkPermi } from '@/utils/permission'
import {
  ProjectApi,
  type ProjectCapability,
  type ProjectApplicationCredentials,
  type ProjectIssuedCredential
} from '@/api/supplier/distribution'

defineOptions({ name: 'ProjectApplicationCredentials' })

const props = defineProps<{ projectCode: string; active: boolean }>()
const message = useMessage()
const loading = ref(false)
const issuedVisible = ref(false)
const issued = ref<ProjectIssuedCredential | null>(null)
const emptyCredentials = (): ProjectApplicationCredentials => ({ appId: null, credentials: [] })
const credentials = ref<ProjectApplicationCredentials>(emptyCredentials())
let projectGeneration = 0
let loadSequence = 0
let capabilityLoadSequence = 0
const canQuery = computed(() => checkPermi(['supply-chain:admin', 'supply-chain:project:query']))
const canEdit = computed(() => checkPermi(['supply-chain:admin', 'supply-chain:project:update']))
const capabilityNames = { STANDARD_PRODUCT: '标准商品', O2O: 'O2O', INSTORE: '到店（INSTORE）' }
const capabilityStatuses = { NOT_ENABLED: '未开通', ENABLED: '已开启', DISABLED: '已关闭' }
const capabilities = ref<ProjectCapability[]>([])
const capabilityLoading = ref(false)
const capabilityWriting = ref(false)
const capabilityError = ref('')
const disableVisible = ref(false)
const disableReason = ref('')
const validDisableReason = computed(() => {
  const length = disableReason.value.trim().length
  return length >= 1 && length <= 256
})
const standardCapability = computed(() =>
  capabilities.value.find((row) => row.capabilityCode === 'STANDARD_PRODUCT')
)
let disableContext: { projectCode: string; generation: number; version: number | null } | null =
  null
const hasActiveCredential = computed(() =>
  credentials.value.credentials.some((row) => row.status === 'CURRENT' || row.status === 'GRACE')
)

// 仅允许当前项目的最后一次请求写入视图；见 docs/superpowers/specs/2026-09-29-project-app-issuance-platform-signing-callback-design.md#7-管理端配套和安全边界。
const isCurrent = (projectCode: string, generation: number) =>
  projectGeneration === generation && props.projectCode === projectCode

// 独立查询失败不补造能力；项目代次及请求序号隔离晚响应。
// 设计：docs/superpowers/specs/2026-10-12-project-standard-product-capability-design.md#4-前端与安全交互。
const loadCapabilities = async (projectCode: string, generation: number) => {
  if (!canQuery.value || !projectCode) return false
  const sequence = ++capabilityLoadSequence
  capabilityLoading.value = true
  capabilities.value = []
  capabilityError.value = ''
  try {
    const result = await ProjectApi.getCapabilities(projectCode)
    if (!isCurrent(projectCode, generation) || sequence !== capabilityLoadSequence) return false
    if (
      !Array.isArray(result) ||
      result.length !== 3 ||
      !Object.keys(capabilityNames).every(
        (code) => result.filter((row) => row.capabilityCode === code).length === 1
      ) ||
      result.some(
        (row) =>
          !Object.keys(capabilityStatuses).includes(row.status) ||
          (row.status === 'NOT_ENABLED'
            ? row.version !== null
            : !Number.isSafeInteger(row.version) || Number(row.version) < 0)
      )
    ) {
      throw new Error('无效能力响应')
    }
    capabilities.value = result
    return true
  } catch {
    if (isCurrent(projectCode, generation) && sequence === capabilityLoadSequence) {
      capabilityError.value = '接入能力状态查询失败，当前状态未确认，请刷新后再操作。'
    }
    return false
  } finally {
    if (isCurrent(projectCode, generation) && sequence === capabilityLoadSequence)
      capabilityLoading.value = false
  }
}
const reloadCapabilities = () => loadCapabilities(props.projectCode, projectGeneration)
const openDisable = () => {
  const row = standardCapability.value
  if (
    !canEdit.value ||
    !row ||
    row.status !== 'ENABLED' ||
    capabilityWriting.value ||
    capabilityLoading.value
  )
    return
  disableContext = {
    projectCode: props.projectCode,
    generation: projectGeneration,
    version: row.version
  }
  disableReason.value = ''
  disableVisible.value = true
}

// 写入不乐观更新，失败（包括版本冲突）只重新查询，不自动重发。
// Axios普通错误可能已丢失业务码，因此所有失败均要求重新核实与确认。
const writeCapability = async (disable: boolean) => {
  const row = standardCapability.value
  if (!canEdit.value || !row || capabilityWriting.value || capabilityLoading.value) return
  const projectCode = props.projectCode
  const generation = projectGeneration
  if (
    disable &&
    (!disableVisible.value ||
      !validDisableReason.value ||
      !disableContext ||
      !isCurrent(disableContext.projectCode, disableContext.generation))
  )
    return
  if (!disable && !props.active) return
  const version = disable ? disableContext!.version : row.version
  capabilityWriting.value = true
  try {
    const result = disable
      ? await ProjectApi.disableStandardProduct(projectCode, version, disableReason.value.trim())
      : await ProjectApi.enableStandardProduct(projectCode, version)
    if (!isCurrent(projectCode, generation)) return
    disableVisible.value = false
    disableContext = null
    if (!result || typeof result.changed !== 'boolean') throw new Error('写入结果未确认')
    const loaded = await loadCapabilities(projectCode, generation)
    if (isCurrent(projectCode, generation)) {
      if (loaded) message.success(result.changed ? '接入能力已更新' : '接入能力无需变更')
      else message.warning('操作已返回，但当前能力状态查询失败，请刷新核实。')
    }
  } catch {
    if (!isCurrent(projectCode, generation)) return
    disableVisible.value = false
    disableContext = null
    message.warning(
      '操作结果未确认或版本已变化，正在重新查询状态；请核实后重新确认，不会自动重试。'
    )
    await loadCapabilities(projectCode, generation)
  } finally {
    if (isCurrent(projectCode, generation)) capabilityWriting.value = false
  }
}
const enableStandardProduct = () => writeCapability(false)
const submitDisable = () => writeCapability(true)

const load = async (projectCode: string, generation: number) => {
  if (!projectCode) return
  const sequence = ++loadSequence
  loading.value = true
  try {
    const result = await ProjectApi.getApplicationCredentials(projectCode)
    if (isCurrent(projectCode, generation) && sequence === loadSequence) {
      credentials.value = result
    }
  } finally {
    if (isCurrent(projectCode, generation) && sequence === loadSequence) loading.value = false
  }
}

const showIssued = (value: ProjectIssuedCredential) => {
  issued.value = value
  issuedVisible.value = true
}

const enable = async () => {
  const projectCode = props.projectCode
  const generation = projectGeneration
  loading.value = true
  try {
    const result = await ProjectApi.enableApplication(projectCode)
    if (!isCurrent(projectCode, generation)) return
    showIssued(result)
    await load(projectCode, generation)
  } finally {
    if (isCurrent(projectCode, generation)) loading.value = false
  }
}

const rotate = async () => {
  const projectCode = props.projectCode
  const generation = projectGeneration
  loading.value = true
  try {
    const result = await ProjectApi.rotateApplication(projectCode)
    if (!isCurrent(projectCode, generation)) return
    showIssued(result)
    await load(projectCode, generation)
  } finally {
    if (isCurrent(projectCode, generation)) loading.value = false
  }
}

const revoke = async () => {
  const projectCode = props.projectCode
  const generation = projectGeneration
  let reason: string
  try {
    const result = await ElMessageBox.prompt(
      '吊销后当前与过渡密钥都会立即失效，请填写原因。',
      '吊销项目应用密钥',
      {
        confirmButtonText: '确认吊销',
        cancelButtonText: '取消',
        type: 'warning',
        inputValidator: (value) => (value.trim() ? true : '请输入吊销原因')
      }
    )
    reason = result.value.trim()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    throw error
  }
  if (!isCurrent(projectCode, generation)) return
  loading.value = true
  try {
    await ProjectApi.revokeApplication(projectCode, reason)
    if (!isCurrent(projectCode, generation)) return
    await load(projectCode, generation)
    if (isCurrent(projectCode, generation)) message.success('活动密钥已吊销')
  } finally {
    if (isCurrent(projectCode, generation)) loading.value = false
  }
}

const copyIssued = async () => {
  if (!issued.value) return
  await navigator.clipboard.writeText(
    `APPID: ${issued.value.appId}\nAPPKEY: ${issued.value.appKey}`
  )
  message.success('已复制，请妥善保管')
}

const clearIssued = () => {
  issued.value = null
  issuedVisible.value = false
}

watch(
  () => props.projectCode,
  async (projectCode) => {
    const generation = ++projectGeneration
    ++loadSequence
    clearIssued()
    ++capabilityLoadSequence
    disableVisible.value = false
    disableContext = null
    disableReason.value = ''
    capabilities.value = []
    capabilityError.value = canQuery.value ? '' : '无项目查询权限'
    capabilityLoading.value = false
    capabilityWriting.value = false
    credentials.value = emptyCredentials()
    loading.value = false
    if (projectCode)
      await Promise.all([load(projectCode, generation), loadCapabilities(projectCode, generation)])
  },
  { immediate: true, flush: 'sync' }
)
onUnmounted(() => {
  ++projectGeneration
  ++loadSequence
  ++capabilityLoadSequence
  disableVisible.value = false
  disableContext = null
  clearIssued()
})
</script>
