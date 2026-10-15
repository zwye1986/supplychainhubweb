<template>
  <ContentWrap>
    <el-tabs v-model="queryParams.bizType" class="mb-12px" @tab-change="handleTabChange">
      <el-tab-pane
        v-for="item in ORDER_TAB_OPTIONS"
        :key="item.value || 'ALL'"
        :label="item.label"
        :name="item.value"
      />
    </el-tabs>
    <el-form
      ref="queryFormRef"
      class="-mb-15px search-form"
      :model="queryParams"
      :inline="true"
      label-width="160px"
    >
      <el-form-item label="供应商名称" prop="supplierName">
        <el-select
          v-model="queryParams.supplierName"
          clearable
          filterable
          placeholder="请选择供应商"
        >
          <el-option
            v-for="item in supplierCodeOptions"
            :key="item.supplierCode"
            :label="item.supplierName"
            :value="item.supplierName"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="订单编号" prop="orderNo">
        <el-input
          v-model="queryParams.orderNo"
          maxlength="64"
          placeholder="供应商订单编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="商品名称" prop="productName">
        <el-input
          v-model="queryParams.productName"
          maxlength="100"
          placeholder="商品名称或SPU"
          clearable
        />
      </el-form-item>
      <el-form-item label="下单时间">
        <el-date-picker
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          v-model="createRange"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          clearable
        />
      </el-form-item>
      <el-form-item label="供货模式" prop="supplyMode">
        <el-select v-model="queryParams.supplyMode" clearable placeholder="请选择供货模式">
          <el-option
            v-for="item in SUPPLY_MODE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="订单类型" prop="bizType">
        <el-select
          v-model="queryParams.bizType"
          clearable
          placeholder="请选择订单类型"
          @change="handleQuery"
        >
          <el-option
            v-for="item in ORDER_BIZ_TYPE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="订单状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="请选择订单状态">
          <el-option
            v-for="item in SUPPLIER_STATUS_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"> <Icon icon="ep:search" class="mr-5px" /> 搜索 </el-button>
        <el-button @click="resetQuery"> <Icon icon="ep:refresh" class="mr-5px" /> 重置 </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <div v-loading="loading" class="order-card-list">
      <div class="order-card-list__scroll">
        <div class="order-card-list__inner" :style="{ minWidth: tableMinWidth }">
          <el-table :data="[]" class="order-header-table">
            <el-table-column label="供应商名称" min-width="140" />
            <el-table-column label="商品信息" min-width="240" />
            <el-table-column label="供货模式" min-width="110">
              <template #header>
                <div>供货模式</div>
                <div class="product-sub">当前合作商品配置</div>
              </template>
            </el-table-column>
            <el-table-column label="供货数量" min-width="90" />
            <el-table-column label="供货价结算" min-width="130" />
            <el-table-column label="订单类型" min-width="110" />
            <el-table-column label="订单状态" min-width="100" />
            <el-table-column label="操作" min-width="140" fixed="right" />
          </el-table>

          <el-empty v-if="!loading && !list.length" description="暂无订单" />

          <div v-for="row in list" :key="row.orderNo" class="order-card">
            <div class="order-card__meta">
              <span>供应商订单编号 {{ row.supplierOrderNo || row.orderNo }}</span>
              <span class="sep">|</span>
              <span class="meta-inline">
                关联平台订单
                <el-button
                  v-if="row.relatedPlatformOrderNo"
                  link
                  type="primary"
                  class="meta-link"
                  @click="openPlatformDetail(row.relatedPlatformOrderNo)"
                >
                  {{ row.relatedPlatformOrderNo }}
                </el-button>
                <span v-else>-</span>
              </span>
              <span class="sep">|</span>
              <span>下单时间 {{ row.createTime || '-' }}</span>
            </div>
            <el-table :data="orderItemList(row)" :show-header="false" class="order-body-table">
              <el-table-column label="供应商名称" min-width="140">
                <template #default="{ row: item }">
                  {{ item.supplierName || row.supplierName || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="商品信息" min-width="240">
                <template #default="{ row: item }">
                  <div class="product-cell">
                    <el-image
                      v-if="item.picUrl"
                      :src="item.picUrl"
                      class="product-thumb"
                      fit="cover"
                    >
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
                      <div v-if="item.skuCode" class="product-sub">{{ item.skuCode }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="供货模式" min-width="110">
                <template #default>{{
                  getOptionLabel(SUPPLY_MODE_OPTIONS, row.supplyMode)
                }}</template>
              </el-table-column>
              <el-table-column label="供货数量" min-width="90">
                <template #default="{ row: item }">{{ item.qty ?? '-' }}</template>
              </el-table-column>
              <el-table-column label="供货价结算" min-width="130">
                <template #default="{ row: item }">
                  <div>{{ formatAmount(item.supplyPrice) }}</div>
                  <div class="product-sub">{{ formatAmount(item.supplyPrice) }}×{{ item.qty }}</div>
                </template>
              </el-table-column>
              <el-table-column label="订单类型" min-width="110">
                <template #default="{ row: item }">
                  {{ getOptionLabel(ORDER_BIZ_TYPE_OPTIONS, item.orderType || row.bizType) }}
                </template>
              </el-table-column>
              <el-table-column label="订单状态" min-width="100">
                <template #default>
                  <span
                    class="status-pill"
                    :class="`status-pill--${supplierStatusTone(row.status)}`"
                  >
                    {{ supplierStatusText(row.status) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="140" fixed="right">
                <template #default>
                  <div class="action-links">
                    <el-button
                      link
                      type="primary"
                      @click="openSupplierDetail(row.supplierOrderNo || row.orderNo)"
                    >
                      详情
                    </el-button>
                    <el-tooltip
                      v-if="canSupplierRefund(row.status)"
                      content="本期暂不考虑退款"
                      placement="top"
                    >
                      <span class="inline-flex">
                        <el-button link type="primary" disabled>退款</el-button>
                      </span>
                    </el-tooltip>
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
</template>

<script lang="ts" setup>
import { OrderApi, OrderVO } from '@/api/order'
import { SupplierApi } from '@/api/supplier/manage'
import OrderPlatformDetail from '../platform/detail/index.vue'
import OrderSupplierDetail from './detail/index.vue'
import {
  FULFILLMENT_STATUS_OPTIONS,
  ORDER_BIZ_TYPE_OPTIONS,
  ORDER_TAB_OPTIONS,
  SUPPLIER_STATUS_OPTIONS,
  SUPPLY_MODE_OPTIONS,
  canSupplierRefund,
  formatAmount,
  getOptionLabel,
  getOptionType
} from '@/views/supplier/order/utils/constants'

defineOptions({ name: 'OrderSupplier' })

const tableMinWidth = '1060px'
const loading = ref(false)
const list = ref<OrderVO[]>([])
const total = ref(0)
const queryFormRef = ref()
const platformDetailRef = ref()
const supplierDetailRef = ref()
const supplierOptions = ref<{ supplierCode?: string; supplierName?: string }[]>([])
const supplierCodeOptions = computed(() =>
  supplierOptions.value.filter((item) => item.supplierCode)
)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  bizType: '' as any,
  orderNo: undefined as string | undefined,
  productName: undefined as string | undefined,
  supplierName: undefined as string | undefined,
  status: undefined as string | undefined,
  supplyMode: undefined as string | undefined,
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

const supplierStatusText = (status?: string) => {
  const prd = getOptionLabel(SUPPLIER_STATUS_OPTIONS, status)
  if (prd !== '-') return prd
  return getOptionLabel(FULFILLMENT_STATUS_OPTIONS, status)
}

const supplierStatusTone = (status?: string) => {
  const type = SUPPLIER_STATUS_OPTIONS.some((item) => item.value === status)
    ? getOptionType(SUPPLIER_STATUS_OPTIONS, status)
    : getOptionType(FULFILLMENT_STATUS_OPTIONS, status)
  if (type === 'success') return 'success'
  if (type === 'danger') return 'failed'
  return 'processing'
}

const toFulfillmentStatus = (status?: string) => {
  if (status === 'FAILED') return 'FAILED'
  if (status === 'FINISHED') return 'SUCCEEDED'
  return undefined
}

const loadFilterOptions = async () => {
  try {
    const data = await SupplierApi.getSupplierNameList({ view: 'simple' })
    supplierOptions.value = (Array.isArray(data) ? data : data?.list || [])
      .map(
        (item: { supplierCode?: string; code?: string; supplierName?: string; name?: string }) => ({
          supplierCode: item.supplierCode || item.code,
          supplierName: item.supplierName || item.name
        })
      )
      .filter((item: { supplierName?: string }) => item.supplierName)
  } catch {
    supplierOptions.value = []
  }
}

const getList = async () => {
  loading.value = true
  try {
    const data = await OrderApi.getSupplierOrderPage({
      pageNo: queryParams.pageNo,
      pageSize: queryParams.pageSize,
      bOrderNo: queryParams.orderNo,
      supplierCode: supplierCodeOptions.value.find(
        (item) => item.supplierName === queryParams.supplierName
      )?.supplierCode,
      fulfillmentStatus: toFulfillmentStatus(queryParams.status),
      createdFrom: queryParams.createFrom,
      createdTo: queryParams.createTo
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
  handleQuery()
}

const resetQuery = () => {
  queryFormRef.value?.resetFields()
  queryParams.bizType = ''
  queryParams.supplierName = undefined
  queryParams.status = undefined
  queryParams.supplyMode = undefined
  queryParams.createFrom = undefined
  queryParams.createTo = undefined
  handleQuery()
}

const openPlatformDetail = (orderNo: string) => platformDetailRef.value.open(orderNo)
const openSupplierDetail = (orderNo: string) => supplierDetailRef.value.open(orderNo)

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
