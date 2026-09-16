import type { App } from 'vue'
import { hasRole } from './permission/hasRole'
import { hasPermi } from './permission/hasPermi'
import { selectLoadMore } from '@/utils/directive'

/**
 * 导出指令：v-xxx
 * @methods hasRole 用户权限，用法: v-hasRole
 * @methods hasPermi 按钮权限，用法: v-hasPermi
 */
export const setupAuth = (app: App<Element>) => {
  hasRole(app)
  hasPermi(app)
}

/**
 * 导出指令：v-mountedFocus
 */
export const setupMountedFocus = (app: App<Element>) => {
  app.directive('mountedFocus', {
    mounted(el) {
      el.focus()
    }
  })
}

/**
 * 导出指令：v-selectLoadMore
 * 下拉滚动到底部加载下一页，用法: v-select-load-more="loadMore"
 */
export const setupSelectLoadMore = (app: App<Element>) => {
  app.directive('selectLoadMore', selectLoadMore)
}
