// src/app/api/webhooks/ship24/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// --- Primary webhook (Ship24 should use POST) ---
export async function POST(req: Request) {
  try {
    const raw = await req.text()

    // Parse JSON if possible (don’t throw if not JSON)
    let body: any = {}
    try { body = JSON.parse(raw) } catch {}

    const event =
      body?.event ?? body?.type ?? 'unknown'
    const trackingNumber =
      body?.trackingNumber ??
      body?.tracking_number ??
      body?.trackingNo ??
      body?.trackingno ??
      null
    const status =
      body?.status ?? body?.currentStatus ?? null

    console.log('🚚 Ship24 webhook (TEST MODE — no auth)', {
      event, trackingNumber, status, gotBody: raw.length > 0,
    })

    // TODO: Add Supabase updates here once the test returns 200 OK.

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Ship24 webhook error:', err?.message || err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

// --- Health checks / sanity pings ---
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Ship24 webhook alive (TEST MODE: no signature required)',
  })
}

// Some providers send HEAD before POST
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}

// In case they preflight or try OPTIONS
export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 })
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, HEAD')
  res.headers.set('Access-Control-Allow-Headers', '*')
  return res
}
