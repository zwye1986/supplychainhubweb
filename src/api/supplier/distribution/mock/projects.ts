import type { DistributorProjectVO } from '../types'

export const PROJECT_MOCK_LIST: DistributorProjectVO[] = [
  {
    id: 201,
    distributorId: 1,
    name: '华东企业年节福利包',
    code: 'PRJ20260701001',
    status: 1,
    startDate: '2026-07-01',
    endDate: '2026-12-31',
    skuCount: 12,
    projectPriceSkuCount: 5,
    settlementParty: '华东福利分销中心',
    createTime: '2026-07-01 11:00:00'
  },
  {
    id: 202,
    distributorId: 1,
    name: '沪上互联网员工权益',
    code: 'PRJ20260720002',
    status: 1,
    startDate: '2026-07-20',
    endDate: '2027-01-20',
    skuCount: 8,
    projectPriceSkuCount: 3,
    settlementParty: '华东福利分销中心',
    createTime: '2026-07-20 10:00:00'
  },
  {
    id: 203,
    distributorId: 1,
    name: '暑期电影通兑专项',
    code: 'PRJ20260801003',
    status: 2,
    startDate: '2026-08-01',
    endDate: '2026-09-30',
    skuCount: 4,
    projectPriceSkuCount: 4,
    settlementParty: '平台结算',
    createTime: '2026-08-01 09:30:00'
  },
  {
    id: 204,
    distributorId: 2,
    name: '苏州园区午餐补贴',
    code: 'PRJ20260716001',
    status: 1,
    startDate: '2026-07-16',
    endDate: '2026-12-31',
    skuCount: 6,
    projectPriceSkuCount: 2,
    settlementParty: '苏州企业购分销商',
    createTime: '2026-07-16 14:00:00'
  },
  {
    id: 205,
    distributorId: 2,
    name: '园区京东实物礼包',
    code: 'PRJ20260805002',
    status: 1,
    startDate: '2026-08-05',
    endDate: '2026-11-05',
    skuCount: 10,
    projectPriceSkuCount: 1,
    settlementParty: '苏州企业购分销商',
    createTime: '2026-08-05 16:20:00'
  },
  {
    id: 206,
    distributorId: 3,
    name: '昆山团购电影券',
    code: 'PRJ20260802001',
    status: 1,
    startDate: '2026-08-02',
    endDate: '2026-10-31',
    skuCount: 3,
    projectPriceSkuCount: 1,
    settlementParty: '昆山园区团购站',
    createTime: '2026-08-02 10:10:00'
  },
  {
    id: 207,
    distributorId: 4,
    name: '杭州互联网午晚餐',
    code: 'PRJ20260722001',
    status: 1,
    startDate: '2026-07-22',
    endDate: '2026-12-31',
    skuCount: 5,
    projectPriceSkuCount: 2,
    settlementParty: '杭州数字生活分销',
    createTime: '2026-07-22 13:00:00'
  }
]
