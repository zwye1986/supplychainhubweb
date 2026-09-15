# 供应链中台代码模板

由 [SKILL.md](SKILL.md) 引用。仅在需要完整脚手架时阅读。

## Mock 模板

```typescript
import dayjs from 'dayjs'
import type { XxxVO } from '../types'

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data))
const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

const rows: XxxVO[] = [/* 初始数据 */]
let seq = Math.max(0, ...rows.map((i) => Number(i.id) || 0))

export const XxxMockApi = {
  async getPage(params: { pageNo?: number; pageSize?: number; keyword?: string }) {
    await delay()
    let list = rows.map(clone)
    if (params.keyword) {
      const kw = params.keyword.trim()
      list = list.filter((i) => String(i.name).includes(kw))
    }
    const pageNo = params.pageNo || 1
    const pageSize = params.pageSize || 10
    const start = (pageNo - 1) * pageSize
    return { list: list.slice(start, start + pageSize), total: list.length }
  },
  async get(id: number) {
    await delay()
    const found = rows.find((i) => i.id === id)
    if (!found) throw new Error('记录不存在')
    return clone(found)
  },
  async create(data: XxxVO) {
    await delay()
    const created = { ...clone(data), id: ++seq, updateTime: now() }
    rows.unshift(created)
    return clone(created)
  },
  async update(data: XxxVO) {
    await delay()
    const index = rows.findIndex((i) => i.id === data.id)
    if (index < 0) throw new Error('记录不存在')
    rows[index] = { ...rows[index], ...clone(data), updateTime: now() }
    return clone(rows[index])
  },
  async delete(id: number) {
    await delay()
    const index = rows.findIndex((i) => i.id === id)
    if (index < 0) throw new Error('记录不存在')
    rows.splice(index, 1)
  }
}
```

## 简单表单弹窗

```vue
<template>
  <el-dialog
    v-model="dialogVisible"
    :title="formData.id ? '编辑' : '新增'"
    width="600px"
    append-to-body
  >
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="100px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" maxlength="50" placeholder="请输入名称" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="formLoading" @click="submitForm">保存</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { XxxApi, XxxVO } from '@/api/<domain>'

defineOptions({ name: 'XxxForm' })

const message = useMessage()
const emit = defineEmits(['success'])
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const formData = reactive<XxxVO>({ name: '' })
const formRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
}

const open = async (id?: number) => {
  dialogVisible.value = true
  formData.id = undefined
  formData.name = ''
  if (!id) return
  formLoading.value = true
  try {
    Object.assign(formData, await XxxApi.get(id))
  } finally {
    formLoading.value = false
  }
}

const submitForm = async () => {
  await formRef.value?.validate()
  formLoading.value = true
  try {
    if (formData.id) await XxxApi.update(formData)
    else await XxxApi.create(formData)
    message.success('保存成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
```

## 列表页模板

```vue
<template>
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      class="-mb-15px search-form"
      :model="queryParams"
      :inline="true"
      label-width="90px"
    >
      <el-form-item label="名称" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          placeholder="请输入名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="商品类型" prop="productType">
        <el-select v-model="queryParams.productType" clearable>
          <el-option
            v-for="dict in getStrDictOptions('supply_chain_product_type')"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" plain @click="openForm()">
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="名称" prop="name" min-width="160" />
      <el-table-column label="合作状态" min-width="110">
        <template #default="{ row }">
          {{ getDictLabel('supply_chain_supplier_status', row.status) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="openForm(row.id)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>
  <XxxForm ref="formRef" @success="getList" />
</template>
```

## remaining.ts 隐藏路由

```typescript
{
  path: '/product',
  component: Layout,
  name: 'ProductHidden',
  meta: { hidden: true },
  children: [
    {
      path: 'list/detail/:spuCode',
      name: 'ProductListDetail',
      component: () => import('@/views/supplier/product/list/detail/index.vue'),
      meta: {
        hidden: true,
        canTo: true,
        noCache: true,
        title: '商品详情',
        activeMenu: '/product/list'
      }
    }
  ]
}
```

临时可见菜单（后端菜单未配时，用完删除）：

```typescript
{
  path: '/order',
  component: Layout,
  name: 'OrderManage',
  meta: { title: '订单管理', icon: 'ep:document', alwaysShow: true },
  children: [
    {
      path: 'platform',
      name: 'OrderPlatform',
      component: () => import('@/views/supplier/order/platform/index.vue'),
      meta: { title: '平台订单', icon: 'ep:tickets' }
    }
  ]
}
```

## 存量 yudao CRUD（system 等模块）

API 用独立函数，不用 `XxxApi` 对象：

```typescript
export const getXxxPage = (params: PageParam) => {
  return request.get({ url: '/<module>/<feature>/page', params })
}
```

表单用 `<Dialog v-model="dialogVisible" :title="dialogTitle" width="600">`，校验用 `required()`，文案用 `t('common.createSuccess')`，按钮加 `v-hasPermi`。

完整列表/表单样例见仓库内 `src/views/system/` 与个人技能 `yudao-admin-vue3`。
