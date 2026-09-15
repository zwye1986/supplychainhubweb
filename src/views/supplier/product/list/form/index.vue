<template>
  <el-dialog v-model="dialogVisible" :title="pageTitle" width="1100px" append-to-body>
    <el-form
      ref="formRef"
      v-loading="formLoading"
      class="mt-16px"
      :model="formData"
      :rules="formRules"
      label-width="140px"
    >
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
          <el-form-item label="副标题" prop="subtitle">
            <el-input v-model="formData.subtitle" maxlength="200" placeholder="请输入副标题" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品类型" prop="productType">
            <el-select v-model="formData.productType" placeholder="请选择商品类型">
              <el-option
                v-for="dict in getStrDictOptions(PRODUCT_TYPE_DICT)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="可售品类" prop="sellableCategory">
            <el-select v-model="formData.sellableCategory" placeholder="请选择可售品类">
              <el-option
                v-for="dict in getStrDictOptions(SELLABLE_CATEGORY_DICT)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品分类" prop="productClassification">
            <el-select v-model="formData.productClassification" placeholder="请选择商品分类">
              <el-option
                v-for="dict in getStrDictOptions(PRODUCT_CLASSIFICATION_DICT)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="主分类" prop="primaryCategoryId">
            <el-tree-select
              v-model="formData.primaryCategoryId"
              :data="categoryTree"
              check-strictly
              node-key="id"
              :props="{ label: 'name', children: 'children' }"
              placeholder="请选择主分类"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="品牌" prop="brandId">
            <el-select v-model="formData.brandId" placeholder="请选择品牌">
              <el-option v-for="item in brandList" :key="item.id" :label="item.name" :value="item.id!" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="配送方式" prop="deliveryType">
            <el-select v-model="formData.deliveryType" placeholder="请选择配送方式">
              <el-option
                v-for="item in DELIVERY_TYPE_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="封面图">
            <UploadImg v-model="formData.coverUrl" height="80px" width="80px" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="轮播图">
            <UploadImgs v-model="formData.sliderImageUrls" :limit="6" height="80px" width="80px" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="起购量">
            <el-input-number v-model="formData.minQuantity" :min="1" :precision="0" class="!w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="限购量">
            <el-input-number v-model="formData.maxQuantity" :min="1" :precision="0" class="!w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="使用说明">
            <el-input
              v-model="formData.useInstruction"
              type="textarea"
              maxlength="500"
              show-word-limit
              :rows="2"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="图文详情">
            <Editor v-model="formData.description" height="200px" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">SKU规格管理</el-divider>
      <el-button class="mb-12px" type="primary" plain @click="addSku">
        <Icon icon="ep:plus" class="mr-5px" /> 新增SKU
      </el-button>
      <div v-for="(sku, index) in formData.skus" :key="index" class="mb-16px rounded border p-16px">
        <div class="mb-12px flex items-center justify-between">
          <span class="font-600">SKU {{ index + 1 }}</span>
          <el-button link type="danger" :disabled="formData.skus.length <= 1" @click="removeSku(index)">
            删除
          </el-button>
        </div>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item :prop="`skus.${index}.skuName`" :rules="skuRequiredRules" label="SKU名称">
              <el-input v-model="sku.skuName" placeholder="如：月卡" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="SKU编码">
              <el-input v-model="sku.skuCode" placeholder="新增时可空，由系统生成" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item
              :prop="`skus.${index}.fulfillmentType`"
              :rules="skuRequiredRules"
              label="履约方式"
            >
              <el-select v-model="sku.fulfillmentType" placeholder="请选择履约方式">
                <el-option
                  v-for="item in FULFILLMENT_TYPE_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :prop="`skus.${index}.faceValueYuan`" :rules="skuPriceRules" label="面值（元）">
              <el-input-number v-model="sku.faceValueYuan" :min="0" :precision="2" class="!w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="市场价（元）">
              <el-input-number v-model="sku.marketPriceYuan" :min="0" :precision="2" class="!w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="销售建议价（元）">
              <el-input-number
                v-model="sku.suggestedSalePriceYuan"
                :min="0"
                :precision="2"
                class="!w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="是否含税">
              <el-switch v-model="sku.taxIncluded" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="税率（%）">
              <el-input-number v-model="sku.taxRatePercent" :min="0" :precision="2" class="!w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="起购量">
              <el-input-number v-model="sku.minQuantity" :min="1" :precision="0" class="!w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="限购量">
              <el-input-number v-model="sku.maxQuantity" :min="1" :precision="0" class="!w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="每人限购">
              <div class="flex flex-wrap items-center gap-8px">
                <el-checkbox v-model="sku.userLimitEnabled">开启</el-checkbox>
                <el-select
                  v-if="sku.userLimitEnabled"
                  v-model="sku.userLimitPeriod"
                  class="!w-120px"
                >
                  <el-option
                    v-for="item in LIMIT_PERIOD_OPTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <el-input-number
                  v-if="sku.userLimitEnabled"
                  v-model="sku.userLimitQuantity"
                  :min="1"
                  :precision="0"
                />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每订单限购">
              <el-checkbox v-model="sku.orderLimitEnabled">开启</el-checkbox>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="绑定手机号限购">
              <div class="flex flex-wrap items-center gap-8px">
                <el-checkbox v-model="sku.phoneBindLimitEnabled">开启</el-checkbox>
                <el-select
                  v-if="sku.phoneBindLimitEnabled"
                  v-model="sku.phoneBindLimitPeriod"
                  class="!w-120px"
                >
                  <el-option
                    v-for="item in LIMIT_PERIOD_OPTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <el-input-number
                  v-if="sku.phoneBindLimitEnabled"
                  v-model="sku.phoneBindLimitQuantity"
                  :min="1"
                  :precision="0"
                />
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
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
  PRODUCT_STATUS,
  SpuSaveReqVO
} from '@/api/product'
import { getStrDictOptions } from '@/utils/dict'
import { centsToYuan, yuanToCents } from '@/views/supplier/utils/constants'
import {
  DELIVERY_TYPE_OPTIONS,
  FULFILLMENT_TYPE_OPTIONS,
  LIMIT_PERIOD_OPTIONS,
  PRODUCT_CLASSIFICATION_DICT,
  PRODUCT_TYPE_DICT,
  SELLABLE_CATEGORY_DICT
} from '@/views/supplier/product/utils/constants'

defineOptions({ name: 'ProductListForm' })

interface SkuFormItem {
  skuCode?: string
  skuName: string
  fulfillmentType: string
  faceValueYuan?: number
  marketPriceYuan?: number
  suggestedSalePriceYuan?: number
  taxIncluded?: boolean
  taxRatePercent?: number
  minQuantity?: number
  maxQuantity?: number
  userLimitEnabled?: boolean
  userLimitPeriod?: string
  userLimitQuantity?: number
  orderLimitEnabled?: boolean
  phoneBindLimitEnabled?: boolean
  phoneBindLimitPeriod?: string
  phoneBindLimitQuantity?: number
  status?: number
}

interface SpuFormData {
  spuCode?: string
  spuName: string
  subtitle?: string
  brandId?: number
  primaryCategoryId?: number
  sellableCategory?: string
  productType?: string
  productClassification?: string
  coverUrl?: string
  sliderImageUrls: string[]
  useInstruction?: string
  description?: string
  deliveryType?: string
  minQuantity?: number
  maxQuantity?: number
  status?: number
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

const createSku = (): SkuFormItem => ({
  skuName: '',
  skuCode: '',
  fulfillmentType: '',
  faceValueYuan: 0,
  marketPriceYuan: 0,
  suggestedSalePriceYuan: 0,
  taxIncluded: true,
  taxRatePercent: 0,
  userLimitEnabled: false,
  userLimitPeriod: 'DAY',
  userLimitQuantity: 1,
  orderLimitEnabled: false,
  phoneBindLimitEnabled: false,
  phoneBindLimitPeriod: 'DAY',
  phoneBindLimitQuantity: 1
})

const formData = reactive<SpuFormData>({
  spuName: '',
  productType: '',
  sellableCategory: '',
  productClassification: '',
  deliveryType: 'VIRTUAL',
  sliderImageUrls: [],
  status: PRODUCT_STATUS.DRAFT,
  skus: [createSku()]
})

const skuRequiredRules = [{ required: true, message: '该项为必填项', trigger: 'blur' }]
const skuPriceRules = [{ required: true, message: '请输入面值', trigger: 'blur' }]
const formRules = {
  spuName: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  productType: [{ required: true, message: '请选择商品类型', trigger: 'change' }],
  sellableCategory: [{ required: true, message: '请选择可售品类', trigger: 'change' }],
  productClassification: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  brandId: [{ required: true, message: '请选择品牌', trigger: 'change' }]
}
const pageTitle = computed(() => (isEdit.value ? '编辑商品' : '新增商品'))

const resetForm = () => {
  Object.assign(formData, {
    spuCode: undefined,
    spuName: '',
    subtitle: undefined,
    brandId: undefined,
    primaryCategoryId: undefined,
    sellableCategory: '',
    productType: '',
    productClassification: '',
    coverUrl: undefined,
    sliderImageUrls: [],
    useInstruction: undefined,
    description: '',
    deliveryType: 'VIRTUAL',
    minQuantity: undefined,
    maxQuantity: undefined,
    status: PRODUCT_STATUS.DRAFT,
    skus: [createSku()]
  })
  formRef.value?.resetFields()
}

const addSku = () => formData.skus.push(createSku())
const removeSku = (index: number) => formData.skus.splice(index, 1)

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
      subtitle: data.subtitle,
      brandId: data.brandId,
      primaryCategoryId: data.primaryCategoryId,
      sellableCategory: data.sellableCategory,
      productType: data.productType,
      productClassification: data.productClassification,
      coverUrl: data.coverUrl,
      sliderImageUrls: data.sliderImageUrls || [],
      useInstruction: data.useInstruction,
      description: data.description || '',
      deliveryType: data.deliveryType || 'VIRTUAL',
      minQuantity: data.minQuantity,
      maxQuantity: data.maxQuantity,
      status: data.status,
      skus: (data.skus || []).map((sku) => ({
        skuCode: sku.skuCode,
        skuName: sku.skuName || '',
        fulfillmentType: sku.fulfillmentType || '',
        faceValueYuan: centsToYuan(sku.faceValue) ?? 0,
        marketPriceYuan: centsToYuan(sku.marketPrice),
        suggestedSalePriceYuan: centsToYuan(sku.suggestedSalePrice),
        taxIncluded: sku.taxIncluded,
        taxRatePercent: sku.taxRate != null ? Number((sku.taxRate * 100).toFixed(2)) : 0,
        minQuantity: sku.minQuantity,
        maxQuantity: sku.maxQuantity,
        userLimitEnabled: sku.userLimitEnabled,
        userLimitPeriod: sku.userLimitPeriod || 'DAY',
        userLimitQuantity: sku.userLimitQuantity,
        orderLimitEnabled: sku.orderLimitEnabled,
        phoneBindLimitEnabled: sku.phoneBindLimitEnabled,
        phoneBindLimitPeriod: sku.phoneBindLimitPeriod || 'DAY',
        phoneBindLimitQuantity: sku.phoneBindLimitQuantity,
        status: sku.status
      }))
    })
    if (!formData.skus?.length) formData.skus = [createSku()]
  } finally {
    formLoading.value = false
  }
}

const buildPayload = (): SpuSaveReqVO => ({
  spuCode: formData.spuCode,
  spuName: formData.spuName,
  subtitle: formData.subtitle,
  brandId: formData.brandId as number,
  primaryCategoryId: formData.primaryCategoryId,
  sellableCategory: formData.sellableCategory || '',
  productType: formData.productType || '',
  productClassification: formData.productClassification || '',
  coverUrl: formData.coverUrl,
  sliderImageUrls: formData.sliderImageUrls,
  useInstruction: formData.useInstruction,
  description: formData.description,
  deliveryType: formData.deliveryType,
  minQuantity: formData.minQuantity,
  maxQuantity: formData.maxQuantity,
  status: formData.status,
  skus: formData.skus.map((sku) => ({
    skuCode: sku.skuCode,
    skuName: sku.skuName,
    fulfillmentType: sku.fulfillmentType,
    faceValue: yuanToCents(sku.faceValueYuan) ?? 0,
    marketPrice: yuanToCents(sku.marketPriceYuan),
    suggestedSalePrice: yuanToCents(sku.suggestedSalePriceYuan),
    taxIncluded: sku.taxIncluded,
    taxRate: sku.taxRatePercent != null ? Number((sku.taxRatePercent / 100).toFixed(4)) : undefined,
    minQuantity: sku.minQuantity,
    maxQuantity: sku.maxQuantity,
    userLimitEnabled: sku.userLimitEnabled,
    userLimitPeriod: sku.userLimitEnabled ? sku.userLimitPeriod : undefined,
    userLimitQuantity: sku.userLimitEnabled ? sku.userLimitQuantity : undefined,
    orderLimitEnabled: sku.orderLimitEnabled,
    phoneBindLimitEnabled: sku.phoneBindLimitEnabled,
    phoneBindLimitPeriod: sku.phoneBindLimitEnabled ? sku.phoneBindLimitPeriod : undefined,
    phoneBindLimitQuantity: sku.phoneBindLimitEnabled ? sku.phoneBindLimitQuantity : undefined,
    status: sku.status
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
