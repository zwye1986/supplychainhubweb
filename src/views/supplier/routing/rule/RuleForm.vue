<template>
  <el-dialog
    v-model="dialogVisible"
    :title="formData.ruleCode ? '编辑路由规则' : '新增路由规则'"
    width="860px"
    append-to-body
  >
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="130px">
      <el-divider content-position="left">基础信息</el-divider>
      <el-form-item label="规则名称" prop="name">
        <el-input
          v-model="formData.name"
          maxlength="50"
          :disabled="formData.protectedRule"
          placeholder="请输入规则名称"
          clearable
        />
      </el-form-item>
      <el-form-item label="适用分销商">
        <el-select
          v-model="formData.distributorCodes"
          multiple
          collapse-tags
          filterable
          clearable
          placeholder="全部"
        >
          <el-option v-for="item in distributorOptions" :key="item.code" :label="item.name" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="适用项目">
        <el-select
          v-model="formData.projectCodes"
          multiple
          collapse-tags
          filterable
          clearable
          placeholder="请选择"
        >
          <el-option v-for="item in projectOptions" :key="item.code" :label="item.name" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="适用商品类型">
        <ProductType v-model="formData.productTypeCodes" placeholder="全部" />
      </el-form-item>

      <el-divider content-position="left">路由模式与供应商设置</el-divider>
      <el-form-item label="路由模式" prop="routeMode">
        <el-radio-group v-model="formData.routeMode">
          <el-radio v-for="item in ROUTE_MODE_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="formData.routeMode === 'AUTO'" label="适用供应商" required>
        <el-radio-group v-model="formData.supplierMode">
          <el-radio value="ALL">全部</el-radio>
          <el-radio value="SPECIFIED">指定供应商</el-radio>
        </el-radio-group>
        <div v-if="formData.supplierMode === 'SPECIFIED'" class="mt-8px">
          <el-button link type="primary" @click="pickerVisible = true">选择供应商</el-button>
          <div v-if="selectedSupplierNames.length" class="mt-8px text-13px">
            已选：{{ selectedSupplierNames.join('、') }}
          </div>
          <div class="mt-4px text-12px text-gray-500">指定供应商时请至少选择 2 个，用于失败降级。</div>
        </div>
      </el-form-item>
      <el-form-item v-if="formData.routeMode === 'FIXED'" label="主供应商" prop="primarySupplierCode">
        <el-select v-model="formData.primarySupplierCode" filterable clearable placeholder="请选择固定主供应商">
          <el-option v-for="item in supplierOptions" :key="item.code" :label="item.name" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-radio-group v-model="formData.status">
          <el-radio v-for="item in ROUTE_STATUS_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-divider content-position="left">优先级顺序设置</el-divider>
      <div class="mb-12px text-13px text-gray-500">支持拖拽调整优先级顺序，共 3 个优先级。</div>
      <draggable v-model="formData.priorities" item-key="id" handle=".drag-handle" :animation="200">
        <template #item="{ element, index }">
          <div class="mb-12px flex items-center gap-12px rounded border p-12px">
            <Icon icon="ic:round-drag-indicator" class="drag-handle cursor-move text-gray-400" />
            <span class="w-90px">第{{ index + 1 }}优先级</span>
            <el-select v-model="element.strategy" class="!w-220px">
              <el-option
                v-for="item in ROUTE_STRATEGY_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
                :disabled="usedStrategies.includes(item.value) && element.strategy !== item.value"
              />
            </el-select>
            <span class="text-12px text-gray-500">{{ getStrategyHint(element.strategy) }}</span>
          </div>
        </template>
      </draggable>

      <template v-if="showWeights">
        <el-divider content-position="left">综合排序评分权重</el-divider>
        <el-alert class="mb-16px" type="info" :closable="false">
          综合排序评分权重在所有规则中保持一致；修改后其他规则会同步更新。权重之和必须为 100%。
        </el-alert>
        <el-form-item label="稳定性评分权重">
          <el-input-number v-model="formData.weights.stability" :min="0" :max="100" :precision="0" />
          <span class="ml-8px">%</span>
        </el-form-item>
        <el-form-item label="价格权重">
          <el-input-number v-model="formData.weights.price" :min="0" :max="100" :precision="0" />
          <span class="ml-8px">%</span>
        </el-form-item>
        <el-form-item label="时效评分权重">
          <el-input-number v-model="formData.weights.timeliness" :min="0" :max="100" :precision="0" />
          <span class="ml-8px">%</span>
        </el-form-item>
        <el-form-item label="合计">
          <span :class="weightSum === 100 ? 'text-[var(--el-color-success)]' : 'text-[var(--el-color-danger)]'">
            {{ weightSum }}%
          </span>
          <div v-if="weightSum !== 100" class="mt-4px text-12px text-[var(--el-color-danger)]">
            稳定性权重、价格权重、时效权重之和必须等于100%，当前为 {{ weightSum }}%
          </div>
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="formLoading" @click="submitForm">确定</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="pickerVisible" title="选择供应商" width="640px" append-to-body>
    <el-table
      ref="supplierTableRef"
      :data="supplierOptions"
      row-key="code"
      @selection-change="handleSupplierPick"
    >
      <el-table-column type="selection" width="50" :selectable="() => true" />
      <el-table-column label="供应商编码" prop="code" min-width="140" />
      <el-table-column label="供应商名称" prop="name" min-width="180" />
    </el-table>
    <template #footer>
      <el-button @click="pickerVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmSupplierPick">确定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import draggable from 'vuedraggable'
import { RoutingApi, RouteRuleVO } from '@/api/routing'
import { DistributorApi, ProjectApi } from '@/api/supplier/distribution'
import { SupplierApi } from '@/api/supplier/manage'
import {
  ROUTE_MODE_OPTIONS,
  ROUTE_STATUS_OPTIONS,
  ROUTE_STRATEGY_OPTIONS,
  createPriorities,
  createWeights,
  getRoutingScopeError,
  getStrategyHint
} from '@/views/supplier/routing/rule/utils/constants'

defineOptions({ name: 'RoutingRuleForm' })

interface CodeNameOption {
  code: string
  name: string
}

const message = useMessage()
const emit = defineEmits(['success'])
const dialogVisible = ref(false)
const pickerVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const pickedCodes = ref<string[]>([])
const supplierTableRef = ref()
const distributorOptions = ref<CodeNameOption[]>([])
const projectOptions = ref<CodeNameOption[]>([])
const supplierOptions = ref<CodeNameOption[]>([])
const formData = reactive<RouteRuleVO>({
  ruleCode: '',
  name: '',
  distributorMode: 'ALL',
  distributorCodes: [],
  projectMode: 'ALL',
  projectCodes: [],
  productTypeMode: 'ALL',
  productTypeCodes: [],
  routeMode: 'AUTO',
  supplierMode: 'ALL',
  supplierCodes: [],
  priorities: createPriorities(),
  weights: createWeights(),
  status: 'ENABLED'
})
const formRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  routeMode: [{ required: true, message: '请选择路由模式', trigger: 'change' }],
  primarySupplierCode: [{ required: true, message: '请选择主供应商', trigger: 'change' }]
}
const showWeights = computed(() => formData.priorities.some((item) => item.strategy === 'COMPOSITE'))
const weightSum = computed(
  () => (formData.weights.stability || 0) + (formData.weights.price || 0) + (formData.weights.timeliness || 0)
)
const usedStrategies = computed(() => formData.priorities.map((item) => item.strategy))
const selectedSupplierNames = computed(() =>
  (formData.supplierCodes || []).map((code, index) => {
    return (
      supplierOptions.value.find((item) => item.code === code)?.name ||
      formData.supplierNames?.[index] ||
      code
    )
  })
)

const toCodeName = (code?: string, name?: string) => ({ code: code || '', name: name || code || '' })

const loadOptions = async () => {
  const [distributors, projects, suppliers] = await Promise.all([
    DistributorApi.getDistributorNameList().catch(() => []),
    ProjectApi.getProjectNameList().catch(() => []),
    SupplierApi.getSupplierNameList({ view: 'simple' }).catch(() => [])
  ])
  distributorOptions.value = (distributors || [])
    .map((item) => toCodeName(item.code, item.label || item.value))
    .filter((item) => item.code)
  projectOptions.value = (projects || [])
    .map((item) => toCodeName(item.code, item.label || item.value))
    .filter((item) => item.code)
  const supplierList = Array.isArray(suppliers) ? suppliers : suppliers?.list || []
  supplierOptions.value = supplierList
    .map((item: { supplierCode?: string; code?: string; supplierName?: string; name?: string }) =>
      toCodeName(item.supplierCode || item.code, item.supplierName || item.name)
    )
    .filter((item: CodeNameOption) => item.code)
}

const handleSupplierPick = (rows: { code: string }[]) => {
  pickedCodes.value = rows.map((item) => item.code)
}

watch(pickerVisible, async (visible) => {
  if (!visible) return
  await nextTick()
  supplierTableRef.value?.clearSelection()
  supplierOptions.value.forEach((item) => {
    if (formData.supplierCodes?.includes(item.code)) {
      supplierTableRef.value?.toggleRowSelection(item, true)
    }
  })
})

const confirmSupplierPick = () => {
  formData.supplierCodes = [...pickedCodes.value]
  pickerVisible.value = false
}

const resetForm = () => {
  Object.assign(formData, {
    ruleCode: '',
    name: '',
    protectedRule: false,
    distributorMode: 'ALL',
    distributorCodes: [],
    projectMode: 'ALL',
    projectCodes: [],
    productTypeMode: 'ALL',
    productTypeCodes: [],
    routeMode: 'AUTO',
    supplierMode: 'ALL',
    supplierCodes: [],
    primarySupplierCode: undefined,
    priorities: createPriorities(),
    weights: createWeights(),
    status: 'ENABLED'
  })
  pickedCodes.value = []
  formRef.value?.resetFields()
}

const submitForm = async () => {
  await formRef.value?.validate()
  formData.distributorMode = formData.distributorCodes?.length ? 'SPECIFIED' : 'ALL'
  formData.projectMode = formData.projectCodes?.length ? 'SPECIFIED' : 'ALL'
  formData.productTypeMode = formData.productTypeCodes?.length ? 'SPECIFIED' : 'ALL'
  if (formData.routeMode === 'FIXED') {
    formData.supplierMode = 'SPECIFIED'
    formData.supplierCodes = formData.primarySupplierCode ? [formData.primarySupplierCode] : []
  }
  const scopeError = getRoutingScopeError(
    formData.distributorMode,
    formData.projectMode,
    formData.productTypeMode,
    formData.supplierMode
  )
  if (scopeError) {
    message.warning(scopeError)
    return
  }
  if (
    formData.routeMode === 'AUTO' &&
    formData.supplierMode === 'SPECIFIED' &&
    (formData.supplierCodes?.length || 0) < 2
  ) {
    message.warning('请选择2个及以上的供应商')
    return
  }
  if (formData.routeMode === 'FIXED' && !formData.primarySupplierCode) {
    message.warning('当路由模式为“固定供应商”时，必须指定主供应商')
    return
  }
  const strategies = formData.priorities.map((item) => item.strategy)
  if (new Set(strategies).size !== 3) {
    message.warning('三个优先级需分别选择稳定优先、价格优先、综合排序')
    return
  }
  if (showWeights.value && weightSum.value !== 100) {
    message.warning(`稳定性权重、价格权重、时效权重之和必须等于100%，当前为 ${weightSum.value}%`)
    return
  }
  formLoading.value = true
  try {
    if (formData.ruleCode) await RoutingApi.update(formData.ruleCode, { ...formData })
    else await RoutingApi.create({ ...formData })
    message.success('保存成功')
    dialogVisible.value = false
    emit('success')
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  } finally {
    formLoading.value = false
  }
}

const open = async (ruleCode?: string) => {
  dialogVisible.value = true
  resetForm()
  loadOptions()
  if (!ruleCode) return
  formLoading.value = true
  try {
    Object.assign(formData, await RoutingApi.get(ruleCode))
    if (!formData.priorities?.length) formData.priorities = createPriorities()
    if (!formData.weights) formData.weights = createWeights()
    if (!formData.distributorCodes) formData.distributorCodes = []
    if (!formData.projectCodes) formData.projectCodes = []
    if (!formData.productTypeCodes) formData.productTypeCodes = []
    pickedCodes.value = [...(formData.supplierCodes || [])]
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
