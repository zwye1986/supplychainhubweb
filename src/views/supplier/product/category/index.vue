<template>
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      class="-mb-15px search-form"
      :model="queryParams"
      :inline="true"
      label-width="80px"
    >
      <el-form-item label="分类名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="分类名称或编码"
          maxlength="50"
          clearable
          @keyup.enter="getList"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" clearable placeholder="全部">
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
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
    <el-table v-loading="loading" :data="list" row-key="id" default-expand-all>
      <el-table-column label="分类名称" prop="name" min-width="200" />
      <el-table-column label="分类编码" prop="code" min-width="140" />
      <el-table-column label="SPU数" prop="spuCount" min-width="90" />
      <el-table-column label="状态" min-width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" prop="updateTime" min-width="170" />
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button link type="primary" @click="openForm('update', row.id)">编辑</el-button>
          <el-button link type="primary" @click="openForm('create', undefined, row.id)">添加子分类</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>
  <CategoryForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { ProductCategoryApi, ProductCategoryVO } from '@/api/product'
import CategoryForm from './CategoryForm.vue'

defineOptions({ name: 'ProductCategory' })

const message = useMessage()
const loading = ref(false)
const list = ref<ProductCategoryVO[]>([])
const queryFormRef = ref()
const formRef = ref()
const queryParams = reactive({
  name: undefined as string | undefined,
  status: undefined as number | undefined
})

const getList = async () => {
  loading.value = true
  try {
    list.value = await ProductCategoryApi.getCategoryList({ ...queryParams })
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryFormRef.value?.resetFields()
  getList()
}

const openForm = (type: string, id?: number, parentId?: number) => {
  formRef.value.open(type, id, parentId)
}

const handleDelete = async (row: ProductCategoryVO) => {
  try {
    await message.delConfirm()
    await ProductCategoryApi.deleteCategory(row.id!)
    message.success('删除成功')
    getList()
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  }
}

onMounted(getList)
</script>
