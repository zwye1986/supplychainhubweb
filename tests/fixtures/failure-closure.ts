import { createApp, h } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import Panel from '../../src/views/supplier/order/components/FailureClosurePanel.vue'

const states = ['manual', 'verifying', 'confirmable', 'cancelled']
createApp({
  render: () =>
    h('main', { style: 'max-width:1100px;margin:24px auto;font-family:sans-serif' }, [
      h('h1', '原单失败处置 · 无业务网络 fixture'),
      ...states.map((state) =>
        h('section', { style: 'margin-bottom:32px' }, [
          h(
            'h2',
            { id: state },
            {
              manual: '人工处理 MANUAL',
              verifying: '核实中 STARTED',
              confirmable: '可确认失败',
              cancelled: '供应商已取消 CANCELLED / 平台失败 FAILED'
            }[state]
          ),
          h(Panel, {
            summary: {
              caseNo: state,
              terminalReasonNote: state === 'cancelled' ? '供应商返回已取消' : undefined,
              expectedSupplierSettlementAmount: 9500,
              reportedSupplierSettlementAmount: 20000,
              supplierSettlementDifferenceAmount: 10500,
              externalSupplierStatus: state === 'cancelled' ? 'CANCEL' : undefined
            }
          })
        ])
      )
    ])
})
  .use(ElementPlus)
  .mount('#app')
