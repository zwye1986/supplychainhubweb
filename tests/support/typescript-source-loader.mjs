import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
const root = fileURLToPath(new URL('../../src/', import.meta.url))

/** 加载实际 TS 依赖，避免为价格编辑逻辑复制模块实现。 */
export function loadTypeScriptSource(filename) {
  const exports = {}
  const javascript = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText
  new Function('exports', 'require', javascript)(exports, (name) => {
    const target = name.startsWith('@/')
      ? path.join(root, name.slice(2))
      : path.resolve(path.dirname(filename), name)
    return loadTypeScriptSource(
      fs.existsSync(`${target}.ts`) ? `${target}.ts` : path.join(target, 'index.ts')
    )
  })
  return exports
}
