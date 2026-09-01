import type { DistributorInvoiceVO } from '../types'

export const DIST_INVOICE_MOCK_LIST: DistributorInvoiceVO[] = [
  {
    id: 401,
    distributorId: 1,
    titleType: 1,
    invoiceTitle: '上海华东福利科技有限公司',
    socialCreditCode: '91310000MA1DIST001',
    phone: '021-88880001',
    bankName: '工商银行上海分行',
    bankAccount: '6222020000000000001',
    invoiceAddress: '上海市浦东新区世纪大道100号'
  },
  {
    id: 402,
    distributorId: 2,
    titleType: 1,
    invoiceTitle: '苏州企业购电子商务有限公司',
    socialCreditCode: '91320500MA1DIST002',
    phone: '0512-88880002',
    bankName: '建设银行苏州分行',
    bankAccount: '6227000000000000002',
    invoiceAddress: '苏州市工业园区星湖街328号'
  }
]
