<template>
  <ContentWrap>
    <el-form ref="queryFormRef" class="-mb-15px search-form" :model="queryParams" :inline="true" label-width="90px">
      <el-form-item label="供应商名称" prop="supplierName">
        <el-select v-model="queryParams.supplierName" placeholder="请选择/搜索供应商名称" filterable allow-create default-first-option clearable :reserve-keyword="false">
          <el-option v-for="item in nameOptions" :key="item.supplierCode" :label="item.supplierName" :value="item.supplierName" />
        </el-select>
      </el-form-item>
      <el-form-item label="供应商编号" prop="supplierCode">
        <el-input v-model="queryParams.supplierCode" placeholder="供应商编号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="可售品类" prop="categoryL1Ids">
        <el-select v-model="queryParams.categoryL1Ids" placeholder="请选择品类" multiple clearable collapse-tags collapse-tags-tooltip>
          <el-option v-for="dict in getStrDictOptions('supply_chain_sellable_category')" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="供货模式" prop="supplyModes">
        <el-select v-model="queryParams.supplyModes" placeholder="请选择供货模式" multiple clearable collapse-tags collapse-tags-tooltip>
          <el-option v-for="dict in getStrDictOptions('supply_chain_supply_mode')" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="合作状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" multiple clearable collapse-tags collapse-tags-tooltip>
          <el-option v-for="dict in getStrDictOptions('supply_chain_supplier_status')" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="更新时间">
        <el-date-picker :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]" v-model="updatedRange" value-format="YYYY-MM-DD HH:mm:ss" type="datetimerange" start-placeholder="开始时间"
          end-placeholder="结束时间" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery" type="primary">
          <Icon icon="ep:search" class="mr-5px" /> 搜索
        </el-button>
        <el-button @click="resetQuery">
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
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="48" />
      <el-table-column label="供应商名称" align="center" prop="supplierName" min-width="160">
        <template #default="{ row }">
          <el-link :underline="false" type="primary" @click="openDetail(row)">
            {{ row.supplierName }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="供应商编号" align="center" prop="supplierCode" min-width="140">
        <template #default="{ row }">
          {{ row.supplierCode || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="可售品类" align="center" min-width="160">
        <template #default="{ row }">
          <el-tag v-for="tag in getSellableCategoryLabels(row.sellableCategories || row.categories)" :key="tag" class="m-2px" size="small" type="info">
            {{ tag }}
          </el-tag>
          <span v-if="!getSellableCategoryLabels(row.sellableCategories || row.categories).length">-</span>
        </template>
      </el-table-column>
      <el-table-column label="商品类型" align="center" min-width="160">
        <template #default="{ row }">
          <ProductType :model-value="namedRefCodes(row.productTypes)" text />
        </template>
      </el-table-column>
      <el-table-column label="商品分类" align="center" min-width="200">
        <template #default="{ row }">
          <ProductCategory :model-value="namedRefCodes(row.productCategories || row.productClassifications)" text />
        </template>
      </el-table-column>
      <el-table-column label="供货模式" align="center" prop="supplyModes" min-width="180">
        <template #default="{ row }">
          <el-tag v-for="tag in getDictRefLabels(row.supplyModes, 'supply_chain_supply_mode')" :key="tag" class="m-2px" size="small" type="primary">
            {{ tag }}
          </el-tag>
          <span v-if="!getDictRefLabels(row.supplyModes, 'supply_chain_supply_mode').length">-</span>
        </template>
      </el-table-column>
      <el-table-column label="合作商品SKU数" align="center" prop="skuCount" min-width="160" />
      <el-table-column label="合作状态" align="center" prop="status" min-width="110">
        <template #default="{ row }">
          <dict-tag v-if="row.status" type="supply_chain_supplier_status" :value="row.status" />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="接入时间" align="center" prop="onboardedAt" :formatter="dateFormatter" width="180" />
      <el-table-column label="更新时间" align="center" prop="updatedAt" :formatter="dateFormatter" width="180" />
      <el-table-column label="操作" align="center" fixed="right" width="280">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button link type="primary" @click="openForm(row)">编辑</el-button>
          <!-- 正常：暂停 -->
          <el-button v-if="row.status === 'ACTIVE'" link type="warning" @click="handleStatusChange(row, 'SUSPENDED')">
            暂停
          </el-button>
          <!-- 暂停供货：恢复 -->
          <el-button v-if="row.status === 'SUSPENDED'" link type="success" @click="handleStatusChange(row, 'ACTIVE')">
            恢复
          </el-button>
          <!-- 正常 / 暂停供货：移入黑名单 -->
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

  <SupplierFormDialog v-model="formVisible" :supplier-code="formSupplierCode" :mode="formMode" @success="handleFormSuccess" />
  <SupplierDetailDrawer ref="detailRef" v-model="detailVisible" :supplier-code="detailSupplierCode" @success="getList" @edit="openFormByCode" />
</template>

<script lang="ts" setup>
  import { dateFormatter } from '@/utils/formatTime'
  import { getDictLabel, getStrDictOptions } from '@/utils/dict'
  import { NamedRefOrCode, SupplierApi, SupplierVO } from '@/api/supplier/manage'
  import SupplierFormDialog from './form/index.vue'
  import SupplierDetailDrawer from './detail/index.vue'

  defineOptions({ name: 'SupplierManage' })

  const message = useMessage()

  const loading = ref(true)
  const list = ref<SupplierVO[]>([])
  const total = ref(0)
  const queryFormRef = ref()
  const nameOptions = ref<Pick<SupplierVO, 'id' | 'supplierName'>[]>([])
  const selectedList = ref<SupplierVO[]>([])
  const formVisible = ref(false)
  const formSupplierCode = ref<string | undefined>(undefined)
  const formMode = ref<'create' | 'edit' | 'view'>('create')
  const detailVisible = ref(false)
  const detailSupplierCode = ref<string | undefined>(undefined)
  const detailRef = ref()
  const queryParams = reactive({
    pageNo: 1,
    pageSize: 20,
    supplierName: undefined as string | undefined,
    supplierCode: undefined as string | undefined,
    categoryL1Ids: [] as Array<string | number>,
    supplyModes: [] as string[],
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

  /** 取出业务编码；兼容 string[] 与 { id, name }[] */
  const namedRefCodes = (refs: NamedRefOrCode[] | null | undefined) => {
    if (!refs?.length) return []
    return [
      ...new Set(
        refs
          .map((item) => {
            if (item == null) return ''
            if (typeof item === 'string' || typeof item === 'number') return String(item).trim()
            return String(item.id ?? item.name ?? '').trim()
          })
          .filter(Boolean)
      )
    ]
  }

  /** 可售品类：优先接口 name，否则用字典 supply_chain_sellable_category */
  const getSellableCategoryLabels = (refs: NamedRefOrCode[] | null | undefined) => {
    if (!refs?.length) return []
    return [
      ...new Set(
        refs
          .map((item) => {
            if (item == null) return ''
            if (typeof item === 'string' || typeof item === 'number') {
              const code = String(item).trim()
              return (getDictLabel('supply_chain_sellable_category', code) || code).trim()
            }
            const code = String(item.id ?? '').trim()
            const apiName = String(item.name ?? '').trim()
            if (apiName && apiName !== code) return apiName
            return (
              getDictLabel('supply_chain_sellable_category', code) ||
              getDictLabel('supply_chain_sellable_category', apiName) ||
              apiName ||
              code
            ).trim()
          })
          .filter(Boolean)
      )
    ]
  }

  /** 供货模式：name 可能是枚举编码，先解析字典，再回退接口名称或编码。 */
  const getDictRefLabels = (refs: NamedRefOrCode[] | null | undefined, dictType: string) => {
    if (!refs?.length) return []
    return [
      ...new Set(
        refs
          .map((item) => {
            if (item == null) return ''
            if (typeof item === 'string' || typeof item === 'number') {
              const code = String(item).trim()
              return (getDictLabel(dictType, code) || code).trim()
            }
            const code = String(item.id ?? '').trim()
            const apiName = String(item.name ?? '').trim()
            return (
              getDictLabel(dictType, apiName) ||
              getDictLabel(dictType, code) ||
              apiName ||
              code
            ).trim()
          })
          .filter(Boolean)
      )
    ]
  }

  const getSupplierDisplayName = (row: SupplierVO) => row.supplierName || row.name || ''

  const getSupplierBizCode = (row?: SupplierVO) => row?.supplierCode || row?.code || ''

  /** 查询列表（默认按更新时间倒序，由后端处理） */
  const getList = async () => {
    loading.value = true
    try {
      const data = await SupplierApi.getSupplierPage({ ...queryParams })
      list.value = Array.isArray(data?.list) ? data.list : []
      total.value = Number(data?.total) || 0
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

  const openForm = (row?: SupplierVO) => {
    formSupplierCode.value = row ? getSupplierBizCode(row) || undefined : undefined
    formMode.value = formSupplierCode.value ? 'edit' : 'create'
    formVisible.value = true
  }

  const openFormByCode = (supplierCode?: string) => {
    if (!supplierCode) return
    formSupplierCode.value = supplierCode
    formMode.value = 'edit'
    formVisible.value = true
  }

  const openDetail = (row?: SupplierVO) => {
    const code = getSupplierBizCode(row)
    if (!code) {
      message.error('缺少供应商编号，无法查看详情')
      return
    }
    detailSupplierCode.value = code
    detailVisible.value = true
  }

  /** 表单保存后刷新列表和下拉选项；详情抽屉仍打开时同步刷新 */
  const handleFormSuccess = () => {
    getList()
    getFilterOptions()
    if (detailVisible.value) {
      detailRef.value?.reload?.()
    }
  }

  /** 读取供应商名称列表，供搜索下拉模糊筛选 */
  const getFilterOptions = async () => {
    try {
      const data = await SupplierApi.getSupplierNameList({ view: 'simple' })
      nameOptions.value = Array.isArray(data) ? data : data?.list || []
    } catch {
      nameOptions.value = []
    }
  }

  /** 按当前状态展示对应操作文案并二次确认 */
  const getStatusActionText = (row: SupplierVO, targetStatus: string) => {
    if (targetStatus === 'SUSPENDED') return '暂停供货'
    if (targetStatus === 'BLACKLIST') return '移入黑名单'
    if (row.status === 'BLACKLIST') return '移出黑名单'
    return '恢复合作'
  }

  const handleStatusChange = async (row: SupplierVO, status: string) => {
    const supplierCode = getSupplierBizCode(row)
    if (!supplierCode) {
      message.error('缺少供应商编号，无法变更状态')
      return
    }
    const actionText = getStatusActionText(row, status)
    try {
      await message.confirm(
        `确认将供应商「${getSupplierDisplayName(row)}」${actionText}吗？`,
        `${actionText}确认`
      )
      // 暂停 / 恢复走批量接口（单条也复用）；移入/移出黑名单走单条状态变更
      const isPauseOrResume =
        status === 'SUSPENDED' || (status === 'ACTIVE' && row.status === 'SUSPENDED')

      if (isPauseOrResume) {
        await SupplierApi.batchUpdateSupplierStatus([supplierCode], status)
      } else {
        await SupplierApi.updateSupplierStatus(supplierCode, status)
      }
      message.success(`${actionText}成功`)
      await getList()
    } catch {}
  }

  /** 表格多选 */
  const handleSelectionChange = (rows: SupplierVO[]) => {
    selectedList.value = rows
  }

  /** 批量暂停：仅当前「正常」的选中项 */
  const pausableSelectedList = computed(() =>
    selectedList.value.filter((row) => row.status === 'ACTIVE')
  )

  /** 批量恢复：仅当前「暂停供货」的选中项 */
  const resumableSelectedList = computed(() =>
    selectedList.value.filter((row) => row.status === 'SUSPENDED')
  )

  /** 批量状态变更（暂停/恢复各自只处理符合状态的数据） */
  const handleBatchStatusChange = async (status: string) => {
    const isPause = status === 'SUSPENDED'
    const targetList = isPause ? pausableSelectedList.value : resumableSelectedList.value
    const actionText = isPause ? '暂停供货' : '恢复合作'
    if (targetList.length === 0) {
      message.warning(
        isPause
          ? '请选择状态为「正常」的供应商后再批量暂停'
          : '请选择状态为「暂停供货」的供应商后再批量恢复'
      )
      return
    }
    const supplierCodes = targetList
      .map((row) => getSupplierBizCode(row))
      .filter((code): code is string => !!code)
    if (!supplierCodes.length) {
      message.error('选中供应商缺少编号，无法批量变更状态')
      return
    }
    try {
      await message.confirm(
        `确认批量${actionText}选中的 ${targetList.length} 家供应商吗？`,
        `批量${actionText}确认`
      )
      await SupplierApi.batchUpdateSupplierStatus(supplierCodes, status)
      message.success(`批量${actionText}成功`)
      await getList()
    } catch {}
  }

  const loadPage = async () => {
    getList()
    getFilterOptions()
  }

  onMounted(loadPage)
</script>
