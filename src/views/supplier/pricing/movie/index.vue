<template>
  <el-tabs v-model="kind">
    <el-tab-pane label="快充模板" name="FAST" />
    <el-tab-pane label="慢充模板" name="SLOW" />
  </el-tabs>
  <TemplateList
    scene="MOVIE"
    :kind="kind"
    tip="电影专区中电影的价格会根据“使用中”的加价模块的设置来计算，"
  />
</template>

<script lang="ts" setup>
import TemplateList from '../components/TemplateList.vue'

defineOptions({ name: 'PricingMovie' })

const kind = ref<'FAST' | 'SLOW'>('FAST')
</script>
