import dayjs from 'dayjs'
import type { PricingPageParam, PricingTemplateVO } from '../types'
import {
  createChannel,
  createDistPrice,
  createRegion,
  DINING_CHANNELS,
  H5_CHANNELS
} from '@/views/supplier/pricing/utils/constants'

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data))
const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

const templates: PricingTemplateVO[] = [
  {
    id: 1,
    scene: 'MOVIE',
    kind: 'FAST',
    name: '三江分销商电影快充模板',
    distributorMode: 'SPECIFIED',
    distributorCodes: ['18-001'],
    distributorNames: ['华东福利分销中心'],
    projectMode: 'ALL',
    projectCodes: [],
    projectNames: [],
    feeCopy: '配送、服务及其他费用：',
    hideFeeCopy: false,
    national: createRegion(true),
    regions: [
      {
        ...createRegion(),
        cities: ['江苏-南京', '四川-宜宾'],
        cityLabels: ['江苏省南京市', '四川省宜宾市'],
        formula: { base: 'SUGGEST', percent: 115, op: '+', amount: 0 }
      }
    ],
    hideThreshold: 1,
    distPrice: createDistPrice(),
    updateTime: '2026-09-10 11:20:00'
  },
  {
    id: 2,
    scene: 'MOVIE',
    kind: 'SLOW',
    name: '全国电影慢充默认模板',
    distributorMode: 'ALL',
    distributorCodes: [],
    distributorNames: [],
    projectMode: 'ALL',
    projectCodes: [],
    projectNames: [],
    feeCopy: '配送、服务及其他费用：',
    national: {
      ...createRegion(true),
      formula: { base: 'MARKET', percent: 108, op: '+', amount: 2 }
    },
    regions: [],
    hideThreshold: 2,
    distPrice: { ...createDistPrice(), mode: 'SUGGEST', taxMode: 'TAX_EXCLUDED' },
    updateTime: '2026-09-08 09:00:00'
  },
  {
    id: 3,
    scene: 'DINING',
    name: '园区午餐点餐加价模板',
    distributorMode: 'SPECIFIED',
    distributorCodes: ['18-002'],
    distributorNames: ['苏州企业购分销商'],
    projectMode: 'SPECIFIED',
    projectCodes: ['PRJ_20260716001'],
    projectNames: ['苏州园区午餐补贴'],
    feeCopy: '配送、服务及其他费用：',
    channelCodes: ['KFC', 'MCD', 'LUCKIN'],
    channels: ['KFC', 'MCD', 'LUCKIN'].map((code) => {
      const item = DINING_CHANNELS.find((row) => row.code === code)!
      const channel = createChannel(item.code, item.name)
      channel.serviceFee = { percent: 0, op: '+', amount: code === 'KFC' ? 15 : 5 }
      channel.national.formula = { base: 'MARKET', percent: 110, op: '+', amount: 0 }
      return channel
    }),
    distPrice: createDistPrice(),
    hideThreshold: 5,
    updateTime: '2026-09-11 16:40:00'
  },
  {
    id: 4,
    scene: 'H5',
    name: 'H5出行渠道加价模板',
    distributorMode: 'ALL',
    projectMode: 'ALL',
    feeCopy: '服务费说明：',
    channelCodes: ['TB_FLASH', 'AMAP_TAXI'],
    channels: ['TB_FLASH', 'AMAP_TAXI'].map((code) => {
      const item = H5_CHANNELS.find((row) => row.code === code)!
      const channel = createChannel(item.code, item.name)
      channel.national.formula = { base: 'SUGGEST', percent: 105, op: '+', amount: 1 }
      return channel
    }),
    distPrice: createDistPrice(),
    hideThreshold: 2,
    updateTime: '2026-09-12 10:00:00'
  }
]

let seq = Math.max(...templates.map((item) => item.id || 0))

export const PricingMockApi = {
  async getList(params: PricingPageParam) {
    await delay()
    return templates
      .filter((item) => item.scene === params.scene && (!params.kind || item.kind === params.kind))
      .map(clone)
      .sort((a, b) => String(b.updateTime).localeCompare(String(a.updateTime)))
  },
  async getTemplate(id: number) {
    await delay()
    const found = templates.find((item) => item.id === id)
    if (!found) throw new Error('模板不存在')
    return clone(found)
  },
  async saveTemplate(data: PricingTemplateVO) {
    await delay()
    if (templates.filter((item) => item.scene === data.scene).length >= 20 && !data.id) {
      throw new Error('已达模板数量上限（20条）')
    }
    if (templates.some((item) => item.id !== data.id && item.scene === data.scene && item.name === data.name)) {
      throw new Error('模板名称已存在')
    }
    if (data.id) {
      const index = templates.findIndex((item) => item.id === data.id)
      templates[index] = { ...templates[index], ...clone(data), updateTime: now() }
      return clone(templates[index])
    }
    const created = { ...clone(data), id: ++seq, updateTime: now() }
    templates.unshift(created)
    return clone(created)
  },
  async deleteTemplate(id: number) {
    await delay()
    const index = templates.findIndex((item) => item.id === id)
    if (index >= 0) templates.splice(index, 1)
    return true
  }
}
