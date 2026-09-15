<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="620px" append-to-body>
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="120px">
      <el-form-item label="分类层级" prop="levelType">
        <el-select v-model="formData.levelType" @change="handleLevelChange">
          <el-option label="一级分类" value="ROOT" />
          <el-option label="二级分类（子分类）" value="CHILD" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="formData.levelType === 'CHILD'" label="所属父分类" prop="parentId">
        <el-tree-select
          v-model="formData.parentId"
          :data="categoryTree"
          check-strictly
          node-key="id"
          :props="{ label: 'name', children: 'children' }"
          placeholder="请选择父分类"
        />
      </el-form-item>
      <el-form-item label="商品类型" prop="typeCodes">
        <el-select v-model="formData.typeCodes" multiple collapse-tags>
          <el-option v-for="item in typeList" :key="item.code" :label="item.name" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="分类名称" prop="name">
        <el-input v-model="formData.name" maxlength="50" placeholder="请输入分类名称" />
      </el-form-item>
      <el-form-item label="分类编码" prop="code">
        <el-input v-model="formData.code" maxlength="32" placeholder="字母/数字组合" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <el-form-item label="分类描述" prop="remark">
        <el-input v-model="formData.remark" type="textarea" maxlength="200" show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="formLoading" @click="submitForm">保存</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ProductCategoryApi, ProductCategoryVO, ProductTypeApi, ProductTypeVO } from '@/api/product'

defineOptions({ name: 'ProductCategoryForm' })

const message = useMessage()
const emit = defineEmits(['success'])
const dialogVisible = ref(false)
const dialogTitle = ref('新增分类')
const formLoading = ref(false)
const formRef = ref()
const typeList = ref<ProductTypeVO[]>([])
const categoryTree = ref<ProductCategoryVO[]>([])
const formData = reactive({
  id: undefined as number | undefined,
  levelType: 'ROOT',
  parentId: 0,
  name: '',
  code: '',
  typeCodes: [] as string[],
  status: 1,
  remark: ''
})
const formRules = {
  levelType: [{ required: true, message: '请选择分类层级', trigger: 'change' }],
  typeCodes: [{ required: true, message: '请选择商品类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const handleLevelChange = () => {
  if (formData.levelType === 'ROOT') formData.parentId = 0
}

const open = async (type: string, id?: number, parentId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增分类' : '编辑分类'
  formData.id = undefined
  formData.levelType = parentId ? 'CHILD' : 'ROOT'
  formData.parentId = parentId || 0
  formData.name = ''
  formData.code = ''
  formData.typeCodes = []
  formData.status = 1
  formData.remark = ''
  typeList.value = await ProductTypeApi.getTypeList()
  categoryTree.value = await ProductCategoryApi.getCategoryList()
  if (!id) return
  formLoading.value = true
  try {
    const data = await ProductCategoryApi.getCategory(id)
    Object.assign(formData, data)
    formData.levelType = data.parentId ? 'CHILD' : 'ROOT'
  } finally {
    formLoading.value = false
  }
}

const submitForm = async () => {
  await formRef.value?.validate()
  if (formData.levelType === 'CHILD' && !formData.parentId) {
    message.warning('请选择父分类')
    return
  }
  formLoading.value = true
  try {
    const payload: ProductCategoryVO = {
      ...formData,
      parentId: formData.levelType === 'ROOT' ? 0 : formData.parentId
    }
    if (formData.id) await ProductCategoryApi.updateCategory(payload)
    else await ProductCategoryApi.createCategory(payload)
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
