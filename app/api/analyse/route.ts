import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { analyse } from '@/lib/kpi'
import type { KPIConfig } from '@/lib/types'

export const runtime    = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const form     = await req.formData()
    const file     = form.get('file')    as File   | null
    const cfgRaw   = form.get('configs') as string | null

    if (!file)   return NextResponse.json({ error: 'No file uploaded'  }, { status: 400 })
    if (!cfgRaw) return NextResponse.json({ error: 'No KPI config sent' }, { status: 400 })

    const configs: KPIConfig[] = JSON.parse(cfgRaw)
    if (!configs.length) return NextResponse.json({ error: 'Select at least one KPI' }, { status: 400 })

    const text   = await file.text()
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true, skipEmptyLines: true, dynamicTyping: true,
    })

    const fields  = parsed.meta.fields ?? []
    const dateCol = fields[0]
    const rows    = parsed.data as Record<string, string | number>[]

    if (rows.length < 3)
      return NextResponse.json({ error: 'Need at least 3 rows of data' }, { status: 400 })

    const result = analyse(rows, dateCol, configs)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
