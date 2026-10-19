<template>
  <ContentWrap>
    <el-form class="-mb-15px search-form" :inline="true" @submit.prevent>
      <el-form-item label="类型名称">
        <el-input v-model="queryParams.keyword" placeholder="请输入类型名称或类型编码" maxlength="100" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button native-type="button" @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" /> 搜索
        </el-button>
        <el-button native-type="button" @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" /> 重置
        </el-button>
        <el-button type="primary" plain native-type="button" @click="openForm()">
          <Icon icon="ep:plus" class="mr-5px" /> 新增类型
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap v-loading="loading">
    <el-empty v-if="!loading && !list.length" description="暂无商品类型" />
    <el-row v-else :gutter="16">
      <el-col v-for="item in list" :key="item.typeCode" :xs="24" :sm="12" :lg="8" class="mb-16px">
        <el-card shadow="hover" class="h-full">
          <div class="mb-8px flex items-center justify-between gap-12px">
            <div class="flex min-w-0 items-center gap-12px">
              <el-image v-if="item.iconUrl" :src="item.iconUrl" class="h-40px w-40px rounded" fit="cover" />
              <div class="min-w-0">
                <div class="truncate text-16px font-600">{{ item.typeName }}</div>
                <div class="text-12px text-gray-500">{{ item.typeCode }}</div>
              </div>
            </div>
            <el-tag :type="getTypeStatusType(item.status)" size="small">
              {{ getDictLabel('supply_chain_product_type_status', item.status) || '-' }}
            </el-tag>
          </div>
          <div class="mb-12px min-h-40px text-13px text-gray-500">
            {{ item.description || item.remark || '暂无描述' }}
          </div>
          <div class="mb-16px flex gap-24px">
            <div class="flex flex-col gap-4px">
              <span class="text-24px font-700 leading-28px">{{ item.spuCount ?? 0 }}</span>
              <span class="text-14px leading-20px text-gray-400">SPU数</span>
            </div>
            <div class="flex flex-col gap-4px">
              <span class="text-24px font-700 leading-28px">{{ item.skuCount ?? 0 }}</span>
              <span class="text-14px leading-20px text-gray-400">SKU数</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-8px">
            <el-button link type="primary" @click="goProduct(item.typeCode)">查看商品</el-button>
            <el-button link type="primary" @click="openForm(item.typeCode)">编辑</el-button>
            <el-button v-if="!(item.spuCount || item.skuCount || item.productCount)" link type="danger" @click="handleDelete(item)">
              删除
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <Pagination v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
  </ContentWrap>
  <TypeForm ref="typeFormRef" @success="getList" />
</template>

<script lang="ts" setup>
  import { PRODUCT_TYPE_STATUS, ProductTypeApi, ProductTypeVO } from '@/api/product'
  import TypeForm from './TypeForm.vue'
  import { getDictLabel } from '@/utils/dict'
  defineOptions({ name: 'ProductType' })

  const router = useRouter()
  const message = useMessage()
  const loading = ref(false)
  const list = ref<ProductTypeVO[]>([])
  const total = ref(0)
  const typeFormRef = ref()
  const queryParams = reactive({
    pageNo: 1,
    pageSize: 20,
    keyword: undefined as string | undefined
  })

  const getTypeStatusLabel = (status?: number) => {
    if (status === PRODUCT_TYPE_STATUS.ENABLED) return '启用'
    if (status === PRODUCT_TYPE_STATUS.DISABLED) return '停用'
    if (status === PRODUCT_TYPE_STATUS.DRAFT) return '草稿'
    if (status === PRODUCT_TYPE_STATUS.ARCHIVED) return '已归档'
    return '-'
  }

  const getTypeStatusType = (status?: number) => {
    if (status === PRODUCT_TYPE_STATUS.ENABLED) return 'success'
    if (status === PRODUCT_TYPE_STATUS.DISABLED) return 'info'
    if (status === PRODUCT_TYPE_STATUS.DRAFT) return 'warning'
    return 'info'
  }

  const getList = async () => {
    loading.value = true
    try {
      const data = await ProductTypeApi.getTypePage({
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

  const openForm = (typeCode?: string) => typeFormRef.value?.open(typeCode)
  const goProduct = (typeCode?: string) => {
    if (!typeCode) return
    router.push({ path: '/supplier/product/list', query: { productType: typeCode } })
  }

  const handleDelete = async (row: ProductTypeVO) => {
    if (!row.typeCode || row.spuCount || row.skuCount || row.productCount) return
    try {
      await message.delConfirm()
      await ProductTypeApi.deleteType(row.typeCode)
      message.success('删除成功')
      getList()
    } catch {}
  }

  onMounted(getList)
</script>
