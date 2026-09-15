<template>
  <OrderListPage source="SUPPLIER" :show-tabs="false" />
</template>
<script lang="ts" setup>
import OrderListPage from '../components/OrderListPage.vue'
defineOptions({ name: 'OrderSupplier' })
</script>
