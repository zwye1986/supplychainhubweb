<template>
  <!-- v-loading 必须挂在原生元素上；挂在 el-cascader 上会触发非元素根节点告警 -->
  <div v-loading="loading" class="w-full">
    <el-cascader
      class="w-full"
      :model-value="cascaderValue"
      :options="areaTree"
      :props="cascaderProps"
      :disabled="disabled"
      :clearable="clearable"
      :filterable="filterable"
      :placeholder="placeholder"
      :show-all-levels="showAllLevels"
      @update:model-value="handleChange"
    />
  </div>
</template>

<script lang="ts" setup>
import type { CascaderNode, CascaderOption } from 'element-plus'

import * as AreaApi from '@/api/system/area'
import { defaultProps } from '@/utils/tree'

defineOptions({ name: 'AreaSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number | number[]
    disabled?: boolean
    clearable?: boolean
    filterable?: boolean
    checkStrictly?: boolean
    /** 是否回传从省到当前节点的完整路径；默认只回当前节点 */
    emitPath?: boolean
    showAllLevels?: boolean
    selectableLevels?: number[]
    placeholder?: string
  }>(),
  {
    disabled: false,
    clearable: true,
    filterable: true,
    checkStrictly: false,
    emitPath: false,
    showAllLevels: true,
    placeholder: '请选择地区'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined]
}>()

const areaTree = ref<Tree[]>([]) // 地区树
const loading = ref(false) // 地区树的加载中

/** 级联选择器配置 */
const cascaderProps = computed(() => ({
  ...defaultProps,
  checkStrictly: props.checkStrictly,
  ...(props.selectableLevels
    ? {
        disabled: (_data: CascaderOption, node: CascaderNode) =>
          !props.selectableLevels?.includes(node.level)
      }
    : {}),
  emitPath: props.emitPath
}))

/** 根据末级 id 回溯省/市/区完整路径，兼容只存了叶子的旧数据 */
const findAreaPath = (tree: Tree[], targetId: number, path: number[] = []): number[] | undefined => {
  for (const node of tree) {
    const next = [...path, node.id]
    if (node.id === targetId) return next
    if (node.children?.length) {
      const found = findAreaPath(node.children as Tree[], targetId, next)
      if (found) return found
    }
  }
  return undefined
}

/** emitPath 时 cascader 需要数组；若外部只给了叶子 id，自动补全祖先 */
const cascaderValue = computed(() => {
  if (!props.emitPath) return props.modelValue
  const val = props.modelValue
  if (val == null || val === undefined) return undefined
  if (Array.isArray(val)) {
    if (val.length === 1 && areaTree.value.length) {
      return findAreaPath(areaTree.value, val[0]) || val
    }
    return val
  }
  if (typeof val === 'number' && areaTree.value.length) {
    return findAreaPath(areaTree.value, val) || [val]
  }
  return typeof val === 'number' ? [val] : undefined
})

/** 选中变化 */
const handleChange = (value: unknown) => {
  if (props.emitPath) {
    emit(
      'update:modelValue',
      Array.isArray(value) && value.length ? (value as number[]) : undefined
    )
    return
  }
  emit('update:modelValue', typeof value === 'number' ? value : undefined)
}

/** 获得地区树 */
const getAreaTree = async () => {
  loading.value = true
  try {
    areaTree.value = await AreaApi.getAreaTree()
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getAreaTree()
})
</script>
