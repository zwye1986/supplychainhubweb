<template>
  <ContentWrap>
    <div class="mb-12px flex flex-wrap items-center justify-between gap-10px">
      <div class="flex flex-wrap gap-8px">
        <el-check-tag :checked="!activeTag" @change="handleTagChange('')">全部</el-check-tag>
        <el-check-tag
          v-for="tag in filterTags"
          :key="tag.value"
          :checked="activeTag === tag.value"
          @change="handleTagChange(tag.value)"
        >
          {{ tag.label }}
        </el-check-tag>
      </div>
      <el-button
        v-hasPermi="['scm:supplier:update']"
        type="primary"
        @click="openSelectDialog"
      >
        <Icon icon="ep:plus" class="mr-5px" /> 新增商品
      </el-button>
    </div>

    <el-alert
      class="mb-12px"
      type="info"
      :closable="false"
      title="供应价模式：固定值按设定金额供货；供货折扣按标品价格 × 折扣率结算。"
    />

    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="SPU名称" prop="spuName" min-width="140" />
      <el-table-column label="SKU名称" prop="skuName" min-width="140" />
      <el-table-column label="SKU编号" prop="skuCode" min-width="120" />
      <el-table-column label="分类" prop="categoryName" min-width="100" />
      <el-table-column label="供应价模式" prop="supplyPriceMode" min-width="110">
        <template #default="{ row }">
          {{ getSupplyPriceModeLabel(row.supplyPriceMode) }}
        </template>
      </el-table-column>
      <el-table-column label="供应价/折扣" min-width="120">
        <template #default="{ row }">
          <span v-if="row.supplyPriceMode === SupplyPriceModeEnum.FIXED">
            ¥{{ row.supplyPrice ?? '-' }}
          </span>
          <span v-else>{{ row.supplyDiscount ?? '-' }}%</span>
        </template>
      </el-table-column>
      <el-table-column label="供货模式" prop="supplyMode" min-width="100">
        <template #default="{ row }">
          {{ getSupplyModeLabel(row.supplyMode) }}
        </template>
      </el-table-column>
      <el-table-column label="供货上限" prop="supplyLimit" min-width="100" />
      <el-table-column label="最低起购量" prop="minOrderQty" min-width="110" />
      <el-table-column
        label="创建时间"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="操作" width="90" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            v-hasPermi="['scm:supplier:update']"
            link
            type="danger"
            @click="handleDelete(row.id)"
          >
            移除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />

    <ProductSelectDialog
      ref="selectDialogRef"
      :supplier-id="supplierId"
      :capability-tags="capabilityTags"
      @success="getList"
    />
  </ContentWrap>
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import { SupplierApi, SupplierProductVO } from '@/api/supplier/manage'
import {
  SupplyPriceModeEnum,
  getCapabilityLabel,
  getSupplyModeLabel,
  getSupplyPriceModeLabel
} from '@/views/supplier/utils/constants'
import ProductSelectDialog from './ProductSelectDialog.vue'

defineOptions({ name: 'SupplierProductList' })

const props = defineProps<{
  supplierId: number
  capabilityTags?: string[]
}>()

const message = useMessage()
const loading = ref(false)
const list = ref<SupplierProductVO[]>([])
const total = ref(0)
const activeTag = ref('')
const selectDialogRef = ref<InstanceType<typeof ProductSelectDialog>>()

const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  supplierId: undefined as number | undefined,
  categoryCode: undefined as string | undefined
})

const filterTags = computed(() =>
  (props.capabilityTags || []).map((value) => ({
    value,
    label: getCapabilityLabel(value)
  }))
)

const getList = async () => {
  if (!props.supplierId) return
  loading.value = true
  queryParams.supplierId = props.supplierId
  queryParams.categoryCode = activeTag.value || undefined
  try {
    const data = await SupplierApi.getProductPage(queryParams)
    list.value = data.list || []
    total.value = data.total || 0
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleTagChange = (value: string) => {
  activeTag.value = value
  queryParams.pageNo = 1
  getList()
}

const openSelectDialog = () => {
  selectDialogRef.value?.open()
}

const handleDelete = async (id?: number) => {
  if (!id) return
  try {
    await message.delConfirm('确认移除该合作商品吗？')
    await SupplierApi.deleteProduct(id)
    message.success('移除成功')
    await getList()
  } catch {}
}

watch(
  () => props.supplierId,
  () => {
    queryParams.pageNo = 1
    getList()
  },
  { immediate: true }
)
</script>
