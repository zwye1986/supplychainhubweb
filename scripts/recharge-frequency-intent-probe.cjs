/**
 * 现有依赖下的限频意图生命周期行为探针：编译实际SFC并挂载到Vue renderer，
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
let answer = 'uncertain'
let reads = 0
const request = {
  get: async ({ url }) => {
    reads++
    return url.endsWith('/statistics')
      ? {
          waitingOrderCount: 1,
          occupiedQueueCount: 1,
          overThresholdQueueCount: 0,
          overdueQueueCount: 0,
          observedAt: 1
        }
      : { list: [], total: 0, observedAt: 1 }
  },
  post: async ({ url, data }) => {
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
  const failures = results.filter((value) => !value.passed)
  console.log(
    JSON.stringify({ tests: results.length, failures: failures.length, results }, null, 2)
  )
  process.exitCode = failures.length ? 1 : 0
})().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
