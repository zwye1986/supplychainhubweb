import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const vue = require('vue')
const { parse, compileScript, compileTemplate } = require('vue/compiler-sfc')
const ts = require('typescript')
const sourceRoot = fileURLToPath(new URL('../../src/', import.meta.url))
Object.assign(globalThis, vue)

/** 编译真实列表、结果组件和 API，仅 HTTP 与路由/字典/Element UI 壳替换。 */
export function mountProductList(http, confirm = async () => {}) {
  const messages = []
  const confirmations = []
  const cache = new Map()
  globalThis.useRoute = () => ({ query: {}, path: '/supplier/product/list' })
  globalThis.useRouter = () => ({ replace: () => {} })
  globalThis.useMessage = () => ({
    ...Object.fromEntries(['error', 'warning', 'success'].map(type => [type, text => messages.push({ type, text })])),
    confirm: text => { confirmations.push(text); return confirm(text) }
  })
  const dictionary = { getDictLabel: () => '', getStrDictOptions: () => [] }
  function evaluate(code, resolve) {
    const exports = {}
    const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
    new Function('exports', 'require', js)(exports, resolve)
    return exports
  }
  function stub(name) {
    return { name, setup: (_props, { slots, expose }) => {
      expose({ open: () => {} })
      return () => name === 'ElTableColumn' ? null : vue.h('div', slots.default?.())
    } }
  }
  function resolve(name, file) {
    if (name === 'vue') return vue
    if (name === '@/config/axios') return { __esModule: true, default: http }
    if (name === '@/utils/dict') return dictionary
    const target = name.startsWith('@/') ? path.join(sourceRoot, name.slice(2)) : path.resolve(path.dirname(file), name)
    if (name.endsWith('.vue')) {
      // 表单、详情、定价不参与批量上下架；结果组件必须执行真实模板。
      if (['PriceDialog.vue'].includes(path.basename(name)) || name.includes('/form/') || name.includes('/detail/')) {
        return { __esModule: true, default: stub(path.basename(name)) }
      }
      return { __esModule: true, default: load(target) }
    }
    const moduleFile = fs.existsSync(`${target}.ts`) ? `${target}.ts` : path.join(target, 'index.ts')
    return load(moduleFile)
  }
  function load(file) {
    if (cache.has(file)) return cache.get(file)
    const source = fs.readFileSync(file, 'utf8')
    const imports = name => resolve(name, file)
    if (!file.endsWith('.vue')) {
      const module = evaluate(source, imports); cache.set(file, module); return module
    }
    const { descriptor } = parse(source, { filename: file })
    const script = compileScript(descriptor, { id: file })
    const component = evaluate(script.content, imports).default
    const template = compileTemplate({ source: descriptor.template.content, filename: file, id: file,
      compilerOptions: { bindingMetadata: script.bindings } })
    if (template.errors.length) throw new Error(String(template.errors))
    component.render = evaluate(template.code, imports).render
    cache.set(file, component)
    return component
  }
  const renderer = vue.createRenderer({
    createElement: tag => ({ tag, children: [], props: {} }), createText: text => ({ text, children: [] }),
    createComment: () => ({ children: [] }),
    setElementText: (node, text) => { node.text = text }, setText: (node, text) => { node.text = text },
    patchProp: (node, key, _old, value) => { node.props[key] = value },
    insert: (node, parent, anchor = null) => {
      if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1)
      parent.children ||= []
      const index = anchor ? parent.children.indexOf(anchor) : -1
      parent.children.splice(index < 0 ? parent.children.length : index, 0, node); node.parent = parent
    },
    remove: node => { if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1); node.parent = null },
    parentNode: node => node.parent,
    nextSibling: node => node.parent?.children[node.parent.children.indexOf(node) + 1] || null
  })
  const app = renderer.createApp(load(path.join(sourceRoot, 'views/supplier/product/list/index.vue')))
  app.directive('loading', {})
  for (const name of ['ContentWrap', 'Icon', 'Pagination', 'ProductType', 'ProductCategory', 'ElTabs', 'ElTabPane',
    'ElForm', 'ElFormItem', 'ElInput', 'ElSelect', 'ElOption', 'ElDatePicker', 'ElButton', 'ElTable', 'ElTableColumn',
    'ElImage', 'ElTag', 'ElDialog', 'ElScrollbar', 'ElAlert']) app.component(name, stub(name))
  const container = { children: [] }
  const root = app.mount(container)
  const textContent = node => [node.text || '', ...(node.children || []).map(textContent)].join(' ')
  function buttons() {
    const found = []
    function visit(vnode) {
      if (!vnode) return
      if (Array.isArray(vnode)) return vnode.forEach(visit)
      if (vnode.component) {
        if (vnode.type.name === 'ElButton') found.push({ props: vnode.props, text: textContent(vnode.el) })
        visit(vnode.component.subTree)
      }
      if (Array.isArray(vnode.children)) vnode.children.forEach(visit)
    }
    visit(root.$.vnode)
    return found.filter(button => button.text.includes('批量上架') || button.text.includes('批量下架'))
  }
  return { state: root.$.setupState, messages, confirmations, buttons, container,
    text: () => textContent(container), unmount: () => app.unmount() }
}

export async function flushProductList() {
  await vue.nextTick()
  await new Promise(resolve => setImmediate(resolve))
  await vue.nextTick()
}
