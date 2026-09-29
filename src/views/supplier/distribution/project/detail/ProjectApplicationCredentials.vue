<template>
  <div v-loading="loading">
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

    <el-dialog
      v-model="issuedVisible"
      title="保存项目应用密钥"
      width="560px"
      destroy-on-close
      @closed="clearIssued"
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
import {
  ProjectApi,
  type ProjectApplicationCredentials,
  type ProjectIssuedCredential
} from '@/api/supplier/distribution'

defineOptions({ name: 'ProjectApplicationCredentials' })

const props = defineProps<{ projectCode: string; active: boolean }>()
const message = useMessage()
const loading = ref(false)
const issuedVisible = ref(false)
const issued = ref<ProjectIssuedCredential | null>(null)
const credentials = ref<ProjectApplicationCredentials>({ appId: null, credentials: [] })
const hasActiveCredential = computed(() =>
  credentials.value.credentials.some((row) => row.status === 'CURRENT' || row.status === 'GRACE')
)

const load = async () => {
  if (!props.projectCode) return
  loading.value = true
  try {
    credentials.value = await ProjectApi.getApplicationCredentials(props.projectCode)
  } finally {
    loading.value = false
  }
}

const showIssued = (value: ProjectIssuedCredential) => {
  issued.value = value
  issuedVisible.value = true
}

const enable = async () => {
  loading.value = true
  try {
    showIssued(await ProjectApi.enableApplication(props.projectCode))
    await load()
  } finally {
    loading.value = false
  }
}

const rotate = async () => {
  loading.value = true
  try {
    showIssued(await ProjectApi.rotateApplication(props.projectCode))
    await load()
  } finally {
    loading.value = false
  }
}

const revoke = async () => {
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
  loading.value = true
  try {
    await ProjectApi.revokeApplication(props.projectCode, reason)
    await load()
    message.success('活动密钥已吊销')
  } finally {
    loading.value = false
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
}

watch(() => props.projectCode, load, { immediate: true })
onUnmounted(clearIssued)
</script>
