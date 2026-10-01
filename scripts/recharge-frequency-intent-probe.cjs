/**
 * 现有依赖下的限频意图生命周期与筛选行为探针：编译实际SFC并挂载到Vue renderer，
 * 使用真实Router与AppView的fullPath key重现权限撤销、同路由更新和卸载。
 * API/权限适配器只隔离网络和登录环境，不替代组件或路由行为。
 * 运行：node scripts/recharge-frequency-intent-probe.cjs [待验证Git修订]
 * 可选修订只通过git show读取源码，不修改工作树，可复现修复前RED。
 * 设计：docs/superpowers/specs/2026-09-30-direct-recharge-mobile-spu-frequency-design.md#8-前端监控页面
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { execFileSync } = require('node:child_process')
const vue = require('vue')
const routerLib = require('vue-router')
const compiler = require('vue/compiler-sfc')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')
const sourceRef = process.argv[2]
const readSource = (file) =>
  sourceRef
    ? execFileSync('git', ['show', `${sourceRef}:${path.relative(root, file)}`], {
        cwd: root,
        encoding: 'utf8'
      })
    : fs.readFileSync(file, 'utf8')
const pageFile = path.join(root, 'src/views/supplier/order/recharge-frequency/index.vue')
const dialogFile = path.join(
  root,
  'src/views/supplier/order/recharge-frequency/components/FrequencyActionDialog.vue'
)
const permissions = vue.reactive(new Set())
const calls = []
const notifications = []
const queryCalls = []
const backlogResult = {
  list: [
    {
      queueId: '9007199254740993',
      maskedMobile: '138****8000',
      platformSpuCode: 'SPU',
      waitingCount: 8,
      earliestEnqueuedAt: 1790784000000,
      overThreshold: true
    }
  ],
  total: 1,
  observedAt: 1
}
let answer = 'uncertain'
let reads = 0
const request = {
  get: async (options) => {
    const { url } = options
    queryCalls.push({ method: 'GET', ...JSON.parse(JSON.stringify(options)) })
    reads++
    return url.endsWith('/statistics')
      ? {
          waitingOrderCount: 1,
          occupiedQueueCount: 1,
          overThresholdQueueCount: 0,
          overdueQueueCount: 0,
          observedAt: 1
        }
      : url.endsWith('/backlogs')
        ? backlogResult
        : { list: [], total: 0, observedAt: 1 }
  },
  post: async ({ url, data }) => {
    if (url.endsWith('/search')) {
      queryCalls.push({ method: 'POST', url, data: JSON.parse(JSON.stringify(data)) })
      return data.view === 'BACKLOGS' ? backlogResult : { list: [], total: 0, observedAt: 1 }
    }
    calls.push({ url, data: JSON.parse(JSON.stringify(data)) })
    if (answer === 'uncertain') throw { kind: 'uncertain', message: 'unknown' }
    if (answer === 'refused') throw { kind: 'business', code: 1050001152, message: '版本已变化' }
    return {
      actionNo: data.actionNo,
      resultCode: url.endsWith('/retry') ? 'RETRY_SCHEDULED' : 'RELEASED',
      message: '确定'
    }
  }
}
const moduleCache = new Map()
const evaluate = (source, filename) => {
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true
    }
  }).outputText
  const module = { exports: {} }
  const localRequire = (name) => {
    if (name === '@/utils/permission')
      return { checkPermi: (values) => values.some((value) => permissions.has(value)) }
    if (name === '@/config/axios') return { __esModule: true, default: request }
    if (name === '@/api/order/rechargeFrequency') return loadApi()
    if (name === 'element-plus')
      return {
        ElMessage: {
          warning: (value) => notifications.push(value),
          success: (value) => notifications.push(value)
        }
      }
    if (name === './components/FrequencyActionDialog.vue')
      return { __esModule: true, default: loadSfc(dialogFile) }
    if (name === '@/views/supplier/order/platform/detail/index.vue')
      return {
        __esModule: true,
        default: vue.defineComponent({ name: 'OrderDetailProbe', render: () => null })
      }
    return require(name)
  }
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports)
  return module.exports
}
const loadApi = () => {
  const file = path.join(root, 'src/api/order/rechargeFrequency.ts')
  if (!moduleCache.has(file)) moduleCache.set(file, evaluate(readSource(file), file))
  return moduleCache.get(file)
}
const loadSfc = (file) => {
  if (moduleCache.has(file)) return moduleCache.get(file)
  const descriptor = compiler.parse(readSource(file), { filename: file }).descriptor
  const id = path.basename(path.dirname(file))
  const script = compiler.compileScript(descriptor, { id })
  const template = compiler.compileTemplate({
    source: descriptor.template.content,
    filename: file,
    id,
    compilerOptions: { bindingMetadata: script.bindings }
  })
  assert.deepEqual(template.errors, [], `${file}: template compile`)
  const component = evaluate(script.content, file).default
  component.render = evaluate(template.code, file).render
  moduleCache.set(file, component)
  return component
}
const renderer = vue.createRenderer({
  createElement: (type) => ({ type, props: {}, children: [], parent: null }),
  createText: (text) => ({ type: '#text', text, children: [], parent: null }),
  createComment: (text) => ({ type: '#comment', text, children: [], parent: null }),
  setText: (node, text) => {
    node.text = text
  },
  setElementText: (node, text) => {
    node.text = text
    node.children = []
  },
  parentNode: (node) => node.parent,
  nextSibling: (node) => node.parent?.children[node.parent.children.indexOf(node) + 1] || null,
  patchProp: (node, key, previous, next) => {
    node.props[key] = next
  },
  insert: (node, parent, anchor = null) => {
    if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1)
    node.parent = parent
    const index = parent.children.indexOf(anchor)
    parent.children.splice(index < 0 ? parent.children.length : index, 0, node)
  },
  remove: (node) => {
    node.parent?.children.splice(node.parent.children.indexOf(node), 1)
    node.parent = null
  }
})
const elements = [
  'ContentWrap',
  'el-button',
  'el-alert',
  'el-row',
  'el-col',
  'el-card',
  'el-tabs',
  'el-tab-pane',
  'el-form',
  'el-form-item',
  'el-input',
  'el-date-picker',
  'el-table',
  'el-table-column',
  'el-tag',
  'el-pagination',
  'el-result',
  'el-dialog',
  'el-descriptions',
  'el-descriptions-item'
]
const stub = (name) =>
  vue.defineComponent({
    name: `Probe${name}`,
    inheritAttrs: false,
    setup:
      (_, { attrs, slots }) =>
      () =>
        vue.h(name, attrs, name === 'el-table-column' ? [] : [slots.default?.(), slots.footer?.()])
  })
const findComponent = (vnode, name) => {
  if (!vnode) return null
  if ((vnode.component?.type.name || vnode.component?.type.__name) === name) return vnode.component
  const nested = findComponent(vnode.component?.subTree, name)
  if (nested) return nested
  for (const child of Array.isArray(vnode.children) ? vnode.children : []) {
    const found = findComponent(child, name)
    if (found) return found
  }
  return null
}
const findElement = (node, predicate) => {
  if (predicate(node)) return node
  for (const child of node.children || []) {
    const found = findElement(child, predicate)
    if (found) return found
  }
  return null
}
const flush = async () => {
  await vue.nextTick()
  await new Promise((resolve) => setImmediate(resolve))
  await vue.nextTick()
}
const listeners = new Map()
global.window = {
  addEventListener: (key, fn) => listeners.set(key, fn),
  removeEventListener: (key) => listeners.delete(key)
}
global.crypto = { randomUUID }
const policy = loadApi().FREQUENCY_PERMISSIONS
const results = []
const scenario = async (name, callback) => {
  try {
    await callback()
    results.push({ name, passed: true })
    console.log(`PASS ${name}`)
  } catch (error) {
    results.push({ name, passed: false })
    console.error(`FAIL ${name}: ${error.message.split('\n')[0]}`)
  }
}
const setup = async (kind = 'retry') => {
  permissions.clear()
  Object.values(policy).forEach((value) => permissions.add(value))
  calls.length = 0
  queryCalls.length = 0
  notifications.length = 0
  reads = 0
  answer = 'uncertain'
  const router = routerLib.createRouter({
    history: routerLib.createMemoryHistory(),
    routes: [
      { path: '/monitor/:id?', component: loadSfc(pageFile) },
      { path: '/other', component: vue.defineComponent({ render: () => vue.h('other') }) }
    ]
  })
  await router.push('/monitor/a')
  await router.isReady()
  const application = renderer.createApp({
    render: () =>
      vue.h(routerLib.RouterView, null, {
        // 与src/layout/components/AppView.vue相同的key，真实Router决定leave/update guards。
        default: ({ Component, route }) => Component && vue.h(Component, { key: route.fullPath })
      })
  })
  elements.forEach((name) => application.component(name, stub(name)))
  application.directive('loading', {})
  application.use(router)
  application.config.warnHandler = (message) => {
    if (!message.includes('Extraneous non-props')) throw new Error(message)
  }
  const container = { type: 'root', children: [] }
  application.mount(container)
  await flush()
  const page = () => findComponent(application._instance.subTree, 'RechargeFrequencyMonitor')
  const action = () => page()?.setupState.actions
  const target =
    kind === 'retry'
      ? {
          kind,
          row: {
            entryId: '9007199254740993',
            queueId: 1,
            version: '9007199254740994',
            maskedMobile: '138****8000',
            platformSpuCode: 'SPU',
            orderNo: 'ORD'
          }
        }
      : {
          kind,
          row: {
            queueId: '9007199254740993',
            version: '9007199254740994',
            generation: '9007199254740995',
            canRelease: true,
            maskedMobile: '138****8000',
            platformSpuCode: 'SPU',
            holderOrderNo: 'ORD'
          }
        }
  if (kind === null) {
    return { application, router, page, container, close: () => application.unmount() }
  }
  action().open(target)
  await flush()
  const input = findElement(
    container,
    (node) => node.type === 'el-input' && node.props.type === 'textarea'
  )
  input.props['onUpdate:modelValue']('已核实，原因固定')
  await flush()
  const submit = () =>
    findComponent(application._instance.subTree, 'FrequencyActionDialog').setupState.submit()
  await submit()
  await flush()
  assert.equal(action().hasPending, true, 'unknown must remain pending')
  return {
    application,
    router,
    page,
    action,
    submit,
    initialAction: action(),
    initialPage: page(),
    target,
    close: () => application.unmount()
  }
}
;(async () => {
  for (const kind of ['retry', 'release']) {
    await scenario(`撤销/恢复查询和${kind}权限保留同一引用、操作号与完整正文`, async () => {
      const env = await setup(kind)
      try {
        const first = calls[0]
        permissions.delete(policy.query)
        await flush()
        assert.equal(
          env.action(),
          env.initialAction,
          'query revocation must not unmount action carrier'
        )
        assert.equal(env.action().hasPending, true)
        const initialReads = reads
        env.page().setupState.refresh()
        await env.submit()
        await flush()
        assert.equal(reads, initialReads, 'no new query when query permission revoked')
        assert.equal(calls.length, 1, 'no send when query permission revoked')
        permissions.add(policy.query)
        permissions.delete(policy[kind])
        await flush()
        await env.submit()
        assert.equal(calls.length, 1, 'no send when action permission revoked')
        permissions.add(policy[kind])
        await flush()
        await env.submit()
        await flush()
        assert.deepEqual(calls[1], first, 'restored permission retries same immutable intent')
        env.action().open(env.target)
        await env.submit()
        await flush()
        assert.deepEqual(calls[2], first, 'cannot open fresh intent while unknown')
        await env.router.push('/other')
        await flush()
        assert.equal(
          env.router.currentRoute.value.fullPath,
          '/monitor/a',
          'unknown still prevents leave'
        )
      } finally {
        env.close()
      }
    })
  }
  for (const destination of ['/monitor/a?scope=2', '/monitor/a#changed', '/monitor/b', '/other']) {
    await scenario(`未知意图阻止导航 ${destination}，确定后允许导航`, async () => {
      const env = await setup()
      try {
        const first = calls[0]
        await env.router.push(destination)
        await flush()
        assert.equal(
          env.router.currentRoute.value.fullPath,
          '/monitor/a',
          'unknown must prevent route update/leave'
        )
        assert.equal(env.page(), env.initialPage, 'fullPath key must not unmount pending page')
        assert.equal(env.action(), env.initialAction)
        answer = 'success'
        await env.submit()
        await flush()
        assert.deepEqual(calls[1], first)
        assert.equal(env.action().hasPending, false)
        await env.router.push(destination)
        await flush()
        assert.equal(env.router.currentRoute.value.fullPath, destination)
      } finally {
        env.close()
      }
    })
  }
  for (const kind of ['retry', 'release']) {
    await scenario(`已确定结果后撤销查询或${kind}权限阻止新意图`, async () => {
      const env = await setup(kind)
      try {
        answer = 'success'
        await env.submit()
        await flush()
        const component = () =>
          findComponent(env.application._instance.subTree, 'FrequencyActionDialog')
        assert.equal(component().setupState.visible, false)
        permissions.delete(policy.query)
        await flush()
        env.action().open(env.target)
        await flush()
        assert.equal(component().setupState.visible, false, 'revoked query blocks new intent')
        permissions.add(policy.query)
        permissions.delete(policy[kind])
        await flush()
        env.action().open(env.target)
        await flush()
        assert.equal(component().setupState.visible, false, 'revoked action blocks new intent')
        assert.equal(calls.length, 2)
      } finally {
        env.close()
      }
    })
  }
  await scenario('已确定领域拒绝结束意图并允许同路由导航', async () => {
    const env = await setup()
    try {
      answer = 'refused'
      await env.submit()
      await flush()
      assert.equal(env.action().hasPending, false)
      await env.router.push('/monitor/a?resolved=refused')
      await flush()
      assert.equal(env.router.currentRoute.value.fullPath, '/monitor/a?resolved=refused')
    } finally {
      env.close()
    }
  })
  // 通过实际模板的model事件、表单提交和分页事件验证筛选，不以源码文本替代行为。
  const control = (env, label, type = 'el-input') => {
    const item = findElement(
      env.container,
      (node) => node.type === 'el-form-item' && node.props.label === label
    )
    assert.ok(item, `missing visible filter: ${label}`)
    return findElement(item, (node) => node.type === type)
  }
  const setFilter = async (env, label, value, type) => {
    control(env, label, type).props['onUpdate:modelValue'](value)
    await flush()
  }
  const selectView = async (env, view) => {
    const tabs = findElement(env.container, (node) => node.type === 'el-tabs')
    tabs.props['onUpdate:modelValue'](view)
    await flush()
    tabs.props.onTabChange(view)
    await flush()
  }
  const submitSearch = async (env) => {
    const form = findElement(env.container, (node) => node.type === 'el-form')
    form.props.onSubmit({ preventDefault() {} })
    await flush()
  }
  const lastPageQuery = () => queryCalls.filter((call) => !call.url.endsWith('/statistics')).at(-1)
  const fields = {
    platformSpuCode: 'SPU',
    buyerId: '9007199254740993',
    projectId: '9223372036854775807',
    orderNo: 'ORD',
    buyerOrderNo: 'BUYER-ORD',
    enqueuedFrom: '2026-10-01T00:00:00',
    enqueuedTo: '2026-10-01T23:59:59'
  }
  const fillFilters = async (env) => {
    await setFilter(env, '平台SPU编码', ` ${fields.platformSpuCode} `)
    await setFilter(env, '分销商ID', ` ${fields.buyerId} `)
    await setFilter(env, '项目ID', ` ${fields.projectId} `)
    await setFilter(env, '平台订单号', ` ${fields.orderNo} `)
    await setFilter(env, '采购商订单号', ` ${fields.buyerOrderNo} `)
    await setFilter(
      env,
      '首次入队时间（上海）',
      [fields.enqueuedFrom, fields.enqueuedTo],
      'el-date-picker'
    )
  }
  await scenario('积压页签显示全部筛选控件及整队列统计说明', async () => {
    const env = await setup(null)
    try {
      await selectView(env, 'BACKLOGS')
      for (const label of ['分销商ID', '项目ID', '平台订单号', '采购商订单号']) {
        assert.ok(control(env, label))
      }
      assert.ok(control(env, '首次入队时间（上海）', 'el-date-picker'))
      assert.ok(
        findElement(env.container, (node) =>
          node.text?.includes('筛选匹配队列，数量与最早等待时间统计整条队列')
        ),
        'backlog aggregation explanation is visible'
      )
    } finally {
      env.close()
    }
  })
  await scenario('积压GET传完整字符串ID与上海本地时间，整队列数据及全局统计保留', async () => {
    const env = await setup(null)
    try {
      await fillFilters(env)
      await selectView(env, 'BACKLOGS')
      await submitSearch(env)
      assert.deepEqual(lastPageQuery(), {
        method: 'GET',
        url: '/supply-chain/recharge-frequency/backlogs',
        params: { ...fields, pageNo: 1, pageSize: 20 },
        frequencySafeErrors: true
      })
      assert.deepEqual(env.page().setupState.rows, backlogResult.list)
      assert.equal(env.page().setupState.rows[0].waitingCount, 8)
      assert.equal(env.page().setupState.rows[0].earliestEnqueuedAt, 1790784000000)
      assert.equal(env.page().setupState.rows[0].overThreshold, true)
      assert.equal(env.page().setupState.statistics.waitingOrderCount, 1)
      env.page().setupState.refresh()
      await flush()
      for (const call of queryCalls.filter((call) => call.url.endsWith('/statistics'))) {
        assert.deepEqual(call, {
          method: 'GET',
          url: '/supply-chain/recharge-frequency/statistics',
          frequencySafeErrors: true
        })
      }
    } finally {
      env.close()
    }
  })
  await scenario('积压手机号搜索仅POST且按上海时区转换两个时间边界', async () => {
    const env = await setup(null)
    try {
      await fillFilters(env)
      const exactMobile = ['138', '0013', '8000'].join('')
      await setFilter(env, '精确手机号', exactMobile)
      await selectView(env, 'BACKLOGS')
      await submitSearch(env)
      assert.deepEqual(lastPageQuery(), {
        method: 'POST',
        url: '/supply-chain/recharge-frequency/search',
        data: {
          ...fields,
          enqueuedFrom: Date.parse('2026-10-01T00:00:00+08:00'),
          enqueuedTo: Date.parse('2026-10-01T23:59:59+08:00'),
          mobile: exactMobile,
          view: 'BACKLOGS',
          pageNo: 1,
          pageSize: 20
        }
      })
      assert.ok(
        queryCalls.every((call) => !JSON.stringify(call.params || {}).includes(exactMobile))
      )
      assert.ok(queryCalls.every((call) => !call.url.includes(exactMobile)))
      assert.equal(env.router.currentRoute.value.fullPath, '/monitor/a')
      await env.router.push('/other')
      await flush()
      assert.equal(env.page(), null, 'leaving unmounts component and its sensitive input')
    } finally {
      env.close()
    }
  })
  for (const label of ['分销商ID', '项目ID']) {
    await scenario(`积压${label}拒绝非正整数且允许超安全整数字符串`, async () => {
      const env = await setup(null)
      try {
        await selectView(env, 'BACKLOGS')
        for (const invalid of ['0', '-1', '1.5', '1e3', 'abc', '01']) {
          await setFilter(env, label, invalid)
          const before = queryCalls.length
          await submitSearch(env)
          assert.equal(queryCalls.length, before, `${label}: invalid ID must not request`)
          assert.equal(notifications.at(-1), '分销商和项目ID须为正整数内部主键')
        }
        await setFilter(env, label, '9223372036854775807')
        await submitSearch(env)
        assert.equal(
          lastPageQuery().params[label === '分销商ID' ? 'buyerId' : 'projectId'],
          '9223372036854775807'
        )
      } finally {
        env.close()
      }
    })
  }
  await scenario('跨页签及翻页保留完整筛选，查询和改页大小回第一页', async () => {
    const env = await setup(null)
    try {
      await fillFilters(env)
      await submitSearch(env)
      for (const view of ['BACKLOGS', 'OCCUPANCIES', 'WAITING', 'BACKLOGS']) {
        await selectView(env, view)
        assert.deepEqual(lastPageQuery().params, { ...fields, pageNo: 1, pageSize: 20 })
      }
      let pagination = findElement(env.container, (node) => node.type === 'el-pagination')
      pagination.props.onCurrentChange(2)
      await flush()
      assert.deepEqual(lastPageQuery().params, { ...fields, pageNo: 2, pageSize: 20 })
      await submitSearch(env)
      assert.deepEqual(lastPageQuery().params, { ...fields, pageNo: 1, pageSize: 20 })
      pagination = findElement(env.container, (node) => node.type === 'el-pagination')
      pagination.props.onSizeChange(100)
      await flush()
      assert.deepEqual(lastPageQuery().params, { ...fields, pageNo: 1, pageSize: 100 })
      assert.deepEqual(pagination.props['page-sizes'], [20, 50, 100])
    } finally {
      env.close()
    }
  })
  const failures = results.filter((value) => !value.passed)
  console.log(
    JSON.stringify({ tests: results.length, failures: failures.length, results }, null, 2)
  )
  process.exitCode = failures.length ? 1 : 0
})().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
