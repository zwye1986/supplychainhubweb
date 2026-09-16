import type { Directive, DirectiveBinding } from 'vue'
import { nextTick } from 'vue'
import { debounce } from 'lodash-es'

interface SelectLoadMoreBinding {
  loadMore: () => void
  distance?: number
}

export const selectLoadMore: Directive = {
  mounted(el: any, binding: DirectiveBinding<SelectLoadMoreBinding | (() => void)>) {
    const loadMore = typeof binding.value === 'function' ? binding.value : binding.value?.loadMore
    const distance = typeof binding.value === 'object' && binding.value?.distance !== undefined ? binding.value.distance : 10
    const handleScroll = debounce((e: Event) => {
      const target = e.target as HTMLElement
      const { scrollTop, scrollHeight, clientHeight } = target
      if (scrollHeight > 0 && scrollTop + clientHeight >= scrollHeight - distance) {
        loadMore?.()
      }
    }, 200)

    const findScrollWrap = (popper: HTMLElement): HTMLElement | null => {
      const selectors = [
        '.el-select-dropdown__wrap',
        '.el-select-v2__wrapper',
        '[class*="select"] [class*="wrap"]',
        '[class*="select"] [class*="scroll"]'
      ]
      for (const selector of selectors) {
        const el = popper.querySelector(selector) as HTMLElement
        if (el) {
          return el
        }
      }
      return null
    }

    const attachListener = () => {
      const poppers = document.querySelectorAll('.el-popper')
      let found = false

      poppers.forEach((popper: any) => {
        const scrollWrap = findScrollWrap(popper)
        if (scrollWrap && !scrollWrap._hasSelectLoadMoreListener) {
          scrollWrap._hasSelectLoadMoreListener = true
          scrollWrap.addEventListener('scroll', handleScroll)
          found = true
        }
      })

      return found
    }

    let retryTimer: ReturnType<typeof setTimeout> | null = null

    const retryAttach = (times: number, delay: number) => {
      if (times <= 0) return
      if (retryTimer) clearTimeout(retryTimer)
      retryTimer = setTimeout(() => {
        if (!attachListener()) {
          retryAttach(times - 1, delay * 2)
        }
      }, delay)
    }

    const observer = new MutationObserver(() => {
      nextTick(() => {
        attachListener()
      })
    })

    observer.observe(document.body, { childList: true, subtree: true, attributes: true })

    // 初始尝试 + 多次重试（处理异步渲染时序问题）
    attachListener()
    retryAttach(5, 100)

    el._selectLoadMoreObserver = observer
    el._selectLoadMoreHandleScroll = handleScroll
    el._selectLoadMoreRetryTimer = retryTimer
  },
  unmounted(el: any) {
    const observer = el._selectLoadMoreObserver
    const handleScroll = el._selectLoadMoreHandleScroll
    const retryTimer = el._selectLoadMoreRetryTimer

    if (observer) {
      observer.disconnect()
    }

    if (retryTimer) {
      clearTimeout(retryTimer)
    }

    const poppers = document.querySelectorAll('.el-popper')
    poppers.forEach((popper: any) => {
      const scrollWrap = popper.querySelector('.el-select-dropdown__wrap, .el-select-v2__wrapper')
      if (scrollWrap) {
        scrollWrap.removeEventListener('scroll', handleScroll)
        scrollWrap._hasSelectLoadMoreListener = false
      }
    })
  }
}