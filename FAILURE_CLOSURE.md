# 订单原单核实与失败关单

对应后端设计 `docs/superpowers/specs/2026-10-13-huasheng-error-classification-and-failure-closure-design.md` §3、6、7、8。入口复用供应商与平台订单详情，不提供独立释放资金按钮。

## 接口与安全边界

- 供应商详情 `failureClosure`、平台详情 `supplierOrders[].failureClosure` 提供可选原因、供应商原状态、分值金额差异、预留快照和 Case 关联。列表不加载处置摘要，避免额外逐行查询。
- 平台终结原因使用总订单状态日志的 `terminalReasonCode`，不以某个供应商尝试替代总单事实。
- 原单核实使用 GET Case、POST verify、GET actions；确认使用 POST confirm-failure。全部位于 `/supply-chain/fulfillment-cases/{caseNo}`。
- 分别检查 query / verify / confirm-failure 权限，并同时尊重服务端 canVerify / canConfirmFailure。缺失 caseVersion 或 generation 不提交命令。
- 核实与确认使用不同的 32 字符 actionNo。确认关联 verifyActionNo，携带 expectedCaseVersion、expectedGeneration、reason；不提交 actor、退款标记、金额或外部订单状态。
- HTTP 受理只表示受理；展示 RECEIVED/STARTED/SUCCEEDED/UNKNOWN 等实际异步状态与证据。网络未知保留原 actionNo 和完整命令参数供幂等重试。
- 切换订单、关闭详情和组件卸载使旧返回失格；重复点击不会重复提交，较早刷新不能覆盖较新读取。
- 没有预留快照显示未知，不默认已释放。金额单位分，仅展示时转换为元；不顺带修复业务类型和供货模式缺口。

## 无业务网络验证

```sh
node --test tests/failure-closure.test.mjs
node --test tests/*.test.mjs
pnpm ts:check
pnpm build:dev
node node_modules/vite/bin/vite.js --config tests/fixtures/failure-closure.vite.mjs
```

访问 `http://127.0.0.1:5199/tests/fixtures/failure-closure.html`。此 fixture 渲染真实 FailureClosurePanel 和 Element Plus，仅将 Case API 与权限模块替换为本地内存实现，没有真实业务请求。覆盖人工、核实中、可确认、供应商取消/平台失败；输入原因后可打开强确认弹窗，不会实际释放资金。

2026-10-13 本地证据：定向真实 mapper/SFC 回归通过；全量既有 routing-scope 测试引用缺失文件失败；类型检查存在基线错误，构建通过。后端 `.amp/in/artifacts/huasheng-frontend-*` 保存完整记录及截图；真实后端联调、迁移和供应商查询未执行。
