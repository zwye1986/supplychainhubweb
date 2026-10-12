/** 分转元 */
export const centsToYuan = (cents?: number | null) => {
  if (cents === undefined || cents === null) return undefined
  return Number((Number(cents) / 100).toFixed(2))
}

/** 元转分 */
export const yuanToCents = (yuan?: number | null) => {
  if (yuan === undefined || yuan === null) return undefined
  return Math.round(Number(yuan) * 100)
}

/** 金额分格式化为元文案 */
export const formatCentsYuan = (cents?: number | null) => {
  const yuan = centsToYuan(cents)
  return yuan === undefined ? '-' : yuan.toFixed(2)
}

/** 折扣基点转百分比，10000=100% */
export const bpToPercent = (bp?: number | null) => {
  if (bp === undefined || bp === null) return undefined
  return Number((Number(bp) / 100).toFixed(2))
}

/** 百分比转折扣基点 */
export const percentToBp = (percent?: number | null) => {
  if (percent === undefined || percent === null) return undefined
  return Math.round(Number(percent) * 100)
}
