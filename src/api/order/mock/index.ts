import dayjs from 'dayjs'
import type { AfterSalePageParam, AfterSaleVO, OrderPageParam, OrderRouteRecordVO, OrderVO } from '../types'

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
    projectGoodsAmount: 15.15,
    projectFreightAmount: 0,
    distributorPayAmount: 15.15,
    distributorGoodsAmount: 15.15,
    distributorFreightAmount: 0,
    source: 'PLATFORM',
    supplierOrders: [{ supplierOrderNo: 'SPL20260912088', supplierName: '腾讯会员供应商', status: 'FINISHED' }],
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
    projectGoodsAmount: 38,
    projectFreightAmount: 0,
    distributorPayAmount: 38,
    distributorGoodsAmount: 38,
    distributorFreightAmount: 0,
    source: 'PLATFORM',
    supplierOrders: [{ supplierOrderNo: 'MY20260913002', supplierName: '猫眼票务', status: 'WAIT_SHIP' }],
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
    supplierOrders: [{ supplierOrderNo: 'KFC20260913003', supplierName: '百胜餐饮', status: 'FINISHED' }],
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
    orderNo: 'G20260914005',
    supplierOrderNo: 'G20260914005',
    relatedPlatformOrderNo: 'SC202609140005',
    distributorOrderNo: 'DST20260914055',
    bizType: 'VIRTUAL_CARD',
    status: 'WAIT_SHIP',
    supplyMode: 'API_DIRECT',
    deliveryMode: 'API直发',
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
    orderNo: 'TX20260916007',
    supplierOrderNo: 'TX20260916007',
    relatedPlatformOrderNo: 'SC202609160007',
    distributorOrderNo: 'DST20260916077',
    bizType: 'VIRTUAL_RECHARGE',
    status: 'FINISHED',
    supplyMode: 'API_DIRECT',
    deliveryMode: 'API直发',
    shipTime: '2026-09-16 11:05:40',
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
  },
  {
    id: 9,
    orderNo: 'SC202609180009',
    distributorOrderNo: 'DST20260918099',
    bizType: 'VIRTUAL_CARD',
    status: 'WAIT_PAY',
    amount: 19.9,
    qty: 1,
    supplierName: '',
    distributorName: '华东福利分销中心',
    projectName: '沪上互联网员工权益',
    buyerId: 'U10094',
    buyerName: '冯十一',
    buyerMobile: '13100009999',
    receiverName: '冯十一',
    receiverMobile: '13100009999',
    receiverAddress: '上海市静安区南京西路 1266 号',
    payMethod: '',
    payTradeNo: '',
    goodsAmount: 19.9,
    freightAmount: 0,
    serviceFee: 0,
    couponAmount: 0,
    distGoodsAmount: 18.5,
    distFreightAmount: 0,
    projectPayAmount: 0,
    projectGoodsAmount: 19.2,
    projectFreightAmount: 0,
    distributorPayAmount: 18.5,
    distributorGoodsAmount: 18.5,
    distributorFreightAmount: 0,
    createTime: '2026-09-18 09:12:00',
    source: 'PLATFORM',
    items: [
      {
        id: 91,
        name: '爱奇艺黄金会员 月卡',
        skuCode: 'SKU10021',
        spec: '月卡',
        qty: 1,
        afterSaleQty: 0,
        supplyPrice: 16,
        distPrice: 18.5,
        projectPrice: 19.2,
        salePrice: 19.9,
        serviceFee: 0,
        couponAmount: 0,
        orderType: 'VIRTUAL_CARD',
        logisticsStatus: 'UNSHIPPED',
        afterSaleStatus: 'NONE'
      }
    ]
  },
  {
    id: 10,
    orderNo: 'SC202609140005',
    supplierOrderNo: 'G20260914005',
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
    projectPayAmount: 97,
    projectGoodsAmount: 97,
    projectFreightAmount: 0,
    distributorPayAmount: 97,
    distributorGoodsAmount: 97,
    distributorFreightAmount: 0,
    createTime: '2026-09-14 08:30:00',
    source: 'PLATFORM',
    supplierOrders: [{ supplierOrderNo: 'G20260914005', supplierName: '京东慧采', status: 'WAIT_SHIP' }],
    items: [
      {
        id: 101,
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
        logisticsStatus: 'UNSHIPPED',
        afterSaleStatus: 'NONE',
        cardInfos: [{ cardNo: 'JD20260914001', password: 'ECARD-100', expireTime: '2027-09-14 23:59:59' }]
      }
    ]
  },
  {
    id: 11,
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
    projectPayAmount: 100,
    projectGoodsAmount: 100,
    projectFreightAmount: 0,
    distributorPayAmount: 98,
    distributorGoodsAmount: 98,
    distributorFreightAmount: 0,
    createTime: '2026-09-16 11:05:00',
    finishTime: '2026-09-16 11:06:00',
    source: 'PLATFORM',
    supplierOrders: [{ supplierOrderNo: 'TX20260916007', supplierName: '腾讯会员供应商', status: 'FINISHED' }],
    items: [
      {
        id: 111,
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
        logisticsStatus: 'SIGNED',
        afterSaleStatus: 'NONE',
        rechargeInfo: { account: 'qq-908812', result: '成功', voucherNo: 'RC20260916007' }
      }
    ]
  },
  {
    id: 12,
    orderNo: 'SPL20260912088',
    supplierOrderNo: 'SPL20260912088',
    relatedPlatformOrderNo: 'SC202609120001',
    distributorOrderNo: 'DST20260912011',
    bizType: 'VIRTUAL_CARD',
    status: 'FINISHED',
    supplyMode: 'API_DIRECT',
    deliveryMode: '虚拟发放',
    shipTime: '2026-09-12 10:21:40',
    amount: 15.15,
    qty: 1,
    supplierName: '腾讯会员供应商',
    distributorName: '华东福利分销中心',
    projectName: '沪上互联网员工权益',
    buyerId: 'U10086',
    buyerName: '张三',
    buyerMobile: '13800001111',
    receiverName: '张三',
    receiverMobile: '13800001111',
    receiverAddress: '上海市浦东新区世纪大道 1 号',
    goodsAmount: 12.5,
    freightAmount: 0,
    createTime: '2026-09-12 10:21:00',
    finishTime: '2026-09-12 10:22:00',
    source: 'SUPPLIER',
    items: [
      {
        id: 121,
        name: '腾讯视频VIP会员 月卡',
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
        logisticsStatus: 'SIGNED',
        afterSaleStatus: 'NONE',
        cardInfos: [{ cardNo: 'TX20260912001', password: 'VIP-8821', expireTime: '2026-12-31 23:59:59' }]
      }
    ]
  },
  {
    id: 13,
    orderNo: 'MY20260913002',
    supplierOrderNo: 'MY20260913002',
    relatedPlatformOrderNo: 'SC202609130002',
    distributorOrderNo: 'DST20260913022',
    bizType: 'MOVIE',
    status: 'SHIPPED',
    supplyMode: 'H5_DIRECT',
    deliveryMode: 'H5直发',
    shipTime: '2026-09-13 19:12:00',
    amount: 32,
    qty: 1,
    supplierName: '猫眼票务',
    distributorName: '华东福利分销中心',
    projectName: '暑期电影通兑专项',
    buyerId: 'U10087',
    buyerName: '李四',
    buyerMobile: '13900002222',
    receiverName: '李四',
    receiverMobile: '13900002222',
    receiverAddress: '江苏省南京市建邺区江东中路 88 号',
    goodsAmount: 32,
    freightAmount: 0,
    createTime: '2026-09-13 19:10:00',
    source: 'SUPPLIER',
    remark: '权益',
    items: [
      {
        id: 131,
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
        logisticsStatus: 'SHIPPED',
        afterSaleStatus: 'NONE',
        ticketCode: 'MOVIE-8821'
      }
    ]
  },
  {
    id: 14,
    orderNo: 'KFC20260913003',
    supplierOrderNo: 'KFC20260913003',
    relatedPlatformOrderNo: 'SC202609130003',
    distributorOrderNo: 'DST20260913033',
    bizType: 'DINING',
    status: 'FINISHED',
    supplyMode: 'STORE_PICKUP',
    deliveryMode: '门店自提',
    shipTime: '2026-09-13 12:09:00',
    amount: 24,
    qty: 1,
    supplierName: '百胜餐饮',
    distributorName: '苏州企业购分销商',
    projectName: '苏州园区午餐补贴',
    buyerId: 'U10088',
    buyerName: '王五',
    buyerMobile: '13700003333',
    receiverName: '王五',
    receiverMobile: '13700003333',
    receiverAddress: '江苏省苏州市工业园区星湖街 328 号',
    goodsAmount: 24,
    freightAmount: 0,
    createTime: '2026-09-13 12:08:00',
    finishTime: '2026-09-13 12:10:00',
    source: 'SUPPLIER',
    items: [
      {
        id: 141,
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
        logisticsStatus: 'SIGNED',
        afterSaleStatus: 'NONE',
        pickupCode: 'KFC8821'
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
  if (params.orderNo) {
    const key = params.orderNo
    list = list.filter(
      (item) =>
        item.orderNo.includes(key) ||
        item.supplierOrderNo?.includes(key) ||
        item.relatedPlatformOrderNo?.includes(key)
    )
  }
  if (params.status) list = list.filter((item) => item.status === params.status)
  if (params.statuses?.length) list = list.filter((item) => params.statuses!.includes(item.status))
  if (params.supplyMode) list = list.filter((item) => item.supplyMode === params.supplyMode)
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
      (item) => item.buyerName?.includes(key) || item.buyerMobile?.includes(key) || item.buyerId?.includes(key)
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

const matchOrder = (item: OrderVO, orderNo: string) =>
  item.orderNo === orderNo || item.supplierOrderNo === orderNo || item.relatedPlatformOrderNo === orderNo

const routeRecords: OrderRouteRecordVO[] = [
  {
    orderNo: 'SC202609120001',
    productName: '腾讯视频VIP会员 月卡×1',
    qty: 1,
    status: 'SUCCESS',
    productType: 'VIRTUAL_CARD',
    tryCount: 2,
    failCount: 1,
    finalSupplierName: '腾讯会员供应商',
    supplierOrderNo: 'SPL20260912088',
    durationSec: 3.6,
    steps: [
      {
        index: 1,
        supplierName: '爱奇艺专供供应商',
        result: 'FAILED',
        time: '2026-09-12 10:21:08',
        supplyPrice: 13.8,
        assignQty: 0,
        failReason: 'API_TIMEOUT',
        remark: '供应商API响应超时',
        request: { skuCode: 'SKU10002', qty: 1, receiverMobile: '13800001111' },
        response: { code: 'TIMEOUT', message: 'gateway timeout' }
      },
      {
        index: 2,
        supplierName: '腾讯会员供应商',
        result: 'SUCCESS',
        time: '2026-09-12 10:21:12',
        supplyPrice: 12.5,
        assignQty: 1,
        remark: '路由成功',
        request: { skuCode: 'SKU10002', qty: 1, receiverMobile: '13800001111' },
        response: { code: '0', supplierOrderNo: 'SPL20260912088', stock: 999 }
      }
    ]
  },
  {
    orderNo: 'SC202609130002',
    productName: '全国电影快充通兑券 40元通兑×1',
    qty: 1,
    status: 'SUCCESS',
    productType: 'MOVIE',
    tryCount: 1,
    failCount: 0,
    finalSupplierName: '猫眼票务',
    supplierOrderNo: 'MY20260913002',
    durationSec: 1.2,
    steps: [
      {
        index: 1,
        supplierName: '猫眼票务',
        result: 'SUCCESS',
        time: '2026-09-13 19:10:06',
        supplyPrice: 32,
        assignQty: 1,
        remark: '路由成功',
        request: { skuCode: 'SKU20001', qty: 1 },
        response: { code: '0', supplierOrderNo: 'MY20260913002' }
      }
    ]
  },
  {
    orderNo: 'SC202609150006',
    productName: '移动话费直充 50元×1',
    qty: 1,
    status: 'FAILED',
    productType: 'VIRTUAL_RECHARGE',
    tryCount: 3,
    failCount: 3,
    durationSec: 39.0,
    steps: [
      {
        index: 1,
        supplierName: '腾讯会员供应商',
        result: 'FAILED',
        time: '2026-09-15 16:18:08',
        supplyPrice: 49.2,
        assignQty: 0,
        failReason: 'STOCK_SHORT',
        remark: '供应商当前库存不足以满足订单需求',
        request: { skuCode: 'SKU60001', qty: 1, account: '13800009999' },
        response: { code: 'STOCK_SHORT', stock: 0 }
      },
      {
        index: 2,
        supplierName: '京东慧采',
        result: 'FAILED',
        time: '2026-09-15 16:18:21',
        supplyPrice: 49.8,
        assignQty: 0,
        failReason: 'PRICE_OVER_THRESHOLD',
        remark: '供货价¥49.80高于项目配置的利润阈值¥49.50',
        request: { skuCode: 'SKU60001', qty: 1, account: '13800009999' },
        response: { code: '0', price: 49.8 }
      },
      {
        index: 3,
        supplierName: '华南直充供应商',
        result: 'FAILED',
        time: '2026-09-15 16:18:47',
        supplyPrice: 48.9,
        assignQty: 0,
        failReason: 'SUPPLIER_REJECT',
        remark: '供应商主动拒绝接单',
        request: { skuCode: 'SKU60001', qty: 1, account: '13800009999' },
        response: { code: 'REJECT', message: 'account risk' }
      }
    ]
  },
  {
    orderNo: 'SC202609170008',
    productName: '全国电影慢充通兑券 50元×1',
    qty: 1,
    status: 'FAILED',
    productType: 'MOVIE',
    tryCount: 0,
    failCount: 0,
    durationSec: 0,
    steps: []
  },
  {
    orderNo: 'SC202609140005',
    productName: '京东E卡 100元面值×1',
    qty: 1,
    status: 'SUCCESS',
    productType: 'VIRTUAL_CARD',
    tryCount: 1,
    failCount: 0,
    finalSupplierName: '京东慧采',
    supplierOrderNo: 'G20260914005',
    durationSec: 2.1,
    steps: [
      {
        index: 1,
        supplierName: '京东慧采',
        result: 'SUCCESS',
        time: '2026-09-14 08:30:08',
        supplyPrice: 95,
        assignQty: 1,
        remark: '路由成功',
        request: { skuCode: 'SKU40001', qty: 1 },
        response: { code: '0', supplierOrderNo: 'G20260914005' }
      }
    ]
  }
]

export const OrderMockApi = {
  async getOrderPage(params: OrderPageParam) {
    await delay()
    return paginate(filterOrders(params).map(clone), params.pageNo || 1, params.pageSize || 20)
  },
  async exportOrders(params: OrderPageParam) {
    await delay()
    return filterOrders(params).map(clone)
  },
  async getOrder(orderNo: string, source?: 'PLATFORM' | 'SUPPLIER') {
    await delay()
    const found =
      (source && orders.find((item) => item.source === source && matchOrder(item, orderNo))) ||
      orders.find((item) => matchOrder(item, orderNo))
    if (!found) throw new Error('订单不存在')
    return clone(found)
  },
  async getRouteRecord(orderNo: string) {
    await delay()
    const found =
      routeRecords.find((item) => item.orderNo === orderNo) ||
      routeRecords.find((item) => item.supplierOrderNo === orderNo)
    if (!found) throw new Error('暂无路由记录')
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
