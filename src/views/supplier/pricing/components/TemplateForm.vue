<template>
  <el-dialog
    v-model="dialogVisible"
    :title="pageTitle"
    width="1100px"
    append-to-body
  >
    <el-alert v-if="scene === 'DINING'" class="mb-16px" type="info" :closable="false">
      <ol class="pl-16px leading-24px">
        <li>当前店铺场景支持肯德基、麦当劳、奈雪的茶、瑞幸咖啡、星巴克、库迪咖啡</li>
        <li>每个品牌的商品当其他低价大牌销售时，会出价到指定价格，所以客户在配置单品利润空间时，请根据实际需求配置</li>
        <li>配置完加价模板后，需要在H5商城中设置加价模板为默认值，才会出现商品展示，详细问题可以联系运营人员</li>
        <li>所有品类商品价格会根据实际情况有所调整，具体价格可咨询运营人员</li>
      </ol>
    </el-alert>
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="120px">
      <el-divider content-position="left">基本信息</el-divider>
      <el-form-item v-if="scene === 'MOVIE'" label="类型" prop="kind">
        <el-select v-model="formData.kind">
          <el-option v-for="item in MOVIE_KIND_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="模板名称" prop="name">
        <el-input v-model="formData.name" maxlength="50" placeholder="请输入模板名称" />
      </el-form-item>
      <el-form-item label="适用分销商" prop="distributorMode">
        <el-radio-group v-model="formData.distributorMode">
          <el-radio value="ALL">全部分销商</el-radio>
          <el-radio value="SPECIFIED">指定分销商</el-radio>
        </el-radio-group>
        <el-select
          v-if="formData.distributorMode === 'SPECIFIED'"
          v-model="formData.distributorCodes"
          class="mt-8px"
          multiple
          filterable
        >
          <el-option v-for="item in MOCK_DISTRIBUTORS" :key="item.code" :label="item.name" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="适用项目" prop="projectMode">
        <el-radio-group v-model="formData.projectMode">
          <el-radio value="ALL">全部项目</el-radio>
          <el-radio value="SPECIFIED">指定项目</el-radio>
        </el-radio-group>
        <el-select
          v-if="formData.projectMode === 'SPECIFIED'"
          v-model="formData.projectCodes"
          class="mt-8px"
          multiple
          filterable
        >
          <el-option v-for="item in MOCK_PROJECTS" :key="item.code" :label="item.name" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="服务费文案">
        <el-input v-model="formData.feeCopy" maxlength="100" placeholder="配送、服务及其他费用：" />
        <el-checkbox v-model="formData.hideFeeCopy" class="mt-8px">不显示服务文案</el-checkbox>
        <div v-if="scene === 'DINING'" class="mt-8px text-12px text-[var(--el-color-danger)]">
          配置文案时，请注意增加符号，若选择不显示服务文案，用户在支付时，可能会出现价格不对等，请谨慎开通
        </div>
      </el-form-item>

      <template v-if="scene === 'MOVIE'">
        <el-divider content-position="left">销售价配置</el-divider>
        <el-alert class="mb-16px" type="info" :closable="false">
          全国加价、指定区域加价二者可同时设置。系统取价顺序为：城市定价 > 全国定价
        </el-alert>
        <MarkupBlock v-model="formData.national!" title="全国加价" national />
        <MarkupBlock
          v-for="(row, index) in formData.regions"
          :key="row.id"
          v-model="formData.regions![index]"
          title="指定区域加价"
          removable
          :disabled-cities="usedCities(index)"
          @remove="formData.regions!.splice(index, 1)"
        />
        <el-button class="mb-16px" @click="addRegion">继续添加区域加价</el-button>
      </template>

      <template v-else>
        <el-divider content-position="left">指定渠道加价</el-divider>
        <el-alert v-if="scene === 'DINING'" class="mb-16px" type="info" :closable="false">
          商品销售价：选择市场价时，盈利点为市场价+加价所得+服务费-供应价；选择供应价时，盈利点为加价所得+服务费。
        </el-alert>
        <el-form-item label="指定渠道" required>
          <el-checkbox-group v-model="formData.channelCodes" @change="syncChannels">
            <el-checkbox v-for="item in channelOptions" :key="item.code" :value="item.code">
              {{ item.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <div v-for="(channel, index) in formData.channels" :key="channel.channelCode" class="mb-16px rounded border p-16px">
          <div class="mb-12px font-600">{{ channel.channelName }}</div>
          <el-form-item label="服务费">
            <FormulaInput v-model="channel.serviceFee" :with-base="false" />
          </el-form-item>
          <MarkupBlock
            v-if="scene === 'DINING'"
            v-model="formData.channels![index].national"
            title="全国加价"
            national
            :show-service-fee="false"
          />
          <template v-if="scene === 'DINING'">
            <MarkupBlock
              v-for="(row, rIndex) in channel.regions"
              :key="row.id"
              v-model="formData.channels![index].regions[rIndex]"
              title="指定区域加价"
              removable
              :show-service-fee="false"
              @remove="channel.regions.splice(rIndex, 1)"
            />
            <el-button class="mb-12px" @click="channel.regions.push(createRegion())">添加区域</el-button>
          </template>
          <MarkupBlock
            v-else
            v-model="formData.channels![index].national"
            title="全国加价"
            national
            :show-service-fee="false"
          />
          <el-form-item label="隐藏规则">
            <div class="flex items-center gap-8px">
              <span>总利润空间低于</span>
              <el-input-number :controls="false" v-model="channel.hideThreshold" :min="0" :max="100" :precision="0" />
              <span>% 用户端自动隐藏该商品</span>
            </div>
          </el-form-item>
        </div>
      </template>

      <el-divider content-position="left">隐藏规则</el-divider>
      <el-form-item label="利润空间阈值" prop="hideThreshold">
        <div class="flex items-center gap-8px">
          <span>商品展示：总利润空间低于</span>
          <el-input-number :controls="false" v-model="formData.hideThreshold" :min="0" :max="100" :precision="0" />
          <span>% 用户端自动隐藏该商品</span>
        </div>
        <div class="mt-8px text-12px text-gray-500">
          提示：单品牌利润空间=（商品分销价-供应价）/供应价*100%
        </div>
      </el-form-item>

      <el-divider content-position="left">分销价配置</el-divider>
      <el-form-item label="分销价">
        <el-button type="primary" plain @click="openDistPrice">配置分销价</el-button>
        <div v-if="formData.distPrice" class="mt-8px text-13px text-gray-500">
          {{ formData.distPrice.mode === 'SUGGEST' ? '分销价=销售建议价' : formatFormula(formData.distPrice.formula) }}
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="formLoading" @click="submitForm">保存</el-button>
    </template>
    <DistPriceDialog ref="distRef" />
  </el-dialog>
</template>

<script lang="ts" setup>
import { PricingApi, PricingTemplateVO, TemplateScene } from '@/api/pricing'
import MarkupBlock from './MarkupBlock.vue'
import FormulaInput from './FormulaInput.vue'
import DistPriceDialog from './DistPriceDialog.vue'
import {
  DINING_CHANNELS,
  H5_CHANNELS,
  MOCK_DISTRIBUTORS,
  MOCK_PROJECTS,
  MOVIE_KIND_OPTIONS,
  createDistPrice,
  createRegion,
  createChannel,
  formatFormula
} from '@/views/supplier/pricing/utils/constants'

defineOptions({ name: 'PricingTemplateForm' })

const props = defineProps({
  scene: { type: String as PropType<TemplateScene>, required: true }
})

const message = useMessage()
const emit = defineEmits(['success'])
const dialogVisible = ref(false)
const formRef = ref()
const distRef = ref()
const formLoading = ref(false)
const channelOptions = computed(() => (props.scene === 'H5' ? H5_CHANNELS : DINING_CHANNELS))
const formData = reactive<PricingTemplateVO>({
  scene: props.scene,
  kind: 'FAST',
  name: '',
  distributorMode: 'ALL',
  distributorCodes: [],
  projectMode: 'ALL',
  projectCodes: [],
  feeCopy: '配送、服务及其他费用：',
  hideFeeCopy: false,
  national: createRegion(true),
  regions: [],
  hideThreshold: 2,
  distPrice: createDistPrice(),
  channelCodes: [],
  channels: []
})
const formRules = computed(() => ({
  ...(props.scene === 'MOVIE'
    ? { kind: [{ required: true, message: '请选择类型', trigger: 'change' }] }
    : {}),
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  distributorMode: [{ required: true, message: '请选择适用分销商', trigger: 'change' }],
  projectMode: [{ required: true, message: '请选择适用项目', trigger: 'change' }],
  hideThreshold: [{ required: true, message: '请设置利润空间阈值', trigger: 'change' }]
}))
const pageTitle = computed(() => (formData.id ? '编辑定价模板' : '新建定价模板'))

const resetForm = () => {
  Object.assign(formData, {
    id: undefined,
    scene: props.scene,
    kind: 'FAST',
    name: '',
    distributorMode: 'ALL',
    distributorCodes: [],
    projectMode: 'ALL',
    projectCodes: [],
    feeCopy: '配送、服务及其他费用：',
    hideFeeCopy: false,
    national: createRegion(true),
    regions: [],
    hideThreshold: 2,
    distPrice: createDistPrice(),
    channelCodes: [],
    channels: []
  })
  formRef.value?.resetFields()
}

const usedCities = (index: number) =>
  (formData.regions || [])
    .filter((_, i) => i !== index)
    .flatMap((item) => item.cities || [])

const addRegion = () => {
  formData.regions = formData.regions || []
  formData.regions.push(createRegion())
}

const syncChannels = () => {
  const codes = formData.channelCodes || []
  const exists = new Map((formData.channels || []).map((item) => [item.channelCode, item]))
  formData.channels = codes.map((code) => {
    if (exists.has(code)) return exists.get(code)!
    const option = channelOptions.value.find((item) => item.code === code)!
    return createChannel(option.code, option.name)
  })
}

const openDistPrice = async () => {
  formData.distPrice = await distRef.value.open(formData.distPrice)
}

const submitForm = async () => {
  await formRef.value?.validate()
  if (formData.distributorMode === 'SPECIFIED' && !formData.distributorCodes?.length) {
    message.warning('请至少选择一个分销商')
    return
  }
  if (formData.projectMode === 'SPECIFIED' && !formData.projectCodes?.length) {
    message.warning('请至少选择一个项目')
    return
  }
  if (props.scene !== 'MOVIE' && !formData.channelCodes?.length) {
    message.warning('请至少选择一个渠道品牌')
    return
  }
  formData.distributorNames = MOCK_DISTRIBUTORS.filter((item) =>
    formData.distributorCodes?.includes(item.code)
  ).map((item) => item.name)
  formData.projectNames = MOCK_PROJECTS.filter((item) => formData.projectCodes?.includes(item.code)).map(
    (item) => item.name
  )
  formLoading.value = true
  try {
    await PricingApi.saveTemplate({ ...formData, scene: props.scene })
    message.success('保存成功')
    dialogVisible.value = false
    emit('success')
  } catch (error: any) {
    if (error?.message) message.error(error.message)
  } finally {
    formLoading.value = false
  }
}

const open = async (id?: number, kind?: 'FAST' | 'SLOW') => {
  dialogVisible.value = true
  resetForm()
  if (kind) formData.kind = kind
  if (!id) return
  formLoading.value = true
  try {
    Object.assign(formData, await PricingApi.getTemplate(id))
    if (!formData.national) formData.national = createRegion(true)
    if (!formData.regions) formData.regions = []
    if (!formData.distPrice) formData.distPrice = createDistPrice()
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
