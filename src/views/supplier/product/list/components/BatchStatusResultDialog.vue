<template>
  <el-dialog v-model="visible" :title="`批量${actionText}结果`" width="680px">
    <template v-if="result">
      <p v-if="result.syncSkuOnShelf === true">成功 {{ result.succeeded.length }} 个商品组及 {{ successfulSkuCount }} 个规格，失败 {{ result.failed.length }} 个商品组（失败组全部回滚）</p>
      <p v-else>成功 {{ result.succeeded.length }} 项，失败 {{ result.failed.length }} 项</p>
      <div v-if="result.failed.length" class="max-h-400px overflow-y-auto" aria-label="批量上下架全部失败明细">
        <p v-for="item in result.failed" :key="item.code" class="whitespace-pre-wrap break-all">
          <template v-if="result.syncSkuOnShelf === true">商品组 {{ item.code }}：[{{ item.failedEntityType }}] {{ item.failedEntityCode }}：{{ item.errorMessage }}</template>
          <template v-else>[{{ item.entityType }}] {{ item.code }}：{{ item.errorMessage }}</template>（错误码 {{ item.errorCode }}）
        </p>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
  import type { ProductBatchStatusResultVO } from '@/api/product'

  /**
   * 完整呈现已校验回执，失败原因仅使用文本插值；所有失败项可滚动查看，不截断。
   * 同步模式按商品组与成功规格计数并显示具体失败实体，失败组全部回滚。
   * 设计见后端 docs/superpowers/specs/2026-10-11-platform-product-batch-shelf-sync-design.md#5-结果与页面交互。
   */
  const props = defineProps<{ result: ProductBatchStatusResultVO | null; actionText: string }>()
  const successfulSkuCount = computed(() => props.result?.groups?.filter(group => group.succeeded).reduce((count, group) => count + group.skuCodes.length, 0) || 0)
  const visible = defineModel<boolean>({ default: false })
</script>
