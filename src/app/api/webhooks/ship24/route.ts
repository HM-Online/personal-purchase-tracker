// src/app/api/webhooks/ship24/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Admin client only if env is present (no-ops otherwise). */
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || '';
const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
        auth: { persistSession: false },
      })
    : null;

/** Constant-time compare */
function timingSafeEqual(a: string, b: string) {
  const ab = Buffer.from(a || '', 'utf8');
  const bb = Buffer.from(b || '', 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Normalize payload into a shape we can use safely. */
function normalizeShip24Payload(body: any) {
  const trackingNumber =
    body?.trackingNumber ??
    body?.tracking_number ??
    body?.trackingNo ??
    body?.data?.trackingNumber ??
    body?.data?.tracking_number ??
    body?.data?.trackingNo ??
    body?.shipment?.trackingNumber ??
    body?.shipment?.tracking_number ??
    body?.shipment?.trackingNo ??
    null;

  const rawStatus =
    body?.status ??
    body?.data?.status ??
    body?.shipment?.status ??
    body?.event ??
    body?.type ??
    null;

  const carrier =
    body?.courier ??
    body?.carrier ??
    body?.data?.carrier ??
    body?.tracking?.carrier ??
    body?.shipment?.carrier ??
    null;

  const checkpoints =
    body?.events ??
    body?.data?.events ??
    body?.tracking?.events ??
    body?.shipment?.events ??
    body?.checkpoints ??
    body?.data?.checkpoints ??
    [];

  return { trackingNumber, rawStatus, carrier, checkpoints };
}

/** Map Ship24-ish statuses to your internal enum. */
function mapStatusToInternal(raw: string | null): string | null {
  if (!raw) return null;
  const s = String(raw).toLowerCase();

  if (s.includes('delivered')) return 'delivered';
  if (s.includes('out_for_delivery') || s.includes('out-for-delivery'))
    return 'out_for_delivery';
  if (s.includes('in_transit') || s.includes('in-transit') || s.includes('transit'))
    return 'in_transit';
  if (s.includes('failed') && s.includes('attempt')) return 'failed_attempt';
  if (s.includes('exception') || s.includes('error')) return 'exception';
  if (s.includes('return') && s.includes('progress')) return 'return_in_progress';
  if (s.includes('return') && s.includes('delivered')) return 'return_delivered';
  if (s.includes('pending') || s.includes('created')) return 'pending';

  return s.replace(/\s+/g, '_');
}

/** Insert checkpoints (best-effort). */
async function upsertCheckpoints(shipmentId: string, checkpoints: any[]) {
  if (!supabaseAdmin || !Array.isArray(checkpoints) || checkpoints.length === 0) return;

  const rows = checkpoints
    .map((cp: any) => {
      const description = cp?.description ?? cp?.status ?? cp?.event ?? 'Scan';

      // ⬇️ FIX: parenthesize the || part so it can be used with ??
      const location =
        cp?.location ??
        (([cp?.city, cp?.state, cp?.country].filter(Boolean).join(', ')) ||
          cp?.address) ??
        null;

      const timeStr =
        cp?.time ??
        cp?.date ??
        cp?.datetime ??
        cp?.timestamp ??
        cp?.eventTime ??
        cp?.scanTime ??
        null;

      const time = timeStr ? new Date(timeStr) : new Date();

      return {
        shipment_id: shipmentId,
        description: String(description),
        location: location ? String(location) : null,
        time,
      };
    })
    .filter((r) => r.description);

  if (rows.length === 0) return;

  await supabaseAdmin.from('checkpoints').insert(rows).throwOnError();
}

export async function POST(req: Request) {
  try {
    const raw = await req.text();

    const secret = process.env.SHIP24_WEBHOOK_SECRET?.trim();
    const sigHeader =
      req.headers.get('x-ship24-signature') ?? req.headers.get('x-signature') ?? '';

    if (secret) {
      const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');

      console.log('Ship24 signature debug', {
        haveSecret: !!secret,
        sigHeader,
        expected,
      });

      if (!timingSafeEqual(sigHeader, expected)) {
        console.error('Ship24 webhook: invalid signature');
        return NextResponse.json(
          { ok: false, error: 'invalid signature' },
          { status: 401 }
        );
      }
    }

    let body: any = {};
    try {
      body = JSON.parse(raw);
    } catch {
      body = { raw };
    }

    const { trackingNumber, rawStatus, carrier, checkpoints } =
      normalizeShip24Payload(body);
    const mappedStatus = mapStatusToInternal(rawStatus);

    console.log('🚚 Ship24 webhook received', {
      trackingNumber,
      rawStatus,
      mappedStatus,
      carrier,
      checkpointsCount: Array.isArray(checkpoints) ? checkpoints.length : 0,
    });

    if (supabaseAdmin && trackingNumber) {
      let q = supabaseAdmin
        .from('shipments')
        .select('id')
        .eq('tracking_number', trackingNumber)
        .limit(1);
      if (carrier) q = q.eq('courier', carrier);

      const { data: found, error: findErr } = await q.maybeSingle();

      if (findErr) {
        console.error('Supabase: find shipment error:', findErr.message);
      } else if (found?.id) {
        if (mappedStatus) {
          const { error: upErr } = await supabaseAdmin
            .from('shipments')
            .update({ status: mappedStatus })
            .eq('id', found.id);
          if (upErr) console.error('Supabase: update status error:', upErr.message);
        }

        try {
          await upsertCheckpoints(found.id, checkpoints);
        } catch (cpErr: any) {
          console.error('Supabase: checkpoints insert error:', cpErr?.message || cpErr);
        }
      } else {
        console.warn(
          'Supabase: shipment not found for trackingNumber',
          trackingNumber
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Ship24 webhook error:', err?.message || err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Ship24 webhook alive' });
}
