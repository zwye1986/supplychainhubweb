<template>
  <div>
    <el-card shadow="never">
      <div class="flex items-center">
        <el-avatar :src="avatar" :size="70" class="mr-16px">
          <img src="@/assets/imgs/avatar.gif" alt="" />
        </el-avatar>
        <div>
          <div class="text-20px">
            {{ t('workplace.welcome') }} {{ username }} {{ t('workplace.happyDay') }}
          </div>
          <div class="mt-10px text-14px text-gray-500">供应商中台</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '@/store/modules/user'

defineOptions({ name: 'SupplierIndex' })

const { t } = useI18n()
const userStore = useUserStore()
const avatar = userStore.getUser.avatar
const username = userStore.getUser.nickname
</script>
