<template>
  <ContentWrap>
    <el-tabs v-if="showTabs" v-model="queryParams.bizType" class="mb-12px" @tab-change="handleQuery">
      <el-tab-pane label="全部" name="" />
      <el-tab-pane v-for="item in ORDER_BIZ_TYPE_OPTIONS" :key="item.value" :label="item.label" :name="item.value" />
    </el-tabs>
    <el-form
      ref="queryFormRef"
      class="-mb-15px search-form"
      :model="queryParams"
      :inline="true"
      label-width="110px"
    >
      <el-form-item label="订单编号" prop="orderNo">
        <el-input v-model="queryParams.orderNo" maxlength="32" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="订单状态" prop="status">
        <el-select v-model="queryParams.status" clearable>
          <el-option v-for="item in ORDER_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
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
      <el-form-item label="供应商订单号" prop="supplierOrderNo">
        <el-input v-model="queryParams.supplierOrderNo" maxlength="32" clearable />
      </el-form-item>
      <el-form-item label="分销商订单号" prop="distributorOrderNo">
        <el-input v-model="queryParams.distributorOrderNo" maxlength="32" clearable />
      </el-form-item>
      <el-form-item label="供应商" prop="supplierName">
        <el-input v-model="queryParams.supplierName" clearable />
      </el-form-item>
      <el-form-item label="分销商" prop="distributorName">
        <el-input v-model="queryParams.distributorName" clearable />
      </el-form-item>
      <el-form-item label="商品名称" prop="productName">
        <el-input v-model="queryParams.productName" maxlength="100" clearable />
      </el-form-item>
      <el-form-item label="下单人信息" prop="buyerKeyword">
        <el-input v-model="queryParams.buyerKeyword" placeholder="ID/昵称/手机号" clearable />
      </el-form-item>
      <el-form-item label="收货人信息" prop="receiverKeyword">
        <el-input v-model="queryParams.receiverKeyword" placeholder="姓名/手机号" clearable />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="订单编号" prop="orderNo" min-width="160" />
      <el-table-column label="商品信息" min-width="220">
        <template #default="{ row }">
          <div class="flex items-center gap-8px">
            <el-image
              v-if="row.items?.[0]?.picUrl"
              :src="row.items[0].picUrl"
              class="h-40px w-40px rounded"
              fit="cover"
            />
            <div class="min-w-0">
              <div class="truncate">{{ row.items?.[0]?.name || '—' }}</div>
              <div class="text-12px text-gray-500">共 {{ row.qty }} 件</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="订单金额" min-width="110">
        <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
      </el-table-column>
      <el-table-column label="商品数量" prop="qty" min-width="90" />
      <el-table-column label="供应商订单编号" prop="supplierOrderNo" min-width="160" />
      <el-table-column label="分销商订单编号" prop="distributorOrderNo" min-width="160" />
      <el-table-column label="分销商" prop="distributorName" min-width="140" />
      <el-table-column label="供应商" prop="supplierName" min-width="140" />
      <el-table-column label="订单状态" min-width="100">
        <template #default="{ row }">
          <el-tag :type="getOptionType(ORDER_STATUS_OPTIONS, row.status)" size="small">
            {{ getOptionLabel(ORDER_STATUS_OPTIONS, row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="下单人" min-width="140">
        <template #default="{ row }">{{ row.buyerId }} {{ row.buyerName }}</template>
      </el-table-column>
      <el-table-column label="下单人手机号" prop="buyerMobile" min-width="120" />
      <el-table-column label="下单时间" prop="createTime" min-width="170" />
      <el-table-column label="操作" fixed="right" width="180">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.orderNo)">查看</el-button>
          <el-button v-if="row.status === 'WAIT_SHIP'" link type="primary" @click="openShip(row.orderNo)">
            发货
          </el-button>
          <el-button v-if="row.status === 'AFTER_SALE'" link type="warning" @click="goAfterSale(row.orderNo)">
            售后处理
          </el-button>
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
  <ShipForm ref="shipRef" @success="getList" />
  <OrderDetail ref="detailRef" />
</template>

<script lang="ts" setup>
import { OrderApi, OrderVO } from '@/api/order'
import ShipForm from '../components/ShipForm.vue'
import OrderDetail from '../platform/detail/index.vue'
import {
  ORDER_BIZ_TYPE_OPTIONS,
  ORDER_STATUS_OPTIONS,
  formatMoney,
  getOptionLabel,
  getOptionType
} from '@/views/supplier/order/utils/constants'

defineOptions({ name: 'OrderListPage' })

const props = defineProps({
  source: { type: String as PropType<'PLATFORM' | 'SUPPLIER'>, default: 'PLATFORM' },
  showTabs: { type: Boolean, default: true }
})

const router = useRouter()
const loading = ref(false)
const list = ref<OrderVO[]>([])
const total = ref(0)
const queryFormRef = ref()
const shipRef = ref()
const detailRef = ref()
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  bizType: '' as any,
  orderNo: undefined as string | undefined,
  status: undefined as any,
  supplierOrderNo: undefined as string | undefined,
  distributorOrderNo: undefined as string | undefined,
  supplierName: undefined as string | undefined,
  distributorName: undefined as string | undefined,
  productName: undefined as string | undefined,
  buyerKeyword: undefined as string | undefined,
  receiverKeyword: undefined as string | undefined,
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
const openShip = (orderNo: string) => shipRef.value.open(orderNo)
const goAfterSale = (orderNo: string) => router.push({ path: '/order/aftersale', query: { orderNo } })

onMounted(getList)
</script>
