<template>
  <el-dialog v-model="dialogVisible" title="订单发货" width="560px" append-to-body>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="发货方式" prop="shipType">
        <el-radio-group v-model="form.shipType">
          <el-radio value="VIRTUAL">虚拟发货</el-radio>
          <el-radio value="PHYSICAL">实物发货</el-radio>
        </el-radio-group>
      </el-form-item>
      <template v-if="form.shipType === 'PHYSICAL'">
        <el-form-item label="物流公司" prop="expressCompany">
          <el-select v-model="form.expressCompany">
            <el-option label="顺丰速运" value="顺丰速运" />
            <el-option label="中通快递" value="中通快递" />
            <el-option label="圆通快递" value="圆通快递" />
          </el-select>
        </el-form-item>
        <el-form-item label="物流单号" prop="expressNo">
          <el-input v-model="form.expressNo" maxlength="50" />
        </el-form-item>
      </template>
      <el-form-item v-else label="虚拟凭证" prop="voucher">
        <el-input v-model="form.voucher" type="textarea" :rows="4" placeholder="兑换码/激活码/链接，支持多行" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" maxlength="200" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">确认发货</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { OrderApi } from '@/api/order'

defineOptions({ name: 'OrderShipForm' })

const message = useMessage()
const emit = defineEmits(['success'])
const dialogVisible = ref(false)
const loading = ref(false)
const formRef = ref()
const orderNo = ref('')
const form = reactive({
  shipType: 'VIRTUAL',
  expressCompany: '',
  expressNo: '',
  voucher: '',
  remark: ''
})
const rules = {
  shipType: [{ required: true, message: '请选择发货方式', trigger: 'change' }]
}

const open = (no: string) => {
  orderNo.value = no
  dialogVisible.value = true
}

const submit = async () => {
  await formRef.value?.validate()
  if (form.shipType === 'PHYSICAL' && (!form.expressCompany || !form.expressNo)) {
    message.warning('实物发货请填写物流公司和物流单号')
    return
  }
  if (form.shipType === 'VIRTUAL' && !form.voucher) {
    message.warning('虚拟发货请填写虚拟凭证')
    return
  }
  loading.value = true
  try {
    await OrderApi.shipOrder(orderNo.value, { ...form })
    message.success('发货成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>
