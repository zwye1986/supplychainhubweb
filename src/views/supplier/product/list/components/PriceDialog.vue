<template>
  <el-dialog v-model="dialogVisible" title="商品定价" width="640px" append-to-body>
    <el-alert
      class="mb-16px"
      type="info"
      :closable="false"
      title="定价规则将按所选调价方式回写 SKU 销售建议价。"
    />
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
      <el-form-item label="调价方式" prop="mode">
        <el-radio-group v-model="formData.mode">
          <el-radio
            v-for="dict in getStrDictOptions('supply_chain_suggested_sale_price_mode')"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="formData.mode === 'CUSTOM'" label="销售建议价" prop="percentage">
        <div class="flex flex-wrap items-center gap-8px">
          <el-select v-model="formData.base" class="!w-140px">
            <el-option label="市场价" value="MARKET_PRICE" />
            <el-option label="销售建议价" value="SUGGESTED_SALE_PRICE" />
          </el-select>
          <span>*</span>
          <el-input-number :controls="false" v-model="formData.percentage" :min="0.01" :precision="2" />
          <span>%</span>
          <el-select v-model="formData.operator" class="!w-90px">
            <el-option
              v-for="dict in getStrDictOptions('supply_chain_suggested_sale_price_operator')"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
          <el-input-number :controls="false" v-model="formData.operand" :min="0" :precision="2" />
          <span>元</span>
        </div>
      </el-form-item>
      <el-form-item v-if="formData.mode === 'FIXED'" label="固定售价" prop="fixedPrice">
        <el-input-number :controls="false" v-model="formData.fixedPrice" :min="0.01" :precision="2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="formLoading" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ProductApi, SuggestedSalePriceRule, toSpuSaveReq } from '@/api/product'
import { getStrDictOptions } from '@/utils/dict'
import { yuanToCents } from '@/views/supplier/utils/constants'

defineOptions({ name: 'ProductPriceDialog' })

const message = useMessage()
const emit = defineEmits(['success'])
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const spuCodes = ref<string[]>([])
const formData = reactive({
  mode: 'CUSTOM',
  base: 'MARKET_PRICE',
  percentage: 50,
  operator: 'ADD',
  operand: 0,
  fixedPrice: undefined as number | undefined
})
const formRules = {
  mode: [{ required: true, message: '请选择调价方式', trigger: 'change' }]
}

const buildPriceRule = (): SuggestedSalePriceRule => ({
  mode: formData.mode,
  base: formData.base,
  percentage: formData.percentage,
  operator: formData.operator,
  operand: formData.operand,
  fixedPriceCents: yuanToCents(formData.fixedPrice)
})

const open = (codes: string[]) => {
  spuCodes.value = codes
  dialogVisible.value = true
}

const submit = async () => {
  await formRef.value?.validate()
  if (formData.mode === 'CUSTOM' && !formData.percentage) {
    message.warning('请填写百分比')
    return
  }
  if (formData.mode === 'FIXED' && !formData.fixedPrice) {
    message.warning('请填写固定售价')
    return
  }
  formLoading.value = true
  try {
    const suggestedSalePriceRule = buildPriceRule()
    for (const spuCode of spuCodes.value) {
      const detail = await ProductApi.getProduct(spuCode)
      const payload = toSpuSaveReq(detail)
      payload.skus = (payload.skus || []).map((sku) => ({
        ...sku,
        suggestedSalePriceRule
      }))
      await ProductApi.updateProduct(spuCode, payload)
    }
    message.success('定价已保存')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
