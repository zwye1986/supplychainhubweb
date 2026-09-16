<template>
  <ContentWrap>
    <el-form class="-mb-15px search-form" :inline="true" @submit.prevent>
      <el-form-item label="品牌名称/编码">
        <el-input
          v-model="queryParams.keyword"
          placeholder="品牌名称或编码"
          maxlength="100"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" plain @click="openForm()">
          <Icon icon="ep:plus" class="mr-5px" /> 新增品牌
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap v-loading="loading">
    <el-empty v-if="!loading && !list.length" description="暂无品牌" />
    <el-row v-else :gutter="16">
      <el-col v-for="item in list" :key="item.brandCode" :xs="24" :sm="12" :lg="8" class="mb-16px">
        <el-card shadow="hover" class="h-full">
          <div class="mb-12px flex items-center gap-12px">
            <el-image v-if="item.logoUrl" :src="item.logoUrl" class="h-48px w-48px rounded" fit="cover" />
            <div
              v-else
              class="h-48px w-48px flex items-center justify-center rounded bg-[var(--el-color-primary-light-9)] text-[var(--el-color-primary)]"
            >
              {{ (item.brandName || '').slice(0, 1) }}
            </div>
            <div class="min-w-0">
              <div class="truncate text-16px font-600">{{ item.brandName }}</div>
              <div class="text-12px text-gray-500">{{ item.brandCode }}</div>
            </div>
          </div>
          <div class="mb-12px text-13px text-gray-500">{{ item.spuCount || 0 }}个SPU商品</div>
          <div class="flex gap-8px">
            <el-button link type="primary" @click="openForm(item.brandCode)">编辑</el-button>
            <el-button v-if="!(item.spuCount || 0)" link type="danger" @click="handleDelete(item)">
              删除
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
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
const total = ref(0)
const formRef = ref()
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  keyword: undefined as string | undefined
})

const getList = async () => {
  loading.value = true
  try {
    const data = await ProductBrandApi.getBrandPage({
      ...queryParams,
      keyword: queryParams.keyword?.trim() || undefined
    })
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryParams.keyword = undefined
  handleQuery()
}

const openForm = (brandCode?: string) => formRef.value.open(brandCode)

const handleDelete = async (row: ProductBrandVO) => {
  if (!row.brandCode) return
  try {
    await message.delConfirm()
    await ProductBrandApi.deleteBrand(row.brandCode)
    message.success('删除成功')
    getList()
  } catch {}
}

onMounted(getList)
</script>
