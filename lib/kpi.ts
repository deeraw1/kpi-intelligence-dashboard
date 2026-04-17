import type { KPIAnalysis, KPIConfig, KPIPoint, DashboardResult } from './types'
import { linearRegression, rSquared, forecastNext, movingAvg, coefficientOfVariation } from './regression'

function detectUnit(name: string, values: number[]): string {
  if (/rate|margin|pct|percent|churn|growth/i.test(name)) return '%'
  const max = Math.max(...values)
  if (max > 10000) return '$'
  return ''
}

function analyseKPI(config: KPIConfig, series: KPIPoint[]): KPIAnalysis {
  const values  = series.map(p => p.value)
  const current  = values[values.length - 1] ?? 0
  const previous = values[values.length - 2] ?? current
  const change   = previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0
  const changeAbs = current - previous

  const { slope, intercept } = linearRegression(values)
  const r2 = rSquared(values, slope, intercept)
  const trendScore = Math.round(r2 * 100)

  const trend: KPIAnalysis['trend'] =
    Math.abs(slope) < 0.001 * Math.abs(movingAvg(values)) ? 'flat'
    : slope > 0 ? 'up' : 'down'

  const forecast    = forecastNext(values, 2)
  const ma3         = movingAvg(values, 3)
  const volatility  = coefficientOfVariation(values)
  const unit        = detectUnit(config.name, values)

  // positive direction: up is good for higher_better, down is good for lower_better
  const positiveChange = config.direction === 'higher_better' ? change >= 0 : change <= 0
  const positiveTrend  = config.direction === 'higher_better' ? trend === 'up' : trend === 'down'

  // health scoring
  let healthScore = 50
  if (positiveChange)  healthScore += 20
  else                 healthScore -= 20
  if (positiveTrend)   healthScore += 20
  else                 healthScore -= 20
  if (volatility < 10) healthScore += 10
  else if (volatility > 25) healthScore -= 10
  healthScore = Math.max(0, Math.min(100, healthScore))

  const health: KPIAnalysis['health'] =
    healthScore >= 65 ? 'good' : healthScore >= 40 ? 'warning' : 'critical'
  const healthColor =
    health === 'good' ? '#17c082' : health === 'warning' ? '#f59e0b' : '#e74c3c'

  const flags: string[] = []
  if (!positiveChange && Math.abs(change) > 5)
    flags.push(`${config.name} declined ${Math.abs(change).toFixed(1)}% vs prior period`)
  if (volatility > 25)
    flags.push(`High volatility (CV ${volatility.toFixed(1)}%) — inconsistent performance`)
  if (!positiveTrend && trendScore > 50)
    flags.push(`Strong ${trend === 'up' ? 'upward' : 'downward'} trend — direction is unfavourable`)

  return {
    name: config.name, direction: config.direction,
    series, current, previous, change: parseFloat(change.toFixed(2)),
    changeAbs: parseFloat(changeAbs.toFixed(4)),
    trend, trendScore, ma3: parseFloat(ma3.toFixed(4)),
    forecast, volatility: parseFloat(volatility.toFixed(1)),
    healthScore, health, healthColor, flags, unit,
  }
}

export function analyse(
  rows: Record<string, string | number>[],
  dateCol: string,
  configs: KPIConfig[]
): DashboardResult {
  const periods = rows.map(r => String(r[dateCol] ?? ''))

  const kpis = configs.map(cfg => {
    const series: KPIPoint[] = rows.map(r => ({
      period: String(r[dateCol] ?? ''),
      value:  parseFloat(String(r[cfg.name] ?? '0')) || 0,
    }))
    return analyseKPI(cfg, series)
  })

  const overallScore = Math.round(kpis.reduce((s, k) => s + k.healthScore, 0) / kpis.length)
  const overallLabel = overallScore >= 70 ? 'Healthy' : overallScore >= 45 ? 'Needs Attention' : 'At Risk'
  const overallColor = overallScore >= 70 ? '#17c082' : overallScore >= 45 ? '#f59e0b' : '#e74c3c'

  return { kpis, periods, overallScore, overallLabel, overallColor, rowCount: rows.length }
}
