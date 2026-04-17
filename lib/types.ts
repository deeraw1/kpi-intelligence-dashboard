export interface KPIConfig {
  name:      string
  direction: 'higher_better' | 'lower_better'
}

export interface KPIPoint { period: string; value: number }

export interface KPIAnalysis {
  name:          string
  direction:     'higher_better' | 'lower_better'
  series:        KPIPoint[]
  current:       number
  previous:      number
  change:        number        // % MoM
  changeAbs:     number
  trend:         'up' | 'down' | 'flat'
  trendScore:    number        // R² * 100
  ma3:           number        // 3-period moving average
  forecast:      number[]      // next 2 periods
  volatility:    number        // CV %
  healthScore:   number        // 0–100
  health:        'good' | 'warning' | 'critical'
  healthColor:   string
  flags:         string[]
  unit:          string        // auto-detected: %, $, plain
}

export interface DashboardResult {
  kpis:          KPIAnalysis[]
  periods:       string[]
  overallScore:  number
  overallLabel:  string
  overallColor:  string
  rowCount:      number
}
