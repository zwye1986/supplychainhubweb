<template>
  <el-dialog v-model="visible" :title="`批量${actionText}结果`" width="680px">
    <template v-if="result">
      <p>成功 {{ result.succeeded.length }} 项，失败 {{ result.failed.length }} 项</p>
      <div v-if="result.failed.length" class="max-h-400px overflow-y-auto" aria-label="批量上下架全部失败明细">
        <p v-for="item in result.failed" :key="item.code" class="whitespace-pre-wrap break-all">
          [{{ item.entityType }}] {{ item.code }}：{{ item.errorMessage }}（错误码 {{ item.errorCode }}）
        </p>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
  import type { ProductBatchStatusResultVO } from '@/api/product'

  /**
   * 完整呈现已校验回执，失败原因仅使用文本插值；所有失败项可滚动查看，不截断。
   * 设计见 docs/superpowers/specs/2026-09-11-supply-chain-product-center-design.md#4110-批量上下架接口put-supply-chainproductsbatch-status。
   */
  defineProps<{ result: ProductBatchStatusResultVO | null; actionText: string }>()
  const visible = defineModel<boolean>({ default: false })
</script>
