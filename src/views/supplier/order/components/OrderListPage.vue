<template>
  <ContentWrap>
    <el-tabs v-model="queryParams.bizType" class="mb-12px" @tab-change="handleTabChange">
      <el-tab-pane v-for="item in ORDER_TAB_OPTIONS" :key="item.value || 'ALL'" :label="item.label" :name="item.value" />
    </el-tabs>
    <el-form ref="queryFormRef" class="-mb-15px search-form" :model="queryParams" :inline="true" label-width="160px">
      <template v-if="isPlatform">
        <el-form-item label="订单编号" prop="orderNo">
          <el-input v-model="queryParams.orderNo" maxlength="64" placeholder="请输入订单编号" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="商品名称" prop="productName">
          <el-input v-model="queryParams.productName" maxlength="100" placeholder="商品名称或SPU" clearable />
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker v-model="createRange" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss" start-placeholder="开始时间" end-placeholder="结束时间" clearable />
        </el-form-item>
        <el-form-item label="分销商名称" prop="distributorNames">
          <el-select v-model="queryParams.distributorNames" multiple collapse-tags clearable filterable>
            <el-option v-for="item in distributorOptions" :key="item.code || item.name" :label="item.name" :value="item.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商名称" prop="supplierNames">
          <el-select v-model="queryParams.supplierNames" multiple collapse-tags clearable filterable>
            <el-option v-for="item in supplierOptions" :key="item.supplierCode || item.supplierName" :label="item.supplierName" :value="item.supplierName" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单类型" prop="bizTypes">
          <el-select v-model="queryParams.bizTypes" multiple collapse-tags clearable @change="handleBizTypesChange">
            <el-option v-for="item in ORDER_BIZ_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态" prop="statuses">
          <el-select v-model="queryParams.statuses" multiple collapse-tags clearable>
            <el-option v-for="item in PLATFORM_STATUS_FILTER_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单人姓名或手机号" prop="buyerKeyword">
          <el-input v-model="queryParams.buyerKeyword" maxlength="50" placeholder="姓名或手机号" clearable />
        </el-form-item>
      </template>
      <template v-else>
        <el-form-item label="供应商名称" prop="supplierName">
          <el-select v-model="queryParams.supplierName" clearable filterable placeholder="请选择供应商">
            <el-option v-for="item in supplierCodeOptions" :key="item.supplierCode" :label="item.supplierName" :value="item.supplierName" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单编号" prop="orderNo">
          <el-input v-model="queryParams.orderNo" maxlength="64" placeholder="供应商订单编号" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="商品名称" prop="productName">
          <el-input v-model="queryParams.productName" maxlength="100" placeholder="商品名称或SPU" clearable />
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker v-model="createRange" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss" start-placeholder="开始时间" end-placeholder="结束时间" clearable />
        </el-form-item>
        <el-form-item label="供货模式" prop="supplyMode">
          <el-select v-model="queryParams.supplyMode" clearable placeholder="请选择供货模式">
            <el-option v-for="item in SUPPLY_MODE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单类型" prop="bizType">
          <el-select v-model="queryParams.bizType" clearable placeholder="请选择订单类型" @change="handleQuery">
            <el-option v-for="item in ORDER_BIZ_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态" prop="status">
          <el-select v-model="queryParams.status" clearable placeholder="请选择订单状态">
            <el-option v-for="item in SUPPLIER_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </template>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" /> 搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" /> 重置
        </el-button>
        <el-button v-if="isPlatform" type="success" plain :loading="exportLoading" @click="handleExport">
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap>
    <el-table v-loading="loading" :data="list" row-key="orderNo" :expand-row-keys="expandRowKeys" class="order-list-table" row-class-name="order-summary-row">
      <el-table-column type="expand">
        <template #default="{ row }">
          <el-table v-if="isPlatform" :data="row.items" size="small" class="m-12px">
            <el-table-column label="商品详情" min-width="220">
              <template #default="{ row: item }">
                <div class="flex items-center gap-8px">
                  <el-image v-if="item.picUrl" :src="item.picUrl" class="h-40px w-40px rounded" fit="cover" />
                  <div class="min-w-0">
                    <div class="truncate">{{ item.name }}</div>
                    <div class="text-12px text-gray-500">{{ item.spec || item.skuCode }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="销售价（元）" min-width="110">
              <template #default="{ row: item }">{{ formatMoney(item.salePrice) }}</template>
            </el-table-column>
            <el-table-column label="商品数量" prop="qty" min-width="90" />
            <el-table-column label="供应商订单编号" min-width="160">
              <template #default>{{ formatSupplierOrderNos(row) }}</template>
            </el-table-column>
            <el-table-column label="分销商订单编号" min-width="160">
              <template #default>{{ row.distributorOrderNo || '-' }}</template>
            </el-table-column>
            <el-table-column label="分销商名称" min-width="140">
              <template #default>{{ row.distributorName || '-' }}</template>
            </el-table-column>
            <el-table-column label="项目名称" min-width="160">
              <template #default>{{ row.projectName || '-' }}</template>
            </el-table-column>
            <el-table-column label="供应商名称" min-width="140">
              <template #default="{ row: item }">{{ item.supplierName || row.supplierName || '-' }}</template>
            </el-table-column>
            <el-table-column label="订单类型" min-width="110">
              <template #default="{ row: item }">{{ getOptionLabel(ORDER_BIZ_TYPE_OPTIONS, item.orderType) }}</template>
            </el-table-column>
            <el-table-column label="订单状态" min-width="100">
              <template #default>
                <el-tag :type="getOptionType(ORDER_STATUS_OPTIONS, row.status)" size="small">
                  {{ getOptionLabel(ORDER_STATUS_OPTIONS, row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="下单人" min-width="140">
              <template #default>{{ formatBuyer(row) }}</template>
            </el-table-column>
            <el-table-column label="下单人手机号" min-width="130">
              <template #default>{{ row.buyerMobile || '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" min-width="220">
              <template #default>
                <el-button link type="primary" @click="openPlatformDetail(row.orderNo)">详情</el-button>
                <el-tooltip v-if="canResend(row.status)" content="本期暂不考虑一键补发" placement="top">
                  <span class="inline-flex">
                    <el-button link type="warning" disabled>一键补发</el-button>
                  </span>
                </el-tooltip>
                <el-tooltip v-if="canRefund(row.status)" content="本期暂不考虑退款" placement="top">
                  <span class="inline-flex">
                    <el-button link type="danger" disabled>退款</el-button>
                  </span>
                </el-tooltip>
                <el-button v-if="canRouteRecord(row.status)" link type="primary" @click="openRouteRecord(row.orderNo)">
                  路由记录
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-table v-else :data="row.items" size="small" class="m-12px">
            <el-table-column label="供应商名称" min-width="140">
              <template #default="{ row: item }">{{ item.supplierName || row.supplierName || '-' }}</template>
            </el-table-column>
            <el-table-column label="商品信息" min-width="240">
              <template #default="{ row: item }">
                <div class="flex items-center gap-8px">
                  <el-image v-if="item.picUrl" :src="item.picUrl" class="h-40px w-40px rounded" fit="cover" />
                  <div class="min-w-0">
                    <div class="truncate">{{ item.name }}</div>
                    <div class="text-12px text-gray-500">{{ item.skuCode }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="供货模式" min-width="110">
              <template #default>{{ getOptionLabel(SUPPLY_MODE_OPTIONS, row.supplyMode) }}</template>
            </el-table-column>
            <el-table-column label="供货数量" prop="qty" min-width="90" />
            <el-table-column label="供货价结算" min-width="130">
              <template #default="{ row: item }">
                <div>{{ formatAmount(item.supplyPrice) }}</div>
                <div class="text-12px text-gray-500">{{ formatAmount(item.supplyPrice) }}×{{ item.qty }}</div>
              </template>
            </el-table-column>
            <el-table-column label="订单类型" min-width="110">
              <template #default="{ row: item }">{{ getOptionLabel(ORDER_BIZ_TYPE_OPTIONS, item.orderType) }}</template>
            </el-table-column>
            <el-table-column label="订单状态" min-width="100">
              <template #default>
                <el-tag :type="supplierStatusType(row.status)" size="small">
                  {{ supplierStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="140">
              <template #default>
                <el-button link type="primary" @click="openSupplierDetail(row.supplierOrderNo || row.orderNo)">详情</el-button>
                <el-tooltip v-if="canSupplierRefund(row.status)" content="本期暂不考虑退款" placement="top">
                  <span class="inline-flex">
                    <el-button link type="danger" disabled>退款</el-button>
                  </span>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>
      <template v-if="isPlatform">
        <el-table-column label="订单编号" prop="orderNo" min-width="170" />
        <el-table-column label="下单时间" prop="createTime" min-width="170" />
        <el-table-column label="商品总数" prop="qty" min-width="90" />
        <el-table-column label="订单总价" min-width="110">
          <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
        </el-table-column>
      </template>
      <template v-else>
        <el-table-column label="供应商订单编号" min-width="170">
          <template #default="{ row }">{{ row.supplierOrderNo || row.orderNo }}</template>
        </el-table-column>
        <el-table-column label="关联平台订单" min-width="170">
          <template #default="{ row }">
            <el-button v-if="row.relatedPlatformOrderNo" link type="primary" @click="openPlatformDetail(row.relatedPlatformOrderNo)">
              {{ row.relatedPlatformOrderNo }}
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" prop="createTime" min-width="170" />
      </template>
    </el-table>
    <Pagination v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
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
  import OrderPlatformDetail from '../platform/detail/index.vue'
  import OrderSupplierDetail from '../supplier/detail/index.vue'
  import RouteRecordDialog from './RouteRecordDialog.vue'
  import {
    FULFILLMENT_STATUS_OPTIONS,
    ORDER_BIZ_TYPE_OPTIONS,
    ORDER_STATUS_OPTIONS,
    ORDER_TAB_OPTIONS,
    PLATFORM_STATUS_FILTER_OPTIONS,
    SUPPLIER_STATUS_OPTIONS,
    SUPPLY_MODE_OPTIONS,
    canRefund,
    canResend,
    canRouteRecord,
    canSupplierRefund,
    formatAmount,
    formatMoney,
    getOptionLabel,
    getOptionType
  } from '@/views/supplier/order/utils/constants'

  defineOptions({ name: 'OrderListPage' })

  const props = defineProps({
    source: { type: String as PropType<'PLATFORM' | 'SUPPLIER'>, default: 'PLATFORM' }
  })

  const isPlatform = computed(() => props.source === 'PLATFORM')
  const message = useMessage()
  const loading = ref(false)
  const exportLoading = ref(false)
  const list = ref<any[]>([])
  const expandRowKeys = ref<string[]>([])
  const total = ref(0)
  const queryFormRef = ref()
  const platformDetailRef = ref()
  const supplierDetailRef = ref()
  const routeRecordRef = ref()
  const supplierOptions = ref<{ supplierCode?: string; supplierName?: string }[]>([])
  const distributorOptions = ref<{ code?: string; name: string }[]>([])
  const supplierCodeOptions = computed(() =>
    supplierOptions.value.filter((item) => item.supplierCode)
  )
  const queryParams = reactive({
    pageNo: 1,
    pageSize: 20,
    bizType: '' as any,
    bizTypes: [] as any[],
    orderNo: undefined as string | undefined,
    productName: undefined as string | undefined,
    distributorNames: [] as string[],
    supplierNames: [] as string[],
    supplierName: undefined as string | undefined,
    statuses: [] as any[],
    status: undefined as string | undefined,
    buyerKeyword: undefined as string | undefined,
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

  const supplierStatusText = (status?: string) => {
    const prd = getOptionLabel(SUPPLIER_STATUS_OPTIONS, status)
    if (prd !== '-') return prd
    return getOptionLabel(FULFILLMENT_STATUS_OPTIONS, status)
  }

  const supplierStatusType = (status?: string) => {
    if (SUPPLIER_STATUS_OPTIONS.some((item) => item.value === status))
      return getOptionType(SUPPLIER_STATUS_OPTIONS, status)
    return getOptionType(FULFILLMENT_STATUS_OPTIONS, status)
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
    if (!isPlatform.value) return
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
      if (isPlatform.value) {
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
        await nextTick()
        expandRowKeys.value = list.value.map((item) => item.orderNo)
        return
      }
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
      await nextTick()
      expandRowKeys.value = list.value.map((item) => item.orderNo)
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

  const syncTabByTypes = (val: any) => {
    const values = Array.isArray(val) ? val : val ? [val] : []
    queryParams.bizTypes = values
    queryParams.bizType = values.length === 1 ? values[0] : ''
  }

  const handleBizTypesChange = (val: any) => {
    syncTabByTypes(val)
    handleQuery()
  }

  const resetQuery = () => {
    queryFormRef.value?.resetFields()
    queryParams.bizType = ''
    queryParams.bizTypes = []
    queryParams.supplierName = undefined
    queryParams.status = undefined
    queryParams.supplyMode = undefined
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
  .order-list-table {
    :deep(.order-summary-row > td.el-table__cell) {
      background-color: var(--el-fill-color-light);
    }

    :deep(.el-table__body tr.order-summary-row:hover > td.el-table__cell) {
      background-color: var(--el-fill-color);
    }
  }
</style>
