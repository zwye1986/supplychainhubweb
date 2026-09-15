export type TemplateScene = 'MOVIE' | 'DINING' | 'H5'
export type MovieTemplateKind = 'FAST' | 'SLOW'
export type ScopeMode = 'ALL' | 'SPECIFIED'
export type MarkupMode = 'MARKET' | 'CUSTOM'
export type FormulaBase = 'MARKET' | 'SUGGEST' | 'SUPPLY'
export type FormulaOp = '+' | '-' | '*' | '/'
export type TaxMode = 'TAX_INCLUDED' | 'TAX_EXCLUDED'

export interface FormulaVO {
  base?: FormulaBase
  percent?: number
  op?: FormulaOp
  amount?: number
}

export interface ServiceFeeVO {
  percent?: number
  op?: FormulaOp
  amount?: number
}

export interface RegionMarkupVO {
  id?: string
  cities: string[]
  cityLabels?: string[]
  mode: MarkupMode
  formula?: FormulaVO
  serviceFee?: ServiceFeeVO
}

export interface DistPriceVO {
  mode: 'SUGGEST' | 'CUSTOM'
  formula?: FormulaVO
  taxMode: TaxMode
  taxRate?: number
  hideThreshold?: number
}

export interface ChannelMarkupVO {
  channelCode: string
  channelName: string
  serviceFee: ServiceFeeVO
  national: RegionMarkupVO
  regions: RegionMarkupVO[]
  hideThreshold: number
}

export interface PricingTemplateVO {
  id?: number
  scene: TemplateScene
  kind?: MovieTemplateKind
  name: string
  distributorMode: ScopeMode
  distributorCodes?: string[]
  distributorNames?: string[]
  projectMode: ScopeMode
  projectCodes?: string[]
  projectNames?: string[]
  feeCopy?: string
  hideFeeCopy?: boolean
  national?: RegionMarkupVO
  regions?: RegionMarkupVO[]
  hideThreshold?: number
  distPrice?: DistPriceVO
  channelCodes?: string[]
  channels?: ChannelMarkupVO[]
  updateTime?: string
}

export interface PricingPageParam {
  scene: TemplateScene
  kind?: MovieTemplateKind
}
