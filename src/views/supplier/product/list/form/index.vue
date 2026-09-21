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
            <el-input v-model="formData.spuCode" disabled placeholder="由系统生成" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品类型" prop="productType">
            <ProductType v-model="formData.productType" :multiple="false" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品分类" prop="primaryCategoryId">
            <ProductCategory v-model="formData.primaryCategoryId" v-model:category-code="formData.productClassification" node-key="id" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="品牌" prop="brandCode">
            <el-select v-model="formData.brandCode" clearable placeholder="请选择品牌">
              <el-option v-for="item in brandList" :key="item.brandCode" :label="item.brandName" :value="item.brandCode" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品状态">
            <el-select v-model="formData.status" clearable placeholder="请选择">
              <el-option
                v-for="dict in getStrDictOptions('supply_chain_sku_status')"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="兑换方式" prop="">
            <el-select v-model="formData.fulfillmentType" clearable placeholder="请选择兑换方式" @change="onFulfillmentTypeChange">
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
        <el-table-column label="SKU详情图" min-width="110" align="center">
          <template #default="{ row }">
            <div class="sku-detail-pics-trigger" @click="openDetailPicsEditor(row)">
              <el-image
                v-if="row.detailPics?.[0]"
                :src="row.detailPics[0]"
                fit="cover"
                class="h-100px w-100px rounded"
              />
              <div v-else class="sku-detail-pics-empty">
                <Icon icon="ep:plus" />
              </div>
              <span v-if="row.detailPics?.length" class="sku-detail-pics-count">
                {{ row.detailPics.length }}/5
              </span>
            </div>
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
            <el-input-number :controls="false" v-model="row.marketPrice" :min="0" :precision="2" class="!w-full" />
          </template>
        </el-table-column>
        <el-table-column label="销售建议价（元）" min-width="360">
          <template #default="{ row }">
            <div class="flex flex-col gap-8px">
              <el-radio-group v-model="row.suggestedSalePriceRule.mode" @change="onAdjustModeChange(row)">
                <el-radio v-for="dict in getStrDictOptions('supply_chain_suggested_sale_price_mode')" :key="dict.value" :value="dict.value">
                  {{ dict.label }}
                </el-radio>
              </el-radio-group>
              <div v-if="row.suggestedSalePriceRule.mode === 'CUSTOM'" class="flex flex-wrap items-center gap-8px">
                <el-select v-model="row.suggestedSalePriceRule.base" clearable class="!w-140px">
                  <el-option label="市场价" value="MARKET_PRICE" />
                  <el-option label="销售建议价" value="SUGGESTED_SALE_PRICE" />
                </el-select>
                <span>*</span>
                <el-input-number :controls="false" v-model="row.suggestedSalePriceRule.percentage" :min="0.01" :precision="2" class="!w-110px" />
                <span>%</span>
                <el-select v-model="row.suggestedSalePriceRule.operator" clearable class="!w-90px">
                  <el-option v-for="dict in getStrDictOptions('supply_chain_suggested_sale_price_operator')" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
                <el-input-number :controls="false" v-model="row.suggestedSalePriceRule.operand" :min="0" :precision="2" class="!w-110px" />
                <span>元</span>
              </div>
              <div v-if="row.suggestedSalePriceRule.mode === 'FIXED'" class="flex items-center gap-8px">
                <span>固定售价</span>
                <el-input-number :controls="false" :model-value="centsToYuan(row.suggestedSalePriceRule.fixedPriceCents)" :min="0" :precision="2" class="!w-140px"
                  @update:model-value="(val) => onFixedPriceChange(row, val)" />
              </div>
              <div class="text-12px text-gray-500">{{ formatSuggestFormula(row) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="面值（元）" min-width="110" align="right">
          <template #default="{ row }">
            <el-input-number :controls="false" v-model="row.faceValue" :min="0" :precision="2" class="!w-full" />
          </template>
        </el-table-column>
        <el-table-column label="总库存" min-width="110" align="right">
          <template #default="{ row }">
            <el-input-number :controls="false" v-model="row.skuInventory" :min="0" :precision="0" class="!w-full" />
          </template>
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
            <el-option v-for="dict in getStrDictOptions('supply_chain_purchase_limit_period')" :key="dict.value" :label="dict.label" :value="dict.value" />
          </el-select>
          <span v-if="formData.userLimitEnabled">限购</span>
          <el-input-number :controls="false" v-if="formData.userLimitEnabled" v-model="formData.userLimitQuantity" :min="1" :precision="0" />
        </div>
      </el-form-item>
      <el-form-item v-if="!isCardFulfillment" label="绑定手机号限购">
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

  <el-dialog
    v-model="detailPicsDialogVisible"
    :title="detailPicsDialogTitle"
    width="680px"
    append-to-body
    destroy-on-close
  >
    <UploadImgs
      v-if="detailPicsEditingSku"
      v-model="detailPicsEditingSku.detailPics"
      :limit="5"
      height="100px"
      width="100px"
      :drag="false"
    />
    <template #footer>
      <el-button type="primary" @click="detailPicsDialogVisible = false">完成</el-button>
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
    ProductTypeApi,
    SkuDetail,
    SkuItemSaveReqVO,
    SpuDetail,
    SpuSaveReqVO,
    SuggestedSalePriceRule
  } from '@/api/product'
  import { getDictLabel, getStrDictOptions } from '@/utils/dict'
  import { centsToYuan, yuanToCents } from '@/views/supplier/utils/constants'

  defineOptions({ name: 'ProductListForm' })

  const PRICE_RULE_MODE = {
    MARKET: 'MARKET',
    CUSTOM: 'CUSTOM',
    FIXED: 'FIXED'
  }
  const PRICE_RULE_BASE = {
    MARKET_PRICE: 'MARKET_PRICE',
    SUGGESTED_SALE_PRICE: 'SUGGESTED_SALE_PRICE'
  }
  interface SkuFormItem {
    skuCode?: string
    skuName: string
    faceValue?: number
    marketPrice?: number
    picUrl?: string
    detailPics: string[]
    description?: string
    suggestedSalePriceRule: SuggestedSalePriceRule
    skuInventory?: number
  }

  interface SpuFormData {
    spuCode?: string
    spuName: string
    brandCode?: number | string
    sellableCategory?: string
    productType?: string
    primaryCategoryId?: number
    productClassification?: string
    deliveryType?: string
    status?: string
    fulfillmentType?: string
    userLimitEnabled?: boolean
    userLimitPeriod?: string
    userLimitQuantity?: number
    phoneBindLimitEnabled?: boolean
    phoneBindLimitPeriod?: string
    phoneBindLimitQuantity?: number
    skus: SkuFormItem[]
  }

  const message = useMessage()
  const { t } = useI18n()
  const emit = defineEmits<{
    success: [spuCode?: string]
  }>()

  const dialogVisible = ref(false)
  const formRef = ref()
  const formLoading = ref(false)
  const isEdit = ref(false)
  const brandList = ref<ProductBrandVO[]>([])
  const detailPicsDialogVisible = ref(false)
  const detailPicsEditingSku = ref<SkuFormItem | null>(null)
  const detailPicsDialogTitle = computed(() =>
    detailPicsEditingSku.value?.skuName
      ? `SKU详情图 · ${detailPicsEditingSku.value.skuName}`
      : 'SKU详情图'
  )

  const openDetailPicsEditor = (row: SkuFormItem) => {
    if (!Array.isArray(row.detailPics)) row.detailPics = []
    detailPicsEditingSku.value = row
    detailPicsDialogVisible.value = true
  }

  const firstDictValue = (dictType: string) => getStrDictOptions(dictType)[0]?.value || ''
  const PRODUCT_STATUS_DICT = 'supply_chain_sku_status'
  const toStatusDictValue = (status?: string | number | null) =>
    status == null || status === '' ? firstDictValue(PRODUCT_STATUS_DICT) : String(status)

  const createPriceRule = (): SuggestedSalePriceRule => ({
    mode: PRICE_RULE_MODE.CUSTOM,
    base: PRICE_RULE_BASE.MARKET_PRICE,
    percentage: undefined,
    operator: undefined,
    operand: 0,
    fixedPriceCents: undefined
  })

  const createSku = (): SkuFormItem => ({
    skuName: '',
    skuCode: '',
    faceValue: 0,
    marketPrice: 0,
    picUrl:'',
    detailPics: [],
    description: '',
    suggestedSalePriceRule: createPriceRule(),
    skuInventory: 0
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
    primaryCategoryId: undefined,
    productClassification: undefined,
    sellableCategory: '',
    deliveryType: 'VIRTUAL',
    status: firstDictValue('supply_chain_sku_status'),
    fulfillmentType: null,
    ...defaultLimit(),
    skus: [createSku()]
  })

  const noLogistics = computed({
    get: () => formData.deliveryType === 'VIRTUAL',
    set: (val: boolean) => {
      formData.deliveryType = val ? 'VIRTUAL' : undefined
    }
  })

  const isCardFulfillment = computed(() => {
    const type = formData.fulfillmentType
    if (type == null || type === '') return false
    const code = String(type).toUpperCase()
    if (['CARD', 'CARD_SECRET', 'CARD_CODE', 'CARD_PWD', 'CARD_KEY', 'CARD_PIN', 'CDK'].includes(code)) {
      return true
    }
    const text = `${getDictLabel('supply_chain_fulfillment_type', type) || ''} ${type}`
    return /卡号|卡密/.test(text)
  })

  const disablePhoneBindLimit = () => {
    formData.phoneBindLimitEnabled = false
  }

  const onFulfillmentTypeChange = () => {
    if (isCardFulfillment.value) disablePhoneBindLimit()
  }

  const skuRequiredRules = [{ required: true, message: '该项为必填项', trigger: 'blur' }]
  const formRules = {
    spuName: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
    productType: [{ required: true, message: '请选择商品类型', trigger: 'change' }],
    primaryCategoryId: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
    brandCode: [{ required: true, message: '请选择品牌', trigger: 'change' }],
    fulfillmentType: [{ required: true, message: '请选择兑换方式', trigger: 'change' }]
  }
  const pageTitle = computed(() => (isEdit.value ? '编辑商品' : '新增商品'))

  const onAdjustModeChange = (sku: SkuFormItem) => {
    const rule = sku.suggestedSalePriceRule
    if (rule.mode === PRICE_RULE_MODE.FIXED && rule.fixedPriceCents == null) {
      rule.fixedPriceCents = yuanToCents(sku.marketPrice || 0)
    }
  }

  const onFixedPriceChange = (sku: SkuFormItem, yuan?: number | null) => {
    sku.suggestedSalePriceRule.fixedPriceCents = yuanToCents(yuan)
  }

  const formatSuggestFormula = (sku: SkuFormItem) => {
    const rule = sku.suggestedSalePriceRule
    if (rule.mode === PRICE_RULE_MODE.MARKET) {
      return getDictLabel('supply_chain_suggested_sale_price_mode', rule.mode) || '销售建议价=市场价'
    }
    if (rule.mode === PRICE_RULE_MODE.FIXED) {
      return `固定售价 ${centsToYuan(rule.fixedPriceCents) ?? 0}元`
    }
    const base = rule.base === PRICE_RULE_BASE.SUGGESTED_SALE_PRICE ? '销售建议价' : '市场价'
    const opLabel =
      getDictLabel('supply_chain_suggested_sale_price_operator', rule.operator) ||
      rule.operator ||
      '+'
    return `${base}*${rule.percentage ?? 0}%${opLabel}${rule.operand ?? 0}元`
  }

  const resetForm = () => {
    Object.assign(formData, {
      spuCode: undefined,
      spuName: '',
      brandCode: undefined,
      productType: '',
      primaryCategoryId: undefined,
      productClassification: undefined,
      sellableCategory: firstDictValue('supply_chain_sellable_category'),
      deliveryType: 'VIRTUAL',
      status: firstDictValue('supply_chain_sku_status'),
      fulfillmentType: null,
      ...defaultLimit(),
      skus: [createSku()]
    })
    formRef.value?.resetFields()
  }

  const addSku = () => {
    formData.skus.push(createSku())
  }
  const removeSku = (index: number) => formData.skus.splice(index, 1)

  const mapSkuToForm = (sku: SkuDetail): SkuFormItem => ({
    ...createSku(),
    skuCode: sku.skuCode,
    skuName: sku.skuName,
    picUrl: sku.picUrl,
    detailPics: Array.isArray(sku.detailPics) ? sku.detailPics : [],
    description: sku.description,
    marketPrice: centsToYuan(sku.marketPrice) ?? 0,
    faceValue: centsToYuan(sku.faceValue) ?? 0,
    suggestedSalePriceRule: {
      ...createPriceRule(),
      ...sku.suggestedSalePriceRule
    },
    skuInventory: sku.skuInventory ?? sku.totalInventory ?? 0
  })

  const toSkuSaveItem = (sku: SkuFormItem): SkuItemSaveReqVO => {
    const rule = sku.suggestedSalePriceRule
    return {
      skuCode: sku.skuCode,
      skuName: sku.skuName,
      picUrl: sku.picUrl,
      detailPics: sku.detailPics,
      description: sku.description,
      marketPrice: yuanToCents(sku.marketPrice),
      faceValue: yuanToCents(sku.faceValue) ?? 0,
      skuInventory: sku.skuInventory ?? 0,
      suggestedSalePriceRule: {
        mode: rule.mode,
        base: rule.base,
        percentage: rule.percentage,
        operator: rule.operator,
        operand: rule.operand,
        fixedPriceCents: rule.fixedPriceCents
      }
    }
  }

  const applyProductDetail = (data: SpuDetail) => {
    Object.assign(formData, {
      ...data,
      status: toStatusDictValue(data.status),
      skus: (data.skus || []).map(mapSkuToForm)
    })
    if (!formData.skus?.length) formData.skus = [createSku()]
    if (isCardFulfillment.value) disablePhoneBindLimit()
  }

  const loadProduct = async (spuCode: string) => {
    applyProductDetail(await ProductApi.getProduct(spuCode))
  }

  const open = async (spuCode?: string) => {
    dialogVisible.value = true
    isEdit.value = !!spuCode
    resetForm()
    brandList.value = await ProductBrandApi.getBrandList()
    if (!spuCode) return
    formLoading.value = true
    try {
      await loadProduct(spuCode)
    } finally {
      formLoading.value = false
    }
  }

  const submitForm = async () => {
    await formRef.value?.validate()
    formLoading.value = true
    try {
      const payload = {
        ...formData,
        status:
          formData.status != null && formData.status !== '' && /^\d+$/.test(formData.status)
            ? Number(formData.status)
            : formData.status,
        userLimitEnabled: !!formData.userLimitEnabled,
        phoneBindLimitEnabled: isCardFulfillment.value ? false : !!formData.phoneBindLimitEnabled,
        skus: formData.skus.map(toSkuSaveItem)
      } as SpuSaveReqVO
      if (!payload.userLimitEnabled) {
        delete payload.userLimitPeriod
        delete payload.userLimitQuantity
      }
      if (!payload.phoneBindLimitEnabled) {
        delete payload.phoneBindLimitPeriod
        delete payload.phoneBindLimitQuantity
      }
      let savedSpuCode = formData.spuCode
      if (isEdit.value && formData.spuCode) {
        await ProductApi.updateProduct(formData.spuCode, payload)
      } else {
        delete payload.spuCode
        const created = await ProductApi.createProduct(payload)
        savedSpuCode =
          typeof created === 'string'
            ? created
            : created?.spuCode || created?.data || formData.spuCode
      }
      if (savedSpuCode) {
        await loadProduct(savedSpuCode)
        isEdit.value = true
      }
      message.success('保存成功')
      dialogVisible.value = false
      emit('success', savedSpuCode)
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
  .sku-detail-pics-trigger {
    position: relative;
    display: inline-block;
    cursor: pointer;
  }
  .sku-detail-pics-empty {
    display: flex;
    width: 100px;
    height: 100px;
    align-items: center;
    justify-content: center;
    border: 1px dashed var(--el-border-color-darker);
    border-radius: 8px;
    color: var(--el-text-color-secondary);
    font-size: 28px;
  }
  .sku-detail-pics-trigger:hover .sku-detail-pics-empty {
    border-color: var(--el-color-primary);
  }
  .sku-detail-pics-count {
    position: absolute;
    right: 0;
    bottom: 0;
    padding: 0 6px;
    border-radius: 4px 0 8px 0;
    background: rgb(0 0 0 / 60%);
    color: #fff;
    font-size: 12px;
    line-height: 18px;
  }
</style>
