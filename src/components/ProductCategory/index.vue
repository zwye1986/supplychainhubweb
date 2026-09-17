/** 商品分类选择 / 回显 */
<template>
  <span v-if="text" class="inline-flex flex-wrap items-center">
    <template v-if="displayItems.length">
      <el-tag v-if="showTags" v-for="item in displayItems" :key="item.value" class="m-2px" size="small" type="warning">
        {{ item.label }}
      </el-tag>
      <span v-else>{{ displayItems[0]?.label }}</span>
    </template>
    <span v-else>-</span>
  </span>
  <el-tree-select v-else v-model="model" :data="displayTree" :clearable="clearable" :check-strictly="checkStrictly" :filterable="filterable" :disabled="disabled" :node-key="nodeKey"
    :props="{ label: 'categoryName', children: 'children', disabled: 'disabled' }" :placeholder="placeholder" class="w-full" @change="onChange" @visible-change="onVisibleChange" />
</template>

<script lang="ts" setup>
  import { ProductCategoryApi, ProductCategoryVO } from '@/api/product'

  /** 商品分类选择 / 回显 */
  defineOptions({ name: 'ProductCategory' })

  const props = withDefaults(
    defineProps<{
      clearable?: boolean
      checkStrictly?: boolean
      filterable?: boolean
      disabled?: boolean
      placeholder?: string
      nodeKey?: string
      /** 仅展示名称，不渲染下拉 */
      text?: boolean
      /** 编辑分类时禁用自身及子节点 */
      excludeCode?: string
    }>(),
    {
      clearable: true,
      checkStrictly: true,
      filterable: true,
      disabled: false,
      placeholder: '请选择商品分类',
      nodeKey: 'categoryCode',
      text: false,
      excludeCode: undefined
    }
  )

  const emit = defineEmits<{
    change: [value: string | number | Array<string | number> | undefined]
  }>()

  type CategoryTreeNode = ProductCategoryVO & { disabled?: boolean }

  const model = defineModel<string | number | Array<string | number> | undefined>()
  const categoryCode = defineModel<string | undefined>('categoryCode')
  const categoryTree = ref<ProductCategoryVO[]>([])

  const flattenCategories = (nodes: ProductCategoryVO[]): ProductCategoryVO[] =>
    nodes.flatMap((node) => [node, ...flattenCategories(node.children || [])])

  const findCategory = (nodes: ProductCategoryVO[], code?: string): ProductCategoryVO | undefined => {
    if (!code) return undefined
    for (const node of nodes) {
      if (node.categoryCode === code || String(node.id) === code) return node
      const found = findCategory(node.children || [], code)
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

  const displayTree = computed(() => {
    if (!props.excludeCode) return categoryTree.value
    const disabledCodes = new Set<string>([props.excludeCode])
    collectDescendantCodes(findCategory(categoryTree.value, props.excludeCode)).forEach((code) =>
      disabledCodes.add(code)
    )
    return markDisabled(categoryTree.value, disabledCodes)
  })

  const showTags = computed(() => Array.isArray(model.value))

  const displayItems = computed(() => {
    const value = model.value
    const codes = Array.isArray(value) ? value : value != null && value !== '' ? [value] : []
    const list = flattenCategories(categoryTree.value)
    return codes
      .map((code) => String(code))
      .filter(Boolean)
      .map((code) => {
        const found = list.find(
          (item) =>
            item.categoryCode === code || String(item.id) === code || item.categoryName === code
        )
        return { value: code, label: found?.categoryName || code }
      })
  })

  const syncCategoryCode = (value: string | number | Array<string | number> | undefined) => {
    if (value == null || value === '' || (Array.isArray(value) && !value.length)) {
      categoryCode.value = undefined
      return
    }
    const key = String(Array.isArray(value) ? value[0] : value)
    const found = flattenCategories(categoryTree.value).find(
      (item) => item.categoryCode === key || String(item.id) === key
    )
    if (found?.categoryCode) categoryCode.value = found.categoryCode
  }

  const onChange = (value: string | number | Array<string | number> | undefined) => {
    syncCategoryCode(value)
    emit('change', value)
  }

  const loadTree = async () => {
    categoryTree.value = await ProductCategoryApi.getCategoryList({ status: 10 })
    syncCategoryCode(model.value)
  }

  const onVisibleChange = (visible: boolean) => {
    if (visible) loadTree()
  }

  onMounted(loadTree)
</script>
