'use client'
import { useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Papa from 'papaparse'
import type { DashboardResult, KPIConfig, KPIAnalysis } from '@/lib/types'

const SparklineChart = dynamic(() => import('./SparklineChart'), { ssr: false })
const TrendChart     = dynamic(() => import('./TrendChart'),     { ssr: false })

const ACCENT  = '#818cf8'
const PALETTE = ['#818cf8','#34d399','#f59e0b','#f87171','#c084fc','#60a5fa','#4ade80','#fb923c']

function fmt(v: number, unit: string) {
  if (unit === '$') return v >= 1_000_000 ? `$${(v/1_000_000).toFixed(2)}M` : v >= 1_000 ? `$${(v/1_000).toFixed(1)}K` : `$${v.toFixed(0)}`
  if (unit === '%') return `${v.toFixed(1)}%`
  return v >= 1_000_000 ? `${(v/1_000_000).toFixed(2)}M` : v >= 1_000 ? `${(v/1_000).toFixed(1)}K` : v.toFixed(1)
}

function chgColor(k: KPIAnalysis) {
  const good = k.direction === 'higher_better' ? k.change >= 0 : k.change <= 0
  return good ? '#17c082' : '#e74c3c'
}

const SAMPLE_CSV = `date,revenue,mrr,customers,churn_rate,cac,nps,gross_margin
2024-01,420000,385000,1240,3.8,320,41,68
2024-02,445000,408000,1290,3.6,315,43,69
2024-03,462000,428000,1340,3.4,308,44,70
2024-04,478000,445000,1380,3.3,312,42,70
2024-05,495000,465000,1420,3.1,305,45,71
2024-06,518000,488000,1470,2.9,298,47,72
2024-07,535000,505000,1510,2.8,302,46,72
2024-08,552000,522000,1550,2.7,295,48,73
2024-09,571000,542000,1600,2.5,288,50,74
2024-10,589000,560000,1640,2.4,292,49,74
2024-11,608000,580000,1690,2.3,285,51,75
2024-12,632000,602000,1740,2.2,278,53,76`

const SAMPLE_DIRECTIONS: Record<string, 'higher_better' | 'lower_better'> = {
  revenue: 'higher_better', mrr: 'higher_better', customers: 'higher_better',
  churn_rate: 'lower_better', cac: 'lower_better', nps: 'higher_better', gross_margin: 'higher_better',
}

export default function KPIApp() {
  const [file,       setFile]       = useState<File | null>(null)
  const [dragging,   setDragging]   = useState(false)
  const [columns,    setColumns]    = useState<string[]>([])
  const [rowCount,   setRowCount]   = useState(0)
  const [configs,    setConfigs]    = useState<KPIConfig[]>([])
  const [result,     setResult]     = useState<DashboardResult | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [selected,   setSelected]   = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const loadFile = useCallback((f: File) => {
    setFile(f); setResult(null); setError('')
    const reader = new FileReader()
    reader.onload = e => {
      const parsed = Papa.parse<Record<string, string>>(e.target?.result as string, { header: true, skipEmptyLines: true })
      const fields = (parsed.meta.fields ?? []).slice(1)  // drop date col
      setColumns(fields)
      setRowCount(parsed.data.length)
      setConfigs(fields.map(name => ({
        name,
        direction: (SAMPLE_DIRECTIONS[name] ?? 'higher_better') as KPIConfig['direction'],
      })))
      setSelected(fields.slice(0, 4))
    }
    reader.readAsText(f)
  }, [])

  function loadSample() {
    const f = new File([SAMPLE_CSV], 'sample_kpis.csv', { type: 'text/csv' })
    loadFile(f)
  }

  function toggleSelect(name: string) {
    setSelected(s => s.includes(name) ? s.filter(x => x !== name) : [...s, name])
  }

  function setDirection(name: string, dir: KPIConfig['direction']) {
    setConfigs(c => c.map(k => k.name === name ? { ...k, direction: dir } : k))
  }

  async function handleAnalyse() {
    if (!file || !configs.length) return
    setLoading(true); setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('configs', JSON.stringify(configs))
      const res  = await fetch('/api/analyse', { method: 'POST', body: form })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
      setSelected(data.kpis.slice(0, 4).map((k: KPIAnalysis) => k.name))
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg,#080812 0%,#0e0e2a 55%,#141460 100%)', borderRadius: 16, padding: '48px 52px', marginBottom: 36, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: 40, top: -10, fontSize: 180, opacity: 0.04, color: '#fff', lineHeight: 1, userSelect: 'none' }}>◎</div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#fff', marginBottom: 8 }}>KPI Intelligence Dashboard</h1>
          <p style={{ color: '#9ca3f0', fontSize: '1rem', maxWidth: 560 }}>
            Upload any business metrics CSV. Get trend analysis, period-over-period changes, linear forecasts, health scores, and performance alerts — instantly.
          </p>
          <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Trend Analysis','MoM Change','Linear Forecast','Health Score','Volatility','Alerts'].map(t => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        </div>

        {/* Upload */}
        <div className="section-label">Step 01</div>
        <div className="section-title">Upload KPI Data</div>

        <div onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) loadFile(f) }}
          style={{ background: dragging ? '#0a0a20' : 'var(--surface)', border: `2px dashed ${dragging ? ACCENT : 'var(--border2)'}`, borderRadius: 14, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', marginBottom: 12 }}>
          <input ref={fileRef} type="file" accept=".csv" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }} style={{ display: 'none' }} />
          {file ? (
            <>
              <div style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 4 }}>{file.name}</div>
              <div style={{ color: 'var(--faint)', fontSize: '0.8rem' }}>{rowCount} rows · {columns.length} KPI columns · click to replace</div>
            </>
          ) : (
            <>
              <div style={{ color: 'var(--muted)', fontWeight: 600, marginBottom: 6 }}>Click to browse or drag CSV here</div>
              <div style={{ color: 'var(--faint)', fontSize: '0.8rem' }}>First column = date/period · Remaining columns = KPI values</div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <button onClick={loadSample} style={{ background: 'rgba(129,140,248,0.1)', color: ACCENT, border: '1px solid rgba(129,140,248,0.25)', borderRadius: 8, padding: '7px 16px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            Load sample (SaaS metrics)
          </button>
          <div style={{ color: 'var(--faint)', fontSize: '0.76rem' }}>
            Format: <code style={{ color: 'var(--muted)', fontFamily: 'monospace' }}>date, kpi_1, kpi_2, ...</code> · any period label works (monthly, quarterly, weekly)
          </div>
        </div>

        {/* Config */}
        {columns.length > 0 && (
          <>
            <div className="section-label">Step 02</div>
            <div className="section-title">Configure KPIs</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12, marginBottom: 28 }}>
              {configs.map(cfg => (
                <div key={cfg.name} style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem', marginBottom: 10, textTransform: 'capitalize' }}>
                    {cfg.name.replace(/_/g, ' ')}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['higher_better', 'lower_better'] as const).map(dir => (
                      <button key={dir} onClick={() => setDirection(cfg.name, dir)} style={{
                        flex: 1, padding: '5px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                        background: cfg.direction === dir ? 'rgba(129,140,248,0.15)' : 'transparent',
                        border: `1px solid ${cfg.direction === dir ? 'rgba(129,140,248,0.4)' : 'var(--border2)'}`,
                        color: cfg.direction === dir ? ACCENT : 'var(--muted)',
                      }}>
                        {dir === 'higher_better' ? '↑ Higher' : '↓ Lower'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {error && (
          <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '11px 16px', color: '#f87171', fontSize: '0.85rem', marginBottom: 16 }}>{error}</div>
        )}

        {columns.length > 0 && (
          <button className="btn-primary" onClick={handleAnalyse} disabled={loading || !file}>
            {loading ? 'Analysing…' : 'Run KPI Analysis'}
          </button>
        )}

        {/* Results */}
        {result && (
          <div id="results">
            <hr />
            <div className="section-label">Results</div>
            <div className="section-title">KPI Health Report</div>

            {/* Overall score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28, padding: '20px 24px', background: 'var(--surface)', border: `1px solid ${result.overallColor}33`, borderRadius: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--muted)', marginBottom: 4 }}>Overall Health</div>
                <div style={{ fontSize: '2.6rem', fontWeight: 800, color: result.overallColor, lineHeight: 1 }}>{result.overallScore}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: result.overallColor, marginTop: 4 }}>{result.overallLabel}</div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ background: 'var(--border2)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${result.overallScore}%`, height: '100%', background: result.overallColor, borderRadius: 6, transition: 'width 0.5s ease' }} />
                </div>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                {result.kpis.filter(k => k.health === 'good').length} healthy · {result.kpis.filter(k => k.health === 'warning').length} warning · {result.kpis.filter(k => k.health === 'critical').length} critical
              </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14, marginBottom: 28 }}>
              {result.kpis.map((k, i) => (
                <div key={k.name} style={{ background: 'var(--surface)', border: `1px solid ${k.healthColor}33`, borderRadius: 12, padding: '16px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                  onClick={() => toggleSelect(k.name)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>
                        {k.name.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{fmt(k.current, k.unit)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: chgColor(k) }}>
                        {k.change >= 0 ? '+' : ''}{k.change.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--faint)', marginTop: 2 }}>vs prior</div>
                    </div>
                  </div>
                  <SparklineChart data={k.series} color={PALETTE[i % PALETTE.length]} forecast={k.forecast} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: k.healthColor, display: 'inline-block' }} />
                      <span style={{ fontSize: '0.72rem', color: k.healthColor, fontWeight: 600, textTransform: 'capitalize' }}>{k.health}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: selected.includes(k.name) ? ACCENT : 'var(--faint)', fontWeight: 600 }}>
                      {selected.includes(k.name) ? '✓ on chart' : '+ add to chart'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Trend chart */}
            {selected.length > 0 && (
              <>
                <hr />
                <div className="section-label">Analysis 01</div>
                <div className="section-title">Trend Chart — {selected.join(', ')} <span style={{ fontSize: '0.78rem', color: 'var(--faint)', fontWeight: 400 }}>(click cards to toggle)</span></div>
                <TrendChart kpis={result.kpis} periods={result.periods} selected={selected} />
              </>
            )}

            {/* Alerts */}
            {result.kpis.some(k => k.flags.length > 0) && (
              <>
                <hr />
                <div className="section-label">Alerts</div>
                <div className="section-title">Performance Flags</div>
                {result.kpis.filter(k => k.flags.length > 0).map(k => (
                  <div key={k.name} style={{ marginBottom: 12 }}>
                    {k.flags.map((f, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.15)', borderRadius: 8, marginBottom: 6 }}>
                        <span style={{ color: '#e74c3c', fontWeight: 700, flexShrink: 0 }}>!</span>
                        <span style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}

            {/* Summary table */}
            <hr />
            <div className="section-label">Analysis 02</div>
            <div className="section-title">KPI Summary Table</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="htable" style={{ width: '100%', minWidth: 700, whiteSpace: 'nowrap' }}>
                <thead>
                  <tr>{['KPI','Direction','Current','Prior','MoM Δ','3-Period MA','Forecast +1','Forecast +2','Volatility','Health'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {result.kpis.map(k => (
                    <tr key={k.name}>
                      <td style={{ fontWeight: 700, textTransform: 'capitalize' }}>{k.name.replace(/_/g,' ')}</td>
                      <td style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{k.direction === 'higher_better' ? '↑ Higher' : '↓ Lower'}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(k.current, k.unit)}</td>
                      <td style={{ color: 'var(--muted)' }}>{fmt(k.previous, k.unit)}</td>
                      <td style={{ color: chgColor(k), fontWeight: 600 }}>{k.change >= 0 ? '+' : ''}{k.change.toFixed(1)}%</td>
                      <td>{fmt(k.ma3, k.unit)}</td>
                      <td style={{ color: 'var(--muted)' }}>{fmt(k.forecast[0] ?? 0, k.unit)}</td>
                      <td style={{ color: 'var(--muted)' }}>{fmt(k.forecast[1] ?? 0, k.unit)}</td>
                      <td style={{ color: k.volatility > 25 ? '#e74c3c' : k.volatility > 10 ? '#f59e0b' : '#17c082' }}>{k.volatility.toFixed(1)}%</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: k.healthColor + '18', border: `1px solid ${k.healthColor}33`, borderRadius: 12, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, color: k.healthColor, textTransform: 'capitalize' }}>
                          {k.health}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 32, padding: '13px 18px', background: 'var(--surface)', borderLeft: '3px solid var(--border2)', borderRadius: '0 8px 8px 0', color: 'var(--faint)', fontSize: '0.78rem' }}>
              <strong style={{ color: 'var(--muted)' }}>Methodology:</strong> Trends computed via ordinary least squares regression. Forecasts are linear projections — not ML predictions. Health scores combine MoM change, trend direction, and volatility. Dashed lines on charts represent the 2-period forecast.
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 56, paddingTop: 28, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ color: 'var(--faint)', fontSize: '0.82rem', lineHeight: 1.8 }}>
            <span style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '0.85rem' }}>Muhammed Adediran</span><br />
            Financial Data Analyst · Business Intelligence · FP&A
          </div>
          <a href="https://adediran.xyz/contact" target="_blank" rel="noreferrer"
            style={{ color: ACCENT, fontWeight: 600, fontSize: '0.85rem', border: '1px solid rgba(129,140,248,0.25)', borderRadius: 8, padding: '9px 20px', textDecoration: 'none' }}>
            Get in touch
          </a>
        </div>

      </div>
    </div>
  )
}
