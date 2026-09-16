<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="620px" append-to-body>
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="120px">
      <el-form-item label="所属父分类" prop="parentCategoryCode">
        <el-tree-select v-model="formData.parentCategoryCode" :data="parentTree" check-strictly clearable node-key="categoryCode"
          :props="{ label: 'categoryName', children: 'children', disabled: 'disabled' }" placeholder="请选择父分类，不选则为一级分类" />
      </el-form-item>
      <el-form-item label="商品类型" prop="typeCodes">
        <el-select v-model="formData.typeCodes" multiple collapse-tags placeholder="请选择商品类型">
          <el-option v-for="dict in getStrDictOptions('supply_chain_product_type')" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="分类名称" prop="categoryName">
        <el-input v-model="formData.categoryName" maxlength="50" placeholder="请输入分类名称" />
      </el-form-item>
      <el-form-item label="分类编码" prop="categoryCode">
        <el-input v-model="formData.categoryCode" maxlength="32" placeholder="字母/数字组合，可空自动生成" :disabled="isEdit" />
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
  import { getStrDictOptions } from '@/utils/dict'

  defineOptions({ name: 'ProductCategoryForm' })

  type CategoryTreeNode = ProductCategoryVO & { disabled?: boolean }

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
    typeCodes: [] as string[],
    status: CATEGORY_STATUS.ENABLED,
    remark: '',
    sort: undefined as number | undefined,
    visible: undefined as number | undefined
  })
  const formRules = {
    typeCodes: [{ required: true, message: '请选择商品类型', trigger: 'change' }],
    categoryName: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }

  const findNodeByCode = (
    nodes: ProductCategoryVO[],
    categoryCode?: string
  ): ProductCategoryVO | undefined => {
    if (!categoryCode) return undefined
    for (const node of nodes) {
      if (node.categoryCode === categoryCode) return node
      const found = findNodeByCode(node.children || [], categoryCode)
      if (found) return found
    }
  }

  const findCodeById = (nodes: ProductCategoryVO[], id?: number): string | undefined => {
    if (id == null || id === 0) return undefined
    for (const node of nodes) {
      if (node.id === id) return node.categoryCode
      const found = findCodeById(node.children || [], id)
      if (found) return found
    }
  }

  const collectDescendantCodes = (node?: ProductCategoryVO): string[] => {
    if (!node) return []
    const codes: string[] = []
    ;(node.children || []).forEach((child) => {
      if (child.categoryCode) codes.push(child.categoryCode)
      codes.push(...collectDescendantCodes(child))
    })
    return codes
  }

  const markDisabled = (nodes: ProductCategoryVO[], disabledCodes: Set<string>): CategoryTreeNode[] =>
    nodes.map((node) => ({
      ...node,
      disabled: !!node.categoryCode && disabledCodes.has(node.categoryCode),
      children: node.children?.length ? markDisabled(node.children, disabledCodes) : undefined
    }))

  const parentTree = computed(() => {
    const disabledCodes = new Set<string>()
    if (isEdit.value && formData.categoryCode) {
      disabledCodes.add(formData.categoryCode)
      collectDescendantCodes(findNodeByCode(categoryTree.value, formData.categoryCode)).forEach(
        (code) => disabledCodes.add(code)
      )
    }
    return markDisabled(categoryTree.value, disabledCodes)
  })

  const resetForm = () => {
    formData.parentCategoryCode = undefined
    formData.categoryName = ''
    formData.categoryCode = ''
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
    categoryTree.value = await ProductCategoryApi.getCategoryList()
    if (!categoryCode) return
    formLoading.value = true
    try {
      const data = await ProductCategoryApi.getCategory(categoryCode)
      formData.categoryCode = data.categoryCode || categoryCode
      formData.categoryName = data.categoryName || ''
      formData.sort = data.sort
      formData.visible = data.visible
      formData.status =
        data.status === CATEGORY_STATUS.ENABLED ? CATEGORY_STATUS.ENABLED : CATEGORY_STATUS.DISABLED
      originalStatus.value = data.status
      formData.parentCategoryCode = findCodeById(categoryTree.value, data.parentId)
    } finally {
      formLoading.value = false
    }
  }

  const submitForm = async () => {
    await formRef.value?.validate()
    formLoading.value = true
    try {
      let savedCode = formData.categoryCode
      if (isEdit.value) {
        await ProductCategoryApi.updateCategory(formData.categoryCode, formData)
      } else {
        savedCode = (await ProductCategoryApi.createCategory(formData)) as string
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
