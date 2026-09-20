<template>
  <ContentWrap>
    <el-tabs v-if="showTabs" v-model="queryParams.bizType" class="mb-12px" @tab-change="handleQuery">
      <el-tab-pane v-for="item in ORDER_TAB_OPTIONS" :key="item.value || 'ALL'" :label="item.label" :name="item.value" />
    </el-tabs>
    <el-form
      ref="queryFormRef"
      class="-mb-15px search-form"
      :model="queryParams"
      :inline="true"
      label-width="110px"
    >
      <el-form-item label="订单编号" prop="orderNo">
        <el-input v-model="queryParams.orderNo" maxlength="64" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="商品名称" prop="productName">
        <el-input v-model="queryParams.productName" maxlength="100" clearable />
      </el-form-item>
      <el-form-item label="下单时间">
        <el-date-picker
          v-model="createRange"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
        />
      </el-form-item>
      <el-form-item label="分销商名称" prop="distributorNames">
        <el-select v-model="queryParams.distributorNames" multiple collapse-tags clearable filterable>
          <el-option v-for="item in MOCK_DISTRIBUTORS" :key="item.code" :label="item.name" :value="item.name" />
        </el-select>
      </el-form-item>
      <el-form-item label="供应商名称" prop="supplierNames">
        <el-select v-model="queryParams.supplierNames" multiple collapse-tags clearable filterable>
          <el-option v-for="item in MOCK_SUPPLIERS" :key="item.code" :label="item.name" :value="item.name" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="!showTabs" label="订单类型" prop="bizTypes">
        <el-select v-model="queryParams.bizTypes" multiple collapse-tags clearable>
          <el-option v-for="item in ORDER_BIZ_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="success" plain @click="handleExport"><Icon icon="ep:download" class="mr-5px" /> 导出</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap>
    <el-table v-loading="loading" :data="list" row-key="orderNo">
      <el-table-column type="expand">
        <template #default="{ row }">
          <el-table :data="row.items" size="small" class="m-12px">
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
              <template #default>{{ row.supplierOrderNo || '-' }}</template>
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
          </el-table>
        </template>
      </el-table-column>
      <el-table-column label="订单编号" prop="orderNo" min-width="170" />
      <el-table-column label="下单时间" prop="createTime" min-width="170" />
      <el-table-column label="商品总数" prop="qty" min-width="90" />
      <el-table-column label="订单总价" min-width="110">
        <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
      </el-table-column>
      <el-table-column label="订单状态" min-width="100">
        <template #default="{ row }">
          <el-tag :type="getOptionType(ORDER_STATUS_OPTIONS, row.status)" size="small">
            {{ getOptionLabel(ORDER_STATUS_OPTIONS, row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.orderNo)">详情</el-button>
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
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>
  <OrderDetail ref="detailRef" />
</template>

<script lang="ts" setup>
import { OrderApi, OrderVO } from '@/api/order'
import OrderDetail from '../platform/detail/index.vue'
import {
  MOCK_DISTRIBUTORS,
  MOCK_SUPPLIERS,
  ORDER_BIZ_TYPE_OPTIONS,
  ORDER_STATUS_OPTIONS,
  ORDER_TAB_OPTIONS,
  canRefund,
  canResend,
  formatMoney,
  getOptionLabel,
  getOptionType
} from '@/views/supplier/order/utils/constants'

defineOptions({ name: 'OrderListPage' })

const props = defineProps({
  source: { type: String as PropType<'PLATFORM' | 'SUPPLIER'>, default: 'PLATFORM' },
  showTabs: { type: Boolean, default: true }
})

const message = useMessage()
const loading = ref(false)
const list = ref<OrderVO[]>([])
const total = ref(0)
const queryFormRef = ref()
const detailRef = ref()
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  bizType: '' as any,
  bizTypes: [] as any[],
  orderNo: undefined as string | undefined,
  productName: undefined as string | undefined,
  distributorNames: [] as string[],
  supplierNames: [] as string[],
  createFrom: undefined as string | undefined,
  createTo: undefined as string | undefined
})
const createRange = computed<string[]>({
  get: () =>
    queryParams.createFrom && queryParams.createTo ? [queryParams.createFrom, queryParams.createTo] : [],
  set: (val) => {
    queryParams.createFrom = val?.[0]
    queryParams.createTo = val?.[1]
  }
})

const getList = async () => {
  loading.value = true
  try {
    const data = await OrderApi.getOrderPage({
      ...queryParams,
      bizType: queryParams.bizType || undefined,
      bizTypes: props.showTabs ? undefined : queryParams.bizTypes,
      source: props.source
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

const resetQuery = () => {
  queryFormRef.value?.resetFields()
  queryParams.bizType = ''
  queryParams.createFrom = undefined
  queryParams.createTo = undefined
  handleQuery()
}

const openDetail = (orderNo: string) => detailRef.value.open(orderNo)

const handleExport = async () => {
  try {
    await message.confirm('确认导出当前筛选条件下的订单数据？')
    const rows = await OrderApi.exportOrders({
      ...queryParams,
      bizType: queryParams.bizType || undefined,
      source: props.source
    })
    const header = ['订单编号', '下单时间', '商品总数', '订单总价', '订单状态', '分销商', '供应商']
    const body = (rows as OrderVO[]).map((item) =>
      [
        item.orderNo,
        item.createTime || '',
        item.qty,
        item.amount,
        getOptionLabel(ORDER_STATUS_OPTIONS, item.status),
        item.distributorName || '',
        item.supplierName || ''
      ].join(',')
    )
    const blob = new Blob(['\uFEFF' + [header.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `orders-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
    message.success('导出成功')
  } catch {}
}

onMounted(getList)
</script>
