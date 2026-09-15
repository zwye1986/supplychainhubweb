---
name: supplychainhubweb
description: >
  供应链中台 supplychainhubweb（基于 yudao-ui-admin-vue3）项目开发技能。
  在本仓库创建或修改业务模块页面（列表/表单/详情）、API、前端 Mock、路由、字典、
  Element Plus 表格弹窗，或开发供应商、商品、订单、定价、分销等供应链模块时必须使用。
---

# 供应链中台开发技能

生成代码必须对齐本仓库既有写法，优先抄同目录已有页面，而不是套通用 yudao 模板。

完整可复制模板见 [reference.md](reference.md)。

## 技术栈与命令

| 项 | 值 |
| --- | --- |
| 框架 | Vue 3.5 + `<script lang="ts" setup>` |
| UI | Element Plus 2.13（自动导入 `el-*`） |
| 构建 | Vite + TypeScript，别名 `@/` → `src/` |
| 样式 | UnoCSS + SCSS |
| 包管理 | **pnpm**（禁止 npm/yarn） |
| 启动 | `pnpm dev`（env.local）/ `pnpm dev-server`（连后端） |

Node >= 20.19。改完页面后按用户规则在浏览器走通主路径再结束。

## 自动导入（禁止手写 import）

可直接使用、不要 import：

- Vue：`ref` `reactive` `computed` `watch` `onMounted` `nextTick` `defineOptions` `defineProps` `defineEmits` `defineExpose` `unref`
- Router：`useRouter` `useRoute`
- 项目：`useI18n` `useMessage` `useTable` `useCrudSchemas` `required` `DICT_TYPE`
- 组件：所有 `el-*`；`src/components/` 下组件（DiyEditor 移动端子组件除外）

需要**显式 import** 的：`@/config/axios`、`@/api/...`、`@/utils/dict`（`getStrDictOptions` / `getDictLabel`）、`@/utils/formatTime`、`@/utils/permission`、同目录表单/详情组件。

## 目录对照

```
src/api/<domain>/index.ts          # 接口对象 + 开关 + 类型再导出
src/api/<domain>/types.ts          # VO / 入参 / 枚举
src/api/<domain>/mock/index.ts     # 后端未就绪时的内存 Mock
src/views/<module>/<feature>/index.vue
src/views/supplier/<feature>/      # 供应链业务页面
  utils/constants.ts               # 仅无后端字典时才写；有字典不要建
  components/                      # 本功能弹窗/复用块
  form/index.vue                   # 复杂新增/编辑（宽弹窗）
  detail/index.vue                 # 详情抽屉或弹窗
src/router/modules/remaining.ts    # 隐藏页、后端菜单未配时的临时菜单
src/store/modules/<name>.ts        # Pinia（少用，供应链页一般不新建 Store）
```

存量模块（erp / wms / mes / crm / fms / hrm / system / mall …）继续沿用该模块原有文件结构，不要强行改成供应链风格。

## 两条线：先判定再写

1. **存量 yudao 模块**：函数式 API（`getXxxPage`）、`<Dialog>` 表单、`v-hasPermi`、`DICT_TYPE` 枚举。参考 `src/views/system/user/`。
2. **供应链新模块**（`src/views/supplier/**`、`src/api/{product,order,pricing,supplier}/**`）：对象式 API、`/supply-chain/` REST、Mock 开关、业务编码当主键、`el-dialog`。参考 `src/views/supplier/manage/`、`src/views/supplier/product/`。

下面默认描述第 2 条线。改第 1 条线时以邻文件为准。

---

## 一、供应链 API

**路径前缀**：`/supply-chain/`  
**身份字段**：优先 `supplierCode` / `buyerCode` / `spuCode` / `skuCode` / `orderNo`，不要一律用数字 `id`。  
**风格**：REST + 对象导出。

```typescript
import request from '@/config/axios'
import { XxxMockApi } from './mock'
import type { XxxPageParam, XxxVO } from './types'

export type { XxxPageParam, XxxVO } from './types'

export const USE_XXX_MOCK = true // 接口就绪后改为 false

export const XxxApi = {
  getPage: async (params: XxxPageParam) => {
    if (USE_XXX_MOCK) return XxxMockApi.getPage(params)
    return await request.get({ url: '/supply-chain/xxxs', params })
  },
  get: async (code: string) => {
    if (USE_XXX_MOCK) return XxxMockApi.get(code)
    return await request.get({ url: `/supply-chain/xxxs/${code}` })
  },
  create: async (data: XxxVO) => {
    if (USE_XXX_MOCK) return XxxMockApi.create(data)
    return await request.post({ url: '/supply-chain/xxxs', data })
  },
  update: async (code: string, data: XxxVO) => {
    if (USE_XXX_MOCK) return XxxMockApi.update(code, data)
    return await request.put({ url: `/supply-chain/xxxs/${code}`, data })
  },
  delete: async (code: string) => {
    if (USE_XXX_MOCK) return XxxMockApi.delete(code)
    return await request.delete({ url: `/supply-chain/xxxs/${code}` })
  }
}
```

`request` 方法：`get` `{url, params}` / `post` `{url, data}` / `put` `{url, data}` / `patch` `{url, data}` / `delete` / `download` / `upload`。

规则：

- types 只放 `types.ts`，`index.ts` 用 `export type { ... }` 再导出。
- 真实 URL 以产品/后端约定为准，禁止臆造另一套前缀（如不要新写 `/scm/`，存量兼容代码除外）。
- 分页出参按项目封装：**直接使用 `data.list` / `data.total`**（axios 已解包 `res.data`）。
- 部分接口未就绪时，只给未就绪方法走 Mock，已接好的走 `request`（见 `src/api/product/index.ts`）。

## 二、Mock

文件：`src/api/<domain>/mock/index.ts`。

- `delay()` + `clone()`（`JSON.parse(JSON.stringify)`），返回值形状必须与真实接口一致。
- 内存数组 + 自增序号；校验失败 `throw new Error('中文原因')`。
- 时间用 `dayjs().format('YYYY-MM-DD HH:mm:ss')`。
- 禁止在 Vue 里写假数据；页面只调 `XxxApi`。

## 三、页面约定

### 必须项

- `defineOptions({ name: 'PascalCaseName' })`
- 列表搜索：`ContentWrap` + `el-form` `:inline="true"` `class="-mb-15px search-form"`
- 按钮图标：`<Icon icon="ep:search" class="mr-5px" />`（refresh / plus / delete 同理）
- 分页：`<Pagination v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />`
- 列表状态：直接模式（`loading` / `list` / `total` / `queryParams`），不要对供应链新页上 `useTable`，除非邻文件已经在用。
- 操作列：`el-button link type="primary|warning|success|danger"`
- 空态：无数据用 `el-empty`；删除/状态变更先 `message.confirm` 或 `message.delConfirm()`

### 表单形态选择

| 复杂度 | 写法 | 范例 |
| --- | --- | --- |
| 字段少 | 同目录 `XxxForm.vue`，`el-dialog` `width="600px"` `append-to-body`，`defineExpose({ open })` | `product/brand/BrandForm.vue` |
| 字段多、分组 | `form/index.vue`，宽弹窗约 `1100px`，`el-divider` 分组 | `product/list/form/index.vue`、`manage/form/index.vue` |
| 详情 | `detail/index.vue` 抽屉/弹窗，`defineExpose({ open })` | `product/list/detail/index.vue` |

供应链新模块用 **`el-dialog`，不用 `<Dialog>`**（`<Dialog>` 默认 fullscreen，存量 system 页才常用）。

父页：`<XxxForm ref="formRef" @success="getList" />`，`formRef.value.open(id?)`。

### 列表骨架（直接模式）

```vue
<script lang="ts" setup>
import { XxxApi, XxxVO } from '@/api/<domain>'
import { getStrDictOptions, getDictLabel } from '@/utils/dict'
import XxxForm from './XxxForm.vue'

defineOptions({ name: 'XxxList' })
const message = useMessage()
const loading = ref(true)
const list = ref<XxxVO[]>([])
const total = ref(0)
const queryParams = reactive({ pageNo: 1, pageSize: 10, keyword: undefined as string | undefined })
const formRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await XxxApi.getPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
const handleQuery = () => { queryParams.pageNo = 1; getList() }
const resetQuery = () => { queryParams.keyword = undefined; handleQuery() }
const openForm = (id?: number) => formRef.value.open(id)

onMounted(getList)
</script>
```

校验：简单表单用 `{ required: true, message: '请输入…', trigger: 'blur' }`；存量页可用自动导入的 `required()`。

成功文案：供应链新页多用 `message.success('保存成功')`；存量页用 `t('common.createSuccess')` 等。与邻文件保持一致。

## 四、字典

`getStrDictOptions`、`getDictLabel` **必须从 `@/utils/dict` 显式 import**，不能依赖自动导入。参数直接传字典类型字符串。

```ts
import { getStrDictOptions, getDictLabel } from '@/utils/dict'
```

有后端字典时必须走字典，**不要**再写 `utils/constants.ts` 里的 `XXX_OPTIONS` / `getXxxLabel`。

下拉框：

```vue
<el-select v-model="queryParams.productType" clearable>
  <el-option
    v-for="dict in getStrDictOptions('supply_chain_product_type')"
    :key="dict.value"
    :label="dict.label"
    :value="dict.value"
  />
</el-select>
```

回显：

```vue
{{ getDictLabel('supply_chain_supplier_status', row.status) }}
```

```vue
<el-table-column label="合作状态" prop="status">
  <template #default="{ row }">
    {{ getDictLabel('supply_chain_supplier_status', row.status) }}
  </template>
</el-table-column>
```

仅当**没有真实字典、接口也未提供选项**时，才允许在 `src/views/supplier/<feature>/utils/constants.ts`（跨功能则 `src/views/supplier/utils/constants.ts`）写临时选项；字典或接口就绪后删掉改回上面两个方法。

## 五、金额与时间

- 商品/供应价接口多为**分**：展示用 `formatCentsYuan` / `centsToYuan`，提交用 `yuanToCents`（`src/views/supplier/utils/constants.ts`）。
- 订单金额若已是元：用该模块 `formatMoney`。
- 不要把分直接当元显示。
- 日期列：`dateFormatter`（`@/utils/formatTime`）。
- 日期筛选：`el-date-picker` + `value-format`；接口要 ISO 时用 `YYYY-MM-DDTHH:mm:ss`，普通查询用 `YYYY-MM-DD HH:mm:ss`，跟已接接口保持一致。

## 六、路由

后台菜单由**后端菜单管理**下发。`remaining.ts` 只用于：

1. 隐藏的表单/详情：`hidden: true`、`canTo: true`、`noCache: true`、`activeMenu` 指向列表。
2. 后端菜单尚未配置时的**临时**侧边栏（供应链订单目前如此）。接口与菜单就绪后应删临时项，避免与动态路由重复。

```ts
{
  path: 'detail/:orderNo',
  name: 'OrderPlatformDetail',
  component: () => import('@/views/supplier/order/platform/detail/index.vue'),
  meta: { hidden: true, canTo: true, noCache: true, title: '订单详情', activeMenu: '/order/platform' }
}
```

`name` 必须唯一，供 keep-alive 使用。

## 七、权限与 Store

- 存量页按钮：`v-hasPermi="['module:feature:action']"`；脚本里 `checkPermi`。
- 供应链新页多数尚未挂权限指令，**不要擅自编造权限码**；用户明确要求时再加。
- 页面局部状态不要新建 Pinia。必须跨页共享时才写 `src/store/modules/<name>.ts`（选项式 `defineStore` + `useXxxStoreWithOut`）。

## 八、生成顺序

新供应链功能按此顺序落文件：

1. `types.ts`
2. `mock/index.ts`（接口未就绪）
3. `index.ts`（`XxxApi` + `USE_XXX_MOCK`）
4. 列表 `index.vue`（下拉/回显用字典方法）
5. 表单弹窗
6. 详情（如需要）
7. `remaining.ts`（仅当必须从前端进路由时）

## 九、禁止事项

- 手写 import `ref`/`reactive`/`useRouter`/`useMessage`
- 使用字典却不 `import { getStrDictOptions, getDictLabel } from '@/utils/dict'`
- 已有后端字典时再写 `constants.ts` 选项数组或 `getXxxLabel`
- 在页面里写死列表假数据，绕过 API/Mock
- 新接口使用非 `/supply-chain/` 前缀（除非用户给出确切 URL）
- 供应链价字段按元展示却不经分转元
- 用 `<Dialog>` 做供应链新表单（默认全屏）
- 修改无关文件、新增 README、顺手重构邻模块
- Windows 反斜杠路径

## 对照范例

| 场景 | 抄这个 |
| --- | --- |
| 供应商列表 + 宽表单 + 详情抽屉 | `src/views/supplier/manage/` |
| 商品列表 + SKU 展开 + Mock 主数据 | `src/views/supplier/product/`、`src/api/product/` |
| 分销 Mock 拆文件 | `src/api/supplier/distribution/` |
| 订单共享列表 | `src/views/supplier/order/components/OrderListPage.vue` |
| 简单 CRUD 弹窗 | `src/views/supplier/product/brand/` |
| 存量标准 CRUD | `src/views/system/user/` |
