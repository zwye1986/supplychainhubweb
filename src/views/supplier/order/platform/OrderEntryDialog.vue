<template>
  <el-dialog
    v-model="visible"
    class="order-entry-dialog"
    title="录入真实标准订单"
    width="min(760px, calc(100vw - 32px))"
    top="5vh"
    append-to-body
    :show-close="!busy"
    :close-on-click-modal="false"
    :close-on-press-escape="!busy"
    :before-close="beforeClose"
  >
    <el-alert
      title="每单一件，按项目真实价格进行资金预留与供应商履约；候选商品不代表当前可售。"
      type="warning"
      :closable="false"
      class="mb-16px"
    />
    <el-form label-width="120px" :disabled="busy">
      <el-form-item label="项目名称搜索">
        <div class="entry-inline">
          <el-input
            v-model="projectQuery.projectName"
            aria-label="项目名称搜索"
            clearable
            @keyup.enter="searchProjects"
          />
          <el-button :disabled="busy" @click="searchProjects">搜索项目</el-button>
        </div>
      </el-form-item>
      <el-form-item label="录入项目" required>
        <el-select
          v-model="form.projectCode"
          aria-label="录入项目"
          :loading="projectsLoading"
          class="w-full"
          placeholder="选择项目（可搜索并翻页）"
        >
          <el-option
            v-if="
              selectedProject &&
              !projects.some((item) => item.projectCode === selectedProject?.projectCode)
            "
            :value="selectedProject.projectCode || ''"
            :label="projectLabel(selectedProject)"
          />
          <el-option
            v-for="item in projects"
            :key="item.projectCode"
            :value="item.projectCode || ''"
            :label="projectLabel(item)"
            :disabled="!item.projectCode"
          />
        </el-select>
        <Pagination
          v-model:page="projectQuery.pageNo"
          v-model:limit="projectQuery.pageSize"
          :total="projectTotal"
          @pagination="loadProjects"
        />
      </el-form-item>
      <el-form-item v-if="selectedProject" label="项目归属">
        分销商：{{ selectedProject.buyerName || '-' }}；结算方：{{
          selectedProject.settlementBuyerName || '-'
        }}
      </el-form-item>
      <el-form-item label="录入商品" required>
        <el-select
          v-model="form.platformSkuCode"
          aria-label="录入商品"
          :disabled="!form.projectCode || productsLoading"
          :loading="productsLoading"
          class="w-full"
          placeholder="选择当前项目商品（可翻页）"
        >
          <el-option
            v-if="
              selectedProduct &&
              !products.some((item) => item.platformSkuCode === selectedProduct?.platformSkuCode)
            "
            :value="selectedProduct.platformSkuCode || ''"
            :label="productLabel(selectedProduct)"
          />
          <el-option
            v-for="item in products"
            :key="item.listingCode || item.platformSkuCode"
            :value="item.platformSkuCode || ''"
            :label="productLabel(item)"
            :disabled="!item.platformSkuCode"
          />
        </el-select>
        <Pagination
          v-model:page="productQuery.pageNo"
          v-model:limit="productQuery.pageSize"
          :total="productTotal"
          @pagination="loadProducts"
        />
      </el-form-item>
      <el-form-item label="项目订单号" required>
        <div class="entry-inline">
          <el-input v-model="form.buyerOrderNo" aria-label="项目订单号" maxlength="128" />
          <el-button
            :disabled="busy || unknownResult || receipt?.receiptStatus === 'PROCESSING'"
            @click="generateOrderNo"
            >重新生成</el-button
          >
        </div>
      </el-form-item>
      <el-form-item label="数量">1（固定）</el-form-item>
      <el-alert
        v-if="selectedProduct && !supportedSchema"
        title="目标 Schema 缺失或版本不支持，请维护商品后录入。"
        type="error"
        :closable="false"
        class="mb-16px"
      />
      <el-form-item v-if="isVoucher" label="履约目标"
        >BUYER_ASSET_QUERY（通过买方资产查询获取卡券）</el-form-item
      >
      <template v-if="isAccount">
        <el-form-item label="账号类型" required>
          <el-select v-model="form.accountType" aria-label="账号类型">
            <el-option label="手机号（MOBILE）" value="MOBILE" />
            <el-option label="外部账号（EXTERNAL_ACCOUNT）" value="EXTERNAL_ACCOUNT" />
          </el-select>
        </el-form-item>
        <el-form-item label="履约账号" required>
          <el-input
            v-model="form.accountValue"
            aria-label="履约账号"
            maxlength="128"
            placeholder="请输入实际履约账号"
          />
        </el-form-item>
      </template>
    </el-form>
    <el-alert
      v-if="candidateError"
      :title="candidateError"
      type="error"
      :closable="false"
      class="mb-16px"
    />
    <el-alert
      v-if="unknownResult"
      title="提交结果可能未知，请保留同一项目订单号与参数，同号查询或续跑，或在平台订单查单；不要换号重复下单。"
      type="warning"
      :closable="false"
      class="mb-16px"
    />
    <el-descriptions v-if="receipt" :column="1" border>
      <el-descriptions-item label="受理状态"
        >{{ receipt.receiptStatus }} — {{ receiptLabel }}</el-descriptions-item
      >
      <el-descriptions-item label="说明"
        >受理回执不代表发券、充值或履约成功，请查看订单实际状态。</el-descriptions-item
      >
      <el-descriptions-item label="回执编号 / 版本"
        >{{ receipt.requestId }} / {{ receipt.receiptVersion }}</el-descriptions-item
      >
      <el-descriptions-item label="项目订单号">{{ receipt.buyerOrderNo }}</el-descriptions-item>
      <el-descriptions-item label="平台订单号">{{
        receipt.orderNo || '尚未建单'
      }}</el-descriptions-item>
      <el-descriptions-item label="拒绝码">{{ receipt.rejectionCode || '-' }}</el-descriptions-item>
      <el-descriptions-item label="幂等回放">{{
        receipt.idempotentReplay ? '是' : '否'
      }}</el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <el-button :disabled="busy" @click="close">关闭</el-button>
      <el-button v-if="receipt?.orderNo" :disabled="busy" @click="emit('detail', receipt.orderNo)"
        >查看订单详情</el-button
      >
      <el-button
        v-if="receipt?.receiptStatus === 'REJECTED_RETRYABLE'"
        type="warning"
        :disabled="busy || !canSubmit || !validReceiptVersion"
        :loading="busy"
        @click="submit(true)"
        >条件修复后原单重试</el-button
      >
      <el-button
        v-else-if="unknownResult || receipt?.receiptStatus === 'PROCESSING'"
        type="primary"
        :disabled="busy || !canSubmit"
        :loading="busy"
        @click="submit(false)"
        >同号查询或续跑</el-button
      >
      <el-button
        v-else
        type="primary"
        :disabled="busy || !canSubmit || !!receipt"
        :loading="busy"
        @click="submit(false)"
        >提交订单</el-button
      >
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { OrderEntryApi } from '@/api/order/entry'
import type { OrderEntryCommand, OrderEntryProduct, OrderEntryReceipt } from '@/api/order/entry'
import type { ProjectDetail } from '@/api/supplier/distribution/types'

defineOptions({ name: 'OrderEntryDialog' })
const emit = defineEmits<{ success: [orderNo: string]; detail: [orderNo: string] }>()
const message = useMessage()
const visible = ref(false)
const busy = ref(false)
const projectsLoading = ref(false)
const productsLoading = ref(false)
const candidateError = ref('')
const unknownResult = ref(false)
const receipt = ref<OrderEntryReceipt>()
const projects = ref<ProjectDetail[]>([])
const products = ref<OrderEntryProduct[]>([])
const selectedProject = ref<ProjectDetail>()
const selectedProduct = ref<OrderEntryProduct>()
const projectTotal = ref(0)
const productTotal = ref(0)
const projectQuery = reactive({ projectName: '', pageNo: 1, pageSize: 20 })
const productQuery = reactive({ pageNo: 1, pageSize: 20 })
const form = reactive({
  projectCode: '',
  platformSkuCode: '',
  buyerOrderNo: '',
  accountType: 'MOBILE',
  accountValue: ''
})
const SCHEMA = {
  voucher: 'VOUCHER_DELIVERY_TARGET',
  recharge: 'DIRECT_RECHARGE_TARGET',
  benefit: 'ACCOUNT_BOUND_BENEFIT_TARGET'
} as const
const isVoucher = computed(() => selectedProduct.value?.targetSchemaCode === SCHEMA.voucher)
const isAccount = computed(
  () =>
    selectedProduct.value?.targetSchemaCode === SCHEMA.recharge ||
    selectedProduct.value?.targetSchemaCode === SCHEMA.benefit
)
const supportedSchema = computed(
  () => selectedProduct.value?.targetSchemaVersion === 1 && (isVoucher.value || isAccount.value)
)
const canSubmit = computed(
  () =>
    !!form.projectCode &&
    !!form.platformSkuCode &&
    !!form.buyerOrderNo.trim() &&
    supportedSchema.value &&
    (!isAccount.value ||
      (!!form.accountValue.trim() && ['MOBILE', 'EXTERNAL_ACCOUNT'].includes(form.accountType)))
)
const validReceiptVersion = computed(
  () =>
    Number.isSafeInteger(receipt.value?.receiptVersion) && (receipt.value?.receiptVersion ?? -1) > 0
)
const receiptLabels = {
  ACCEPTED: '已受理，等待实际履约结果',
  PROCESSING: '处理中，保留同号查询或续跑',
  REJECTED_RETRYABLE: '可重试拒绝，修复条件后明确重试原单',
  REJECTED_FINAL: '最终拒绝，不可重试本回执'
}
const receiptLabel = computed(() =>
  receipt.value ? receiptLabels[receipt.value.receiptStatus] : ''
)
const projectLabel = (item: ProjectDetail) => `${item.projectName || '-'}（${item.projectCode}）`
const productLabel = (item: OrderEntryProduct) =>
  `${item.skuName || item.spuName || '-'}（${item.platformSkuCode || '缺少 SKU 编码'}）`
let projectSequence = 0
let productSequence = 0

/** 候选查询按请求序号裁决，切项目或关闭后丢弃迟到响应，不保留旧项目目标。
 * 后端仓库 docs/superpowers/specs/2026-10-14-admin-order-entry-design.md#4-前端行为。
 */
const loadProjects = async () => {
  const sequence = ++projectSequence
  projectsLoading.value = true
  candidateError.value = ''
  try {
    const data = await OrderEntryApi.projects({ ...projectQuery })
    if (sequence !== projectSequence) return
    projects.value = data.list || []
    projectTotal.value = data.total || 0
  } catch {
    if (sequence !== projectSequence) return
    projects.value = []
    projectTotal.value = 0
    candidateError.value = '项目候选加载失败，请重新搜索。'
  } finally {
    if (sequence === projectSequence) projectsLoading.value = false
  }
}
const searchProjects = () => {
  if (busy.value) return
  projectQuery.pageNo = 1
  return loadProjects()
}
const loadProducts = async () => {
  const code = form.projectCode
  const sequence = ++productSequence
  if (!code) return
  productsLoading.value = true
  candidateError.value = ''
  try {
    const data = await OrderEntryApi.products(code, { ...productQuery })
    if (sequence !== productSequence || code !== form.projectCode) return
    products.value = data.list || []
    productTotal.value = data.total || 0
  } catch {
    if (sequence !== productSequence || code !== form.projectCode) return
    products.value = []
    productTotal.value = 0
    candidateError.value = '项目商品加载失败，请重试翻页或重新选择项目。'
  } finally {
    if (sequence === productSequence) productsLoading.value = false
  }
}
const clearReceipt = () => {
  receipt.value = undefined
  unknownResult.value = false
}
watch(
  () => form.projectCode,
  (code) => {
    ++productSequence
    products.value = []
    productTotal.value = 0
    productsLoading.value = false
    form.platformSkuCode = ''
    selectedProduct.value = undefined
    form.accountValue = ''
    form.accountType = 'MOBILE'
    selectedProject.value = projects.value.find((item) => item.projectCode === code)
    clearReceipt()
    productQuery.pageNo = 1
    if (code) loadProducts()
  },
  { flush: 'sync' }
)
watch(
  () => form.platformSkuCode,
  (code) => {
    selectedProduct.value = products.value.find((item) => item.platformSkuCode === code)
    form.accountValue = ''
    form.accountType = 'MOBILE'
    clearReceipt()
  },
  { flush: 'sync' }
)
watch(() => [form.buyerOrderNo, form.accountType, form.accountValue], clearReceipt, {
  flush: 'sync'
})
const generateOrderNo = () => {
  if (busy.value || unknownResult.value || receipt.value?.receiptStatus === 'PROCESSING') return
  form.buyerOrderNo = `ADMIN_${crypto.randomUUID()}`
}
const open = () => {
  if (busy.value) return
  // 未知结果和处理中关闭再打开仍保留原号，防止无意创建第二单。
  if (!unknownResult.value && receipt.value?.receiptStatus !== 'PROCESSING') {
    form.projectCode = ''
    form.platformSkuCode = ''
    form.accountValue = ''
    clearReceipt()
    generateOrderNo()
    projectQuery.projectName = ''
    projectQuery.pageNo = 1
  }
  visible.value = true
  loadProjects()
}
const close = () => {
  if (busy.value) return
  visible.value = false
  ++projectSequence
  ++productSequence
  projectsLoading.value = false
  productsLoading.value = false
}
const beforeClose = (done: () => void) => {
  if (busy.value) return
  close()
  done()
}
onBeforeUnmount(() => {
  ++projectSequence
  ++productSequence
})
defineExpose({ open })

/** 一次明确确认对应一次真实尝试；CAS 只由可重试拒绝按钮携带，未知结果不自动换号/重发。
 * 后端仓库 docs/superpowers/specs/2026-10-14-admin-order-entry-design.md#4-前端行为。
 */
const submit = async (retry: boolean) => {
  if (busy.value || !canSubmit.value) return
  if (
    retry &&
    (receipt.value?.receiptStatus !== 'REJECTED_RETRYABLE' || !validReceiptVersion.value)
  )
    return
  if (!retry && receipt.value && receipt.value.receiptStatus !== 'PROCESSING') return
  busy.value = true
  const code = form.projectCode
  const data: OrderEntryCommand = {
    buyerOrderNo: form.buyerOrderNo.trim(),
    platformSkuCode: form.platformSkuCode,
    quantity: 1,
    target: isVoucher.value
      ? { deliveryMode: 'BUYER_ASSET_QUERY' }
      : { accountType: form.accountType, accountValue: form.accountValue.trim() }
  }
  if (retry) data.previousReceiptVersion = receipt.value!.receiptVersion
  try {
    try {
      await message.confirm('确认进行真实资金预留与供应商履约？本操作不是模拟下单，每单数量为1。')
    } catch {
      return
    }
    const result = await OrderEntryApi.create(code, data)
    if (!result || !Object.hasOwn(receiptLabels, result.receiptStatus))
      throw new Error('Invalid receipt')
    receipt.value = result
    unknownResult.value = false
    if (result.receiptStatus === 'ACCEPTED' && result.orderNo) emit('success', result.orderNo)
  } catch {
    // CAS 可能已在服务端成功；丢弃旧版本，下次只用相同身份读取当前回执。
    receipt.value = undefined
    unknownResult.value = true
    message.warning('提交结果可能未知，请保留同号与参数查单或重试。')
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.entry-inline {
  display: flex;
  width: 100%;
  gap: 8px;
}

.entry-inline .el-input {
  flex: 1;
}

:global(.order-entry-dialog .el-dialog__body) {
  max-height: calc(85vh - 120px);
  overflow-y: auto;
}
</style>
