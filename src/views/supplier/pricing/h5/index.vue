<template>
  <TemplateList
    scene="H5"
    tip="H5 接入渠道的价格会根据“使用中”的加价模板的设置来计算，"
  />
</template>

<script lang="ts" setup>
import TemplateList from '../components/TemplateList.vue'

defineOptions({ name: 'supplierPricingH5' })
</script>
