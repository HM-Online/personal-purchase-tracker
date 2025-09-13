// src/app/api/webhooks/ship24/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    // Read raw body (don’t use req.json(); we want to log raw too)
    const raw = await req.text()

    // Parse JSON if possible (don’t throw on invalid JSON)
    let body: any = {}
    try {
      body = JSON.parse(raw)
    } catch {
      body = {}
    }

    // Log a small summary so you see it in Vercel logs
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

    console.log('🚚 Ship24 webhook (TEST MODE, no auth):', {
      event,
      trackingNumber,
      status,
      gotBody: raw.length > 0,
    })

    // TODO: when you’re ready, upsert into Supabase here.

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Ship24 webhook error:', err?.message || err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

// Simple GET to verify the route is alive
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Ship24 webhook alive (TEST MODE: no signature required)',
  })
}
