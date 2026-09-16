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
          <el-form-item label="商品类型" prop="productType">
            <el-select v-model="formData.productType" placeholder="请选择商品类型">
              <el-option
                v-for="dict in getStrDictOptions('supply_chain_product_type')"
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
                v-for="dict in getStrDictOptions('supply_chain_product_classification')"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="品牌" prop="brandId">
            <el-select v-model="formData.brandId" placeholder="请选择品牌">
              <el-option
                v-for="item in brandList"
                :key="item.brandCode"
                :label="item.brandName"
                :value="item.brandCode!"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品状态">
            <el-select v-model="formData.status" disabled>
              <el-option
                v-for="dict in getStrDictOptions('supply_chain_product_status')"
                :key="dict.value"
                :label="dict.label"
                :value="Number(dict.value)"
              />
            </el-select>
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
        </el-row>

        <el-divider content-position="left">限购设置</el-divider>
        <el-form-item label="每人限购">
          <div class="flex flex-wrap items-center gap-8px">
            <el-checkbox v-model="sku.userLimitEnabled">开启</el-checkbox>
            <el-select v-if="sku.userLimitEnabled" v-model="sku.userLimitPeriod" class="!w-120px">
              <el-option
                v-for="dict in getStrDictOptions('supply_chain_limit_period')"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
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
        <el-form-item label="每个订单限购">
          <div class="flex flex-wrap items-center gap-8px">
            <el-checkbox v-model="sku.phoneBindLimitEnabled">开启</el-checkbox>
            <el-select
              v-if="sku.phoneBindLimitEnabled"
              v-model="sku.phoneBindLimitPeriod"
              class="!w-120px"
            >
              <el-option
                v-for="dict in getStrDictOptions('supply_chain_limit_period')"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
            <el-input-number
              v-if="sku.phoneBindLimitEnabled"
              v-model="sku.phoneBindLimitQuantity"
              :min="1"
              :precision="0"
            />
            <span class="text-12px text-red-500">权益商品专用</span>
          </div>
        </el-form-item>
      </div>

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
  PRODUCT_STATUS,
  SpuDetail,
  SpuSaveReqVO
} from '@/api/product'
import { getStrDictOptions } from '@/utils/dict'
import { centsToYuan, yuanToCents } from '@/views/supplier/utils/constants'

defineOptions({ name: 'ProductListForm' })

interface SkuFormItem {
  skuCode?: string
  skuName: string
  fulfillmentType: string
  faceValueYuan?: number
  marketPriceYuan?: number
  suggestedSalePriceYuan?: number
  userLimitEnabled?: boolean
  userLimitPeriod?: string
  userLimitQuantity?: number
  phoneBindLimitEnabled?: boolean
  phoneBindLimitPeriod?: string
  phoneBindLimitQuantity?: number
}

interface SpuFormData {
  spuCode?: string
  spuName: string
  brandId?: number | string
  sellableCategory?: string
  productType?: string
  productClassification?: string
  deliveryType?: string
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

const firstDictValue = (dictType: string) => getStrDictOptions(dictType)[0]?.value || ''

const createSku = (): SkuFormItem => ({
  skuName: '',
  skuCode: '',
  fulfillmentType: firstDictValue('supply_chain_fulfillment_type'),
  faceValueYuan: 0,
  marketPriceYuan: 0,
  suggestedSalePriceYuan: 0,
  userLimitEnabled: false,
  userLimitPeriod: 'DAY',
  userLimitQuantity: 1,
  phoneBindLimitEnabled: false,
  phoneBindLimitPeriod: 'DAY',
  phoneBindLimitQuantity: 1
})

const formData = reactive<SpuFormData>({
  spuName: '',
  productType: '',
  productClassification: '',
  sellableCategory: '',
  deliveryType: 'VIRTUAL',
  status: PRODUCT_STATUS.DRAFT,
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
  brandId: [{ required: true, message: '请选择品牌', trigger: 'change' }]
}
const pageTitle = computed(() => (isEdit.value ? '编辑商品' : '新增商品'))

const resetForm = () => {
  Object.assign(formData, {
    spuCode: undefined,
    spuName: '',
    brandId: undefined,
    productType: '',
    productClassification: '',
    sellableCategory: firstDictValue('supply_chain_sellable_category'),
    deliveryType: 'VIRTUAL',
    status: PRODUCT_STATUS.DRAFT,
    skus: [createSku()]
  })
  formRef.value?.resetFields()
}

const addSku = () => formData.skus.push(createSku())
const removeSku = (index: number) => formData.skus.splice(index, 1)

const mapSku = (sku: NonNullable<SpuDetail['skus']>[number]): SkuFormItem => ({
  skuCode: sku.skuCode,
  skuName: sku.skuName || '',
  fulfillmentType: sku.fulfillmentType || firstDictValue('supply_chain_fulfillment_type'),
  faceValueYuan: centsToYuan(sku.faceValue) ?? 0,
  marketPriceYuan: centsToYuan(sku.marketPrice),
  suggestedSalePriceYuan: centsToYuan(sku.suggestedSalePrice),
  userLimitEnabled: sku.userLimitEnabled,
  userLimitPeriod: sku.userLimitPeriod || 'DAY',
  userLimitQuantity: sku.userLimitQuantity,
  phoneBindLimitEnabled: sku.phoneBindLimitEnabled,
  phoneBindLimitPeriod: sku.phoneBindLimitPeriod || 'DAY',
  phoneBindLimitQuantity: sku.phoneBindLimitQuantity
})

const open = async (spuCode?: string) => {
  dialogVisible.value = true
  isEdit.value = !!spuCode
  resetForm()
  brandList.value = await ProductBrandApi.getBrandList()
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
      status: data.status,
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
  status: formData.status,
  skus: formData.skus.map((sku) => ({
    skuCode: sku.skuCode,
    skuName: sku.skuName,
    fulfillmentType: sku.fulfillmentType || firstDictValue('supply_chain_fulfillment_type'),
    faceValue: yuanToCents(sku.faceValueYuan) ?? 0,
    marketPrice: yuanToCents(sku.marketPriceYuan),
    suggestedSalePrice: yuanToCents(sku.suggestedSalePriceYuan),
    userLimitEnabled: sku.userLimitEnabled,
    userLimitPeriod: sku.userLimitEnabled ? sku.userLimitPeriod : undefined,
    userLimitQuantity: sku.userLimitEnabled ? sku.userLimitQuantity : undefined,
    phoneBindLimitEnabled: sku.phoneBindLimitEnabled,
    phoneBindLimitPeriod: sku.phoneBindLimitEnabled ? sku.phoneBindLimitPeriod : undefined,
    phoneBindLimitQuantity: sku.phoneBindLimitEnabled ? sku.phoneBindLimitQuantity : undefined
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
