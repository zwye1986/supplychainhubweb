/**
 * 分销商选择组件
 */
<template>
  <el-select
    v-model="model"
    :multiple="multiple"
    :collapse-tags="collapseTags"
    :filterable="filterable"
    :disabled="disabled"
    :placeholder="placeholder"
    class="w-full"
    clearable
    @change="emit('change', $event)"
  >
    <el-option v-for="item in options" :key="item.code" :label="item.name" :value="item.code" />
  </el-select>
</template>

<script lang="ts" setup>
import { DistributorApi } from '@/api/supplier/distribution'

/** 分销商选择 */
defineOptions({ name: 'DistributorSelect' })

const props = withDefaults(
  defineProps<{
    multiple?: boolean
    collapseTags?: boolean
    filterable?: boolean
    disabled?: boolean
    placeholder?: string
    /** 仅加载指定状态的分销商，默认 ACTIVE */
    status?: string[]
  }>(),
  {
    multiple: true,
    collapseTags: true,
    filterable: true,
    disabled: false,
    placeholder: '请选择分销商',
    status: () => ['ACTIVE']
  }
)

const emit = defineEmits<{
  change: [value: string | string[] | undefined]
}>()

const model = defineModel<string | string[] | undefined>()
const options = ref<{ code: string; name: string }[]>([])

onMounted(async () => {
  const list = await DistributorApi.getDistributorNameList({ status: props.status }).catch(() => [])
  options.value = (list || [])
    .map((item) => ({
      code: item.code || '',
      name: item.label || item.value || item.code || ''
    }))
    .filter((item) => item.code)
})
</script>
