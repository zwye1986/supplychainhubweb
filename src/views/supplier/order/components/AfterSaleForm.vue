<template>
  <el-dialog v-model="dialogVisible" title="申请售后" width="640px" append-to-body>
    <el-alert
      class="mb-16px"
      type="warning"
      :closable="false"
      title="请按照与用户沟通的实际结果录入，默认返回方式为上门取件，取件地址为下单地址"
    />
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="售后类型" prop="type">
        <el-select v-model="form.type">
          <el-option v-for="item in AFTER_SALE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="售后原因" prop="reason">
        <el-select v-model="form.reason">
          <el-option v-for="item in AFTER_SALE_REASON_OPTIONS" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="退货数量" prop="qty">
        <el-input-number :controls="false" v-model="form.qty" :min="1" :max="maxQty" />
      </el-form-item>
      <el-form-item label="问题描述" prop="description">
        <el-input v-model="form.description" type="textarea" maxlength="500" show-word-limit :rows="3" />
      </el-form-item>
      <el-form-item label="上传凭证">
        <UploadImgs v-model="form.pics" :limit="9" height="80px" width="80px" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { OrderApi } from '@/api/order'
import { AFTER_SALE_REASON_OPTIONS, AFTER_SALE_TYPE_OPTIONS } from '@/views/supplier/order/utils/constants'

defineOptions({ name: 'OrderAfterSaleForm' })

const message = useMessage()
const emit = defineEmits(['success'])
const dialogVisible = ref(false)
const loading = ref(false)
const formRef = ref()
const maxQty = ref(1)
const form = reactive({
  orderNo: '',
  itemId: undefined as number | undefined,
  type: 'REFUND_ONLY' as any,
  reason: '其他',
  qty: 1,
  description: '',
  pics: [] as string[]
})
const rules = {
  type: [{ required: true, message: '请选择售后类型', trigger: 'change' }],
  reason: [{ required: true, message: '请选择售后原因', trigger: 'change' }],
  qty: [{ required: true, message: '请填写退货数量', trigger: 'change' }]
}

const open = (payload: { orderNo: string; itemId: number; maxQty: number }) => {
  form.orderNo = payload.orderNo
  form.itemId = payload.itemId
  form.qty = 1
  form.description = ''
  form.pics = []
  maxQty.value = payload.maxQty
  dialogVisible.value = true
}

const submit = async () => {
  await formRef.value?.validate()
  loading.value = true
  try {
    await OrderApi.createAfterSale({ ...form })
    message.success('申请成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>
