'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { KPIAnalysis } from '@/lib/types'

const PALETTE = ['#818cf8','#34d399','#f59e0b','#f87171','#c084fc','#60a5fa','#4ade80','#fb923c']

interface Props { kpis: KPIAnalysis[]; periods: string[]; selected: string[] }

export default function TrendChart({ kpis, periods, selected }: Props) {
  const visible = kpis.filter(k => selected.includes(k.name))
  const allPeriods = [
    ...periods,
    ...Array.from({ length: 2 }, (_, i) => `F${i + 1}`),
  ]

  const data = allPeriods.map((p, pi) => {
    const pt: Record<string, string | number> = { period: p }
    visible.forEach(k => {
      if (pi < periods.length) {
        pt[k.name] = k.series[pi]?.value ?? null
      } else {
        pt[`${k.name} (forecast)`] = k.forecast[pi - periods.length] ?? null
      }
    })
    return pt
  })

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#141828" />
        <XAxis dataKey="period" tick={{ fill: '#3a4a60', fontSize: 10 }} axisLine={{ stroke: '#141828' }} tickLine={false}
          interval={Math.floor(allPeriods.length / 8)} />
        <YAxis tick={{ fill: '#3a4a60', fontSize: 11 }} axisLine={{ stroke: '#141828' }} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#0a0c18', border: '1px solid #1a2038', borderRadius: 8, color: '#e8eaf0' }}
          labelStyle={{ color: '#8a9ab8', fontSize: '0.78rem' }}
        />
        <Legend wrapperStyle={{ color: '#8a9ab8', fontSize: '0.78rem', paddingTop: 8 }} />
        {visible.map((k, i) => (
          <>
            <Line key={k.name} type="monotone" dataKey={k.name}
              stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={false} connectNulls />
            <Line key={`${k.name}-fc`} type="monotone" dataKey={`${k.name} (forecast)`}
              stroke={PALETTE[i % PALETTE.length]} strokeWidth={1.5} dot={false}
              strokeDasharray="5 3" opacity={0.6} connectNulls />
          </>
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
