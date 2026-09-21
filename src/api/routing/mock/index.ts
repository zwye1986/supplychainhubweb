import dayjs from 'dayjs'
import type { RouteRulePageParam, RouteRuleVO, RouteWeightVO } from '../types'
import {
  createPriorities,
  createWeights,
  MOCK_DISTRIBUTORS,
  MOCK_PROJECTS,
  MOCK_SUPPLIERS
} from '@/views/supplier/routing/rule/utils/constants'

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data))
const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

let globalWeights: RouteWeightVO = createWeights()
let seq = 3

const rules: RouteRuleVO[] = [
  {
    ruleCode: 'GLOBAL_DEFAULT',
    name: '全局默认规则',
    protectedRule: true,
    distributorMode: 'ALL',
    projectMode: 'ALL',
    productTypeMode: 'ALL',
    routeMode: 'AUTO',
    supplierMode: 'ALL',
    priorities: createPriorities(),
    weights: createWeights(),
    status: 'ENABLED',
    updater: '系统',
    updateTime: '2026-09-01 10:00:00'
  },
  {
    ruleCode: 'RR20260918001',
    name: '华东点餐稳定优先',
    distributorMode: 'SPECIFIED',
    distributorCodes: ['18-001'],
    distributorNames: ['华东福利分销中心'],
    projectMode: 'SPECIFIED',
    projectCodes: ['PRJ_20260716001'],
    projectNames: ['苏州园区午餐补贴'],
    productTypeMode: 'SPECIFIED',
    productTypeCodes: ['DINING'],
    productTypeNames: ['点餐'],
    routeMode: 'AUTO',
    supplierMode: 'SPECIFIED',
    supplierCodes: ['SUP-003', 'SUP-005'],
    supplierNames: ['百胜餐饮', '盒马鲜生'],
    priorities: [
      { id: 'p1', strategy: 'STABLE' },
      { id: 'p2', strategy: 'COMPOSITE' },
      { id: 'p3', strategy: 'PRICE' }
    ],
    weights: createWeights(),
    status: 'ENABLED',
    updater: '张运营',
    updateTime: '2026-09-18 14:20:00'
  },
  {
    ruleCode: 'RR20260919002',
    name: '电影固定猫眼',
    distributorMode: 'ALL',
    projectMode: 'SPECIFIED',
    projectCodes: ['PRJ_20260801003'],
    projectNames: ['暑期电影通兑专项'],
    productTypeMode: 'SPECIFIED',
    productTypeCodes: ['MOVIE'],
    productTypeNames: ['电影'],
    routeMode: 'FIXED',
    supplierMode: 'SPECIFIED',
    supplierCodes: ['SUP-002'],
    supplierNames: ['猫眼票务'],
    primarySupplierCode: 'SUP-002',
    primarySupplierName: '猫眼票务',
    priorities: createPriorities(),
    weights: createWeights(),
    status: 'DISABLED',
    updater: '李调度',
    updateTime: '2026-09-19 09:40:00'
  }
]

const sameScope = (a: RouteRuleVO, b: RouteRuleVO) => {
  const key = (item: RouteRuleVO) =>
    [
      item.distributorMode,
      [...(item.distributorCodes || [])].sort().join(','),
      item.projectMode,
      [...(item.projectCodes || [])].sort().join(','),
      item.productTypeMode,
      [...(item.productTypeCodes || [])].sort().join(','),
      item.supplierMode,
      [...(item.supplierCodes || [])].sort().join(',')
    ].join('|')
  return key(a) === key(b)
}

const assertUniqueEnabled = (data: RouteRuleVO) => {
  if (data.status !== 'ENABLED') return
  const duplicated = rules.some(
    (item) => item.ruleCode !== data.ruleCode && item.status === 'ENABLED' && sameScope(item, data)
  )
  if (duplicated) throw new Error('已存在相同适用范围的路由规则，请调整适用范围或停用原规则。')
}

const fillNames = (data: RouteRuleVO): RouteRuleVO => ({
  ...data,
  distributorNames: MOCK_DISTRIBUTORS.filter((item) => data.distributorCodes?.includes(item.code)).map(
    (item) => item.name
  ),
  projectNames: MOCK_PROJECTS.filter((item) => data.projectCodes?.includes(item.code)).map((item) => item.name),
  supplierNames: MOCK_SUPPLIERS.filter((item) => data.supplierCodes?.includes(item.code)).map((item) => item.name),
  primarySupplierName: MOCK_SUPPLIERS.find((item) => item.code === data.primarySupplierCode)?.name,
  productTypeNames: data.productTypeNames || []
})

export const RoutingMockApi = {
  async getPage(params: RouteRulePageParam) {
    await delay()
    let list = rules.map((item) => ({ ...clone(item), weights: clone(globalWeights) }))
    if (params.name) list = list.filter((item) => item.name.includes(params.name!.trim()))
    if (params.status) list = list.filter((item) => item.status === params.status)
    if (params.distributorCodes?.length) {
      list = list.filter(
        (item) =>
          item.distributorMode === 'ALL' ||
          item.distributorCodes?.some((code) => params.distributorCodes!.includes(code))
      )
    }
    if (params.projectCodes?.length) {
      list = list.filter(
        (item) => item.projectMode === 'ALL' || item.projectCodes?.some((code) => params.projectCodes!.includes(code))
      )
    }
    if (params.productTypeCodes?.length) {
      list = list.filter(
        (item) =>
          item.productTypeMode === 'ALL' ||
          item.productTypeCodes?.some((code) => params.productTypeCodes!.includes(code))
      )
    }
    if (params.supplierCodes?.length) {
      list = list.filter(
        (item) => item.supplierMode === 'ALL' || item.supplierCodes?.some((code) => params.supplierCodes!.includes(code))
      )
    }
    if (params.updaters?.length) list = list.filter((item) => params.updaters!.includes(item.updater || ''))
    if (params.updateFrom && params.updateTo) {
      list = list.filter((item) => item.updateTime && item.updateTime >= params.updateFrom! && item.updateTime <= params.updateTo!)
    }
    list.sort((a, b) => String(b.updateTime).localeCompare(String(a.updateTime)))
    const pageNo = params.pageNo || 1
    const pageSize = params.pageSize || 10
    const start = (pageNo - 1) * pageSize
    return { list: list.slice(start, start + pageSize), total: list.length }
  },
  async get(ruleCode: string) {
    await delay()
    const found = rules.find((item) => item.ruleCode === ruleCode)
    if (!found) throw new Error('路由规则不存在')
    return { ...clone(found), weights: clone(globalWeights) }
  },
  async create(data: RouteRuleVO) {
    await delay()
    if (rules.some((item) => item.name === data.name)) throw new Error('规则名称重复！')
    const created = fillNames({
      ...clone(data),
      ruleCode: `RR${dayjs().format('YYYYMMDD')}${String(++seq).padStart(3, '0')}`,
      protectedRule: false,
      updater: '当前用户',
      updateTime: now(),
      weights: clone(data.weights)
    })
    assertUniqueEnabled(created)
    if (created.priorities.some((item) => item.strategy === 'COMPOSITE')) {
      globalWeights = clone(created.weights)
      rules.forEach((item) => {
        item.weights = clone(globalWeights)
      })
    }
    rules.unshift(created)
    return clone(created)
  },
  async update(ruleCode: string, data: RouteRuleVO) {
    await delay()
    const index = rules.findIndex((item) => item.ruleCode === ruleCode)
    if (index < 0) throw new Error('路由规则不存在')
    if (rules.some((item) => item.ruleCode !== ruleCode && item.name === data.name)) {
      throw new Error('规则名称重复！')
    }
    const next = fillNames({
      ...rules[index],
      ...clone(data),
      ruleCode,
      protectedRule: rules[index].protectedRule,
      updater: '当前用户',
      updateTime: now()
    })
    assertUniqueEnabled(next)
    if (next.priorities.some((item) => item.strategy === 'COMPOSITE')) {
      globalWeights = clone(next.weights)
      rules.forEach((item) => {
        item.weights = clone(globalWeights)
      })
    }
    rules[index] = next
    return clone(rules[index])
  },
  async delete(ruleCode: string) {
    await delay()
    const index = rules.findIndex((item) => item.ruleCode === ruleCode)
    if (index < 0) throw new Error('路由规则不存在')
    if (rules[index].protectedRule) throw new Error('系统预置“全局默认规则”不可删除')
    rules.splice(index, 1)
  },
  async changeStatus(ruleCode: string, status: RouteRuleVO['status']) {
    await delay()
    const found = rules.find((item) => item.ruleCode === ruleCode)
    if (!found) throw new Error('路由规则不存在')
    const next = { ...found, status, updater: '当前用户', updateTime: now() }
    assertUniqueEnabled(next)
    found.status = status
    found.updater = next.updater
    found.updateTime = next.updateTime
    return clone(found)
  }
}
