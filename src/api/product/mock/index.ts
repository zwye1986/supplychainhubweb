import dayjs from 'dayjs'
import type { ProductTypeVO } from '../types'

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

const types = clone(PRODUCT_TYPE_MOCK_LIST)
let typeSeq = Math.max(...types.map((item) => item.id || 0))

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
  }
}
