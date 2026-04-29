# Financial KPI Intelligence Dashboard

An executive financial dashboard with variance decomposition, anomaly detection, and period-over-period analysis — built for management reporting and FP&A teams.

## What It Does

- Tracks key financial KPIs across configurable reporting periods
- **Variance decomposition** — breaks down period-over-period movement into volume, price, and mix effects
- **Anomaly detection** — statistically flags KPIs that have moved outside normal ranges
- **Period-over-period analysis** — MoM, QoQ, and YoY comparisons with waterfall charts
- Colour-coded RAG (Red/Amber/Green) status per KPI against targets
- Executive summary view with drill-down capability per metric

## KPIs Tracked

| Category | Metrics |
|---|---|
| Revenue | Total revenue, revenue by segment, growth rate |
| Profitability | Gross margin, EBIT margin, net margin |
| Efficiency | Opex ratio, headcount cost per revenue |
| Liquidity | Current ratio, cash conversion cycle |
| Growth | MoM, QoQ, YoY revenue and margin trends |

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Recharts** — waterfall charts, trend lines, bar comparisons
- **Tailwind CSS**
- Client-side variance and anomaly computation

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

Built by [Muhammed Adediran](https://adediran.xyz/contact)
