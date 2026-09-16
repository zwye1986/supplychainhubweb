<template>
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      class="-mb-15px search-form"
      :model="queryParams"
      :inline="true"
      label-width="80px"
    >
      <el-form-item label="分类名称" prop="categoryName">
        <el-input
          v-model="queryParams.categoryName"
          placeholder="分类名称或编码"
          maxlength="50"
          clearable
          @keyup.enter="getList"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="全部">
          <el-option label="启用" :value="CATEGORY_STATUS.ENABLED" />
          <el-option label="停用" :value="CATEGORY_STATUS.DISABLED" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="getList"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" plain @click="openForm('create')">
          <Icon icon="ep:plus" class="mr-5px" /> 新增分类
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      row-key="categoryCode"
      default-expand-all
    >
      <el-table-column label="分类名称" prop="categoryName" min-width="200" />
      <el-table-column label="分类编码" prop="categoryCode" min-width="140" />
      <el-table-column label="SPU数" prop="productCount" min-width="90" />
      <el-table-column label="状态" min-width="90">
        <template #default="{ row }">
          <el-tag :type="getCategoryStatusType(row.status)" size="small">
            {{ getCategoryStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" prop="updatedAt" min-width="170" :formatter="dateFormatter" />
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button link type="primary" @click="openForm('update', row.categoryCode)">编辑</el-button>
          <el-button link type="primary" @click="openForm('create', undefined, row.categoryCode)">
            添加子分类
          </el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && !list.length" description="暂无分类" />
  </ContentWrap>
  <CategoryForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { CATEGORY_STATUS, ProductCategoryApi, ProductCategoryVO } from '@/api/product'
import { dateFormatter } from '@/utils/formatTime'
import CategoryForm from './CategoryForm.vue'

defineOptions({ name: 'ProductCategory' })

const message = useMessage()
const loading = ref(false)
const treeData = ref<ProductCategoryVO[]>([])
const list = ref<ProductCategoryVO[]>([])
const queryFormRef = ref()
const formRef = ref()
const queryParams = reactive({
  categoryName: undefined as string | undefined,
  status: undefined as number | undefined
})

const getCategoryStatusLabel = (status?: number) => {
  if (status === CATEGORY_STATUS.ENABLED) return '启用'
  if (status === CATEGORY_STATUS.DISABLED) return '停用'
  if (status === CATEGORY_STATUS.DRAFT) return '草稿'
  if (status === CATEGORY_STATUS.ARCHIVED) return '已归档'
  return '-'
}

const getCategoryStatusType = (status?: number) => {
  if (status === CATEGORY_STATUS.ENABLED) return 'success'
  if (status === CATEGORY_STATUS.DISABLED) return 'info'
  if (status === CATEGORY_STATUS.DRAFT) return 'warning'
  return 'info'
}

const matchesNode = (node: ProductCategoryVO) => {
  const keyword = queryParams.categoryName?.trim().toLowerCase()
  const nameOk =
    !keyword ||
    (node.categoryName || '').toLowerCase().includes(keyword) ||
    (node.categoryCode || '').toLowerCase().includes(keyword)
  const statusOk = queryParams.status == null || node.status === queryParams.status
  return nameOk && statusOk
}

const filterTree = (nodes: ProductCategoryVO[]): ProductCategoryVO[] => {
  const result: ProductCategoryVO[] = []
  nodes.forEach((node) => {
    const children = node.children?.length ? filterTree(node.children) : []
    if (matchesNode(node) || children.length) {
      result.push({ ...node, children: children.length ? children : undefined })
    }
  })
  return result
}

const getList = async () => {
  loading.value = true
  try {
    treeData.value = await ProductCategoryApi.getCategoryList()
    list.value = filterTree(treeData.value)
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryFormRef.value?.resetFields()
  getList()
}

const openForm = (type: string, categoryCode?: string, parentCategoryCode?: string) => {
  formRef.value.open(type, categoryCode, parentCategoryCode)
}

const handleDelete = async (row: ProductCategoryVO) => {
  if (!row.categoryCode) return
  try {
    await message.delConfirm()
    await ProductCategoryApi.deleteCategory(row.categoryCode)
    message.success('删除成功')
    getList()
  } catch {}
}

onMounted(getList)
</script>
