export function linearRegression(y: number[]) {
  const n = y.length
  const sumX  = (n * (n - 1)) / 2
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
  const sumY  = y.reduce((a, b) => a + b, 0)
  const sumXY = y.reduce((s, v, i) => s + i * v, 0)
  const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

export function rSquared(y: number[], slope: number, intercept: number): number {
  const mean  = y.reduce((a, b) => a + b, 0) / y.length
  const ssTot = y.reduce((s, v) => s + Math.pow(v - mean, 2), 0)
  const ssRes = y.reduce((s, v, i) => s + Math.pow(v - (intercept + slope * i), 2), 0)
  return ssTot === 0 ? 0 : Math.max(0, Math.min(1, 1 - ssRes / ssTot))
}

export function forecastNext(values: number[], n = 2): number[] {
  if (values.length < 2) return Array(n).fill(values[values.length - 1] ?? 0)
  const { slope, intercept } = linearRegression(values)
  return Array.from({ length: n }, (_, i) =>
    parseFloat((intercept + slope * (values.length + i)).toFixed(4))
  )
}

export function movingAvg(values: number[], window = 3): number {
  const slice = values.slice(-window)
  return slice.reduce((a, b) => a + b, 0) / slice.length
}

export function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  if (mean === 0) return 0
  const std = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length)
  return Math.abs((std / mean) * 100)
}
