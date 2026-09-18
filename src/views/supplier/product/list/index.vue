<template>
  <ContentWrap>
    <el-tabs v-model="queryParams.tabCode" class="mb-12px" @tab-change="handleQuery">
      <el-tab-pane label="全部" name="ALL" />
      <el-tab-pane v-for="item in typeList" :key="item.typeCode" :label="item.typeName" :name="item.typeCode" />
    </el-tabs>
    <el-form ref="queryFormRef" class="-mb-15px search-form" :model="queryParams" :inline="true" label-width="96px">
      <el-form-item label="商品名称" prop="keyword">
        <el-input v-model="queryParams.keyword" placeholder="商品名称或SPU编号" maxlength="100" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="商品类型" prop="productType">
        <ProductType v-model="queryParams.productType" :multiple="false" />
      </el-form-item>
      <el-form-item label="商品分类" prop="categoryId">
        <ProductCategory v-model="queryParams.categoryId" node-key="id" />
      </el-form-item>
      <el-form-item label="品牌" prop="brandId">
        <el-select v-model="queryParams.brandId" clearable>
          <el-option v-for="item in brandList" :key="item.brandCode" :label="item.brandName" :value="item.brandCode!" />
        </el-select>
      </el-form-item>
      <el-form-item label="市场价">
        <el-input v-model="queryParams.marketPriceMin" placeholder="最低价" class="!w-100px" />
        <span class="mx-8px">~</span>
        <el-input v-model="queryParams.marketPriceMax" placeholder="最高价" class="!w-100px" />
      </el-form-item>
      <el-form-item label="供应价">
        <el-input v-model="queryParams.supplyPriceMin" placeholder="最低价" class="!w-100px" />
        <span class="mx-8px">~</span>
        <el-input v-model="queryParams.supplyPriceMax" placeholder="最高价" class="!w-100px" />
      </el-form-item>
      <el-form-item label="供应商" prop="supplierCode">
        <el-select v-model="queryParams.supplierCode" filterable clearable>
          <el-option v-for="item in supplierOptions" :key="item.supplierCode" :label="item.supplierName" :value="item.supplierCode!" />
        </el-select>
      </el-form-item>
      <el-form-item label="兑换方式" prop="fulfillmentType">
        <el-select v-model="queryParams.fulfillmentType" clearable>
          <el-option v-for="dict in getStrDictOptions('supply_chain_fulfillment_type')" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="商品状态" prop="status">
        <el-select v-model="queryParams.status" clearable>
          <el-option v-for="dict in getStrDictOptions('supply_chain_sku_status')" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="更新时间">
        <el-date-picker v-model="updatedRange" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss" start-placeholder="开始时间" end-placeholder="结束时间" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" /> 搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" /> 重置
        </el-button>
        <el-button type="primary" plain @click="openForm()">
          <Icon icon="ep:plus" class="mr-5px" /> 新增商品
        </el-button>
        <el-button type="success" plain :disabled="!selectedCodes.length" @click="handleBatchStatus(PRODUCT_STATUS.ON_SHELF)">
          批量上架
        </el-button>
        <el-button type="warning" plain :disabled="!selectedCodes.length" @click="handleBatchStatus(PRODUCT_STATUS.OFF_SHELF)">
          批量下架
        </el-button>
        <el-button type="primary" plain :disabled="!selectedSkuCodes.length" @click="openPriceDialog()">
          批量定价
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="tableRows" :span-method="spanMethod" border @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="48" />
      <el-table-column label="商品名称(SPU)" min-width="240">
        <template #default="{ row }">
          <div class="flex items-center gap-10px">
            <el-image v-if="row.coverUrl" :src="row.coverUrl" class="h-48px w-48px flex-none rounded" fit="cover" />
            <div v-else class="h-48px w-48px flex flex-none items-center justify-center rounded bg-gray-100">
              <Icon icon="ep:goods" />
            </div>
            <div class="min-w-0">
              <div class="truncate font-600">{{ row.spuName }}</div>
              <div class="text-12px text-gray-500">{{ row.spuCode }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="SKU规格" min-width="160">
        <template #default="{ row }">
          <div>{{ row.skuName }}</div>
          <div class="text-12px text-gray-500">{{ row.skuCode }}</div>
        </template>
      </el-table-column>
      <el-table-column label="商品类型" min-width="110">
        <template #default="{ row }">
          <ProductType :model-value="row.productType" :multiple="false" text />
        </template>
      </el-table-column>
      <el-table-column label="商品分类" prop="primaryCategoryName" min-width="120" />
      <el-table-column label="品牌" prop="brandName" min-width="100" />
      <el-table-column label="市场价（元）" min-width="110" align="right">
        <template #default="{ row }">{{ formatCentsYuan(row.marketPrice) }}</template>
      </el-table-column>
      <el-table-column label="销售建议价（元）" min-width="130" align="right">
        <template #default="{ row }">{{ formatCentsYuan(row.suggestedSalePrice) }}</template>
      </el-table-column>
      <el-table-column label="供应价（元）" min-width="110" align="right">
        <template #default="{ row }">{{ formatCentsYuan(row.supplyPrice) }}</template>
      </el-table-column>
      <!-- <el-table-column label="不含税供应价（元）" min-width="140" align="right">
        <template #default="{ row }">{{ formatCentsYuan(row.supplyPriceExclusive) }}</template>
      </el-table-column> -->
      <el-table-column label="税率" min-width="110" align="right">
        <template #default="{ row }">{{ row.taxRateDisplay || '—' }}</template>
      </el-table-column>
      <el-table-column label="税额(元)" min-width="100" align="right">
        <template #default="{ row }">{{ formatCentsYuan(row.taxAmount) }}</template>
      </el-table-column>
      <el-table-column label="供应商" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">{{ formatSuppliers(row.suppliers) }}</template>
      </el-table-column>
      <el-table-column label="总库存" min-width="80" align="right">
        <template #default="{ row }">{{ row.totalInventory ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="兑换方式" min-width="110">
        <template #default="{ row }">
          <el-tag size="small">
            {{ row.fulfillmentTypeDisplay || getDictLabel('supply_chain_fulfillment_type', row.fulfillmentType) || '-' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="商品状态" min-width="90">
        <template #default="{ row }">
          <el-tag size="small">
            {{ getDictLabel('supply_chain_sku_status', row.status) || '-' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="下架方式" min-width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status === PRODUCT_STATUS.OFF_SHELF" size="small" type="warning">
            {{ row.unshelveModeDisplay || getDictLabel('supply_chain_unshelve_mode', row.unshelveMode) || '-' }}
          </el-tag>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" min-width="170">
        <template #default="{ row }">{{ row.updatedAt || '—' }}</template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.spuCode)">详情</el-button>
          <el-button link type="primary" @click="openPriceDialog(row.spuCode)">定价</el-button>
          <el-button v-if="row.status === PRODUCT_STATUS.DRAFT" link type="danger" @click="handleDelete(row)">
            删除
          </el-button>
          <el-button v-if="row.status === PRODUCT_STATUS.OFF_SHELF" link type="success" @click="handleStatus(row, PRODUCT_STATUS.ON_SHELF)">
            上架
          </el-button>
          <el-button v-if="row.status === PRODUCT_STATUS.ON_SHELF" link type="warning" @click="handleStatus(row, PRODUCT_STATUS.OFF_SHELF)">
            下架
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
  </ContentWrap>
  <ProductForm ref="formRef" @success="getList" />
  <ProductDetail ref="detailRef" @edit="handleEditFromDetail" />
  <ProductPriceDialog ref="priceRef" @success="getList" />
</template>

<script lang="ts" setup>
  import {
    ProductApi,
    ProductBrandApi,
    ProductBrandVO,
    ProductManagementSkuItem,
    ProductManagementSpuItem,
    ProductTypeApi,
    ProductTypeVO,
    PRODUCT_STATUS,
    SupplierSimpleInfo
  } from '@/api/product'
  import { getDictLabel, getStrDictOptions } from '@/utils/dict'
  import { SupplierApi } from '@/api/supplier/manage'
  import { formatCentsYuan, yuanToCents } from '@/views/supplier/utils/constants'
  import ProductPriceDialog from './components/PriceDialog.vue'
  import ProductForm from './form/index.vue'
  import ProductDetail from './detail/index.vue'

  defineOptions({ name: 'SupplierProductList' })

  const route = useRoute()
  const message = useMessage()

  const loading = ref(false)
  const list = ref<ProductManagementSpuItem[]>([])
  const total = ref(0)
  const brandList = ref<ProductBrandVO[]>([])
  const typeList = ref<ProductTypeVO[]>([])
  const supplierOptions = ref<SupplierSimpleInfo[]>([])
  const selectedList = ref<any[]>([])
  const queryFormRef = ref()
  const formRef = ref()
  const detailRef = ref()
  const priceRef = ref()
  const queryParams = reactive({
    pageNo: 1,
    pageSize: 20,
    keyword: undefined as string | undefined,
    tabCode: 'ALL',
    productType: undefined as string | undefined,
    categoryId: undefined as number | undefined,
    brandId: undefined as number | string | undefined,
    marketPriceMin: undefined as string | undefined,
    marketPriceMax: undefined as string | undefined,
    supplyPriceMin: undefined as string | undefined,
    supplyPriceMax: undefined as string | undefined,
    supplierCode: undefined as string | undefined,
    fulfillmentType: undefined as string | undefined,
    status: undefined as number | undefined,
    updateTimeStart: undefined as string | undefined,
    updateTimeEnd: undefined as string | undefined
  })

  const updatedRange = computed<string[]>({
    get: () =>
      queryParams.updateTimeStart && queryParams.updateTimeEnd
        ? [queryParams.updateTimeStart, queryParams.updateTimeEnd]
        : [],
    set: (val) => {
      queryParams.updateTimeStart = val?.[0]
      queryParams.updateTimeEnd = val?.[1]
    }
  })

  const tableRows = computed(() => {
    const rows: any[] = []
    list.value.forEach((spu) => {
      const skus = spu.skus?.length ? spu.skus : ([{}] as ProductManagementSkuItem[])
      skus.forEach((sku, index) => {
        rows.push({
          ...spu,
          skuName: sku.skuName,
          skuCode: sku.skuCode,
          marketPrice: sku.marketPrice,
          supplyPrice: sku.supplyPrice,
          supplyPriceExclusive: sku.supplyPriceExclusive,
          taxRateDisplay: sku.taxRateDisplay,
          taxAmount: sku.taxAmount,
          suppliers: sku.suppliers,
          totalInventory: sku.totalInventory,
          fulfillmentType: sku.fulfillmentType,
          fulfillmentTypeDisplay: sku.fulfillmentTypeDisplay,
          _rowspan: index === 0 ? skus.length : 0,
          _rowKey: `${spu.spuCode}-${sku.skuCode || index}`
        })
      })
    })
    return rows
  })

  const selectedCodes = computed(() => [
    ...new Set(selectedList.value.map((item) => item.spuCode).filter(Boolean))
  ])

  const getSkuCodesBySpu = (spuCode?: string) =>
    (list.value.find((item) => item.spuCode === spuCode)?.skus || [])
      .map((sku) => sku.skuCode)
      .filter((code): code is string => !!code)

  const selectedSkuCodes = computed(() =>
    list.value
      .filter((spu) => !!spu.spuCode && selectedCodes.value.includes(spu.spuCode))
      .flatMap((spu) => getSkuCodesBySpu(spu.spuCode))
  )

  const spanMethod = ({ row, columnIndex }: { row: any; columnIndex: number }) => {
    if ([0, 1, 3, 4, 5, 15, 16, 17, 18].includes(columnIndex)) {
      return row._rowspan ? { rowspan: row._rowspan, colspan: 1 } : { rowspan: 0, colspan: 0 }
    }
  }

  const formatSuppliers = (suppliers?: SupplierSimpleInfo[]) => {
    if (!suppliers?.length) return '—'
    return suppliers
      .map((item) => item.supplierName || item.supplierCode)
      .filter(Boolean)
      .join('、')
  }

  const toFen = (value?: string) => {
    if (value == null || value === '') return undefined
    return yuanToCents(Number(value))
  }

  const getList = async () => {
    loading.value = true
    try {
      const data = await ProductApi.getProductPage({
        pageNo: queryParams.pageNo,
        pageSize: queryParams.pageSize,
        keyword: queryParams.keyword,
        tabCode: queryParams.tabCode === 'ALL' ? undefined : queryParams.tabCode,
        productType: queryParams.productType,
        categoryId: queryParams.categoryId,
        brandId: queryParams.brandId,
        status: queryParams.status,
        fulfillmentType: queryParams.fulfillmentType,
        supplierCode: queryParams.supplierCode,
        marketPriceMin: toFen(queryParams.marketPriceMin),
        marketPriceMax: toFen(queryParams.marketPriceMax),
        supplyPriceMin: toFen(queryParams.supplyPriceMin),
        supplyPriceMax: toFen(queryParams.supplyPriceMax),
        updateTimeStart: queryParams.updateTimeStart,
        updateTimeEnd: queryParams.updateTimeEnd
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
    queryParams.tabCode = 'ALL'
    queryParams.updateTimeStart = undefined
    queryParams.updateTimeEnd = undefined
    queryParams.marketPriceMin = undefined
    queryParams.marketPriceMax = undefined
    queryParams.supplyPriceMin = undefined
    queryParams.supplyPriceMax = undefined
    handleQuery()
  }

  const handleSelectionChange = (val: any[]) => {
    selectedList.value = val
  }

  const openForm = (spuCode?: string) => {
    formRef.value.open(spuCode)
  }

  const openDetail = (spuCode?: string) => {
    if (!spuCode) return
    detailRef.value.open(spuCode)
  }

  const handleEditFromDetail = (spuCode?: string) => {
    openForm(spuCode)
  }

  const openPriceDialog = (spuCode?: string) => {
    const skuCodes = spuCode ? getSkuCodesBySpu(spuCode) : selectedSkuCodes.value
    if (!skuCodes.length) {
      message.warning('请选择需要定价的商品 SKU')
      return
    }
    priceRef.value.open(skuCodes, !spuCode)
  }

  const handleDelete = async (row: ProductManagementSpuItem) => {
    if (!row.spuCode) return
    try {
      await message.delConfirm()
      await ProductApi.deleteProduct(row.spuCode)
      message.success('删除成功')
      getList()
    } catch {}
  }

  const handleStatus = async (row: ProductManagementSpuItem, targetStatus: number) => {
    if (!row.spuCode) return
    const text = targetStatus === PRODUCT_STATUS.ON_SHELF ? '上架' : '下架'
    try {
      await message.confirm(`确认${text}商品「${row.spuName}」？`)
      await ProductApi.changeProductStatus(row.spuCode, targetStatus)
      message.success(`${text}成功`)
      getList()
    } catch {}
  }

  const handleBatchStatus = async (targetStatus: number) => {
    const text = targetStatus === PRODUCT_STATUS.ON_SHELF ? '上架' : '下架'
    try {
      await message.confirm(`确认批量${text}选中商品？`)
      await Promise.all(
        selectedCodes.value.map((spuCode) => ProductApi.changeProductStatus(spuCode, targetStatus))
      )
      message.success(`批量${text}成功`)
      getList()
    } catch {}
  }

  onMounted(async () => {
    if (route.query.typeCode) queryParams.tabCode = String(route.query.typeCode)
    if (route.query.tabCode) queryParams.tabCode = String(route.query.tabCode)
    brandList.value = await ProductBrandApi.getBrandList()
    typeList.value = await ProductTypeApi.getTypeList()
    try {
      const data = await SupplierApi.getSupplierNameList({ view: 'simple' })
      supplierOptions.value = (Array.isArray(data) ? data : data?.list || []).filter(
        (item: SupplierSimpleInfo) => item.supplierCode
      )
    } catch {
      supplierOptions.value = []
    }
    getList()
  })
</script>
