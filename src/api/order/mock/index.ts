import dayjs from 'dayjs'
import type { AfterSalePageParam, AfterSaleVO, OrderPageParam, OrderVO } from '../types'

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data))
const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')
const paginate = <T>(list: T[], pageNo = 1, pageSize = 20) => {
  const start = (pageNo - 1) * pageSize
  return { list: list.slice(start, start + pageSize), total: list.length }
}

const orders: OrderVO[] = [
  {
    id: 1,
    orderNo: 'SC202609120001',
    supplierOrderNo: 'SPL20260912088',
    distributorOrderNo: 'DST20260912011',
    parentOrderNo: 'P202609120001',
    bizType: 'VIRTUAL_CARD',
    status: 'SUCCESS',
    amount: 15.15,
    qty: 1,
    supplierName: '腾讯会员供应商',
    distributorName: '华东福利分销中心',
    projectName: '沪上互联网员工权益',
    buyerId: 'U10086',
    buyerName: '张三',
    buyerMobile: '13800001111',
    buyerGroup: '总部福利组',
    receiverName: '张三',
    receiverMobile: '13800001111',
    receiverAddress: '上海市浦东新区世纪大道 1 号',
    payMethod: '组合支付（余额支付：10.00元+福利卡支付：5.15元）',
    payTradeNo: 'PAY202609120001',
    goodsAmount: 15.15,
    freightAmount: 0,
    serviceFee: 0,
    couponAmount: 0,
    distGoodsAmount: 15.15,
    distFreightAmount: 0,
    distFeeAmount: 0.3,
    projectPayAmount: 15.15,
    createTime: '2026-09-12 10:21:00',
    finishTime: '2026-09-12 10:22:00',
    source: 'PLATFORM',
    items: [
      {
        id: 11,
        name: '腾讯视频VIP会员 月卡',
        picUrl: 'https://static.iocoder.cn/mall/tencent-vip.png',
        skuCode: 'SKU10002',
        spec: '月卡',
        qty: 1,
        afterSaleQty: 0,
        supplyPrice: 12.5,
        distPrice: 14.8,
        projectPrice: 15.15,
        salePrice: 15.15,
        serviceFee: 0,
        couponAmount: 0,
        orderType: 'VIRTUAL_CARD',
        supplierName: '腾讯会员供应商',
        distSubOrderNo: 'DST20260912011-1',
        logisticsStatus: 'SIGNED',
        afterSaleStatus: 'NONE',
        cardInfos: [{ cardNo: 'TX20260912001', password: 'VIP-8821', expireTime: '2026-12-31 23:59:59' }]
      }
    ],
    traces: [{ time: '2026-09-12 10:22:00', content: '虚拟凭证已发放，订单完成' }]
  },
  {
    id: 2,
    orderNo: 'SC202609130002',
    supplierOrderNo: 'MY20260913002',
    distributorOrderNo: 'DST20260913022',
    bizType: 'MOVIE',
    status: 'PROCESSING',
    amount: 38,
    qty: 1,
    supplierName: '猫眼票务',
    distributorName: '华东福利分销中心',
    projectName: '暑期电影通兑专项',
    buyerId: 'U10087',
    buyerName: '李四',
    buyerMobile: '13900002222',
    buyerGroup: '华东福利组',
    receiverName: '李四',
    receiverMobile: '13900002222',
    receiverAddress: '江苏省南京市建邺区江东中路 88 号',
    payMethod: '福利卡支付：38.00元',
    payTradeNo: 'PAY202609130002',
    goodsAmount: 38,
    freightAmount: 0,
    serviceFee: 0,
    couponAmount: 0,
    distGoodsAmount: 38,
    distFreightAmount: 0,
    distFeeAmount: 0.8,
    projectPayAmount: 38,
    createTime: '2026-09-13 19:10:00',
    source: 'PLATFORM',
    items: [
      {
        id: 21,
        name: '全国电影快充通兑券 40元通兑',
        skuCode: 'SKU20001',
        spec: '40元通兑',
        qty: 1,
        afterSaleQty: 0,
        supplyPrice: 32,
        distPrice: 36,
        projectPrice: 38,
        salePrice: 38,
        serviceFee: 0,
        couponAmount: 0,
        orderType: 'MOVIE',
        supplierName: '猫眼票务',
        distSubOrderNo: 'DST20260913022-1',
        logisticsStatus: 'UNSHIPPED',
        afterSaleStatus: 'NONE',
        ticketCode: ''
      }
    ]
  },
  {
    id: 3,
    orderNo: 'SC202609130003',
    supplierOrderNo: 'KFC20260913003',
    distributorOrderNo: 'DST20260913033',
    bizType: 'DINING',
    status: 'SUCCESS',
    amount: 44,
    qty: 1,
    supplierName: '百胜餐饮',
    distributorName: '苏州企业购分销商',
    projectName: '苏州园区午餐补贴',
    buyerId: 'U10088',
    buyerName: '王五',
    buyerMobile: '13700003333',
    buyerGroup: '园区餐补组',
    receiverName: '王五',
    receiverMobile: '13700003333',
    receiverAddress: '江苏省苏州市工业园区星湖街 328 号',
    payMethod: '余额支付：44.00元',
    payTradeNo: 'PAY202609130003',
    goodsAmount: 29,
    freightAmount: 0,
    serviceFee: 15,
    couponAmount: 0,
    distGoodsAmount: 29,
    distFreightAmount: 0,
    distFeeAmount: 0.6,
    projectPayAmount: 44,
    createTime: '2026-09-13 12:08:00',
    finishTime: '2026-09-13 12:10:00',
    source: 'PLATFORM',
    items: [
      {
        id: 31,
        name: '肯德基超值兑换券 经典汉堡套餐',
        skuCode: 'SKU30001',
        spec: '经典汉堡套餐',
        qty: 1,
        afterSaleQty: 0,
        supplyPrice: 24,
        distPrice: 28,
        projectPrice: 29,
        salePrice: 29,
        serviceFee: 15,
        couponAmount: 0,
        orderType: 'DINING',
        supplierName: '百胜餐饮',
        distSubOrderNo: 'DST20260913033-1',
        logisticsStatus: 'SIGNED',
        afterSaleStatus: 'NONE',
        pickupCode: 'KFC8821'
      }
    ]
  },
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
    buyerGroup: '华南积分组',
    receiverName: '赵六',
    receiverMobile: '13600004444',
    receiverAddress: '广东省深圳市南山区科技园南路 10 号',
    payMethod: '组合支付（余额支付：80.00元+福利卡支付：48.60元）',
    payTradeNo: 'PAY202609110004',
    goodsAmount: 118.6,
    freightAmount: 10,
    serviceFee: 0,
    couponAmount: 0,
    distGoodsAmount: 118.6,
    distFreightAmount: 10,
    distFeeAmount: 2.4,
    projectPayAmount: 128.6,
    createTime: '2026-09-11 18:40:00',
    finishTime: '2026-09-12 09:00:00',
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
        distSubOrderNo: 'DST20260911044-1',
        logisticsStatus: 'SIGNED',
        afterSaleType: 'RETURN_REFUND',
        afterSaleStatus: 'WAIT_PLATFORM'
      }
    ],
    traces: [
      { time: '2026-09-12 09:00:00', content: '已签收' },
      { time: '2026-09-11 21:20:00', content: '正在派送' }
    ]
  },
  {
    id: 5,
    orderNo: 'SC202609140005',
    supplierOrderNo: 'SPL20260914005',
    distributorOrderNo: 'DST20260914055',
    bizType: 'VIRTUAL_CARD',
    status: 'PROCESSING',
    amount: 97,
    qty: 1,
    supplierName: '京东慧采',
    distributorName: '华东福利分销中心',
    projectName: '沪上互联网员工权益',
    buyerId: 'U10090',
    buyerName: '钱七',
    buyerMobile: '13500005555',
    buyerGroup: '总部福利组',
    receiverName: '钱七',
    receiverMobile: '13500005555',
    receiverAddress: '上海市徐汇区漕溪北路 18 号',
    payMethod: '福利卡支付：97.00元',
    payTradeNo: 'PAY202609140005',
    goodsAmount: 97,
    freightAmount: 0,
    serviceFee: 0,
    couponAmount: 0,
    distGoodsAmount: 97,
    distFreightAmount: 0,
    distFeeAmount: 1.9,
    projectPayAmount: 97,
    createTime: '2026-09-14 08:30:00',
    pushTime: '2026-09-14 08:31:00',
    source: 'SUPPLIER',
    items: [
      {
        id: 51,
        name: '京东E卡 100元面值',
        skuCode: 'SKU40001',
        spec: '100元',
        qty: 1,
        afterSaleQty: 0,
        supplyPrice: 95,
        distPrice: 96,
        projectPrice: 97,
        salePrice: 97,
        serviceFee: 0,
        couponAmount: 0,
        orderType: 'VIRTUAL_CARD',
        supplierName: '京东慧采',
        distSubOrderNo: 'DST20260914055-1',
        logisticsStatus: 'UNSHIPPED',
        afterSaleStatus: 'NONE'
      }
    ]
  },
  {
    id: 6,
    orderNo: 'SC202609150006',
    supplierOrderNo: '',
    distributorOrderNo: 'DST20260915066',
    bizType: 'VIRTUAL_RECHARGE',
    status: 'FAILED',
    amount: 50,
    qty: 1,
    supplierName: '',
    distributorName: '苏州企业购分销商',
    projectName: '沪上互联网员工权益',
    buyerId: 'U10091',
    buyerName: '周八',
    buyerMobile: '13400006666',
    buyerGroup: '直充组',
    receiverName: '周八',
    receiverMobile: '13400006666',
    receiverAddress: '江苏省苏州市工业园区若水路 1 号',
    payMethod: '余额支付：50.00元',
    payTradeNo: 'PAY202609150006',
    goodsAmount: 50,
    freightAmount: 0,
    serviceFee: 0,
    couponAmount: 0,
    distGoodsAmount: 48,
    distFreightAmount: 0,
    distFeeAmount: 1,
    projectPayAmount: 50,
    createTime: '2026-09-15 16:18:00',
    source: 'PLATFORM',
    remark: '候选供应商均失败，待人工处理',
    items: [
      {
        id: 61,
        name: '移动话费直充 50元',
        skuCode: 'SKU60001',
        spec: '50元',
        qty: 1,
        afterSaleQty: 0,
        supplyPrice: 49.2,
        distPrice: 48,
        projectPrice: 50,
        salePrice: 50,
        serviceFee: 0,
        couponAmount: 0,
        orderType: 'VIRTUAL_RECHARGE',
        supplierName: '',
        distSubOrderNo: 'DST20260915066-1',
        logisticsStatus: 'UNSHIPPED',
        afterSaleStatus: 'NONE',
        rechargeInfo: { account: '13800009999', result: '失败', voucherNo: '' }
      }
    ]
  },
  {
    id: 7,
    orderNo: 'SC202609160007',
    supplierOrderNo: 'TX20260916007',
    distributorOrderNo: 'DST20260916077',
    bizType: 'VIRTUAL_RECHARGE',
    status: 'SUCCESS',
    amount: 100,
    qty: 1,
    supplierName: '腾讯会员供应商',
    distributorName: '华南积分商城',
    projectName: '沪上互联网员工权益',
    buyerId: 'U10092',
    buyerName: '吴九',
    buyerMobile: '13300007777',
    buyerGroup: '直充组',
    receiverName: '吴九',
    receiverMobile: '13300007777',
    receiverAddress: '广东省广州市天河区珠江新城',
    payMethod: '福利卡支付：100.00元',
    payTradeNo: 'PAY202609160007',
    goodsAmount: 100,
    freightAmount: 0,
    serviceFee: 0,
    couponAmount: 0,
    distGoodsAmount: 98,
    distFreightAmount: 0,
    distFeeAmount: 2,
    projectPayAmount: 100,
    createTime: '2026-09-16 11:05:00',
    finishTime: '2026-09-16 11:06:00',
    pushTime: '2026-09-16 11:05:20',
    confirmTime: '2026-09-16 11:06:00',
    source: 'SUPPLIER',
    items: [
      {
        id: 71,
        name: '腾讯视频VIP 季卡直充',
        skuCode: 'SKU10008',
        spec: '季卡',
        qty: 1,
        afterSaleQty: 0,
        supplyPrice: 88,
        distPrice: 96,
        projectPrice: 100,
        salePrice: 100,
        serviceFee: 0,
        couponAmount: 0,
        orderType: 'VIRTUAL_RECHARGE',
        supplierName: '腾讯会员供应商',
        distSubOrderNo: 'DST20260916077-1',
        logisticsStatus: 'SIGNED',
        afterSaleStatus: 'NONE',
        rechargeInfo: { account: 'qq-908812', result: '成功', voucherNo: 'RC20260916007' }
      }
    ]
  },
  {
    id: 8,
    orderNo: 'SC202609170008',
    distributorOrderNo: 'DST20260917088',
    bizType: 'MOVIE',
    status: 'CLOSED',
    amount: 45,
    qty: 1,
    supplierName: '猫眼票务',
    distributorName: '华东福利分销中心',
    projectName: '暑期电影通兑专项',
    buyerId: 'U10093',
    buyerName: '郑十',
    buyerMobile: '13200008888',
    buyerGroup: '电影组',
    receiverName: '郑十',
    receiverMobile: '13200008888',
    receiverAddress: '上海市黄浦区南京东路 1 号',
    payMethod: '未支付',
    goodsAmount: 45,
    freightAmount: 0,
    serviceFee: 0,
    couponAmount: 0,
    distGoodsAmount: 42,
    distFreightAmount: 0,
    distFeeAmount: 0.8,
    projectPayAmount: 0,
    createTime: '2026-09-17 20:01:00',
    source: 'PLATFORM',
    remark: '超时未支付自动关闭',
    items: [
      {
        id: 81,
        name: '全国电影慢充通兑券 50元',
        skuCode: 'SKU20008',
        spec: '50元通兑',
        qty: 1,
        afterSaleQty: 0,
        supplyPrice: 40,
        distPrice: 42,
        projectPrice: 45,
        salePrice: 45,
        serviceFee: 0,
        couponAmount: 0,
        orderType: 'MOVIE',
        supplierName: '猫眼票务',
        distSubOrderNo: 'DST20260917088-1',
        logisticsStatus: 'UNSHIPPED',
        afterSaleStatus: 'NONE'
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

const filterOrders = (params: OrderPageParam) => {
  let list = orders.filter((item) => !params.source || item.source === params.source)
  if (params.bizType) list = list.filter((item) => item.bizType === params.bizType)
  if (params.bizTypes?.length) list = list.filter((item) => params.bizTypes!.includes(item.bizType))
  if (params.orderNo) list = list.filter((item) => item.orderNo.includes(params.orderNo!))
  if (params.status) list = list.filter((item) => item.status === params.status)
  if (params.supplierOrderNo) list = list.filter((item) => item.supplierOrderNo === params.supplierOrderNo)
  if (params.distributorOrderNo) {
    list = list.filter((item) => item.distributorOrderNo === params.distributorOrderNo)
  }
  if (params.supplierName) list = list.filter((item) => item.supplierName === params.supplierName)
  if (params.distributorName) list = list.filter((item) => item.distributorName === params.distributorName)
  if (params.supplierNames?.length) list = list.filter((item) => params.supplierNames!.includes(item.supplierName || ''))
  if (params.distributorNames?.length) {
    list = list.filter((item) => params.distributorNames!.includes(item.distributorName || ''))
  }
  if (params.productName) {
    list = list.filter((item) => item.items.some((sku) => sku.name.includes(params.productName!)))
  }
  if (params.buyerKeyword) {
    const key = params.buyerKeyword
    list = list.filter(
      (item) => item.buyerId?.includes(key) || item.buyerName?.includes(key) || item.buyerMobile?.includes(key)
    )
  }
  if (params.receiverKeyword) {
    const key = params.receiverKeyword
    list = list.filter((item) => item.receiverName?.includes(key) || item.receiverMobile?.includes(key))
  }
  if (params.createFrom && params.createTo) {
    list = list.filter((item) => item.createTime && item.createTime >= params.createFrom! && item.createTime <= params.createTo!)
  }
  return list.sort((a, b) => String(b.createTime).localeCompare(String(a.createTime)))
}

export const OrderMockApi = {
  async getOrderPage(params: OrderPageParam) {
    await delay()
    return paginate(filterOrders(params).map(clone), params.pageNo || 1, params.pageSize || 20)
  },
  async exportOrders(params: OrderPageParam) {
    await delay()
    return filterOrders(params).map(clone)
  },
  async getOrder(orderNo: string) {
    await delay()
    const found = orders.find((item) => item.orderNo === orderNo)
    if (!found) throw new Error('订单不存在')
    return clone(found)
  },
  async shipOrder(orderNo: string, data: { shipType: string; expressCompany?: string; expressNo?: string; voucher?: string; remark?: string }) {
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
      { time: now(), content: data.shipType === 'VIRTUAL' ? `虚拟发货：${data.voucher || '已发放凭证'}` : `实物发货 ${data.expressCompany} ${data.expressNo}` },
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
  async auditAfterSale(afterSaleNo: string, data: { result: 'PASS' | 'REJECT'; reason?: string; refundAmount?: number; remark?: string }) {
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
