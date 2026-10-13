<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" append-to-body>
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="100px">
      <el-form-item label="品牌编码" prop="brandCode" disabled>
        <el-input v-model="formData.brandCode" maxlength="7" placeholder="自动生成" disabled />
      </el-form-item>
      <el-form-item label="品牌名称" prop="brandName">
        <el-input v-model="formData.brandName" maxlength="50" placeholder="请输入品牌名称" />
      </el-form-item>
      <el-form-item label="品牌简称" prop="shortName">
        <el-input v-model="formData.shortName" maxlength="20" placeholder="请输入品牌简称" />
      </el-form-item>
      <el-form-item label="品牌Logo" prop="logoUrl">
        <UploadImg v-model="formData.logoUrl" height="80px" width="80px" :file-type="['image/jpeg', 'image/png']" />
        <div class="mt-4px text-12px text-gray-400">支持 jpg/png，建议 1:1，不超过 200KB，仅 1 张</div>
      </el-form-item>
      <el-form-item label="品牌介绍" prop="description">
        <el-input v-model="formData.description" type="textarea" maxlength="200" show-word-limit :rows="3" placeholder="请输入品牌介绍" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="formLoading" @click="submitForm">保存品牌</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
  import { BRAND_STATUS, BrandSaveReqVO, ProductBrandApi } from '@/api/product'

  defineOptions({ name: 'ProductBrandForm' })

  const message = useMessage()
  const emit = defineEmits(['success'])
  const dialogVisible = ref(false)
  const dialogTitle = ref('新增品牌')
  const formLoading = ref(false)
  const formRef = ref()
  const isEdit = ref(false)
  const formData = reactive({
    brandCode: '',
    brandName: '',
    shortName: '',
    englishName: '',
    logoUrl: '',
    description: '',
    sort: undefined as number | undefined,
    status: BRAND_STATUS.ENABLED
  })
  const brandCodePattern = /^BRD_(?!000)[0-9]{3}$/
  const formRules = {
    brandName: [{ required: true, message: '请输入品牌名称', trigger: 'blur' }],
    brandCode: [
      {
        validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
          if (!value || brandCodePattern.test(value)) callback()
          else callback(new Error('品牌编码应为 BRD_001 格式，流水号范围 001–999'))
        },
        trigger: 'blur'
      }
    ],
    logoUrl: [{ required: true, message: '请上传品牌Logo', trigger: 'change' }]
  }

  const resetForm = () => {
    formData.brandCode = ''
    formData.brandName = ''
    formData.shortName = ''
    formData.englishName = ''
    formData.logoUrl = ''
    formData.description = ''
    formData.sort = undefined
    formData.status = BRAND_STATUS.ENABLED
  }

  const open = async (brandCode?: string) => {
    dialogVisible.value = true
    isEdit.value = !!brandCode
    dialogTitle.value = isEdit.value ? '编辑品牌' : '新增品牌'
    resetForm()
    if (!brandCode) return
    formLoading.value = true
    try {
      const data = await ProductBrandApi.getBrand(brandCode)
      formData.brandCode = data.brandCode || brandCode
      formData.brandName = data.brandName || ''
      formData.shortName = data.shortName || ''
      formData.englishName = data.englishName || ''
      formData.logoUrl = data.logoUrl || ''
      formData.description = data.description || ''
      formData.sort = data.sort
      formData.status = data.status ?? BRAND_STATUS.ENABLED
    } finally {
      formLoading.value = false
    }
  }

  const buildSavePayload = (): BrandSaveReqVO => {
    const payload: BrandSaveReqVO = {
      brandName: formData.brandName,
      shortName: formData.shortName || undefined,
      logoUrl: formData.logoUrl,
      description: formData.description || undefined
    }
    if (!isEdit.value && formData.brandCode) payload.brandCode = formData.brandCode
    if (isEdit.value) {
      payload.englishName = formData.englishName || undefined
      payload.sort = formData.sort
      payload.status = formData.status
    } else {
      payload.status = BRAND_STATUS.ENABLED
    }
    return payload
  }

  const submitForm = async () => {
    await formRef.value?.validate()
    formLoading.value = true
    try {
      const payload = buildSavePayload()
      if (isEdit.value) await ProductBrandApi.updateBrand(formData.brandCode, payload)
      else await ProductBrandApi.createBrand(payload)
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
