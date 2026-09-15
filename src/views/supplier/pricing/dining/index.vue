<template>
  <TemplateList
    scene="DINING"
    tip="点餐专区中餐品的价格会根据“使用中”的加价模板的设置来计算，"
  />
</template>

<script lang="ts" setup>
import TemplateList from '../components/TemplateList.vue'

defineOptions({ name: 'supplierPricingDining' })
</script>
