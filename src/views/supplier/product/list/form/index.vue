<template>
  <el-dialog v-model="dialogVisible" :title="pageTitle" width="90%" append-to-body>
    <el-form ref="formRef" v-loading="formLoading" class="mt-16px" :model="formData" :rules="formRules" label-width="140px">
      <el-divider content-position="left">基本信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="商品名称（SPU）" prop="spuName">
            <el-input v-model="formData.spuName" maxlength="100" placeholder="请输入商品SPU名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="SPU编号" prop="spuCode">
            <el-input v-model="formData.spuCode" placeholder="可自动生成或手动输入" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品类型" prop="productType">
            <ProductType v-model="formData.productType" :multiple="false" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品分类" prop="productClassification">
            <el-tree-select
              v-model="formData.productClassification"
              :data="categoryTree"
              clearable
              check-strictly
              filterable
              node-key="categoryCode"
              :props="{ label: 'categoryName', children: 'children' }"
              placeholder="请选择商品分类"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="品牌" prop="brandId">
            <el-select v-model="formData.brandId" placeholder="请选择品牌">
              <el-option v-for="item in brandList" :key="item.brandCode" :label="item.brandName" :value="item.brandCode" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品状态">
            <el-select v-model="formData.status">
              <el-option v-for="dict in getStrDictOptions('supply_chain_sku_status')" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="兑换方式" prop="fulfillmentType">
            <el-select v-model="formData.fulfillmentType" placeholder="请选择兑换方式">
              <el-option v-for="dict in getStrDictOptions('supply_chain_fulfillment_type')" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">SKU规格管理</el-divider>
      <div class="flex justify-end">
        <el-button class="mb-12px" type="primary" plain @click="addSku">
          <Icon icon="ep:plus" class="mr-5px" /> 新增SKU
        </el-button>
      </div>
      <el-table :data="formData.skus" border class="sku-spec-table" max-height="520" size="small">
        <el-table-column label="SKU主图" min-width="110" align="center">
          <template #default="{ row }">
            <UploadImg v-model="row.picUrl" height="100px" width="100px" :drag="false" />
          </template>
        </el-table-column>
        <el-table-column label="SKU详情图" min-width="160" align="center">
          <template #default="{ row }">
            <UploadImgs v-model="row.detailPics" :limit="5" height="100px" width="100px" :drag="false" />
          </template>
        </el-table-column>
        <el-table-column label="商品描述" min-width="180">
          <template #default="{ row }">
            <el-input v-model="row.description" type="textarea" :rows="2" maxlength="200" show-word-limit placeholder="商品详情信息" />
          </template>
        </el-table-column>
        <el-table-column label="SKU名称" min-width="140">
          <template #default="{ row, $index }">
            <el-form-item :prop="`skus.${$index}.skuName`" :rules="skuRequiredRules">
              <el-input v-model="row.skuName" placeholder="如：月卡" />
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column label="SKU编码" min-width="120">
          <template #default="{ row }">
            <el-input v-model="row.skuCode" disabled placeholder="由系统生成" />
          </template>
        </el-table-column>
        <el-table-column label="市场价（元）" min-width="140" align="right">
          <template #default="{ row }">
            <el-input-number :controls="false" v-model="row.marketPriceYuan" :min="0" :precision="2" class="!w-full" @change="syncSuggestedPrice(row)" />
          </template>
        </el-table-column>
        <el-table-column label="销售建议价（元）" min-width="360">
          <template #default="{ row }">
            <div class="flex flex-col gap-8px">
              <el-radio-group v-model="row.adjustMode" @change="onAdjustModeChange(row)">
                <el-radio value="MARKET">按照销售建议价=市场价</el-radio>
                <el-radio value="CUSTOM">自定义设置</el-radio>
                <el-radio value="FIXED">固定值</el-radio>
              </el-radio-group>
              <div v-if="row.adjustMode === 'CUSTOM'" class="flex flex-wrap items-center gap-8px">
                <el-select v-model="row.formulaBase" class="!w-120px" @change="onFormulaBaseChange(row)">
                  <el-option label="市场价" value="MARKET" />
                  <el-option label="销售建议价" value="SUGGEST" />
                </el-select>
                <span>*</span>
                <el-input-number :controls="false" v-model="row.percent" :min="0.01" :precision="2" class="!w-110px" @change="syncSuggestedPrice(row)" />
                <span>%</span>
                <el-select v-model="row.op" class="!w-72px" @change="syncSuggestedPrice(row)">
                  <el-option label="+" value="+" />
                  <el-option label="-" value="-" />
                  <el-option label="*" value="*" />
                  <el-option label="/" value="/" />
                </el-select>
                <el-input-number :controls="false" v-model="row.amount" :min="0" :precision="2" class="!w-110px" @change="syncSuggestedPrice(row)" />
                <span>元</span>
              </div>
              <div v-if="row.adjustMode === 'FIXED'" class="flex items-center gap-8px">
                <span>固定售价</span>
                <el-input-number :controls="false" v-model="row.fixedPriceYuan" :min="0.01" :precision="2" class="!w-140px" @change="syncSuggestedPrice(row)" />
              </div>
              <div class="text-12px text-gray-500">{{ formatSuggestFormula(row) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="供应价（元）" min-width="110" align="right">
          <template #default="{ row }">{{ formatCentsYuan(row.supplyPrice) }}</template>
        </el-table-column>
        <el-table-column label="供应商" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ formatSkuSuppliers(row.suppliers) }}</template>
        </el-table-column>
        <el-table-column label="总库存" min-width="80" align="right">
          <template #default="{ row }">{{ row.totalInventory ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right" align="center">
          <template #default="{ $index }">
            <el-button link type="danger" :disabled="formData.skus.length <= 1" @click="removeSku($index)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-divider content-position="left">限购设置</el-divider>
      <el-form-item label="每人限购">
        <div class="flex flex-wrap items-center gap-8px">
          <el-checkbox v-model="formData.userLimitEnabled">开启</el-checkbox>
          <el-select v-if="formData.userLimitEnabled" v-model="formData.userLimitPeriod" class="!w-120px" placeholder="请选择" clearable>
            <el-option v-for="dict in getStrDictOptions('supply_chain_limit_period')" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
          <span v-if="formData.userLimitEnabled">限购</span>
          <el-input-number :controls="false" v-if="formData.userLimitEnabled" v-model="formData.userLimitQuantity" :min="1" :precision="0" />
        </div>
      </el-form-item>
      <el-form-item label="每个订单限购">
        <div class="flex flex-wrap items-center gap-8px">
          <el-checkbox v-model="formData.phoneBindLimitEnabled">开启</el-checkbox>
          <span v-if="formData.phoneBindLimitEnabled">限购绑定手机号数量</span>
          <el-input-number :controls="false" v-if="formData.phoneBindLimitEnabled" v-model="formData.phoneBindLimitQuantity" :min="1" :precision="0" />
          <span class="text-12px text-red-500">权益商品专用</span>
        </div>
      </el-form-item>

      <el-divider content-position="left">配送设置</el-divider>
      <el-form-item label="配送方式">
        <el-checkbox v-model="noLogistics">无需物流</el-checkbox>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="formLoading" @click="submitForm">保存</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
  import {
    ProductApi,
    ProductBrandApi,
    ProductBrandVO,
    ProductCategoryApi,
    ProductCategoryVO,
    SpuDetail,
    SpuSaveReqVO,
    SupplierSimpleInfo
  } from '@/api/product'
  import { getStrDictOptions } from '@/utils/dict'
  import { centsToYuan, formatCentsYuan, yuanToCents } from '@/views/supplier/utils/constants'

  defineOptions({ name: 'ProductListForm' })

  type AdjustMode = 'MARKET' | 'CUSTOM' | 'FIXED'
  type FormulaBase = 'MARKET' | 'SUGGEST'
  type FormulaOp = '+' | '-' | '*' | '/'

  interface SkuFormItem {
    skuCode?: string
    skuName: string
    fulfillmentType: string
    faceValueYuan?: number
    marketPriceYuan?: number
    suggestedSalePriceYuan?: number
    picUrl?: string
    detailPics: string[]
    description?: string
    adjustMode: AdjustMode
    formulaBase: FormulaBase
    percent?: number
    op: FormulaOp
    amount?: number
    fixedPriceYuan?: number
    baseSuggestedYuan?: number
    supplyPrice?: number
    suppliers?: SupplierSimpleInfo[]
    totalInventory?: number
  }

  interface SpuFormData {
    spuCode?: string
    spuName: string
    brandId?: number | string
    sellableCategory?: string
    productType?: string
    productClassification?: string
    deliveryType?: string
    status?: string
    fulfillmentType?: string
    userLimitEnabled?: boolean
    userLimitPeriod?: string
    userLimitQuantity?: number
    phoneBindLimitEnabled?: boolean
    phoneBindLimitQuantity?: number
    skus: SkuFormItem[]
  }

  const message = useMessage()
  const { t } = useI18n()
  const emit = defineEmits(['success'])

  const dialogVisible = ref(false)
  const formRef = ref()
  const formLoading = ref(false)
  const isEdit = ref(false)
  const brandList = ref<ProductBrandVO[]>([])
  const categoryTree = ref<ProductCategoryVO[]>([])

  const firstDictValue = (dictType: string) => getStrDictOptions(dictType)[0]?.value || ''
  const round2 = (value: number) => Math.round(value * 100) / 100

  const createSku = (): SkuFormItem => ({
    skuName: '',
    skuCode: '',
    fulfillmentType: firstDictValue('supply_chain_fulfillment_type'),
    faceValueYuan: 0,
    marketPriceYuan: 0,
    suggestedSalePriceYuan: 0,
    picUrl: '',
    detailPics: [],
    description: '',
    adjustMode: 'CUSTOM',
    formulaBase: 'MARKET',
    percent: 50,
    op: '+',
    amount: 0,
    fixedPriceYuan: undefined,
    baseSuggestedYuan: 0,
    supplyPrice: undefined,
    suppliers: [],
    totalInventory: 0
  })

  const defaultLimit = () => ({
    userLimitEnabled: false,
    userLimitPeriod: undefined as string | undefined,
    userLimitQuantity: 1,
    phoneBindLimitEnabled: false,
    phoneBindLimitQuantity: 1
  })

  const formData = reactive<SpuFormData>({
    spuName: '',
    productType: '',
    productClassification: '',
    sellableCategory: '',
    deliveryType: 'VIRTUAL',
    status: firstDictValue('supply_chain_sku_status'),
    fulfillmentType: firstDictValue('supply_chain_fulfillment_type'),
    ...defaultLimit(),
    skus: [createSku()]
  })

  const noLogistics = computed({
    get: () => formData.deliveryType === 'VIRTUAL',
    set: (val: boolean) => {
      formData.deliveryType = val ? 'VIRTUAL' : undefined
    }
  })

  const skuRequiredRules = [{ required: true, message: '该项为必填项', trigger: 'blur' }]
  const formRules = {
    spuName: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
    productType: [{ required: true, message: '请选择商品类型', trigger: 'change' }],
    productClassification: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
    brandId: [{ required: true, message: '请选择品牌', trigger: 'change' }],
    fulfillmentType: [{ required: true, message: '请选择兑换方式', trigger: 'change' }]
  }
  const pageTitle = computed(() => (isEdit.value ? '编辑商品' : '新增商品'))

  const calcSuggestedYuan = (sku: SkuFormItem) => {
    if (sku.adjustMode === 'MARKET') return round2(sku.marketPriceYuan || 0)
    if (sku.adjustMode === 'FIXED') return round2(sku.fixedPriceYuan || 0)
    const base =
      sku.formulaBase === 'SUGGEST'
        ? sku.baseSuggestedYuan ?? sku.suggestedSalePriceYuan ?? 0
        : sku.marketPriceYuan || 0
    const percentPart = (base * (sku.percent || 0)) / 100
    const amount = sku.amount || 0
    if (sku.op === '-') return Math.max(round2(percentPart - amount), 0)
    if (sku.op === '*') return round2(percentPart * amount)
    if (sku.op === '/') return amount ? round2(percentPart / amount) : round2(percentPart)
    return round2(percentPart + amount)
  }

  const syncSuggestedPrice = (sku: SkuFormItem) => {
    sku.suggestedSalePriceYuan = calcSuggestedYuan(sku)
  }

  const onAdjustModeChange = (sku: SkuFormItem) => {
    if (sku.adjustMode === 'CUSTOM' && sku.formulaBase === 'SUGGEST') {
      sku.baseSuggestedYuan = sku.suggestedSalePriceYuan || 0
    }
    if (sku.adjustMode === 'FIXED' && sku.fixedPriceYuan == null) {
      sku.fixedPriceYuan = sku.suggestedSalePriceYuan || sku.marketPriceYuan || 0
    }
    syncSuggestedPrice(sku)
  }

  const onFormulaBaseChange = (sku: SkuFormItem) => {
    if (sku.formulaBase === 'SUGGEST') {
      sku.baseSuggestedYuan = sku.suggestedSalePriceYuan || 0
    }
    syncSuggestedPrice(sku)
  }

  const formatSuggestFormula = (sku: SkuFormItem) => {
    if (sku.adjustMode === 'MARKET') return '销售建议价=市场价'
    if (sku.adjustMode === 'FIXED') return `固定售价 ${sku.fixedPriceYuan ?? 0}元`
    const base = sku.formulaBase === 'SUGGEST' ? '销售建议价' : '市场价'
    return `${base}*${sku.percent ?? 0}%${sku.op ?? '+'}${sku.amount ?? 0}元`
  }

  const formatSkuSuppliers = (suppliers?: SupplierSimpleInfo[]) => {
    if (!suppliers?.length) return '—'
    return suppliers
      .map((item) => [item.supplierCode, item.supplierName].filter(Boolean).join('-'))
      .join(' ')
  }

  const resetForm = () => {
    Object.assign(formData, {
      spuCode: undefined,
      spuName: '',
      brandId: undefined,
      productType: '',
      productClassification: '',
      sellableCategory: firstDictValue('supply_chain_sellable_category'),
      deliveryType: 'VIRTUAL',
      status: firstDictValue('supply_chain_sku_status'),
      fulfillmentType: firstDictValue('supply_chain_fulfillment_type'),
      ...defaultLimit(),
      skus: [createSku()]
    })
    formRef.value?.resetFields()
  }

  const addSku = () => {
    const sku = createSku()
    sku.fulfillmentType = formData.fulfillmentType || sku.fulfillmentType
    formData.skus.push(sku)
  }
  const removeSku = (index: number) => formData.skus.splice(index, 1)

  const mapSku = (sku: NonNullable<SpuDetail['skus']>[number]): SkuFormItem => {
    const marketPriceYuan = centsToYuan(sku.marketPrice) ?? 0
    const suggestedSalePriceYuan = centsToYuan(sku.suggestedSalePrice) ?? 0
    const sameAsMarket = round2(marketPriceYuan) === round2(suggestedSalePriceYuan)
    return {
      skuCode: sku.skuCode,
      skuName: sku.skuName || '',
      fulfillmentType: sku.fulfillmentType || firstDictValue('supply_chain_fulfillment_type'),
      faceValueYuan: centsToYuan(sku.faceValue) ?? 0,
      marketPriceYuan,
      suggestedSalePriceYuan,
      picUrl: sku.picUrl || '',
      detailPics: sku.detailPics?.length ? [...sku.detailPics] : [],
      description: sku.description || '',
      adjustMode: sameAsMarket ? 'MARKET' : 'CUSTOM',
      formulaBase: 'MARKET',
      percent: 50,
      op: '+',
      amount: 0,
      fixedPriceYuan: suggestedSalePriceYuan,
      baseSuggestedYuan: suggestedSalePriceYuan,
      supplyPrice: sku.supplyPrice,
      suppliers: sku.suppliers || [],
      totalInventory: sku.totalInventory ?? 0
    }
  }

  const open = async (spuCode?: string) => {
    dialogVisible.value = true
    isEdit.value = !!spuCode
    resetForm()
    brandList.value = await ProductBrandApi.getBrandList()
    categoryTree.value = await ProductCategoryApi.getCategoryList()
    if (!spuCode) return
    formLoading.value = true
    try {
      const data = await ProductApi.getProduct(spuCode)
      Object.assign(formData, {
        spuCode: data.spuCode,
        spuName: data.spuName,
        brandId: data.brandId,
        productType: data.productType,
        productClassification: data.productClassification,
        sellableCategory: data.sellableCategory || firstDictValue('supply_chain_sellable_category'),
        deliveryType: data.deliveryType || 'VIRTUAL',
        status: data.status != null ? String(data.status) : firstDictValue('supply_chain_sku_status'),
        fulfillmentType:
          data.skus?.[0]?.fulfillmentType || firstDictValue('supply_chain_fulfillment_type'),
        userLimitEnabled: data.skus?.[0]?.userLimitEnabled ?? false,
        userLimitPeriod: data.skus?.[0]?.userLimitPeriod || undefined,
        userLimitQuantity: data.skus?.[0]?.userLimitQuantity ?? 1,
        phoneBindLimitEnabled: data.skus?.[0]?.phoneBindLimitEnabled ?? false,
        phoneBindLimitQuantity: data.skus?.[0]?.phoneBindLimitQuantity ?? 1,
        skus: (data.skus || []).map(mapSku)
      })
      if (!formData.skus?.length) formData.skus = [createSku()]
    } finally {
      formLoading.value = false
    }
  }

  const buildPayload = (): SpuSaveReqVO => ({
    spuCode: formData.spuCode,
    spuName: formData.spuName,
    brandId: formData.brandId as number,
    sellableCategory: formData.sellableCategory || firstDictValue('supply_chain_sellable_category'),
    productType: formData.productType || '',
    productClassification: formData.productClassification || '',
    deliveryType: formData.deliveryType,
    status: formData.status != null && formData.status !== '' ? Number(formData.status) : undefined,
    skus: formData.skus.map((sku) => ({
      skuCode: sku.skuCode,
      skuName: sku.skuName,
      fulfillmentType: formData.fulfillmentType || firstDictValue('supply_chain_fulfillment_type'),
      faceValue: yuanToCents(sku.faceValueYuan) ?? 0,
      marketPrice: yuanToCents(sku.marketPriceYuan),
      suggestedSalePrice: yuanToCents(sku.suggestedSalePriceYuan),
      picUrl: sku.picUrl || undefined,
      detailPics: sku.detailPics?.length ? sku.detailPics : undefined,
      description: sku.description || undefined,
      userLimitEnabled: formData.userLimitEnabled,
      userLimitPeriod: formData.userLimitEnabled ? formData.userLimitPeriod : undefined,
      userLimitQuantity: formData.userLimitEnabled ? formData.userLimitQuantity : undefined,
      phoneBindLimitEnabled: formData.phoneBindLimitEnabled,
      phoneBindLimitQuantity: formData.phoneBindLimitEnabled
        ? formData.phoneBindLimitQuantity
        : undefined
    }))
  })

  const submitForm = async () => {
    await formRef.value?.validate()
    formLoading.value = true
    try {
      const payload = buildPayload()
      if (isEdit.value && formData.spuCode) {
        await ProductApi.updateProduct(formData.spuCode, payload)
        message.success(t('common.updateSuccess'))
      } else {
        await ProductApi.createProduct(payload)
        message.success(t('common.createSuccess'))
      }
      dialogVisible.value = false
      emit('success')
    } finally {
      formLoading.value = false
    }
  }

  defineExpose({ open })
</script>

<style scoped>
  .sku-spec-table :deep(.el-form-item) {
    margin-bottom: 0;
  }
  .sku-spec-table :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
  .sku-spec-table :deep(.el-upload-list--picture-card .el-upload-list__item),
  .sku-spec-table :deep(.el-upload--picture-card) {
    width: var(--upload-width);
    height: var(--upload-height);
  }
</style>
