<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" append-to-body>
    <el-form ref="elFormRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="100px">
      <el-form-item label="类型名称" prop="typeName">
        <el-input v-model="formData.typeName" maxlength="50" placeholder="请输入类型名称" />
      </el-form-item>
      <el-form-item label="类型编码" prop="typeCode">
        <el-input v-model="formData.typeCode" maxlength="30" placeholder="系统自动生成" disabled />
      </el-form-item>
      <el-form-item label="类型Icon" prop="iconUrl" class="type-icon-item">
        <UploadImg v-model="formData.iconUrl" height="80px" width="80px" :drag="false">
          <template #tip>
            <span class="text-11px text-gray-400">支持 jpg/png/gif</span>
          </template>
        </UploadImg>
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number :controls="false" v-model="formData.sort" :min="0" :value-on-clear="undefined" controls-position="right" class="!w-180px" />
        <span class="ml-8px text-12px text-gray-400">越小越靠前</span>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="formData.status" placeholder="请选择" class="!w-full">
          <el-option v-for="dict in getStrDictOptions('supply_chain_product_type_status')" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="类型描述" prop="description">
        <el-input v-model="formData.description" type="textarea" maxlength="200" show-word-limit :rows="3" placeholder="请输入类型描述" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="formLoading" @click="submitForm">保存</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
  import { ProductTypeApi } from '@/api/product'
  import type { ProductTypeSaveReqVO } from '@/api/product'
  import { getStrDictOptions } from '@/utils/dict'

  defineOptions({ name: 'ProductTypeForm' })

  const message = useMessage()
  const emit = defineEmits(['success'])
  const dialogVisible = ref(false)
  const dialogTitle = ref('新增商品类型')
  const formLoading = ref(false)
  const isEdit = ref(false)
  const elFormRef = ref()
  const firstDictValue = (dictType: string) => getStrDictOptions(dictType)[0]?.value || ''
  const formData = reactive({
    typeCode: '',
    typeName: '',
    iconUrl: '',
    sort: undefined as number | undefined,
    status: firstDictValue('supply_chain_product_type_status'),
    description: '',
    remark: ''
  })
  const typeCodePattern = /^[A-Za-z0-9_]+$/
  const formRules = {
    typeName: [{ required: true, message: '请输入类型名称', trigger: 'blur' }],
    typeCode: [
      {
        validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
          if (!value || typeCodePattern.test(value)) callback()
          else callback(new Error('仅支持字母、数字、下划线'))
        },
        trigger: 'blur'
      }
    ],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }

  const resetForm = () => {
    formData.typeCode = ''
    formData.typeName = ''
    formData.iconUrl = ''
    formData.sort = undefined
    formData.status = firstDictValue('supply_chain_product_type_status')
    formData.description = ''
    formData.remark = ''
    nextTick(() => elFormRef.value?.clearValidate())
  }

  const open = async (typeCode?: string) => {
    dialogVisible.value = true
    isEdit.value = !!typeCode
    dialogTitle.value = isEdit.value ? '编辑商品类型' : '新增商品类型'
    resetForm()
    if (!typeCode) return
    formLoading.value = true
    try {
      const data = await ProductTypeApi.getType(typeCode)
      formData.typeCode = data.typeCode || typeCode
      formData.typeName = data.typeName || ''
      formData.iconUrl = data.iconUrl || ''
      formData.sort = Number.isFinite(data.sort) ? data.sort : undefined
      formData.status =
        data.status != null ? String(data.status) : firstDictValue('supply_chain_product_type_status')
      formData.description = data.description || ''
      formData.remark = data.remark || ''
    } catch {
      dialogVisible.value = false
    } finally {
      formLoading.value = false
    }
  }

  const buildSavePayload = (): ProductTypeSaveReqVO => {
    const payload: ProductTypeSaveReqVO = {
      typeName: formData.typeName.trim(),
      iconUrl: formData.iconUrl || undefined,
      description: formData.description || undefined,
      status: formData.status != null && formData.status !== '' ? Number(formData.status) : undefined
    }
    if (!isEdit.value && formData.typeCode) payload.typeCode = formData.typeCode
    if (isEdit.value && formData.remark) payload.remark = formData.remark
    if (Number.isFinite(formData.sort)) payload.sort = formData.sort
    return payload
  }

  const submitForm = async () => {
    await elFormRef.value?.validate()
    formLoading.value = true
    try {
      const payload = buildSavePayload()
      if (isEdit.value) await ProductTypeApi.updateType(formData.typeCode, payload)
      else await ProductTypeApi.createType(payload)
      message.success('保存成功')
      dialogVisible.value = false
      emit('success')
    } catch {
    } finally {
      formLoading.value = false
    }
  }

  defineExpose({ open })
</script>

<style scoped>
  .type-icon-item :deep(.el-upload__tip) {
    margin-top: 2px;
    line-height: 16px;
    text-align: left;
  }
</style>
