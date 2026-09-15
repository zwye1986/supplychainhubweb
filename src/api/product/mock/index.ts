import dayjs from 'dayjs'
import type { ProductBrandVO, ProductCategoryVO, ProductTypeVO } from '../types'

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data))
const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

export const PRODUCT_TYPE_MOCK_LIST: ProductTypeVO[] = [
  {
    id: 1,
    name: '虚拟卡密',
    code: 'VIRTUAL_CARD',
    status: 1,
    remark: '卡密类虚拟商品，如会员激活码、充值卡密码',
    spuCount: 2,
    skuCount: 4,
    updateTime: '2026-09-01 10:00:00'
  },
  {
    id: 2,
    name: '虚拟直充',
    code: 'VIRTUAL_CHARGE',
    status: 1,
    remark: '账号直充类商品，下单后自动充值到指定账号',
    spuCount: 1,
    skuCount: 2,
    updateTime: '2026-09-02 11:20:00'
  },
  {
    id: 3,
    name: '电影快充',
    code: 'MOVIE_FAST',
    status: 1,
    remark: '电影票快速出票，适合即时观影场景',
    spuCount: 1,
    skuCount: 2,
    updateTime: '2026-09-03 09:10:00'
  },
  {
    id: 4,
    name: '电影慢充',
    code: 'MOVIE_SLOW',
    status: 1,
    remark: '电影票预约出票，适合提前锁座场景',
    spuCount: 1,
    skuCount: 1,
    updateTime: '2026-09-03 09:30:00'
  },
  {
    id: 5,
    name: '点餐',
    code: 'DINING',
    status: 1,
    remark: '餐饮品牌点餐券/兑换券',
    spuCount: 1,
    skuCount: 2,
    updateTime: '2026-09-04 14:00:00'
  },
  {
    id: 6,
    name: '京东',
    code: 'JD',
    status: 1,
    remark: '京东实物/E卡类商品',
    spuCount: 1,
    skuCount: 2,
    updateTime: '2026-09-05 16:40:00'
  }
]

export const PRODUCT_CATEGORY_MOCK_LIST: ProductCategoryVO[] = [
  {
    id: 1,
    parentId: 0,
    name: '虚拟产品',
    code: 'VIRTUAL',
    typeCodes: ['VIRTUAL_CARD', 'VIRTUAL_CHARGE'],
    status: 1,
    remark: '虚拟权益与直充',
    spuCount: 3,
    updateTime: '2026-09-01 10:00:00'
  },
  {
    id: 11,
    parentId: 1,
    name: '影视会员',
    code: 'VIDEO_VIP',
    typeCodes: ['VIRTUAL_CARD', 'VIRTUAL_CHARGE'],
    status: 1,
    spuCount: 3,
    updateTime: '2026-09-01 10:10:00'
  },
  {
    id: 2,
    parentId: 0,
    name: '电影票',
    code: 'MOVIE',
    typeCodes: ['MOVIE_FAST', 'MOVIE_SLOW'],
    status: 1,
    spuCount: 2,
    updateTime: '2026-09-03 09:00:00'
  },
  {
    id: 21,
    parentId: 2,
    name: '电影快票',
    code: 'MOVIE_TICKET_FAST',
    typeCodes: ['MOVIE_FAST'],
    status: 1,
    spuCount: 1,
    updateTime: '2026-09-03 09:10:00'
  },
  {
    id: 22,
    parentId: 2,
    name: '电影慢票',
    code: 'MOVIE_TICKET_SLOW',
    typeCodes: ['MOVIE_SLOW'],
    status: 1,
    spuCount: 1,
    updateTime: '2026-09-03 09:20:00'
  },
  {
    id: 3,
    parentId: 0,
    name: '餐饮外卖',
    code: 'FOOD',
    typeCodes: ['DINING'],
    status: 1,
    spuCount: 1,
    updateTime: '2026-09-04 14:00:00'
  },
  {
    id: 31,
    parentId: 3,
    name: '品牌点餐',
    code: 'DINING_BRAND',
    typeCodes: ['DINING'],
    status: 1,
    spuCount: 1,
    updateTime: '2026-09-04 14:10:00'
  },
  {
    id: 4,
    parentId: 0,
    name: '实物电商',
    code: 'PHYSICAL',
    typeCodes: ['JD'],
    status: 1,
    spuCount: 1,
    updateTime: '2026-09-05 16:00:00'
  },
  {
    id: 41,
    parentId: 4,
    name: '京东E卡',
    code: 'JD_ECARD',
    typeCodes: ['JD'],
    status: 1,
    spuCount: 1,
    updateTime: '2026-09-05 16:10:00'
  }
]

export const PRODUCT_BRAND_MOCK_LIST: ProductBrandVO[] = [
  {
    id: 1,
    name: '腾讯视频',
    shortName: '腾讯',
    code: 'TENCENT_VIDEO',
    intro: '腾讯视频会员及影视权益',
    spuCount: 2,
    updateTime: '2026-09-01 10:00:00'
  },
  {
    id: 2,
    name: '爱奇艺',
    shortName: '爱奇艺',
    code: 'IQIYI',
    intro: '爱奇艺黄金会员',
    spuCount: 1,
    updateTime: '2026-09-02 11:00:00'
  },
  {
    id: 3,
    name: '猫眼电影',
    shortName: '猫眼',
    code: 'MAOYAN',
    intro: '电影票出票渠道',
    spuCount: 2,
    updateTime: '2026-09-03 09:00:00'
  },
  {
    id: 4,
    name: '肯德基',
    shortName: 'KFC',
    code: 'KFC',
    intro: '肯德基点餐券',
    spuCount: 1,
    updateTime: '2026-09-04 14:00:00'
  },
  {
    id: 5,
    name: '京东',
    shortName: '京东',
    code: 'JD',
    intro: '京东平台商品',
    spuCount: 1,
    protectedBrand: true,
    updateTime: '2026-09-05 16:00:00'
  }
]

const types = clone(PRODUCT_TYPE_MOCK_LIST)
const categories = clone(PRODUCT_CATEGORY_MOCK_LIST)
const brands = clone(PRODUCT_BRAND_MOCK_LIST)

let typeSeq = Math.max(...types.map((item) => item.id || 0))
let categorySeq = Math.max(...categories.map((item) => item.id || 0))
let brandSeq = Math.max(...brands.map((item) => item.id || 0))

const toTree = (list: ProductCategoryVO[]) => {
  const map = new Map<number, ProductCategoryVO>()
  const roots: ProductCategoryVO[] = []
  list.forEach((item) => map.set(item.id!, { ...item, children: [] }))
  list.forEach((item) => {
    const node = map.get(item.id!)!
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children!.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

export const ProductMockApi = {
  async getTypeList(params?: { keyword?: string }) {
    await delay()
    let list = types.map(clone)
    if (params?.keyword) {
      const keyword = params.keyword.trim().toLowerCase()
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) || item.code.toLowerCase().includes(keyword)
      )
    }
    return list.sort((a, b) => String(b.updateTime).localeCompare(String(a.updateTime)))
  },
  async getType(id: number) {
    await delay()
    const found = types.find((item) => item.id === id)
    if (!found) throw new Error('商品类型不存在')
    return clone(found)
  },
  async createType(data: ProductTypeVO) {
    await delay()
    if (types.some((item) => item.name === data.name)) throw new Error('类型名称已存在')
    if (types.some((item) => item.code === data.code)) throw new Error('类型编码已存在')
    const created: ProductTypeVO = {
      ...clone(data),
      id: ++typeSeq,
      spuCount: 0,
      skuCount: 0,
      updateTime: now()
    }
    types.unshift(created)
    return clone(created)
  },
  async updateType(data: ProductTypeVO) {
    await delay()
    const index = types.findIndex((item) => item.id === data.id)
    if (index < 0) throw new Error('商品类型不存在')
    if (types.some((item) => item.id !== data.id && item.name === data.name)) {
      throw new Error('类型名称已存在')
    }
    if (types.some((item) => item.id !== data.id && item.code === data.code)) {
      throw new Error('类型编码已存在')
    }
    types[index] = { ...types[index], ...clone(data), updateTime: now() }
    return clone(types[index])
  },
  async deleteType(id: number) {
    await delay()
    const item = types.find((row) => row.id === id)
    if (!item) return true
    if ((item.spuCount || 0) > 0) throw new Error('该类型下存在商品，无法删除')
    types.splice(
      types.findIndex((row) => row.id === id),
      1
    )
    return true
  },

  async getCategoryList(params?: { name?: string; status?: number }) {
    await delay()
    let list = categories.map(clone)
    if (params?.name) {
      const keyword = params.name.trim().toLowerCase()
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          (item.code || '').toLowerCase().includes(keyword)
      )
    }
    if (params?.status != null) list = list.filter((item) => item.status === params.status)
    return toTree(list)
  },
  async getCategory(id: number) {
    await delay()
    const found = categories.find((item) => item.id === id)
    if (!found) throw new Error('分类不存在')
    return clone(found)
  },
  async createCategory(data: ProductCategoryVO) {
    await delay()
    const parentId = data.parentId || 0
    if (categories.some((item) => item.parentId === parentId && item.name === data.name)) {
      throw new Error('分类名称已存在！')
    }
    if (data.code && categories.some((item) => item.code === data.code)) {
      throw new Error('分类编码已存在')
    }
    const created: ProductCategoryVO = {
      ...clone(data),
      id: ++categorySeq,
      parentId,
      spuCount: 0,
      updateTime: now()
    }
    categories.push(created)
    return clone(created)
  },
  async updateCategory(data: ProductCategoryVO) {
    await delay()
    const index = categories.findIndex((item) => item.id === data.id)
    if (index < 0) throw new Error('分类不存在')
    const parentId = data.parentId || 0
    if (
      categories.some(
        (item) => item.id !== data.id && item.parentId === parentId && item.name === data.name
      )
    ) {
      throw new Error('分类名称已存在！')
    }
    if (data.code && categories.some((item) => item.id !== data.id && item.code === data.code)) {
      throw new Error('分类编码已存在')
    }
    categories[index] = { ...categories[index], ...clone(data), parentId, updateTime: now() }
    return clone(categories[index])
  },
  async deleteCategory(id: number) {
    await delay()
    const item = categories.find((row) => row.id === id)
    if (!item) return true
    if (categories.some((row) => row.parentId === id)) throw new Error('该分类下存在子分类，无法删除')
    if ((item.spuCount || 0) > 0) throw new Error('该分类下存在关联商品，无法删除')
    categories.splice(
      categories.findIndex((row) => row.id === id),
      1
    )
    return true
  },

  async getBrandList(params?: { keyword?: string }) {
    await delay()
    let list = brands.map(clone)
    if (params?.keyword) {
      const keyword = params.keyword.trim().toLowerCase()
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          item.code.toLowerCase().includes(keyword) ||
          (item.shortName || '').toLowerCase().includes(keyword)
      )
    }
    return list.sort((a, b) => String(b.updateTime).localeCompare(String(a.updateTime)))
  },
  async getBrand(id: number) {
    await delay()
    const found = brands.find((item) => item.id === id)
    if (!found) throw new Error('品牌不存在')
    return clone(found)
  },
  async createBrand(data: ProductBrandVO) {
    await delay()
    if (brands.some((item) => item.name === data.name)) throw new Error('品牌名称已存在')
    if (brands.some((item) => item.code === data.code)) throw new Error('品牌编码已存在')
    const created: ProductBrandVO = {
      ...clone(data),
      id: ++brandSeq,
      spuCount: 0,
      updateTime: now()
    }
    brands.unshift(created)
    return clone(created)
  },
  async updateBrand(data: ProductBrandVO) {
    await delay()
    const index = brands.findIndex((item) => item.id === data.id)
    if (index < 0) throw new Error('品牌不存在')
    if (brands.some((item) => item.id !== data.id && item.name === data.name)) {
      throw new Error('品牌名称已存在')
    }
    if (brands.some((item) => item.id !== data.id && item.code === data.code)) {
      throw new Error('品牌编码已存在')
    }
    brands[index] = { ...brands[index], ...clone(data), updateTime: now() }
    return clone(brands[index])
  },
  async deleteBrand(id: number) {
    await delay()
    const item = brands.find((row) => row.id === id)
    if (!item) return true
    if (item.protectedBrand) throw new Error('系统保护品牌不可删除')
    if ((item.spuCount || 0) > 0) throw new Error('该品牌下存在商品，无法删除')
    brands.splice(
      brands.findIndex((row) => row.id === id),
      1
    )
    return true
  }
}
