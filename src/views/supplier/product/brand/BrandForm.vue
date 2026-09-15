<template>
  <el-dialog
    v-model="dialogVisible"
    :title="formData.id ? '编辑品牌' : '新增品牌'"
    width="600px"
    append-to-body
  >
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="100px">
      <el-form-item label="品牌名称" prop="name">
        <el-input v-model="formData.name" maxlength="50" placeholder="请输入品牌名称" />
      </el-form-item>
      <el-form-item label="品牌简称" prop="shortName">
        <el-input v-model="formData.shortName" maxlength="20" placeholder="请输入品牌简称" />
      </el-form-item>
      <el-form-item label="品牌编码" prop="code">
        <el-input v-model="formData.code" maxlength="30" placeholder="字母/数字/下划线" />
      </el-form-item>
      <el-form-item label="品牌Logo" prop="logo">
        <UploadImg v-model="formData.logo" height="80px" width="80px" :file-size="0.2" />
      </el-form-item>
      <el-form-item label="品牌介绍" prop="intro">
        <el-input v-model="formData.intro" type="textarea" maxlength="200" show-word-limit :rows="3" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="formLoading" @click="submitForm">保存品牌</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ProductBrandApi, ProductBrandVO } from '@/api/product'

defineOptions({ name: 'ProductBrandForm' })

const message = useMessage()
const emit = defineEmits(['success'])
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const formData = reactive<ProductBrandVO>({
  name: '',
  shortName: '',
  code: '',
  logo: '',
  intro: ''
})
const formRules = {
  name: [{ required: true, message: '请输入品牌名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入品牌编码', trigger: 'blur' }]
}

const open = async (id?: number) => {
  dialogVisible.value = true
  formData.id = undefined
  formData.name = ''
  formData.shortName = ''
  formData.code = ''
  formData.logo = ''
  formData.intro = ''
  if (!id) return
  formLoading.value = true
  try {
    Object.assign(formData, await ProductBrandApi.getBrand(id))
  } finally {
    formLoading.value = false
  }
}

const submitForm = async () => {
  await formRef.value?.validate()
  formLoading.value = true
  try {
    if (formData.id) await ProductBrandApi.updateBrand(formData)
    else await ProductBrandApi.createBrand(formData)
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
