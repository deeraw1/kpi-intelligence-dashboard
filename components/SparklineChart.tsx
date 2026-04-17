'use client'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

interface Props { data: { period: string; value: number }[]; color: string; forecast?: number[] }

export default function SparklineChart({ data, color, forecast = [] }: Props) {
  const combined = [
    ...data.map(d => ({ period: d.period, actual: d.value })),
    ...forecast.map((v, i) => ({ period: `F${i + 1}`, forecast: v })),
  ]
  return (
    <ResponsiveContainer width="100%" height={56}>
      <LineChart data={combined} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <Tooltip
          contentStyle={{ background: '#0a0c18', border: '1px solid #1a2038', borderRadius: 6, fontSize: '0.72rem', color: '#e8eaf0' }}
          formatter={(v: number) => [v.toLocaleString()]}
          labelStyle={{ color: '#8a9ab8' }}
        />
        <Line type="monotone" dataKey="actual"   stroke={color}   strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="forecast" stroke={color}   strokeWidth={1.5} dot={false} strokeDasharray="4 3" opacity={0.6} />
      </LineChart>
    </ResponsiveContainer>
  )
}
