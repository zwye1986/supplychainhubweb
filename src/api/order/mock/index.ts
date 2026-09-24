import dayjs from 'dayjs'
import type { AfterSalePageParam, AfterSaleVO, OrderVO } from '../types'

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data))
const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')
const paginate = <T>(list: T[], pageNo = 1, pageSize = 20) => {
  const start = (pageNo - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total: list.length }
}

/** 仅售后页仍依赖的订单快照。平台订单、供应商履约单已接真实接口。 */
const orders: OrderVO[] = [
  {
    id: 4,
    orderNo: 'SC202609110004',
    supplierOrderNo: 'HEMA20260911004',
    distributorOrderNo: 'DST20260911044',
    bizType: 'HEMA',
    status: 'SUCCESS',
    amount: 128.6,
    qty: 2,
    supplierName: '盒马鲜生',
    distributorName: '华南积分商城',
    projectName: '华东企业年节福利包',
    buyerId: 'U10089',
    buyerName: '赵六',
    buyerMobile: '13600004444',
    receiverName: '赵六',
    receiverMobile: '13600004444',
    receiverAddress: '广东省深圳市南山区科技园南路 10 号',
    goodsAmount: 118.6,
    freightAmount: 10,
    serviceFee: 0,
    couponAmount: 0,
    createTime: '2026-09-11 18:40:00',
    source: 'PLATFORM',
    items: [
      {
        id: 41,
        name: '盒马鲜生 牛肉卷',
        skuCode: 'SKU50001',
        spec: '500g',
        qty: 2,
        afterSaleQty: 1,
        supplyPrice: 48,
        distPrice: 55,
        projectPrice: 59.3,
        salePrice: 59.3,
        serviceFee: 0,
        couponAmount: 0,
        orderType: 'HEMA',
        supplierName: '盒马鲜生',
        logisticsStatus: 'SIGNED',
        afterSaleType: 'RETURN_REFUND',
        afterSaleStatus: 'WAIT_PLATFORM'
      }
    ]
  }
]

const afterSales: AfterSaleVO[] = [
  {
    id: 101,
    afterSaleNo: 'SD20260913001',
    orderNo: 'SC202609110004',
    itemId: 41,
    type: 'RETURN_REFUND',
    status: 'WAIT_PLATFORM',
    reason: '商品质量与描述不符',
    qty: 1,
    description: '包装破损，肉品解冻后有异味',
    pics: [],
    refundToDistributor: 59.3,
    refundToUser: 59.3,
    refundCash: 30,
    refundBalance: 29.3,
    refundFreight: 0,
    refundServiceFee: 0,
    applyTime: '2026-09-13 09:20:00',
    timeline: [
      { status: '待平台审核', time: '2026-09-13 09:20:00', operator: '系统', remark: '用户发起售后', done: true },
      { status: '待分销商处理', done: false },
      { status: '待供应商确认', done: false }
    ]
  }
]

let afterSaleSeq = 101

export const OrderMockApi = {
  async shipOrder(
    orderNo: string,
    data: { shipType: string; expressCompany?: string; expressNo?: string; voucher?: string; remark?: string }
  ) {
    await delay()
    const item = orders.find((row) => row.orderNo === orderNo)
    if (!item) throw new Error('订单不存在')
    item.status = 'SUCCESS'
    item.finishTime = now()
    item.items.forEach((sku) => {
      sku.logisticsStatus = 'SHIPPED'
      if (data.voucher) {
        if (item.bizType === 'MOVIE') sku.ticketCode = data.voucher
        if (item.bizType === 'DINING') sku.pickupCode = data.voucher
      }
    })
    item.traces = [
      {
        time: now(),
        content:
          data.shipType === 'VIRTUAL'
            ? `虚拟发货：${data.voucher || '已发放凭证'}`
            : `实物发货 ${data.expressCompany} ${data.expressNo}`
      },
      ...(item.traces || [])
    ]
    return true
  },
  async getAfterSalePage(params: AfterSalePageParam) {
    await delay()
    let list = afterSales.map((item) => {
      const order = orders.find((row) => row.orderNo === item.orderNo)
      const sku = order?.items.find((row) => row.id === item.itemId)
      return { ...item, order: clone(order), item: clone(sku) }
    })
    if (params.orderNo) list = list.filter((item) => item.orderNo === params.orderNo)
    if (params.types?.length) list = list.filter((item) => params.types!.includes(item.type))
    if (params.statuses?.length) list = list.filter((item) => params.statuses!.includes(item.status))
    if (params.productName) list = list.filter((item) => item.item?.name.includes(params.productName!))
    if (params.supplierName) list = list.filter((item) => item.order?.supplierName === params.supplierName)
    if (params.distributorName) list = list.filter((item) => item.order?.distributorName === params.distributorName)
    return paginate(list.map(clone), params.pageNo || 1, params.pageSize || 20)
  },
  async getAfterSale(afterSaleNo: string) {
    await delay()
    const item = afterSales.find((row) => row.afterSaleNo === afterSaleNo)
    if (!item) throw new Error('售后单不存在')
    const order = orders.find((row) => row.orderNo === item.orderNo)
    const sku = order?.items.find((row) => row.id === item.itemId)
    return clone({ ...item, order, item: sku })
  },
  async createAfterSale(data: Partial<AfterSaleVO>) {
    await delay()
    const order = orders.find((row) => row.orderNo === data.orderNo)
    const sku = order?.items.find((row) => row.id === data.itemId)
    if (!order || !sku) throw new Error('订单商品不存在')
    const created: AfterSaleVO = {
      id: ++afterSaleSeq,
      afterSaleNo: `SD${dayjs().format('YYYYMMDD')}${String(afterSaleSeq).padStart(3, '0')}`,
      orderNo: order.orderNo,
      itemId: sku.id,
      type: data.type || 'REFUND_ONLY',
      status: 'WAIT_PLATFORM',
      reason: data.reason,
      qty: data.qty || 1,
      description: data.description,
      pics: data.pics || [],
      refundToDistributor: sku.salePrice,
      refundToUser: sku.salePrice,
      refundCash: sku.salePrice,
      refundBalance: 0,
      refundFreight: 0,
      refundServiceFee: sku.serviceFee,
      applyTime: now(),
      timeline: [{ status: '待平台审核', time: now(), operator: '运营', remark: '后台代申请售后', done: true }]
    }
    sku.afterSaleStatus = 'WAIT_PLATFORM'
    sku.afterSaleType = created.type
    afterSales.unshift(created)
    return clone(created)
  },
  async auditAfterSale(
    afterSaleNo: string,
    data: { result: 'PASS' | 'REJECT'; reason?: string; refundAmount?: number; remark?: string }
  ) {
    await delay()
    const item = afterSales.find((row) => row.afterSaleNo === afterSaleNo)
    if (!item) throw new Error('售后单不存在')
    item.status = data.result === 'PASS' ? 'FINISHED' : 'REJECTED'
    item.auditRemark = data.remark
    if (data.refundAmount != null) item.refundToUser = data.refundAmount
    item.timeline = [
      {
        status: data.result === 'PASS' ? '已完成' : '已拒绝',
        time: now(),
        operator: '平台运营',
        remark: data.reason || data.remark || '',
        done: true
      },
      ...(item.timeline || [])
    ]
    const order = orders.find((row) => row.orderNo === item.orderNo)
    const sku = order?.items.find((row) => row.id === item.itemId)
    if (sku) sku.afterSaleStatus = item.status
    return true
  }
}
