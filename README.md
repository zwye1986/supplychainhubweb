# 供应链中台（Supply Chain Hub）

> 基于 vue3 + vite + element-plus + typescript 打造的供应链中台前端项目，集成 ERP、WMS、MES、CRM、FMS、HRM 等多业务模块，覆盖采购、仓储、生产、销售、财务、人事全链路，助力企业构建一体化供应链协同平台。

## 简介

供应链中台是一套面向企业的综合性供应链管理解决方案，整合了订单流转、库存调度、生产制造、客户关系、财务核算、人力资源等核心业务能力，通过统一的中台架构实现各业务域数据贯通与能力复用，支撑企业高效协同运营。

项目基于 [yudao-ui-admin-vue3](https://gitee.com/yudaocode/yudao-ui-admin-vue3) 框架二次开发，采用 Vue3 + Vite + Element Plus + TypeScript 技术栈，内置动态路由、权限控制、多租户、国际化、主题切换等中后台通用能力。

## 技术栈

| 框架                                                                   | 说明               | 版本      |
| ---------------------------------------------------------------------- | ------------------ | --------- |
| [Vue](https://staging-cn.vuejs.org/)                                   | Vue 框架           | 3.5.34    |
| [Vite](https://cn.vitejs.dev//)                                        | 开发与构建工具     | 8.1.4     |
| [Element Plus](https://element-plus.org/zh-CN/)                        | UI 组件库          | 2.13.7    |
| [TypeScript](https://www.typescriptlang.org/docs/)                     | JavaScript 超集    | 6.0.3     |
| [pinia](https://pinia.vuejs.org/)                                      | Vue 存储库         | 3.0.4     |
| [vue-router](https://router.vuejs.org/)                               | Vue 路由           | 5.0.6     |
| [vue-i18n](https://kazupon.github.io/vue-i18n/zh/introduction.html/)  | 国际化             | 11.4.0    |
| [@vueuse/core](https://vueuse.org/)                                    | 常用工具集         | 14.3.0    |
| [unocss](https://uno.antfu.me/)                                        | 原子 css           | 66.6.8    |
| [@iconify/vue](https://icon-sets.iconify.design/)                      | 在线图标库         | 5.0.1     |
| [echarts](https://echarts.apache.org/zh/)                              | 图表库             | 6.0.0     |
| [@wangeditor-next/editor](https://www.wangeditor.com/)                 | 富文本编辑器        | 5.7.0     |
| [bpmn-js](https://bpmn.io/)                                            | BPMN 流程设计器    | 18.16.1   |
| [dhtmlx-gantt](https://dhx.com/gantt)                                  | 甘特图组件         | 9.1.1     |
| [livekit-client](https://livekit.io/)                                  | 实时音视频         | 2.18.9    |

## 环境要求

- nodejs >= 20.19.0
- pnpm >= 8.6.0（强制使用 pnpm）

## 快速开始

```bash
# 安装依赖
pnpm install

# 本地开发（使用 env.local 配置）
pnpm dev

# 连接 dev 环境后端启动
pnpm dev-server

# 构建各环境产物
pnpm build:local   # 本地环境
pnpm build:dev     # 开发环境
pnpm build:test    # 测试环境
pnpm build:stage   # 预发环境
pnpm build:prod    # 生产环境

# 预览构建产物
pnpm serve:dev
pnpm serve:prod
```

## 内置业务模块

供应链中台内置覆盖供应链全链路的多业务模块，可按需启用：

### 核心中台能力

| 模块     | 说明                                                                 |
| -------- | -------------------------------------------------------------------- |
| 系统管理 | 用户、角色、菜单、部门、岗位、租户、字典、通知等中后台基础能力        |
| 基础设施 | 代码生成、定时任务、文件服务、API 日志、Swagger、Druid、SkyWalking 等 |
| 工作流程 | 基于 BPMN + 仿钉钉/飞书双设计器，支持会签、或签、驳回、转办、加签等    |
| 数据报表 | 报表设计器、大屏设计器（GoView、积木报表）                            |
| 支付系统 | 应用配置、支付订单、退款订单、回调通知、转账、钱包余额                |
| AI 大模型 | 对话、绘图、写作、思维导图、音乐、模型管理、AI 工作流                |

### 供应链业务模块

| 模块 | 说明                                                                                       |
| ---- | ------------------------------------------------------------------------------------------ |
| ERP  | 采购订单/入库/退货、销售订单/出库/退货、库存盘点/移库、财务收付款、产品与单位管理            |
| WMS  | 仓库管理、物料品牌、商户管理、入库/出库/盘点/移库单、库存查询                              |
| MES  | 生产工单/工序/路线/反馈、排班日历、设备/维修、物料/工作站、质量检验（IQC/IPQC/OQC/RQC）、条码/SN |
| CRM  | 线索、客户、商机、合同、回款、跟进记录、客户池、统计排名                                    |
| FMS  | 凭证、账簿、科目、币种、摘要、期末结账、财务首页                                            |
| HRM  | 员工、部门、招聘渠道/岗位、绩效、团队看板                                                    |

### 其他业务模块

| 模块     | 说明                                          |
| -------- | --------------------------------------------- |
| 商城     | 商品 SPU、品牌、订单、交易配置、客服           |
| 会员中心 | 会员、标签、等级、分组、积分记录               |
| 微信公众号 | 账号、菜单、消息、自动回复、素材、图文草稿箱   |
| IM 即时通讯 | 一对一/一对多聊天、好友、群组、实时音视频     |
| IoT 物联网 | 设备、产品、物模型、规则引擎、告警、OTA 升级   |

## 项目结构

```
supplychainhubweb
├── build/                # vite 构建配置
├── public/               # 静态资源
├── src/
│   ├── api/              # 后端接口定义（按业务域划分）
│   ├── assets/           # 图片、svg 等资源
│   ├── components/       # 公共组件
│   ├── config/           # axios 网络配置
│   ├── directives/       # 自定义指令
│   ├── hooks/            # 组合式函数
│   ├── layout/           # 布局组件
│   ├── locales/          # 国际化文案
│   ├── plugins/          # 插件（统计、unocss）
│   ├── router/           # 路由配置
│   ├── store/            # pinia 状态管理
│   ├── styles/           # 全局样式
│   ├── types/            # 类型声明
│   ├── utils/            # 工具方法
│   └── views/            # 页面（按业务模块组织）
├── types/                # 全局类型声明
├── .env.*                # 各环境变量
├── vite.config.ts        # vite 配置
└── package.json
```

## 开发工具

推荐 VS Code 开发，配合插件如下：

| 插件名                | 功能                  |
| --------------------- | --------------------- |
| Vue - Official         | Vue 与 TypeScript 支持 |
| unocss                 | unocss for vscode     |
| Iconify IntelliSense   | Iconify 预览和搜索    |
| i18n Ally              | 国际化智能提示        |
| Stylelint              | CSS 格式化            |
| Prettier               | 代码格式化            |
| ESLint                 | 脚本代码检查          |
| DotENV                  | env 文件高亮          |

## 代码规范

项目内置 ESLint + Prettier + Stylelint + commitlint + lint-staged 规范：

```bash
# 检查代码规范
pnpm lint

# 自动修复
pnpm lint:eslint
pnpm lint:style
pnpm lint:format
```

## 相关文档

- 后端启动文档：<https://doc.iocoder.cn/quick-start/>
- 视频教程：<https://doc.iocoder.cn/video/>
- 框架源仓库：<https://gitee.com/yudaocode/yudao-ui-admin-vue3>

## License

MIT
