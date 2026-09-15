<template>
  <ContentWrap>
    <el-alert class="mb-16px" type="warning" :closable="false">
      {{ tip }}
      您最多可添加 20 条，还可以添加 {{ remain }} 条。
    </el-alert>
    <div class="mb-16px flex justify-end">
      <el-button type="primary" :disabled="remain <= 0" @click="openForm()">
        <Icon icon="ep:plus" class="mr-5px" /> 新建模板
      </el-button>
    </div>
    <el-empty v-if="!loading && !list.length" description="暂无定价模板，点击「新建模板」创建" />
    <el-row v-else v-loading="loading" :gutter="16">
      <el-col v-for="item in list" :key="item.id" :xs="24" :lg="12" class="mb-16px">
        <el-card shadow="hover">
          <div class="mb-10px flex items-start justify-between gap-8px">
            <div class="min-w-0">
              <div class="truncate text-16px font-600">{{ item.name }}</div>
              <el-tag v-if="item.kind" class="mt-6px" size="small">
                {{ item.kind === 'FAST' ? '快充模板' : '慢充模板' }}
              </el-tag>
            </div>
            <div>
              <el-button link type="primary" @click="openForm(item.id)">编辑</el-button>
              <el-button link type="danger" @click="handleDelete(item)">删除</el-button>
            </div>
          </div>
          <div class="mb-6px text-13px">适用分销商：{{ formatScope(item.distributorMode, item.distributorNames, '全部分销商') }}</div>
          <div class="mb-10px text-13px">适用项目：{{ formatScope(item.projectMode, item.projectNames, '全部项目') }}</div>
          <el-table v-if="scene === 'MOVIE'" :data="movieRows(item)" size="small" border class="mb-10px">
            <el-table-column label="加价区域" min-width="160">
              <template #default="{ row }">{{ formatRegion(row) }}</template>
            </el-table-column>
            <el-table-column label="调价方式" min-width="120">
              <template #default="{ row }">{{ row.cities?.includes('NATION') ? '全国加价' : '指定区域加价' }}</template>
            </el-table-column>
            <el-table-column label="调价规则" min-width="180">
              <template #default="{ row }">{{ formatMarkup(row) }} / {{ formatServiceFee(row.serviceFee) }}</template>
            </el-table-column>
          </el-table>
          <el-table v-else :data="channelRows(item)" size="small" border class="mb-10px">
            <el-table-column label="加价渠道" prop="channelName" min-width="110" />
            <el-table-column label="服务费规则" min-width="160">
              <template #default="{ row }">{{ formatServiceFee(row.serviceFee) }}</template>
            </el-table-column>
            <el-table-column label="销售价加价区域" min-width="140">
              <template #default="{ row }">{{ formatRegion(row.national) }}</template>
            </el-table-column>
            <el-table-column label="调价规则" min-width="160">
              <template #default="{ row }">{{ formatMarkup(row.national) }}</template>
            </el-table-column>
            <el-table-column label="隐藏规则" min-width="160">
              <template #default="{ row }">单品利润空间低于{{ row.hideThreshold }}%</template>
            </el-table-column>
          </el-table>
          <div class="text-13px text-gray-500">
            隐藏规则：单品利润空间低于 {{ item.hideThreshold ?? 0 }}% 用户端自动隐藏该商品
          </div>
          <div class="mt-6px text-13px text-gray-500">
            分销价：{{ item.distPrice?.mode === 'SUGGEST' ? '分销价=销售建议价' : formatFormula(item.distPrice?.formula) }}
            {{ item.distPrice?.taxMode === 'TAX_INCLUDED' ? ` 含税 税率：${item.distPrice?.taxRate}%` : ' 不含税' }}
          </div>
        </el-card>
      </el-col>
    </el-row>
  </ContentWrap>
  <TemplateForm ref="formRef" :scene="scene" @success="getList" />
</template>

<script lang="ts" setup>
import { PricingApi, PricingTemplateVO, TemplateScene } from '@/api/pricing'
import TemplateForm from './TemplateForm.vue'
import {
  formatFormula,
  formatMarkup,
  formatRegion,
  formatScope,
  formatServiceFee
} from '@/views/supplier/pricing/utils/constants'

defineOptions({ name: 'PricingTemplateList' })

const props = defineProps({
  scene: { type: String as PropType<TemplateScene>, required: true },
  kind: { type: String as PropType<'FAST' | 'SLOW' | undefined>, default: undefined },
  tip: { type: String, required: true }
})

const message = useMessage()
const loading = ref(false)
const list = ref<PricingTemplateVO[]>([])
const formRef = ref()
const remain = computed(() => Math.max(0, 20 - list.value.length))

const movieRows = (item: PricingTemplateVO) => [item.national, ...(item.regions || [])].filter(Boolean)
const channelRows = (item: PricingTemplateVO) => item.channels || []

const getList = async () => {
  loading.value = true
  try {
    list.value = await PricingApi.getList({ scene: props.scene, kind: props.kind })
  } finally {
    loading.value = false
  }
}

const openForm = (id?: number) => {
  formRef.value.open(id, props.kind)
}

const handleDelete = async (item: PricingTemplateVO) => {
  try {
    await message.confirm(`确认删除模板「${item.name}」？删除后不可恢复，已使用该模板的定价将失效。`)
    await PricingApi.deleteTemplate(item.id!)
    message.success('删除成功')
    getList()
  } catch {}
}

watch(() => [props.scene, props.kind], getList, { immediate: true })
</script>
