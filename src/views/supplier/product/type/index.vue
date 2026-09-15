<template>
  <ContentWrap>
    <el-form class="-mb-15px search-form" :inline="true" @submit.prevent>
      <el-form-item label="类型名称">
        <el-input
          v-model="keyword"
          placeholder="类型名称或编码"
          maxlength="100"
          clearable
          @keyup.enter="getList"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="getList"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="keyword = ''; getList()"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" plain @click="openForm()">
          <Icon icon="ep:plus" class="mr-5px" /> 新增类型
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap v-loading="loading">
    <el-empty v-if="!loading && !list.length" description="暂无商品类型" />
    <el-row v-else :gutter="16">
      <el-col v-for="item in list" :key="item.id" :xs="24" :sm="12" :lg="8" class="mb-16px">
        <el-card shadow="hover" class="h-full">
          <div class="mb-8px flex items-center justify-between">
            <div class="text-16px font-600">{{ item.name }}</div>
            <el-tag :type="item.status === 1 ? 'success' : 'info'" size="small">
              {{ item.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </div>
          <div class="mb-12px min-h-40px text-13px text-gray-500">{{ item.remark || '暂无描述' }}</div>
          <div class="mb-12px flex gap-16px text-13px">
            <span>SPU <b>{{ item.spuCount || 0 }}</b></span>
            <span>SKU <b>{{ item.skuCount || 0 }}</b></span>
          </div>
          <div class="flex gap-8px">
            <el-button link type="primary" @click="goProduct(item.code)">查看商品</el-button>
            <el-button link type="primary" @click="openForm(item.id)">编辑</el-button>
            <el-button
              v-if="!(item.spuCount || 0) && !(item.skuCount || 0)"
              link
              type="danger"
              @click="handleDelete(item)"
            >
              删除
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </ContentWrap>
  <TypeForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { ProductTypeApi, ProductTypeVO } from '@/api/product'
import TypeForm from './TypeForm.vue'

defineOptions({ name: 'ProductType' })

const router = useRouter()
const message = useMessage()
const loading = ref(false)
const list = ref<ProductTypeVO[]>([])
const keyword = ref('')
const formRef = ref()

const getList = async () => {
  loading.value = true
  try {
    list.value = await ProductTypeApi.getTypeList({ keyword: keyword.value || undefined })
  } finally {
    loading.value = false
  }
}

const openForm = (id?: number) => formRef.value.open(id)
const goProduct = (typeCode: string) => router.push({ path: '/product/list', query: { typeCode } })

const handleDelete = async (row: ProductTypeVO) => {
  try {
    await message.delConfirm()
    await ProductTypeApi.deleteType(row.id!)
    message.success('删除成功')
    getList()
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  }
}

onMounted(getList)
</script>
