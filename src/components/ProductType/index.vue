<template>
  <span v-if="text" class="inline-flex flex-wrap items-center">
    <template v-if="displayItems.length">
      <el-tag
        v-if="multiple"
        v-for="item in displayItems"
        :key="item.value"
        class="m-2px"
        size="small"
        type="success"
      >
        {{ item.label }}
      </el-tag>
      <span v-else>{{ displayItems[0]?.label }}</span>
    </template>
    <span v-else>-</span>
  </span>
  <el-select
    v-else
    v-model="model"
    v-select-load-more="loadMore"
    :multiple="multiple"
    :collapse-tags="collapseTags"
    :disabled="disabled"
    :placeholder="placeholder"
    class="w-full"
    clearable
    @change="emit('change', $event)"
  >
    <el-option v-for="item in typeList" :key="item.typeCode" :label="item.typeName" :value="item.typeCode" />
  </el-select>
</template>

<script lang="ts" setup>
  import { ProductTypeApi, ProductTypeVO } from '@/api/product'

  /** 商品类型选择 / 回显 */
  defineOptions({ name: 'ProductType' })

  const props = withDefaults(
    defineProps<{
      multiple?: boolean
      collapseTags?: boolean
      disabled?: boolean
      placeholder?: string
      /** 仅展示名称，不渲染下拉 */
      text?: boolean
    }>(),
    {
      multiple: true,
      collapseTags: true,
      disabled: false,
      placeholder: '请选择商品类型',
      text: false
    }
  )

  const emit = defineEmits<{
    change: [value: string | string[] | undefined]
  }>()

  const PAGE_SIZE = 20
  const model = defineModel<string | string[] | number | Array<string | number> | undefined>()
  const typeList = ref<ProductTypeVO[]>([])
  const pageNo = ref(0)
  const total = ref(0)
  const loading = ref(false)
  const finished = ref(false)

  const displayItems = computed(() => {
    const value = model.value
    const codes = Array.isArray(value) ? value : value != null && value !== '' ? [value] : []
    return codes
      .map((code) => String(code))
      .filter(Boolean)
      .map((code) => ({
        value: code,
        label: typeList.value.find((item) => item.typeCode === code)?.typeName || code
      }))
  })

  const loadPage = async (reset = false) => {
    if (loading.value || (!reset && finished.value)) return
    loading.value = true
    try {
      const nextPage = reset ? 1 : pageNo.value + 1
      const data = await ProductTypeApi.getTypePage({ pageNo: nextPage, pageSize: PAGE_SIZE })
      const list = ((data?.list || []) as ProductTypeVO[]).filter((item) => !!item.typeCode)
      typeList.value = reset ? list : [...typeList.value, ...list]
      total.value = data?.total || 0
      pageNo.value = nextPage
      finished.value = list.length < PAGE_SIZE || typeList.value.length >= total.value
    } finally {
      loading.value = false
    }
  }

  const loadMore = () => loadPage(false)

  onMounted(async () => {
    if (props.text) {
      typeList.value = await ProductTypeApi.getTypeList()
      return
    }
    loadPage(true)
  })
</script>
