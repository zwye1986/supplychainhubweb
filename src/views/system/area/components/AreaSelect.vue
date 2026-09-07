<template>
  <!-- v-loading 必须挂在原生元素上；挂在 el-cascader 上会触发非元素根节点告警 -->
  <div v-loading="loading" class="w-full">
    <el-cascader
      class="w-full"
      :model-value="modelValue"
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
    modelValue?: number
    disabled?: boolean
    clearable?: boolean
    filterable?: boolean
    checkStrictly?: boolean
    showAllLevels?: boolean
    selectableLevels?: number[]
    placeholder?: string
  }>(),
  {
    disabled: false,
    clearable: true,
    filterable: true,
    checkStrictly: false,
    showAllLevels: true,
    placeholder: '请选择地区'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
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
  emitPath: false
}))

/** 选中变化 */
const handleChange = (value: unknown) => {
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
