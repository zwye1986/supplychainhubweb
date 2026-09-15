<template>
  <ContentWrap>
    <el-form class="-mb-15px search-form" :inline="true" @submit.prevent>
      <el-form-item label="品牌名称/编码">
        <el-input
          v-model="keyword"
          placeholder="品牌名称或编码"
          maxlength="100"
          clearable
          @keyup.enter="getList"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="getList"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="keyword = ''; getList()"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" plain @click="openForm()">
          <Icon icon="ep:plus" class="mr-5px" /> 新增品牌
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap v-loading="loading">
    <el-empty v-if="!loading && !list.length" description="暂无品牌" />
    <el-row v-else :gutter="16">
      <el-col v-for="item in list" :key="item.id" :xs="24" :sm="12" :lg="8" class="mb-16px">
        <el-card shadow="hover" class="h-full">
          <div class="mb-12px flex items-center gap-12px">
            <el-image v-if="item.logo" :src="item.logo" class="h-48px w-48px rounded" fit="cover" />
            <div
              v-else
              class="h-48px w-48px flex items-center justify-center rounded bg-[var(--el-color-primary-light-9)] text-[var(--el-color-primary)]"
            >
              {{ item.name.slice(0, 1) }}
            </div>
            <div class="min-w-0">
              <div class="truncate text-16px font-600">{{ item.name }}</div>
              <div class="text-12px text-gray-500">{{ item.code }}</div>
            </div>
          </div>
          <div class="mb-12px text-13px text-gray-500">{{ item.spuCount || 0 }}个SPU商品</div>
          <div class="flex gap-8px">
            <el-button link type="primary" @click="openForm(item.id)">编辑</el-button>
            <el-button
              v-if="!item.protectedBrand && !(item.spuCount || 0)"
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
  <BrandForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { ProductBrandApi, ProductBrandVO } from '@/api/product'
import BrandForm from './BrandForm.vue'

defineOptions({ name: 'ProductBrand' })

const message = useMessage()
const loading = ref(false)
const list = ref<ProductBrandVO[]>([])
const keyword = ref('')
const formRef = ref()

const getList = async () => {
  loading.value = true
  try {
    list.value = await ProductBrandApi.getBrandList({ keyword: keyword.value || undefined })
  } finally {
    loading.value = false
  }
}

const openForm = (id?: number) => formRef.value.open(id)

const handleDelete = async (row: ProductBrandVO) => {
  try {
    await message.delConfirm()
    await ProductBrandApi.deleteBrand(row.id!)
    message.success('删除成功')
    getList()
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  }
}

onMounted(getList)
</script>
