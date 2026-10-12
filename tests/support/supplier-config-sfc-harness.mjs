import fs from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const vue = require('vue')
const { parse, compileScript, compileTemplate } = require('vue/compiler-sfc')
const ts = require('typescript')
const viewRoot = fileURLToPath(new URL('../../src/views/supplier/config/', import.meta.url))
Object.assign(globalThis, vue)

/** 执行真实 SFC setup 和模板，UI 壳组件使用内存 renderer；见供给发布设计 §15.5。 */
export function mountSupplierConfig(api, entry = 'index.vue', props = {}) {
  const cache = new Map()
  const messages = []
  globalThis.useMessage = () => ({
    error: (value) => messages.push(value),
    warning: (value) => messages.push(value),
    success: (value) => messages.push(value),
    confirm: async () => true
  })
  const constants = evaluate(fs.readFileSync(path.join(viewRoot, 'utils/constants.ts'), 'utf8'))
  const actualFiles = new Set([
    'index.vue',
    'ConnectorPanel.vue',
    'MappingPanel.vue',
    'MappingAppendDialog.vue',
    'CapabilityPanel.vue',
    'ConnectorValidateDialog.vue',
    'ConnectorFormDialog.vue',
    'ConnectorDetailDrawer.vue',
    'CredentialItemDialog.vue'
  ])
  function evaluate(code, resolve = require) {
    const exports = {}
    const js = ts.transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.CommonJS }
    }).outputText
    new Function('exports', 'require', js)(exports, resolve)
    return exports
  }
  function stub(name) {
    return {
      name,
      setup: (_props, { slots, expose, attrs }) => {
        expose({ open: () => {}, validate: async () => true, clearValidate: () => {} })
        return () =>
          ['ElTableColumn'].includes(name)
            ? null
            : vue.h(
                'div',
                name === 'ElAlert'
                  ? [attrs.title, slots.default?.()]
                  : slots.footer
                    ? [slots.default?.(), slots.footer()]
                    : slots.default?.()
              )
      }
    }
  }
  function load(file) {
    if (cache.has(file)) return cache.get(file)
    const filename = path.basename(file)
    if (!actualFiles.has(filename)) return stub(filename.replace('.vue', ''))
    const { descriptor } = parse(fs.readFileSync(file, 'utf8'), { filename: file })
    const script = compileScript(descriptor, { id: filename })
    const imports = (name) => {
      if (name === 'vue') return vue
      if (name === '@/api/supplier/config') return { SupplierConfigApi: api }
      if (name === '@/api/supplier/manage')
        return { SupplierApi: { getSupplierNameList: async () => [] } }
      if (name.endsWith('/utils/constants')) return constants
      if (name.endsWith('.vue'))
        return { __esModule: true, default: load(path.resolve(path.dirname(file), name)) }
      throw new Error(`Unexpected SFC import: ${name}`)
    }
    const component = evaluate(script.content, imports).default
    const template = compileTemplate({
      source: descriptor.template.content,
      filename: file,
      id: filename,
      compilerOptions: { bindingMetadata: script.bindings }
    })
    if (template.errors.length) throw new Error(String(template.errors))
    component.render = evaluate(template.code, imports).render
    cache.set(file, component)
    return component
  }
  const renderer = vue.createRenderer({
    createElement: () => ({ style: {}, children: [] }),
    createText: () => ({ children: [] }),
    createComment: () => ({ children: [] }),
    setElementText: (node, value) => {
      node.text = value
    },
    setText: (node, value) => {
      node.text = value
    },
    patchProp: () => {},
    insert: (node, parent, anchor = null) => {
      if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1)
      parent.children ||= []
      const index = anchor ? parent.children.indexOf(anchor) : -1
      parent.children.splice(index < 0 ? parent.children.length : index, 0, node)
      node.parent = parent
    },
    remove: (node) => {
      if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1)
      node.parent = null
    },
    parentNode: (node) => node.parent,
    nextSibling: (node) => node.parent?.children[node.parent.children.indexOf(node) + 1] || null
  })
  const app = renderer.createApp(load(path.join(viewRoot, entry)), props)
  app.directive('loading', {})
  for (const name of [
    'ContentWrap',
    'Icon',
    'ElForm',
    'ElFormItem',
    'ElSelect',
    'ElOption',
    'ElTabs',
    'ElTabPane',
    'ElButton',
    'ElTable',
    'ElTableColumn',
    'ElEmpty',
    'ElAlert',
    'ElDescriptions',
    'ElDescriptionsItem',
    'ElTag',
    'ElDrawer',
    'ElRadioGroup',
    'ElRadio',
    'ElDialog',
    'ElCheckboxGroup',
    'ElCheckbox',
    'ElInputNumber',
    'ElInput',
    'ElSwitch'
  ])
    app.component(name, stub(name))
  const root = app.mount({})
  function findAll(name) {
    const results = []
    function visit(vnode) {
      if (!vnode) return
      if (Array.isArray(vnode)) return vnode.forEach(visit)
      if (vnode.component) {
        if (vnode.type.name === name) results.push(vnode.component)
        visit(vnode.component.subTree)
      }
      if (Array.isArray(vnode.children)) vnode.children.forEach(visit)
    }
    visit(root.$.vnode)
    return results
  }
  function find(name) {
    const result = findAll(name)[0]
    if (!result) throw new Error(`Missing mounted component: ${name}`)
    return result
  }
  function text() {
    const values = []
    function visit(vnode) {
      if (!vnode) return
      if (Array.isArray(vnode)) return vnode.forEach(visit)
      if (vnode.component) visit(vnode.component.subTree)
      if (typeof vnode.children === 'string') values.push(vnode.children)
      else if (Array.isArray(vnode.children)) vnode.children.forEach(visit)
    }
    visit(root.$.vnode)
    return values.join(' ')
  }
  return { root: root.$, find, findAll, text, messages, unmount: () => app.unmount() }
}

export async function flushSfc() {
  await vue.nextTick()
  await new Promise((resolve) => setImmediate(resolve))
  await vue.nextTick()
}
