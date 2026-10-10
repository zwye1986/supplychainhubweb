<template>
  <ContentWrap>
    <el-form ref="queryFormRef" class="-mb-15px search-form" :model="queryParams" :inline="true" label-width="96px">
      <el-form-item label="分销商名称" prop="buyerName">
        <el-input v-model="queryParams.buyerName" placeholder="请输入分销商名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="分销商编号" prop="buyerCode">
        <el-input v-model="queryParams.buyerCode" placeholder="请输入分销商编号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="等级" prop="distributionLevels">
        <el-select v-model="queryParams.distributionLevels" placeholder="请选择等级" multiple clearable collapse-tags collapse-tags-tooltip>
          <el-option v-for="dict in getStrDictOptions('supply_chain_distribution_level')" :key="dict.value" :label="dict.label" :value="Number(dict.value)" />
        </el-select>
      </el-form-item>
      <el-form-item label="合作模式" prop="cooperationModes">
        <el-select v-model="queryParams.cooperationModes" placeholder="请选择合作模式" multiple clearable collapse-tags collapse-tags-tooltip>
          <el-option v-for="dict in getStrDictOptions('supply_chain_cooperation_mode')" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="分销品类" prop="sellableCategories">
        <el-select v-model="queryParams.sellableCategories" placeholder="请选择分销品类" multiple clearable collapse-tags collapse-tags-tooltip>
          <el-option v-for="dict in getStrDictOptions('supply_chain_sellable_category')" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="合作状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" multiple clearable collapse-tags collapse-tags-tooltip>
          <el-option v-for="dict in getStrDictOptions('supply_chain_buyer_status')" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="更新时间">
        <el-date-picker v-model="updatedRange" value-format="YYYY-MM-DD HH:mm:ss" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间" :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]" />
      </el-form-item>
      <el-form-item style="float: right;">
        <el-button type="primary" @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" /> 搜索
        </el-button>
        <el-button type="info" @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" /> 重置
        </el-button>
        <el-button type="primary" plain @click="openForm()">
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button type="warning" plain :disabled="pausableSelectedList.length === 0" @click="handleBatchStatusChange('SUSPENDED')">
          <Icon icon="ep:video-pause" class="mr-5px" /> 批量暂停
        </el-button>
        <el-button type="success" plain :disabled="resumableSelectedList.length === 0" @click="handleBatchStatusChange('ACTIVE')">
          <Icon icon="ep:video-play" class="mr-5px" /> 批量恢复
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table
      :key="tableRenderKey"
      v-loading="loading"
      :data="list"
      row-key="buyerCode"
      default-expand-all
      :tree-props="{ children: 'children' }"
      :stripe="true"
      :show-overflow-tooltip="true"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="48" />
      <el-table-column label="分销商名称" prop="buyerName" min-width="220">
        <template #default="{ row }">
          <el-link :underline="false" type="primary" @click="openDetail(row)">
            {{ getDistributorDisplayName(row) }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="分销商编号" align="center" prop="buyerCode" min-width="110">
        <template #default="{ row }">
          {{ getDistributorBizCode(row) || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="等级" align="center" prop="distributionLevel" min-width="110">
        <template #default="{ row }">
          <el-tag size="small" type="primary">
            {{
              getDictLabel(
                'supply_chain_distribution_level',
                row.distributionLevel
              ) || '-'
            }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="合作模式" align="center" prop="cooperationModes" min-width="160">
        <template #default="{ row }">
          <el-tag v-for="mode in getCooperationModeValues(row)" :key="mode" class="m-2px" size="small">
            {{ getDictLabel('supply_chain_cooperation_mode', mode) || mode }}
          </el-tag>
          <span v-if="!getCooperationModeValues(row).length">-</span>
        </template>
      </el-table-column>
      <el-table-column label="关联项目" align="center" prop="projectCount" min-width="100" />
      <el-table-column label="分销品类" align="center" min-width="160">
        <template #default="{ row }">
          <el-tag v-for="tag in row.sellableCategories || []" :key="tag" class="m-2px" size="small" type="info">
            {{ getDictLabel('supply_chain_sellable_category', tag) || tag }}
          </el-tag>
          <span v-if="!row.sellableCategories?.length">-</span>
        </template>
      </el-table-column>
      <el-table-column label="商品类型" align="center" min-width="160">
        <template #default="{ row }">
          <ProductType :model-value="toProductTypeCodes(row.productTypes)" text />
        </template>
      </el-table-column>
      <el-table-column label="分销SKU商品数" align="center" prop="skuCount" min-width="130" />
      <el-table-column label="合作状态" align="center" prop="status" min-width="110">
        <template #default="{ row }">
          <el-tag :type="getBuyerStatusType(row.status)" size="small">
            {{ getDictLabel('supply_chain_buyer_status', row.status) || '-' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="合作时间" align="center" prop="cooperationTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="更新时间" align="center" prop="updatedAt" :formatter="dateFormatter" width="180" />
      <el-table-column label="操作" align="center" fixed="right" width="280">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button link type="primary" @click="openForm(row)">编辑</el-button>
          <!-- 正常：暂停 -->
          <el-button v-if="row.status === 'ACTIVE'" link type="warning" @click="handleStatusChange(row, 'SUSPENDED')">
            暂停
          </el-button>
          <!-- 暂停分销：恢复 -->
          <el-button v-if="row.status === 'SUSPENDED'" link type="success" @click="handleStatusChange(row, 'ACTIVE')">
            恢复
          </el-button>
          <!-- 正常 / 暂停分销：移入黑名单 -->
          <el-button v-if="row.status !== 'BLACKLIST'" link type="danger" @click="handleStatusChange(row, 'BLACKLIST')">
            移入黑名单
          </el-button>
          <!-- 黑名单：移出黑名单 -->
          <el-button v-if="row.status === 'BLACKLIST'" link type="success" @click="handleStatusChange(row, 'ACTIVE')">
            移出黑名单
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
  </ContentWrap>

  <DistributorFormDialog v-model="formVisible" :buyer-code="formBuyerCode" :mode="formMode" @success="handleFormSuccess" />
  <DistributorDetailDrawer ref="detailRef" v-model="detailVisible" :buyer-code="detailBuyerCode" @success="getList" @edit="openFormByCode" @open-detail="openDetailByCode" />
</template>

<script lang="ts" setup>
  import { dateFormatter } from '@/utils/formatTime'
  import { getDictLabel, getStrDictOptions } from '@/utils/dict'
  import { BuyerListItem, DistributorApi, toProductTypeCodes } from '@/api/supplier/distribution'
  import DistributorFormDialog from './form/index.vue'
  import DistributorDetailDrawer from './detail/index.vue'

  defineOptions({ name: 'SupplierDistributor' })

  const message = useMessage()

  const loading = ref(true)
  const list = ref<BuyerListItem[]>([])
  const total = ref(0)
  const tableRenderKey = ref(0)
  const queryFormRef = ref()
  const selectedList = ref<BuyerListItem[]>([])
  const formVisible = ref(false)
  const formBuyerCode = ref<string | undefined>(undefined)
  const formMode = ref<'create' | 'edit' | 'view'>('create')
  const detailVisible = ref(false)
  const detailBuyerCode = ref<string | undefined>(undefined)
  const detailRef = ref()
  const queryParams = reactive({
    pageNo: 1,
    pageSize: 20,
    buyerName: undefined as string | undefined,
    buyerCode: undefined as string | undefined,
    distributionLevels: [] as number[],
    cooperationModes: [] as string[],
    sellableCategories: [] as string[],
    status: [] as string[],
    updatedFrom: undefined as string | undefined,
    updatedTo: undefined as string | undefined
  })

  /** 更新时间范围 <-> updatedFrom / updatedTo */
  const updatedRange = computed<string[]>({
    get: () =>
      queryParams.updatedFrom && queryParams.updatedTo
        ? [queryParams.updatedFrom, queryParams.updatedTo]
        : [],
    set: (val) => {
      queryParams.updatedFrom = val?.[0]
      queryParams.updatedTo = val?.[1]
    }
  })

  const getCooperationModeValues = (row: BuyerListItem) => {
    const modes = row.cooperationModes || []
    return [...new Set(modes.filter(Boolean))]
  }

  const getDistributorDisplayName = (row: BuyerListItem) => row.buyerName || ''

  const getDistributorBizCode = (row?: BuyerListItem) => row?.buyerCode || ''

  const getBuyerStatusType = (status?: string) => {
    if (status === 'ACTIVE') return 'success'
    if (status === 'SUSPENDED') return 'warning'
    if (status === 'BLACKLIST') return 'danger'
    return 'info'
  }

  const normalizeBuyerTree = (items?: BuyerListItem[] | null): BuyerListItem[] => {
    if (!items?.length) return []
    return items.map((item) => {
      const children = normalizeBuyerTree(item.children)
      return {
        ...item,
        children: children.length ? children : undefined
      }
    })
  }

  const getList = async () => {
    loading.value = true
    try {
      const data = await DistributorApi.getDistributorPage({ ...queryParams })
      list.value = normalizeBuyerTree(Array.isArray(data?.list) ? data.list : [])
      total.value = Number(data?.total) || 0
      tableRenderKey.value += 1
    } catch (error: any) {
      list.value = []
      total.value = 0
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
    queryParams.updatedFrom = undefined
    queryParams.updatedTo = undefined
    handleQuery()
  }

  const openForm = (row?: BuyerListItem) => {
    formBuyerCode.value = row ? getDistributorBizCode(row) || undefined : undefined
    formMode.value = formBuyerCode.value ? 'edit' : 'create'
    formVisible.value = true
  }

  const openFormByCode = (buyerCode?: string) => {
    if (!buyerCode) return
    formBuyerCode.value = buyerCode
    formMode.value = 'edit'
    formVisible.value = true
  }

  const refreshDetail = async (buyerCode?: string) => {
    const code = buyerCode || detailBuyerCode.value
    if (!code) return
    detailBuyerCode.value = code
    detailVisible.value = true
    await nextTick()
    await detailRef.value?.reload?.(code)
  }

  const openDetail = (row?: BuyerListItem) => {
    const code = getDistributorBizCode(row)
    if (!code) {
      message.error('缺少分销商编号，无法查看详情')
      return
    }
    refreshDetail(code)
  }

  const openDetailByCode = (buyerCode?: string) => {
    if (!buyerCode) return
    refreshDetail(buyerCode)
  }

  const handleFormSuccess = async (buyerCode?: string) => {
    await getList()
    const code = buyerCode || formBuyerCode.value
    if (detailVisible.value && (!code || detailBuyerCode.value === code)) {
      await refreshDetail(code || detailBuyerCode.value)
    }
  }

  const getStatusActionText = (row: BuyerListItem, targetStatus: string) => {
    if (targetStatus === 'SUSPENDED') return '暂停分销'
    if (targetStatus === 'BLACKLIST') return '移入黑名单'
    if (row.status === 'BLACKLIST') return '移出黑名单'
    return '恢复合作'
  }

  const handleStatusChange = async (row: BuyerListItem, status: string) => {
    const buyerCode = getDistributorBizCode(row)
    if (!buyerCode) {
      message.error('缺少分销商编号，无法变更状态')
      return
    }
    const actionText = getStatusActionText(row, status)
    try {
      await message.confirm(
        `确认将分销商「${getDistributorDisplayName(row)}」${actionText}吗？`,
        `${actionText}确认`
      )
      await DistributorApi.batchUpdateDistributorStatus([buyerCode], status)
      message.success(`${actionText}成功`)
      await getList()
    } catch {}
  }

  const handleSelectionChange = (rows: BuyerListItem[]) => {
    selectedList.value = rows
  }

  const pausableSelectedList = computed(() =>
    selectedList.value.filter((row) => row.status === 'ACTIVE')
  )

  const resumableSelectedList = computed(() =>
    selectedList.value.filter((row) => row.status === 'SUSPENDED')
  )

  const handleBatchStatusChange = async (status: string) => {
    const isPause = status === 'SUSPENDED'
    const targetList = isPause ? pausableSelectedList.value : resumableSelectedList.value
    const actionText = isPause ? '暂停分销' : '恢复合作'
    if (targetList.length === 0) {
      message.warning(
        isPause
          ? '请选择状态为「正常」的分销商后再批量暂停'
          : '请选择状态为「暂停分销」的分销商后再批量恢复'
      )
      return
    }
    const buyerCodes = targetList
      .map((row) => getDistributorBizCode(row))
      .filter((code): code is string => !!code)
    if (!buyerCodes.length) {
      message.error('选中分销商缺少编号，无法批量变更状态')
      return
    }
    try {
      await message.confirm(
        `确认批量${actionText}选中的 ${targetList.length} 家分销商吗？`,
        `批量${actionText}确认`
      )
      await DistributorApi.batchUpdateDistributorStatus(buyerCodes, status)
      message.success(`批量${actionText}成功`)
      await getList()
    } catch {}
  }

  const loadPage = async () => {
    getList()
  }

  onMounted(loadPage)
  onActivated(loadPage)
</script>
