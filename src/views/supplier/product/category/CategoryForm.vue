<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="620px" append-to-body>
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="120px">
      <el-form-item label="所属父分类" prop="parentCategoryCode">
        <ProductCategory v-model="formData.parentCategoryCode" :disabled="isEdit" :exclude-code="isEdit ? formData.categoryCode : undefined" placeholder="请选择父分类，不选则为一级分类" />
      </el-form-item>
      <el-form-item label="商品类型" prop="typeCodes">
        <ProductType v-model="formData.typeCodes" />
      </el-form-item>
      <el-form-item label="分类名称" prop="categoryName">
        <el-input v-model="formData.categoryName" maxlength="50" placeholder="请输入分类名称" />
      </el-form-item>
      <el-form-item label="分类编码" prop="categoryCode">
        <el-input v-model="formData.categoryCode" maxlength="11" :placeholder="categoryCodeHint" :disabled="isEdit" />
        <div class="text-12px text-gray-400">{{ categoryCodeHint }}</div>
      </el-form-item>
      <el-form-item v-if="isEdit" label="子分类父段">
        <span>{{ formData.categoryNodeNo?.toString().padStart(3, '0') || '—' }}</span>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-switch v-model="formData.status" :active-value="CATEGORY_STATUS.ENABLED" :inactive-value="CATEGORY_STATUS.DISABLED" />
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
  import { CATEGORY_STATUS, ProductCategoryApi, ProductCategoryVO } from '@/api/product'

  defineOptions({ name: 'ProductCategoryForm' })

  const message = useMessage()
  const emit = defineEmits(['success'])
  const dialogVisible = ref(false)
  const dialogTitle = ref('新增分类')
  const formLoading = ref(false)
  const formRef = ref()
  const isEdit = ref(false)
  const originalStatus = ref<number | undefined>()
  const categoryTree = ref<ProductCategoryVO[]>([])
  const formData = reactive({
    parentCategoryCode: undefined as string | undefined,
    categoryName: '',
    categoryCode: '',
    categoryNodeNo: undefined as number | undefined,
    typeCodes: [] as string[],
    status: CATEGORY_STATUS.ENABLED,
    remark: '',
    sort: undefined as number | undefined,
    visible: undefined as number | undefined
  })
  const findNodeByCode = (nodes: ProductCategoryVO[], code?: string): ProductCategoryVO | undefined => {
    if (!code) return undefined
    for (const node of nodes) {
      if (node.categoryCode === code) return node
      const found = findNodeByCode(node.children || [], code)
      if (found) return found
    }
  }
  const categoryCodeHint = computed(() => {
    if (!formData.parentCategoryCode) return 'CAT_001；不填自动生成'
    const parentNo = findNodeByCode(categoryTree.value, formData.parentCategoryCode)?.categoryNodeNo
    return parentNo
      ? `CAT_${String(parentNo).padStart(3, '0')}_001；父段须匹配所选父分类，不填自动生成`
      : '请选择有效父分类，系统将使用其内部父段生成编码'
  })
  const formRules = {
    typeCodes: [{ required: true, message: '请选择商品类型', trigger: 'change' }],
    categoryName: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }

  const findCodeById = (nodes: ProductCategoryVO[], id?: number): string | undefined => {
    if (id == null || id === 0) return undefined
    for (const node of nodes) {
      if (node.id === id) return node.categoryCode
      const found = findCodeById(node.children || [], id)
      if (found) return found
    }
  }

  const resetForm = () => {
    formData.parentCategoryCode = undefined
    formData.categoryName = ''
    formData.categoryCode = ''
    formData.categoryNodeNo = undefined
    formData.typeCodes = []
    formData.status = CATEGORY_STATUS.ENABLED
    formData.remark = ''
    formData.sort = undefined
    formData.visible = undefined
    originalStatus.value = undefined
  }

  const open = async (type: string, categoryCode?: string, parentCategoryCode?: string) => {
    dialogVisible.value = true
    isEdit.value = type === 'update'
    dialogTitle.value = isEdit.value ? '编辑分类' : '新增分类'
    resetForm()
    formData.parentCategoryCode = parentCategoryCode
    formLoading.value = true
    try {
      categoryTree.value = await ProductCategoryApi.getCategoryList()
      if (!categoryCode) return
      const data = await ProductCategoryApi.getCategory(categoryCode)
      originalStatus.value = data.status
      const source: Record<string, unknown> = {
        ...data,
        parentCategoryCode: data.parentCategoryCode || findCodeById(categoryTree.value, data.parentId)
      }
      for (const key of Object.keys(formData) as Array<keyof typeof formData>) {
        if (source[key] !== undefined) {
          ;(formData as Record<string, unknown>)[key] = source[key]
        }
      }
    } finally {
      formLoading.value = false
    }
  }

  const submitForm = async () => {
    await formRef.value?.validate()
    formLoading.value = true
    try {
      let savedCode = formData.categoryCode
      const payload = { ...formData }
      delete (payload as typeof payload & { categoryNodeNo?: number }).categoryNodeNo
      if (isEdit.value) {
        await ProductCategoryApi.updateCategory(formData.categoryCode, payload)
      } else {
        savedCode = (await ProductCategoryApi.createCategory(payload)) as string
      }
      const targetStatus = formData.status
      if (
        savedCode &&
        (targetStatus === CATEGORY_STATUS.ENABLED || targetStatus === CATEGORY_STATUS.DISABLED) &&
        originalStatus.value !== targetStatus
      ) {
        const needSwitch = isEdit.value || targetStatus === CATEGORY_STATUS.DISABLED
        if (needSwitch) await ProductCategoryApi.changeCategoryStatus(savedCode, targetStatus)
      }
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
