/**
 * 分销商组件
 */
<template>
  <div class="distributor-select flex w-full items-center gap-8px">
    <el-select
      v-model="model"
      :multiple="multiple"
      :collapse-tags="collapseTags"
      :filterable="filterable"
      :disabled="disabled"
      :placeholder="placeholder"
      class="min-w-0 flex-1"
      clearable
      @change="emit('change', $event)"
    >
      <el-option v-for="item in options" :key="item.code" :label="item.name" :value="item.code" />
    </el-select>
    <el-button link type="primary" :disabled="disabled" @click="openPicker">选择</el-button>
  </div>

  <el-dialog v-model="pickerVisible" title="选择分销商" width="1000px" append-to-body>
    <div class="mb-12px flex items-center gap-8px">
      <el-input
        v-model="keyword"
        class="min-w-0 flex-1"
        placeholder="搜索分销商名称"
        clearable
      />
      <el-button :disabled="!multiple || !filteredOptions.length" @click="selectAll">全选</el-button>
      <el-button :disabled="!hasPicked" @click="clearPick">取消勾选</el-button>
    </div>
    <div v-loading="loading" class="max-h-420px overflow-y-auto">
      <el-empty v-if="!filteredOptions.length" description="暂无分销商" :image-size="64" />
      <el-checkbox-group v-else-if="multiple" v-model="pickedCodes" class="distributor-select__list">
        <el-checkbox
          v-for="item in filteredOptions"
          :key="item.code"
          :value="item.code"
          border
          class="distributor-select__item"
        >
          {{ item.name }}
        </el-checkbox>
      </el-checkbox-group>
      <el-radio-group v-else v-model="pickedSingle" class="distributor-select__list">
        <el-radio
          v-for="item in filteredOptions"
          :key="item.code"
          :value="item.code"
          border
          class="distributor-select__item"
        >
          {{ item.name }}
        </el-radio>
      </el-radio-group>
    </div>
    <template #footer>
      <el-button @click="pickerVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmPick">确定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { DistributorApi } from '@/api/supplier/distribution'

/** 分销商选择 */
defineOptions({ name: 'DistributorSelect' })

interface CodeNameOption {
  code: string
  name: string
}

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
const options = ref<CodeNameOption[]>([])
const loading = ref(false)
const pickerVisible = ref(false)
const keyword = ref('')
const pickedCodes = ref<string[]>([])
const pickedSingle = ref<string>('')

const filteredOptions = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  if (!key) return options.value
  return options.value.filter((item) => item.name.toLowerCase().includes(key))
})

const selectedCodes = computed(() => {
  const value = model.value
  if (Array.isArray(value)) return value
  return value ? [value] : []
})

const hasPicked = computed(() =>
  props.multiple ? pickedCodes.value.length > 0 : !!pickedSingle.value
)

const selectAll = () => {
  if (!props.multiple) return
  pickedCodes.value = filteredOptions.value.map((item) => item.code)
}

const clearPick = () => {
  pickedCodes.value = []
  pickedSingle.value = ''
}

const loadOptions = async () => {
  loading.value = true
  try {
    const list = await DistributorApi.getDistributorNameList({ status: props.status }).catch(() => [])
    options.value = (list || [])
      .map((item) => ({
        code: item.code || '',
        name: item.label || item.value || item.code || ''
      }))
      .filter((item) => item.code)
  } finally {
    loading.value = false
  }
}

const openPicker = async () => {
  if (!options.value.length) await loadOptions()
  keyword.value = ''
  if (props.multiple) {
    pickedCodes.value = [...selectedCodes.value]
  } else {
    pickedSingle.value = selectedCodes.value[0] || ''
  }
  pickerVisible.value = true
}

const confirmPick = () => {
  if (props.multiple) {
    const next = [...pickedCodes.value]
    model.value = next
    emit('change', next)
  } else {
    const next = pickedSingle.value || undefined
    model.value = next
    emit('change', next)
  }
  pickerVisible.value = false
}

onMounted(loadOptions)
</script>

<style scoped>
.distributor-select__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.distributor-select__item {
  margin-right: 0 !important;
  height: 36px;
  padding: 0 12px;
  white-space: nowrap;
}
</style>
