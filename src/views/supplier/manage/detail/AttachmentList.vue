<template>
  <div v-if="attachments.length" class="flex flex-wrap items-center gap-12px">
    <template v-for="(item, index) in attachments" :key="`${item.url}-${index}`">
      <el-image
        v-if="item.isImage"
        :src="item.url"
        :preview-src-list="imageUrls"
        :initial-index="imageUrls.indexOf(item.url)"
        :alt="linkLabel || `附件${index + 1}`"
        preview-teleported
        fit="contain"
        class="h-100px w-160px rounded"
      >
        <template #error>
          <el-link :href="item.url" type="primary" target="_blank">
            {{ linkLabel || `附件${index + 1}` }}
          </el-link>
        </template>
      </el-image>
      <el-link v-else :href="item.url" type="primary" target="_blank">
        {{ linkLabel || `附件${index + 1}` }}
      </el-link>
    </template>
  </div>
  <span v-else>-</span>
</template>

<script lang="ts" setup>
import { getFileNameFromUrl, isImage } from '@/utils/file'

defineOptions({ name: 'SupplierAttachmentList' })

const props = defineProps<{
  urls?: string[]
  linkLabel?: string
}>()

const attachments = computed(() =>
  (props.urls || []).filter((url) => url?.trim()).map((url) => ({
    url,
    isImage: isImage(getFileNameFromUrl(url))
  }))
)
const imageUrls = computed(() => attachments.value.filter((item) => item.isImage).map((item) => item.url))
</script>
