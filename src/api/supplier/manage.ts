import request from '@/config/axios'

/** 供应商信息 */
export interface SupplierVO {
  id: number
  code: string // 供应商编号
  name: string // 供应商名称
  companyName: string // 公司名称
  socialCreditCode: string // 统一社会信用代码
  category: string[] // 可售品类
  productType: string[] // 商品类型
  productCategory: string[] // 商品分类
  supplyMode: string[] // 供货模式
  contactName: string // 联系人
  contactMobile: string // 手机号
  status: number // 合作状态
  skuCount: number // 合作商品SKU数
  accessTime: string // 接入时间
  remark: string // 备注
  creator: string
  createTime: string
  updateTime: string
}

/** 供应商分页查询参数 */
export interface SupplierPageParam {
  pageNo: number
  pageSize: number
  name?: string
  code?: string
  category?: string[]
  supplyMode?: string[]
  status?: number[]
  updateTime: string[]
}

// ====== 模拟数据（后端就绪后删除） ======
const mockList: SupplierVO[] = [
  {
    id: 1,
    code: 'SUP20260801001',
    name: '深圳华南电子科技',
    companyName: '深圳华南电子科技有限公司',
    socialCreditCode: '91440300MA5EXAMPLE1',
    category: ['equity', 'dining'],
    productType: ['equity_product', 'jd'],
    productCategory: ['electronics'],
    supplyMode: ['dropshipping', 'api'],
    contactName: '张明',
    contactMobile: '13800138001',
    status: 1,
    skuCount: 36,
    accessTime: '2026-07-15 09:30:00',
    remark: '主要供应电子元器件',
    creator: 'admin',
    createTime: '2026-07-15 09:30:00',
    updateTime: '2026-08-20 14:22:10'
  },
  {
    id: 2,
    code: 'SUP20260622002',
    name: '广州新达包装材料',
    companyName: '广州市新达包装材料有限公司',
    socialCreditCode: '91440100MA5EXAMPLE2',
    category: ['hema'],
    productType: ['jd'],
    productCategory: ['electronics', 'virtual_card'],
    supplyMode: ['batch', 'pickup'],
    contactName: '李芳',
    contactMobile: '13900139002',
    status: 1,
    skuCount: 18,
    accessTime: '2026-06-22 11:05:00',
    remark: '纸箱、彩盒包装',
    creator: 'admin',
    createTime: '2026-06-22 11:05:00',
    updateTime: '2026-08-18 16:40:33'
  },
  {
    id: 3,
    code: 'SUP20260510003',
    name: '浙江沪丰五金制品',
    companyName: '浙江沪丰五金制品股份有限公司',
    socialCreditCode: '91330000MA5EXAMPLE3',
    category: ['equity'],
    productType: ['equity_product'],
    productCategory: ['virtual_card'],
    supplyMode: ['batch'],
    contactName: '王强',
    contactMobile: '13700137003',
    status: 2,
    skuCount: 52,
    accessTime: '2026-05-10 08:15:00',
    remark: '暂停供货：质量整改中',
    creator: 'admin',
    createTime: '2026-05-10 08:15:00',
    updateTime: '2026-08-05 10:12:45'
  },
  {
    id: 4,
    code: 'SUP20260701004',
    name: '上海瑞通贸易',
    companyName: '上海瑞通国际贸易有限公司',
    socialCreditCode: '91310000MA5EXAMPLE4',
    category: ['equity', 'movie'],
    productType: ['equity_product', 'movie'],
    productCategory: ['movie_ticket'],
    supplyMode: ['dropshipping', 'h5'],
    contactName: '陈丽',
    contactMobile: '13600136004',
    status: 1,
    skuCount: 27,
    accessTime: '2026-07-01 13:20:00',
    remark: '进口原材料代理',
    creator: 'admin',
    createTime: '2026-07-01 13:20:00',
    updateTime: '2026-08-25 09:08:00'
  },
  {
    id: 5,
    code: 'SUP20260418005',
    name: '东莞恒昌塑胶模具',
    companyName: '东莞市恒昌塑胶模具有限公司',
    socialCreditCode: '91441900MA5EXAMPLE5',
    category: ['hema'],
    productType: ['jd'],
    productCategory: ['electronics'],
    supplyMode: ['batch', 'pickup'],
    contactName: '刘伟',
    contactMobile: '13500135005',
    status: 3,
    skuCount: 8,
    accessTime: '2026-04-18 10:00:00',
    remark: '黑名单：交期严重违约',
    creator: 'admin',
    createTime: '2026-04-18 10:00:00',
    updateTime: '2026-07-30 17:55:20'
  },
  {
    id: 6,
    code: 'SUP20260801006',
    name: '苏州科信自动化设备',
    companyName: '苏州科信自动化设备有限公司',
    socialCreditCode: '91320500MA5EXAMPLE6',
    category: ['movie'],
    productType: ['movie'],
    productCategory: ['movie_ticket'],
    supplyMode: ['api'],
    contactName: '赵敏',
    contactMobile: '13400134006',
    status: 1,
    skuCount: 14,
    accessTime: '2026-08-01 14:45:00',
    remark: '自动化设备维保服务',
    creator: 'admin',
    createTime: '2026-08-01 14:45:00',
    updateTime: '2026-08-28 11:30:15'
  },
  {
    id: 7,
    code: 'SUP20260605007',
    name: '福建闽辉纺织',
    companyName: '福建闽辉纺织有限公司',
    socialCreditCode: '91350000MA5EXAMPLE7',
    category: ['equity', 'dining'],
    productType: ['equity_product', 'jd'],
    productCategory: ['virtual_card', 'electronics'],
    supplyMode: ['dropshipping', 'batch'],
    contactName: '孙杰',
    contactMobile: '13300133007',
    status: 2,
    skuCount: 41,
    accessTime: '2026-06-05 09:00:00',
    remark: '暂停供货：价格调整协商中',
    creator: 'admin',
    createTime: '2026-06-05 09:00:00',
    updateTime: '2026-08-15 15:20:30'
  },
  {
    id: 8,
    code: 'SUP20260810008',
    name: '北京中科智控科技',
    companyName: '北京中科智控科技有限公司',
    socialCreditCode: '91110000MA5EXAMPLE8',
    category: ['equity'],
    productType: ['equity_product'],
    productCategory: ['virtual_card'],
    supplyMode: ['api', 'h5'],
    contactName: '周婷',
    contactMobile: '13200132008',
    status: 1,
    skuCount: 9,
    accessTime: '2026-08-10 16:30:00',
    remark: '软件与系统集成服务',
    creator: 'admin',
    createTime: '2026-08-10 16:30:00',
    updateTime: '2026-08-29 08:45:00'
  }
]

/** 模拟分页查询 */
const mockPage = (params: SupplierPageParam) => {
  let data = [...mockList]
  if (params.name) {
    const kw = params.name.toLowerCase()
    data = data.filter((item) => item.name.toLowerCase().includes(kw))
  }
  if (params.code) {
    const kw = params.code.toLowerCase()
    data = data.filter((item) => item.code.toLowerCase().includes(kw))
  }
  if (params.status && params.status.length > 0) {
    data = data.filter((item) => params.status!.includes(item.status))
  }
  if (params.category && params.category.length > 0) {
    data = data.filter((item) => item.category?.some((c) => params.category!.includes(c)))
  }
  if (params.supplyMode && params.supplyMode.length > 0) {
    data = data.filter((item) =>
      item.supplyMode?.some((m) => params.supplyMode!.includes(m))
    )
  }
  const total = data.length
  const start = (params.pageNo - 1) * params.pageSize
  const list = data.slice(start, start + params.pageSize)
  return Promise.resolve({ list, total })
}
// ====== 模拟数据结束 ======

export const SupplierApi = {
  /** 查询供应商分页 */
  getSupplierPage: async (params: SupplierPageParam) => {
    // return await request.get({ url: `/scm/supplier/page`, params })
    return await mockPage(params)
  },

  /** 获取供应商名称列表（供下拉选择） */
  getSupplierNameList: async () => {
    // return await request.get({ url: `/scm/supplier/simple-list` })
    return Promise.resolve(mockList.map((item) => ({ value: item.name, label: item.name })))
  },

  /** 查询供应商详情 */
  getSupplier: async (id: number) => {
    return await request.get({ url: `/scm/supplier/get?id=` + id })
  },

  /** 新增供应商 */
  createSupplier: async (data: SupplierVO) => {
    return await request.post({ url: `/scm/supplier/create`, data })
  },

  /** 修改供应商 */
  updateSupplier: async (data: SupplierVO) => {
    return await request.put({ url: `/scm/supplier/update`, data })
  },

  /** 修改合作状态 */
  updateSupplierStatus: async (id: number, status: number) => {
    // 模拟：本地更新状态
    const item = mockList.find((v) => v.id === id)
    if (item) item.status = status
    return Promise.resolve(true)
    // return await request.put({ url: `/scm/supplier/update-status`, data: { id, status } })
  },

  /** 删除供应商 */
  deleteSupplier: async (id: number) => {
    return await request.delete({ url: `/scm/supplier/delete?id=` + id })
  },

  /** 导出供应商 Excel */
  exportSupplier: async (params: any) => {
    return await request.download({ url: `/scm/supplier/export-excel`, params })
  }
}
