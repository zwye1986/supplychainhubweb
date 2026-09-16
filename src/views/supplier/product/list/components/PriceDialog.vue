<template>
  <el-dialog v-model="dialogVisible" title="商品定价" width="640px" append-to-body>
    <el-alert
      class="mb-16px"
      type="info"
      :closable="false"
      title="定价规则将按所选调价方式回写 SKU 销售建议价。"
    />
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
      <el-form-item label="调价方式" prop="adjustMode">
        <el-radio-group v-model="formData.adjustMode">
          <el-radio value="MARKET">按照销售建议价=市场价</el-radio>
          <el-radio value="CUSTOM">自定义设置</el-radio>
          <el-radio value="FIXED">固定值</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="formData.adjustMode === 'CUSTOM'" label="销售建议价" prop="percent">
        <div class="flex flex-wrap items-center gap-8px">
          <el-select v-model="formData.base" class="!w-140px">
            <el-option label="市场价" value="MARKET" />
            <el-option label="销售建议价" value="SUGGEST" />
          </el-select>
          <span>*</span>
          <el-input-number :controls="false" v-model="formData.percent" :min="0.01" :precision="2" />
          <span>%</span>
          <el-select v-model="formData.op" class="!w-80px">
            <el-option label="+" value="+" />
            <el-option label="-" value="-" />
            <el-option label="*" value="*" />
            <el-option label="/" value="/" />
          </el-select>
          <el-input-number :controls="false" v-model="formData.amount" :min="0" :precision="2" />
          <span>元</span>
        </div>
      </el-form-item>
      <el-form-item v-if="formData.adjustMode === 'FIXED'" label="固定售价" prop="fixedPrice">
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
import { ProductApi, toSpuSaveReq } from '@/api/product'
import { yuanToCents } from '@/views/supplier/utils/constants'

defineOptions({ name: 'ProductPriceDialog' })

const message = useMessage()
const emit = defineEmits(['success'])
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const spuCodes = ref<string[]>([])
const formData = reactive({
  adjustMode: 'CUSTOM' as 'MARKET' | 'CUSTOM' | 'FIXED',
  base: 'MARKET' as 'MARKET' | 'SUGGEST',
  percent: 50,
  op: '+' as '+' | '-' | '*' | '/',
  amount: 0,
  fixedPrice: undefined as number | undefined
})
const formRules = {
  adjustMode: [{ required: true, message: '请选择调价方式', trigger: 'change' }]
}

const calcSuggested = (marketPrice = 0, suggestedSalePrice = 0) => {
  if (formData.adjustMode === 'MARKET') return marketPrice
  if (formData.adjustMode === 'FIXED') return yuanToCents(formData.fixedPrice) ?? 0
  const base = formData.base === 'SUGGEST' ? suggestedSalePrice : marketPrice
  const percentPart = Math.round((base * (formData.percent || 0)) / 100)
  const amountCents = yuanToCents(formData.amount) ?? 0
  if (formData.op === '-') return Math.max(percentPart - amountCents, 0)
  if (formData.op === '*') return percentPart * amountCents
  if (formData.op === '/') return amountCents ? Math.round(percentPart / amountCents) : percentPart
  return percentPart + amountCents
}

const open = (codes: string[]) => {
  spuCodes.value = codes
  dialogVisible.value = true
}

const submit = async () => {
  await formRef.value?.validate()
  if (formData.adjustMode === 'CUSTOM' && !formData.percent) {
    message.warning('请填写百分比')
    return
  }
  if (formData.adjustMode === 'FIXED' && !formData.fixedPrice) {
    message.warning('请填写固定售价')
    return
  }
  formLoading.value = true
  try {
    for (const spuCode of spuCodes.value) {
      const detail = await ProductApi.getProduct(spuCode)
      const payload = toSpuSaveReq(detail)
      payload.skus = (payload.skus || []).map((sku) => ({
        ...sku,
        suggestedSalePrice: calcSuggested(sku.marketPrice, sku.suggestedSalePrice)
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
