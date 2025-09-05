import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendTelegramMessage } from '@/lib/telegram';
import crypto from 'crypto';

export async function POST(request: Request) {
  const webhookSecret = process.env.SHIP24_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Ship24 webhook secret is not set.');
    return NextResponse.json({ error: 'Internal server configuration error.' }, { status: 500 });
  }

  const signature = request.headers.get('ship24-signature');
  const requestBody = await request.text();
  
  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(requestBody);
  const expectedSignature = hmac.digest('hex');

  if (signature !== expectedSignature) {
    console.warn('Invalid Ship24 webhook signature received.');
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  try {
    const event = JSON.parse(requestBody);
    const tracking = event.data.tracking;
    const lastEvent = tracking.events[tracking.events.length - 1];

    const { data: ourShipment, error: findError } = await supabase
      .from('shipments')
      .select('id, purchase_id, purchases(store_name, order_id)')
      .eq('tracking_number', tracking.trackingNumber)
      .single();

    if (findError || !ourShipment) {
      console.error(`Webhook received for a tracking number not in our DB: ${tracking.trackingNumber}`);
      return NextResponse.json({ status: 'ok', message: 'Shipment not found in our DB.' });
    }

    if (!ourShipment.purchases || !Array.isArray(ourShipment.purchases) || ourShipment.purchases.length === 0) {
        throw new Error(`Could not find a linked purchase for shipment with tracking number ${tracking.trackingNumber}`);
    }
    const purchaseInfo = ourShipment.purchases[0];

    await supabase.from('checkpoints').insert({
      shipment_id: ourShipment.id,
      event_time: lastEvent.datetime,
      location: lastEvent.location,
      description: lastEvent.status,
    });

    await supabase
      .from('shipments')
      .update({ status: lastEvent.statusCode })
      .eq('id', ourShipment.id);
    
    const message = `
    🚚 <b>Tracking Update!</b>
    --------------------------------------
    <b>Store:</b> ${purchaseInfo.store_name}
    <b>Order ID:</b> ${purchaseInfo.order_id}
    <b>Status:</b> ${lastEvent.status}
    <b>Location:</b> ${lastEvent.location}
    `;

    await sendTelegramMessage(message);
    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('Error processing Ship24 webhook:', error);
    return NextResponse.json({ error: 'Failed to process webhook.' }, { status: 500 });
  }
}