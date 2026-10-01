<template>
  <ContentWrap v-if="canQuery">
    <div class="mb-16px flex items-center justify-between">
      <div>
        <h3>内部运营直充限频监控</h3>
        <div>全中台统计，筛选只影响下方列表。观察时间：{{ time(statistics?.observedAt) }}</div>
      </div>
      <el-button :loading="listLoading || statisticsLoading" @click="refresh">刷新</el-button>
    </div>
    <el-alert
      v-if="statisticsError"
      :title="statisticsError"
      type="error"
      :closable="false"
      class="mb-16px"
    />
    <el-row :gutter="16" class="mb-16px">
      <el-col v-for="card in cards" :key="card.key" :span="6">
        <el-card v-loading="statisticsLoading">
          <div>{{ card.label }}</div>
          <strong>{{ statistics?.[card.key] ?? '—' }}</strong>
          <div v-if="statisticsStale">旧统计已过期</div>
        </el-card>
      </el-col>
    </el-row>
    <el-alert
      :title="`成功最短占用窗口 ${statistics?.successMinimumHoldSeconds ?? FREQUENCY_POLICY.successMinimumHoldSeconds} 秒；持续占用超过 ${Number(statistics?.occupiedAlertSeconds ?? FREQUENCY_POLICY.occupiedAlertSeconds) / 60} 分钟仅告警；等待数量严格大于 ${statistics?.backlogThreshold ?? FREQUENCY_POLICY.backlogThreshold} 才视为积压。`"
      type="info"
      :closable="false"
      class="mb-16px"
    />
    <el-tabs v-model="view" @tab-change="switchView">
      <el-tab-pane label="等待订单" name="WAITING" />
      <el-tab-pane label="占用队列" name="OCCUPANCIES" />
      <el-tab-pane label="积压队列" name="BACKLOGS" />
    </el-tabs>
    <el-form :inline="true" @submit.prevent="search">
      <el-form-item label="精确手机号">
        <el-input
          v-model="mobile"
          maxlength="32"
          autocomplete="off"
          placeholder="仅POST精确查询"
          clearable
        />
      </el-form-item>
      <el-form-item label="平台SPU编码"
        ><el-input v-model="filters.platformSpuCode" maxlength="64" clearable
      /></el-form-item>
      <el-form-item label="分销商ID"
        ><el-input v-model="filters.buyerId" placeholder="内部主键" clearable
      /></el-form-item>
      <el-form-item label="项目ID"
        ><el-input v-model="filters.projectId" placeholder="内部主键" clearable
      /></el-form-item>
      <el-form-item label="平台订单号"
        ><el-input v-model="filters.orderNo" maxlength="64" clearable
      /></el-form-item>
      <el-form-item label="采购商订单号"
        ><el-input v-model="filters.buyerOrderNo" maxlength="128" clearable
      /></el-form-item>
      <el-form-item label="首次入队时间（上海）">
        <el-date-picker
          v-model="enqueuedRange"
          type="datetimerange"
          value-format="YYYY-MM-DDTHH:mm:ss"
          start-placeholder="开始"
          end-placeholder="截止（含边界）"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" native-type="submit" :disabled="listLoading">查询</el-button>
        <el-button :disabled="listLoading" @click="reset">重置</el-button>
      </el-form-item>
    </el-form>
    <div v-if="view === 'BACKLOGS'" class="mb-8px">
      筛选匹配队列，数量与最早等待时间统计整条队列
    </div>
    <el-alert v-if="listError" :title="listError" type="error" :closable="false" class="mb-16px" />
    <div class="mb-8px"
      >列表观察时间：{{ time(listObservedAt) }}
      <el-tag v-if="listStale" type="warning">旧数据已过期</el-tag></div
    >
    <el-table
      v-loading="listLoading"
      :data="rows"
      :row-key="view === 'WAITING' ? 'entryId' : 'queueId'"
    >
      <el-table-column label="脱敏手机号" prop="maskedMobile" min-width="130" />
      <el-table-column label="平台SPU" min-width="160">
        <template #default="{ row }"
          >{{ row.platformSpuName || '—' }}<br />{{ row.platformSpuCode }}</template
        >
      </el-table-column>
      <template v-if="view === 'WAITING'">
        <el-table-column label="分销商 / 项目" min-width="180">
          <template #default="{ row }"
            >{{ row.buyerName || row.buyerCode || row.buyerId }}<br />{{
              row.projectName || row.projectCode || row.projectId || '—'
            }}</template
          >
        </el-table-column>
        <el-table-column label="订单" min-width="210">
          <template #default="{ row }">
            <el-button v-if="canOrder" link type="primary" @click="openOrder(row.orderNo)">{{
              row.orderNo
            }}</el-button>
            <span v-else>{{ row.orderNo }}</span
            ><br />采购商订单：{{ row.buyerOrderNo || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="入队 / 等待" min-width="170"
          ><template #default="{ row }"
            >{{ time(row.enqueuedAt) }}<br />{{ row.waitSeconds }} 秒 / 序号
            {{ row.queueSequence }}</template
          ></el-table-column
        >
        <el-table-column label="状态" width="100"
          ><template #default>等待检查</template></el-table-column
        >
        <el-table-column v-if="canRetry" label="操作" width="120"
          ><template #default="{ row }"
            ><el-button
              link
              type="primary"
              :disabled="listLoading || listStale"
              @click="actions?.open({ kind: 'retry', row })"
              >触发检查</el-button
            ></template
          ></el-table-column
        >
      </template>
      <template v-else-if="view === 'OCCUPANCIES'">
        <el-table-column label="占用订单 / 风险订单" min-width="210">
          <template #default="{ row }">
            <el-button
              v-if="row.holderOrderNo && canOrder"
              link
              type="primary"
              @click="openOrder(row.holderOrderNo)"
              >{{ row.holderOrderNo }}</el-button
            >
            <span v-else>{{ row.holderOrderNo || '迁移阻塞：占用订单未知' }}</span>
            <div v-for="no in row.riskOrderNos || []" :key="no">
              <el-button v-if="canOrder" link type="primary" @click="openOrder(no)">{{
                no
              }}</el-button
              ><span v-else>{{ no }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="取得 / 最短占用截止" min-width="180"
          ><template #default="{ row }"
            >{{ time(row.acquiredAt) }}<br />{{ time(row.minimumHoldUntil) }}</template
          ></el-table-column
        >
        <el-table-column label="占用时长" min-width="120"
          ><template #default="{ row }"
            >{{ row.heldSeconds == null ? '未知' : `${row.heldSeconds} 秒`
            }}<el-tag v-if="row.overdue" type="warning">超过告警阈值</el-tag></template
          ></el-table-column
        >
        <el-table-column label="状态 / 释放资格" min-width="230"
          ><template #default="{ row }"
            >{{ DISPLAY_STATUSES[row.displayStatus] || '状态未知，请先查单核实' }}<br />{{
              row.canRelease
                ? '服务端确认具备释放资格'
                : RELEASE_BLOCKED_REASONS[row.releaseBlockedReason] || '无可信释放资格'
            }}</template
          ></el-table-column
        >
        <el-table-column v-if="canRelease" label="操作" width="120"
          ><template #default="{ row }"
            ><el-button
              link
              type="danger"
              :disabled="!row.canRelease || listLoading || listStale"
              @click="actions?.open({ kind: 'release', row })"
              >释放占用</el-button
            ></template
          ></el-table-column
        >
      </template>
      <template v-else>
        <el-table-column label="队列等待项数量" prop="waitingCount" min-width="140" />
        <el-table-column label="最早首次入队" min-width="180"
          ><template #default="{ row }">{{
            time(row.earliestEnqueuedAt)
          }}</template></el-table-column
        >
        <el-table-column label="积压告警" min-width="140"
          ><template #default="{ row }"
            ><el-tag :type="row.overThreshold ? 'warning' : 'info'">{{
              row.overThreshold ? '超过积压阈值' : '未超过阈值'
            }}</el-tag></template
          ></el-table-column
        >
      </template>
    </el-table>
    <el-pagination
      v-if="total != null"
      class="mt-16px"
      :current-page="pageNo"
      :page-size="pageSize"
      :total="total"
      :page-sizes="[20, 50, 100]"
      layout="total, sizes, prev, pager, next"
      :disabled="listLoading"
      @size-change="changeSize"
      @current-change="changePage"
    />
    <OrderDetail v-if="canOrder" ref="orderDetail" />
  </ContentWrap>
  <ContentWrap v-else><el-result icon="warning" title="无直充限频查询权限" /></ContentWrap>
  <!-- 意图承载组件持续挂载；撤销查询权限不能丢弃未知命令或导航保护。 -->
  <FrequencyActionDialog ref="actions" @resolved="refresh" @changed="refresh" />
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { checkPermi } from '@/utils/permission'
import {
  DISPLAY_STATUSES,
  FREQUENCY_PERMISSIONS,
  FREQUENCY_POLICY,
  RELEASE_BLOCKED_REASONS,
  RechargeFrequencyApi,
  isDeterminedFrequencyError
} from '@/api/order/rechargeFrequency'
import type {
  Backlog,
  FrequencyPageParams,
  FrequencyStatistics,
  FrequencyView,
  Occupancy,
  WaitingOrder
} from '@/api/order/rechargeFrequency'
import FrequencyActionDialog from './components/FrequencyActionDialog.vue'
import OrderDetail from '@/views/supplier/order/platform/detail/index.vue'

defineOptions({ name: 'RechargeFrequencyMonitor' })
dayjs.extend(utc)
dayjs.extend(timezone)
const canQuery = computed(() => checkPermi([FREQUENCY_PERMISSIONS.query]))
const canRetry = computed(() => checkPermi([FREQUENCY_PERMISSIONS.retry]))
const canRelease = computed(() => checkPermi([FREQUENCY_PERMISSIONS.release]))
const canOrder = computed(() => checkPermi([FREQUENCY_PERMISSIONS.order]))
const actions = ref<InstanceType<typeof FrequencyActionDialog>>()
const orderDetail = ref<InstanceType<typeof OrderDetail>>()
const view = ref<FrequencyView>('WAITING')
const mobile = ref('')
const filters = reactive({
  platformSpuCode: '',
  buyerId: '',
  projectId: '',
  orderNo: '',
  buyerOrderNo: ''
})
const enqueuedRange = ref<string[]>([])
const applied = shallowRef<{
  params: Omit<FrequencyPageParams, 'pageNo' | 'pageSize'>
  mobile?: string
}>({ params: {} })
const rows = ref<(WaitingOrder | Occupancy | Backlog)[]>([])
const pageNo = ref(1)
const pageSize = ref(20)
const total = ref<number>()
const listObservedAt = ref<number>()
const listLoading = ref(false)
const listStale = ref(false)
const listError = ref('')
const statistics = ref<FrequencyStatistics>()
const statisticsLoading = ref(false)
const statisticsStale = ref(false)
const statisticsError = ref('')
let listSequence = 0
let statisticsSequence = 0
let active = true
const cards: {
  key: 'waitingOrderCount' | 'occupiedQueueCount' | 'overThresholdQueueCount' | 'overdueQueueCount'
  label: string
}[] = [
  { key: 'waitingOrderCount', label: '全局等待订单' },
  { key: 'occupiedQueueCount', label: '全局占用队列' },
  { key: 'overThresholdQueueCount', label: '全局积压告警队列' },
  { key: 'overdueQueueCount', label: '全局持续占用告警队列' }
]
const time = (value?: number | null) =>
  value == null ? '—' : dayjs(value).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss')
const errorText = (error: unknown) =>
  isDeterminedFrequencyError(error) ? error.message : '请求失败，当前数据未更新，请手动刷新。'

/**
 * 序号覆盖全部列表请求，离页失效；mobile只在组件内存中用于POST正文。
 * 全局统计独立读取，不以当前分页结果推算；失败保留并标识旧数据。
 * 设计：docs/superpowers/specs/2026-09-30-direct-recharge-mobile-spu-frequency-design.md#7-管理端契约与权限
 */
const loadList = async () => {
  if (!active || !canQuery.value) return
  const sequence = ++listSequence
  listLoading.value = true
  listStale.value = rows.value.length > 0
  listError.value = ''
  try {
    const result = await RechargeFrequencyApi.page(
      view.value,
      { ...applied.value.params, pageNo: pageNo.value, pageSize: pageSize.value },
      applied.value.mobile
    )
    if (!active || sequence !== listSequence) return
    rows.value = result.list
    total.value = Number(result.total)
    listObservedAt.value = result.observedAt
    listStale.value = false
  } catch (error: unknown) {
    if (!active || sequence !== listSequence) return
    listError.value = errorText(error)
    listStale.value = true
  } finally {
    if (active && sequence === listSequence) listLoading.value = false
  }
}
const loadStatistics = async () => {
  if (!active || !canQuery.value) return
  const sequence = ++statisticsSequence
  statisticsLoading.value = true
  statisticsError.value = ''
  statisticsStale.value = !!statistics.value
  try {
    const result = await RechargeFrequencyApi.statistics()
    if (!active || sequence !== statisticsSequence) return
    statistics.value = result
    statisticsStale.value = false
  } catch (error: unknown) {
    if (!active || sequence !== statisticsSequence) return
    statisticsError.value = errorText(error)
    statisticsStale.value = true
  } finally {
    if (active && sequence === statisticsSequence) statisticsLoading.value = false
  }
}
const refresh = () => {
  void loadList()
  void loadStatistics()
}
const applyFilters = () => {
  const params: Omit<FrequencyPageParams, 'pageNo' | 'pageSize'> = {}
  if (filters.platformSpuCode.trim()) params.platformSpuCode = filters.platformSpuCode.trim()
  // 各页签保留同一组条件；积压由同一WAITING项匹配队列，聚合仍由服务端统计整队列。
  // 设计：docs/superpowers/specs/2026-09-30-direct-recharge-mobile-spu-frequency-design.md#7-管理端契约与权限
  for (const key of ['buyerId', 'projectId', 'orderNo', 'buyerOrderNo'] as const) {
    if (filters[key].trim()) params[key] = filters[key].trim()
  }
  if (enqueuedRange.value?.length === 2) {
    const exactMobile = mobile.value.trim()
    params.enqueuedFrom = exactMobile
      ? dayjs.tz(enqueuedRange.value[0], 'Asia/Shanghai').valueOf()
      : enqueuedRange.value[0]
    params.enqueuedTo = exactMobile
      ? dayjs.tz(enqueuedRange.value[1], 'Asia/Shanghai').valueOf()
      : enqueuedRange.value[1]
  }
  applied.value = { params, mobile: mobile.value.trim() || undefined }
}
/** 查询与页签自动读取共用ID校验，保留十进制字符串精度。
 * 设计：docs/superpowers/specs/2026-09-30-direct-recharge-mobile-spu-frequency-design.md#8-前端监控页面
 */
const validateIds = () => {
  for (const key of ['buyerId', 'projectId'] as const) {
    if (filters[key].trim() && !/^[1-9]\d*$/.test(filters[key].trim())) {
      ElMessage.warning('分销商和项目ID须为正整数内部主键')
      return false
    }
  }
  return true
}
const search = () => {
  if (listLoading.value || !validateIds()) return
  applyFilters()
  pageNo.value = 1
  void loadList()
}
const reset = () => {
  mobile.value = ''
  Object.keys(filters).forEach((key) => {
    filters[key as keyof typeof filters] = ''
  })
  enqueuedRange.value = []
  search()
}
const switchView = () => {
  // 即使新条件无效也废弃旧请求；不能让旧页签响应回填已切换的列表。
  // 设计：docs/superpowers/specs/2026-09-30-direct-recharge-mobile-spu-frequency-design.md#8-前端监控页面
  ++listSequence
  listLoading.value = false
  listStale.value = false
  listError.value = ''
  pageNo.value = 1
  rows.value = []
  total.value = undefined
  listObservedAt.value = undefined
  if (!validateIds()) return
  applyFilters()
  void loadList()
}
const changeSize = (size: number) => {
  pageSize.value = size
  pageNo.value = 1
  void loadList()
}
const changePage = (page: number) => {
  pageNo.value = page
  void loadList()
}
const openOrder = (no: string) => {
  if (canOrder.value) orderDetail.value?.open(no)
}
const cleanup = () => {
  active = false
  ++listSequence
  ++statisticsSequence
  mobile.value = ''
  applied.value = { params: {} }
}
/**
 * AppView以fullPath作为key，同matched路由的query/hash/params变化也会卸载页面。
 * 未知意图必须同时保护leave和update；拒绝导航时不能清理原正文与操作号。
 * 设计：docs/superpowers/specs/2026-09-30-direct-recharge-mobile-spu-frequency-design.md#8-前端监控页面
 */
const preventPendingNavigation = () => {
  if (actions.value?.hasPending) {
    ElMessage.warning('操作结果尚未确定，请先在弹窗使用原操作号重试并核实结果。')
    return false
  }
}
onBeforeRouteUpdate(preventPendingNavigation)
onBeforeRouteLeave(() => {
  if (preventPendingNavigation() === false) return false
  cleanup()
})
const beforeUnload = (event: BeforeUnloadEvent) => {
  if (actions.value?.hasPending) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload)
  cleanup()
})
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload)
  refresh()
})
</script>
