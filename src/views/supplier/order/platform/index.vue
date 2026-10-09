<template>
  <ContentWrap>
    <el-tabs v-model="queryParams.bizType" class="mb-12px" @tab-change="handleTabChange">
      <el-tab-pane v-for="item in ORDER_TAB_OPTIONS" :key="item.value || 'ALL'" :label="item.label" :name="item.value" />
    </el-tabs>
    <el-form ref="queryFormRef" class="-mb-15px search-form" :model="queryParams" :inline="true" label-width="160px">
      <el-form-item label="订单编号" prop="orderNo">
        <el-input
          v-model="queryParams.orderNo"
          maxlength="64"
          placeholder="请输入订单编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="商品名称" prop="productName">
        <el-input v-model="queryParams.productName" maxlength="100" placeholder="商品名称或SPU" clearable />
      </el-form-item>
      <el-form-item label="下单时间">
        <el-date-picker
          v-model="createRange"
          type="datetimerange"
          value-format="YYYY-MM-DDTHH:mm:ss"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          clearable
        />
      </el-form-item>
      <el-form-item label="分销商名称" prop="distributorNames">
        <el-select v-model="queryParams.distributorNames" multiple collapse-tags clearable filterable>
          <el-option
            v-for="item in distributorOptions"
            :key="item.code || item.name"
            :label="item.name"
            :value="item.name"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="供应商名称" prop="supplierNames">
        <el-select v-model="queryParams.supplierNames" multiple collapse-tags clearable filterable>
          <el-option
            v-for="item in supplierOptions"
            :key="item.supplierCode || item.supplierName"
            :label="item.supplierName"
            :value="item.supplierName"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="订单类型" prop="bizTypes">
        <el-select v-model="queryParams.bizTypes" multiple collapse-tags clearable @change="handleBizTypesChange">
          <el-option
            v-for="item in ORDER_BIZ_TYPE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="订单状态" prop="statuses">
        <el-select v-model="queryParams.statuses" multiple collapse-tags clearable>
          <el-option
            v-for="item in PLATFORM_STATUS_FILTER_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="下单人姓名或手机号" prop="buyerKeyword">
        <el-input v-model="queryParams.buyerKeyword" maxlength="50" placeholder="姓名或手机号" clearable />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" /> 搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" /> 重置
        </el-button>
        <el-button type="success" plain :loading="exportLoading" @click="handleExport">
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <div v-loading="loading" class="order-card-list">
      <div class="order-card-list__scroll">
        <div class="order-card-list__inner" :style="{ minWidth: tableMinWidth }">
          <el-table :data="[]" class="order-header-table">
            <el-table-column label="商品详情" min-width="220" />
            <el-table-column label="销售价(元)" min-width="100" />
            <el-table-column label="商品数量" min-width="90" />
            <el-table-column label="供应商订单编号" min-width="150" />
            <el-table-column label="分销商订单编号" min-width="150" />
            <el-table-column label="分销商名称" min-width="120" />
            <el-table-column label="项目名称" min-width="140" />
            <el-table-column label="供应商名称" min-width="120" />
            <el-table-column label="订单类型" min-width="100" />
            <el-table-column label="订单状态" min-width="90" />
            <el-table-column label="下单人" min-width="130" />
            <el-table-column label="下单人手机号" min-width="120" />
            <el-table-column label="操作" min-width="200" fixed="right" />
          </el-table>

          <el-empty v-if="!loading && !list.length" description="暂无订单" />

          <div v-for="row in list" :key="row.orderNo" class="order-card">
            <div class="order-card__meta">
              <span>订单编号 {{ row.orderNo }}</span>
              <span class="sep">|</span>
              <span>下单时间 {{ row.createTime || '-' }}</span>
              <span class="sep">|</span>
              <span>共{{ row.qty ?? orderItemList(row).length }}件商品</span>
              <span class="sep">|</span>
              <span>订单总价: {{ formatMoney(row.amount) }}</span>
            </div>
            <el-table :data="orderItemList(row)" :show-header="false" class="order-body-table">
              <el-table-column label="商品详情" min-width="220">
                <template #default="{ row: item }">
                  <div class="product-cell">
                    <el-image v-if="item.picUrl" :src="item.picUrl" class="product-thumb" fit="cover">
                      <template #error>
                        <div class="product-thumb product-thumb--placeholder">
                          <Icon icon="ep:picture" />
                        </div>
                      </template>
                    </el-image>
                    <div v-else class="product-thumb product-thumb--placeholder">
                      <Icon icon="ep:picture" />
                    </div>
                    <div class="product-info">
                      <div class="product-name" :title="item.name">{{ item.name || '-' }}</div>
                      <div v-if="item.spec || item.skuCode" class="product-sub">
                        {{ item.spec || item.skuCode }}
                      </div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="销售价(元)" min-width="100">
                <template #default="{ row: item }">{{ formatAmount(item.salePrice) }}</template>
              </el-table-column>
              <el-table-column label="商品数量" min-width="90">
                <template #default="{ row: item }">{{ item.qty ?? '-' }}</template>
              </el-table-column>
              <el-table-column label="供应商订单编号" min-width="150">
                <template #default>{{ formatSupplierOrderNos(row) }}</template>
              </el-table-column>
              <el-table-column label="分销商订单编号" min-width="150">
                <template #default>{{ row.distributorOrderNo || '-' }}</template>
              </el-table-column>
              <el-table-column label="分销商名称" min-width="120">
                <template #default>{{ row.distributorName || '-' }}</template>
              </el-table-column>
              <el-table-column label="项目名称" min-width="140">
                <template #default>{{ row.projectName || '-' }}</template>
              </el-table-column>
              <el-table-column label="供应商名称" min-width="120">
                <template #default="{ row: item }">
                  {{ item.supplierName || row.supplierName || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="订单类型" min-width="100">
                <template #default="{ row: item }">
                  {{ getOptionLabel(ORDER_BIZ_TYPE_OPTIONS, item.orderType || row.bizType) }}
                </template>
              </el-table-column>
              <el-table-column label="订单状态" min-width="90">
                <template #default>
                  <span class="status-pill" :class="`status-pill--${platformStatusTone(row.status)}`">
                    {{ getOptionLabel(ORDER_STATUS_OPTIONS, row.status) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="下单人" min-width="130">
                <template #default>{{ formatBuyer(row) }}</template>
              </el-table-column>
              <el-table-column label="下单人手机号" min-width="120">
                <template #default>{{ row.buyerMobile || '-' }}</template>
              </el-table-column>
              <el-table-column label="操作" min-width="200" fixed="right">
                <template #default>
                  <div class="action-links">
                    <el-button link type="primary" @click="openPlatformDetail(row.orderNo)">详情</el-button>
                    <el-tooltip v-if="canResend(row.status)" content="本期暂不考虑一键补发" placement="top">
                      <span class="inline-flex">
                        <el-button link type="primary" disabled>一键补发</el-button>
                      </span>
                    </el-tooltip>
                    <el-tooltip v-if="canRefund(row.status)" content="本期暂不考虑退款" placement="top">
                      <span class="inline-flex">
                        <el-button link type="primary" disabled>退款</el-button>
                      </span>
                    </el-tooltip>
                    <el-button
                      v-if="canRouteRecord(row.status)"
                      link
                      type="primary"
                      @click="openRouteRecord(row.orderNo)"
                    >
                      路由记录
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <OrderPlatformDetail ref="platformDetailRef" @open-supplier="openSupplierDetail" />
  <OrderSupplierDetail ref="supplierDetailRef" @open-platform="openPlatformDetail" />
  <RouteRecordDialog ref="routeRecordRef" />
</template>

<script lang="ts" setup>
import { OrderApi, OrderVO } from '@/api/order'
import { DistributorApi } from '@/api/supplier/distribution'
import { SupplierApi } from '@/api/supplier/manage'
import download from '@/utils/download'
import OrderPlatformDetail from './detail/index.vue'
import OrderSupplierDetail from '../supplier/detail/index.vue'
import RouteRecordDialog from '../components/RouteRecordDialog.vue'
import {
  ORDER_BIZ_TYPE_OPTIONS,
  ORDER_STATUS_OPTIONS,
  ORDER_TAB_OPTIONS,
  PLATFORM_STATUS_FILTER_OPTIONS,
  canRefund,
  canResend,
  canRouteRecord,
  formatAmount,
  formatMoney,
  getOptionLabel
} from '@/views/supplier/order/utils/constants'

defineOptions({ name: 'OrderPlatform' })

const tableMinWidth = '1730px'
const message = useMessage()
const loading = ref(false)
const exportLoading = ref(false)
const list = ref<OrderVO[]>([])
const total = ref(0)
const queryFormRef = ref()
const platformDetailRef = ref()
const supplierDetailRef = ref()
const routeRecordRef = ref()
const supplierOptions = ref<{ supplierCode?: string; supplierName?: string }[]>([])
const distributorOptions = ref<{ code?: string; name: string }[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  bizType: '' as any,
  bizTypes: [] as any[],
  orderNo: undefined as string | undefined,
  productName: undefined as string | undefined,
  distributorNames: [] as string[],
  supplierNames: [] as string[],
  statuses: [] as any[],
  buyerKeyword: undefined as string | undefined,
  createFrom: undefined as string | undefined,
  createTo: undefined as string | undefined
})
const createRange = computed<string[]>({
  get: () =>
    queryParams.createFrom && queryParams.createTo
      ? [queryParams.createFrom, queryParams.createTo]
      : [],
  set: (val) => {
    queryParams.createFrom = val?.[0]
    queryParams.createTo = val?.[1]
  }
})

const orderItemList = (row: OrderVO) => {
  if (row.items?.length) return row.items
  return [{} as NonNullable<OrderVO['items']>[number]]
}

const formatBuyer = (row: OrderVO) => {
  if (!row.buyerId && !row.buyerName) return '-'
  if (row.buyerId && row.buyerName) return `${row.buyerId}-${row.buyerName}`
  return row.buyerName || row.buyerId || '-'
}

const formatSupplierOrderNos = (row: OrderVO) => {
  const nos = (row.supplierOrders || []).map((item) => item.supplierOrderNo).filter(Boolean)
  if (nos.length) return nos.join('、')
  return row.supplierOrderNo || '-'
}

const platformStatusTone = (status?: string) => {
  if (status === 'SUCCESS') return 'success'
  if (status === 'PROCESSING' || status === 'WAIT_PAY') return 'processing'
  if (status === 'FAILED' || status === 'CLOSED') return 'failed'
  return 'processing'
}

const loadFilterOptions = async () => {
  try {
    const data = await SupplierApi.getSupplierNameList({ view: 'simple' })
    supplierOptions.value = (Array.isArray(data) ? data : data?.list || [])
      .map((item: { supplierCode?: string; code?: string; supplierName?: string; name?: string }) => ({
        supplierCode: item.supplierCode || item.code,
        supplierName: item.supplierName || item.name
      }))
      .filter((item: { supplierName?: string }) => item.supplierName)
  } catch {
    supplierOptions.value = []
  }
  try {
    const rows = (await DistributorApi.getDistributorNameList()) || []
    distributorOptions.value = rows
      .filter((item) => item.label)
      .map((item) => ({ code: item.code, name: item.label }))
  } catch {
    distributorOptions.value = []
  }
}

const getList = async () => {
  loading.value = true
  try {
    const bizTypes = queryParams.bizType ? [queryParams.bizType] : queryParams.bizTypes
    const data = await OrderApi.getOrderPage({
      pageNo: queryParams.pageNo,
      pageSize: queryParams.pageSize,
      orderNo: queryParams.orderNo,
      productName: queryParams.productName,
      createFrom: queryParams.createFrom,
      createTo: queryParams.createTo,
      bizTypes,
      distributorNames: queryParams.distributorNames,
      supplierNames: queryParams.supplierNames,
      statuses: queryParams.statuses,
      buyerKeyword: queryParams.buyerKeyword
    })
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const handleTabChange = (name: string | number) => {
  queryParams.bizType = name as any
  queryParams.bizTypes = name ? [name] : []
  handleQuery()
}

const handleBizTypesChange = (val: any) => {
  const values = Array.isArray(val) ? val : val ? [val] : []
  queryParams.bizTypes = values
  queryParams.bizType = values.length === 1 ? values[0] : ''
  handleQuery()
}

const resetQuery = () => {
  queryFormRef.value?.resetFields()
  queryParams.bizType = ''
  queryParams.bizTypes = []
  queryParams.createFrom = undefined
  queryParams.createTo = undefined
  handleQuery()
}

const openPlatformDetail = (orderNo: string) => platformDetailRef.value.open(orderNo)
const openSupplierDetail = (orderNo: string) => supplierDetailRef.value.open(orderNo)
const openRouteRecord = (orderNo: string) => routeRecordRef.value.open(orderNo)

const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const bizTypes = queryParams.bizType ? [queryParams.bizType] : queryParams.bizTypes
    const data = await OrderApi.exportOrders({
      orderNo: queryParams.orderNo,
      productName: queryParams.productName,
      createFrom: queryParams.createFrom,
      createTo: queryParams.createTo,
      bizTypes,
      distributorNames: queryParams.distributorNames,
      supplierNames: queryParams.supplierNames,
      statuses: queryParams.statuses,
      buyerKeyword: queryParams.buyerKeyword
    })
    download.excel(data, '平台订单.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => {
  loadFilterOptions()
  getList()
})
</script>

<style scoped lang="scss">
@import '@/styles/order-card-list.scss';

.order-header-table,
.order-body-table,
.order-card {
  min-width: v-bind(tableMinWidth);
}
</style>
