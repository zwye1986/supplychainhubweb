<template>
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      class="-mb-15px search-form"
      :model="queryParams"
      :inline="true"
      label-width="110px"
    >
      <el-form-item label="订单编号" prop="orderNo">
        <el-input v-model="queryParams.orderNo" maxlength="32" clearable />
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
      <el-form-item label="申请时间">
        <el-date-picker
          v-model="applyRange"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
        />
      </el-form-item>
      <el-form-item label="供应商订单号" prop="supplierOrderNo">
        <el-input v-model="queryParams.supplierOrderNo" clearable />
      </el-form-item>
      <el-form-item label="分销商订单号" prop="distributorOrderNo">
        <el-input v-model="queryParams.distributorOrderNo" clearable />
      </el-form-item>
      <el-form-item label="供应商" prop="supplierName">
        <el-input v-model="queryParams.supplierName" clearable />
      </el-form-item>
      <el-form-item label="分销商" prop="distributorName">
        <el-input v-model="queryParams.distributorName" clearable />
      </el-form-item>
      <el-form-item label="商品名称" prop="productName">
        <el-input v-model="queryParams.productName" clearable />
      </el-form-item>
      <el-form-item label="售后类型" prop="types">
        <el-select v-model="queryParams.types" multiple collapse-tags clearable>
          <el-option v-for="item in AFTER_SALE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="售后状态" prop="statuses">
        <el-select v-model="queryParams.statuses" multiple collapse-tags clearable>
          <el-option
            v-for="item in AFTER_SALE_STATUS_OPTIONS.filter((row) => row.value !== 'NONE')"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
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
      <el-table-column label="商品信息" min-width="200">
        <template #default="{ row }">{{ row.item?.name || '-' }}</template>
      </el-table-column>
      <el-table-column label="订单金额" min-width="110">
        <template #default="{ row }">{{ formatMoney(row.order?.amount) }}</template>
      </el-table-column>
      <el-table-column label="商品数量" min-width="90">
        <template #default="{ row }">{{ row.item?.qty || '-' }}</template>
      </el-table-column>
      <el-table-column label="供应商订单编号" min-width="160">
        <template #default="{ row }">{{ row.order?.supplierOrderNo || '-' }}</template>
      </el-table-column>
      <el-table-column label="分销商订单编号" min-width="160">
        <template #default="{ row }">{{ row.order?.distributorOrderNo || '-' }}</template>
      </el-table-column>
      <el-table-column label="分销商" min-width="140">
        <template #default="{ row }">{{ row.order?.distributorName || '-' }}</template>
      </el-table-column>
      <el-table-column label="供应商" min-width="140">
        <template #default="{ row }">{{ row.order?.supplierName || '-' }}</template>
      </el-table-column>
      <el-table-column label="售后状态" min-width="130">
        <template #default="{ row }">
          <el-tag :type="getOptionType(AFTER_SALE_STATUS_OPTIONS, row.status)" size="small">
            {{ getOptionLabel(AFTER_SALE_STATUS_OPTIONS, row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="售后类型" min-width="110">
        <template #default="{ row }">{{ getOptionLabel(AFTER_SALE_TYPE_OPTIONS, row.type) }}</template>
      </el-table-column>
      <el-table-column label="订单状态" min-width="100">
        <template #default="{ row }">{{ getOptionLabel(ORDER_STATUS_OPTIONS, row.order?.status) }}</template>
      </el-table-column>
      <el-table-column label="下单人" min-width="140">
        <template #default="{ row }">{{ row.order?.buyerId }} {{ row.order?.buyerName }}</template>
      </el-table-column>
      <el-table-column label="下单人手机号" min-width="120">
        <template #default="{ row }">{{ row.order?.buyerMobile || '-' }}</template>
      </el-table-column>
      <el-table-column label="下单时间" min-width="170">
        <template #default="{ row }">{{ row.order?.createTime || '-' }}</template>
      </el-table-column>
      <el-table-column label="申请时间" prop="applyTime" min-width="170" />
      <el-table-column label="操作" fixed="right" width="140">
        <template #default="{ row }">
          <el-button v-if="row.status === 'WAIT_PLATFORM'" link type="primary" @click="openAudit(row.afterSaleNo)">
            审核
          </el-button>
          <el-button link type="primary" @click="openDetail(row.afterSaleNo)">查看</el-button>
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
  <el-dialog v-model="auditVisible" title="售后审核" width="520px" append-to-body>
    <el-form ref="auditFormRef" :model="auditForm" label-width="100px">
      <el-form-item label="审核结果" required>
        <el-radio-group v-model="auditForm.result">
          <el-radio value="PASS">通过</el-radio>
          <el-radio value="REJECT">拒绝</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="auditForm.result === 'REJECT'" label="拒绝原因">
        <el-input v-model="auditForm.reason" type="textarea" maxlength="200" />
      </el-form-item>
      <el-form-item v-else label="退款金额">
        <el-input-number v-model="auditForm.refundAmount" :min="0" :precision="2" />
      </el-form-item>
      <el-form-item label="处理备注">
        <el-input v-model="auditForm.remark" type="textarea" maxlength="200" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="auditVisible = false">取消</el-button>
      <el-button type="primary" @click="submitAudit">确认</el-button>
    </template>
  </el-dialog>
  <AfterSaleDetail ref="detailRef" @view-order="openOrderDetail" />
  <OrderDetail ref="orderDetailRef" />
</template>

<script lang="ts" setup>
import { AfterSaleVO, OrderApi } from '@/api/order'
import AfterSaleDetail from './detail/index.vue'
import OrderDetail from '../platform/detail/index.vue'
import {
  AFTER_SALE_STATUS_OPTIONS,
  AFTER_SALE_TYPE_OPTIONS,
  ORDER_STATUS_OPTIONS,
  formatMoney,
  getOptionLabel,
  getOptionType
} from '@/views/supplier/order/utils/constants'

defineOptions({ name: 'OrderAftersale' })

const route = useRoute()
const message = useMessage()
const loading = ref(false)
const list = ref<AfterSaleVO[]>([])
const total = ref(0)
const queryFormRef = ref()
const detailRef = ref()
const orderDetailRef = ref()
const auditVisible = ref(false)
const currentNo = ref('')
const auditForm = reactive({ result: 'PASS' as 'PASS' | 'REJECT', reason: '', refundAmount: 0, remark: '' })
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  orderNo: undefined as string | undefined,
  supplierOrderNo: undefined as string | undefined,
  distributorOrderNo: undefined as string | undefined,
  supplierName: undefined as string | undefined,
  distributorName: undefined as string | undefined,
  productName: undefined as string | undefined,
  types: [] as any[],
  statuses: [] as any[],
  createFrom: undefined as string | undefined,
  createTo: undefined as string | undefined,
  applyFrom: undefined as string | undefined,
  applyTo: undefined as string | undefined
})
const createRange = computed<string[]>({
  get: () =>
    queryParams.createFrom && queryParams.createTo ? [queryParams.createFrom, queryParams.createTo] : [],
  set: (val) => {
    queryParams.createFrom = val?.[0]
    queryParams.createTo = val?.[1]
  }
})
const applyRange = computed<string[]>({
  get: () => (queryParams.applyFrom && queryParams.applyTo ? [queryParams.applyFrom, queryParams.applyTo] : []),
  set: (val) => {
    queryParams.applyFrom = val?.[0]
    queryParams.applyTo = val?.[1]
  }
})

const getList = async () => {
  loading.value = true
  try {
    const data = await OrderApi.getAfterSalePage({ ...queryParams })
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
  queryParams.createFrom = undefined
  queryParams.createTo = undefined
  queryParams.applyFrom = undefined
  queryParams.applyTo = undefined
  handleQuery()
}
const openDetail = (afterSaleNo: string) => detailRef.value.open(afterSaleNo)
const openOrderDetail = (orderNo: string) => orderDetailRef.value.open(orderNo)
const openAudit = (afterSaleNo: string) => {
  currentNo.value = afterSaleNo
  auditVisible.value = true
}
const submitAudit = async () => {
  if (auditForm.result === 'REJECT' && !auditForm.reason) {
    message.warning('请填写拒绝原因')
    return
  }
  await OrderApi.auditAfterSale(currentNo.value, { ...auditForm })
  message.success('审核完成')
  auditVisible.value = false
  getList()
}

onMounted(() => {
  if (route.query.orderNo) queryParams.orderNo = String(route.query.orderNo)
  getList()
})
</script>
