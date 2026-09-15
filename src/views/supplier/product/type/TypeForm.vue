<template>
  <el-dialog
    v-model="dialogVisible"
    :title="formData.id ? '编辑商品类型' : '新增商品类型'"
    width="600px"
    append-to-body
  >
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="100px">
      <el-form-item label="类型名称" prop="name">
        <el-input v-model="formData.name" maxlength="50" placeholder="请输入类型名称" />
      </el-form-item>
      <el-form-item label="类型编码" prop="code">
        <el-input v-model="formData.code" maxlength="30" placeholder="字母/数字/下划线" />
      </el-form-item>
      <el-form-item label="类型Icon" prop="icon">
        <UploadImg v-model="formData.icon" height="80px" width="80px" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="formData.status">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="类型描述" prop="remark">
        <el-input v-model="formData.remark" type="textarea" maxlength="200" show-word-limit :rows="3" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="formLoading" @click="submitForm">保存</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ProductTypeApi, ProductTypeVO } from '@/api/product'

defineOptions({ name: 'ProductTypeForm' })

const message = useMessage()
const emit = defineEmits(['success'])
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const formData = reactive<ProductTypeVO>({
  name: '',
  code: '',
  icon: '',
  status: 1,
  remark: ''
})
const formRules = {
  name: [{ required: true, message: '请输入类型名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入类型编码', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const open = async (id?: number) => {
  dialogVisible.value = true
  formData.id = undefined
  formData.name = ''
  formData.code = ''
  formData.icon = ''
  formData.status = 1
  formData.remark = ''
  if (!id) return
  formLoading.value = true
  try {
    Object.assign(formData, await ProductTypeApi.getType(id))
  } finally {
    formLoading.value = false
  }
}

const submitForm = async () => {
  await formRef.value?.validate()
  formLoading.value = true
  try {
    if (formData.id) await ProductTypeApi.updateType(formData)
    else await ProductTypeApi.createType(formData)
    message.success('保存成功')
    dialogVisible.value = false
    emit('success')
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
