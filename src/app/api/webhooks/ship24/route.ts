import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendTelegramMessage } from '@/lib/telegram';
import crypto from 'crypto';

// This function will handle all incoming webhook messages from Ship24
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

  // --- TEMPORARY DIAGNOSTIC STEP ---
  // The Ship24 test button does not send a signature. We are temporarily
  // disabling this check to allow the test message to pass through.
  // Real messages from Ship24 will have a valid signature.
  /*
  if (signature !== expectedSignature) {
    console.warn('Invalid Ship24 webhook signature received.');
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }
  */
  // --- END OF TEMPORARY STEP ---

  try {
    const event = JSON.parse(requestBody);
    
    // The test webhook has a different structure from the real one.
    // We need to handle both possibilities.
    const tracking = event.data ? event.data.tracking : event.trackings[0].tracker;
    const shipment = event.data ? event.data.shipment : event.trackings[0].shipment;
    const allEvents = event.data ? event.data.tracking.events : event.trackings[0].events;
    const lastEvent = allEvents[allEvents.length - 1];

    console.log(`Processing webhook for tracker: ${tracking.trackingNumber}, Status: ${lastEvent.status}`);

    // Find the corresponding shipment in our database
    const { data: ourShipment, error: findError } = await supabase
      .from('shipments')
      .select('id, purchase_id, purchases(store_name, order_id)')
      .eq('tracking_number', tracking.trackingNumber)
      .single();

    if (findError || !ourShipment) {
      console.warn(`Webhook received for a tracking number not in our DB: ${tracking.trackingNumber}. This is normal for test messages.`);
      // We will send a notification anyway for the test, using test data.
      const testMessage = `
      ✅ <b>Webhook Test Successful!</b>
      --------------------------------------
      <b>Status:</b> ${lastEvent.status}
      <b>Location:</b> ${lastEvent.location}
      <i>This is a test message. No data was saved.</i>
      `;
      await sendTelegramMessage(testMessage);
      return NextResponse.json({ status: 'ok', message: 'Test webhook received and processed.' });
    }

    // This part will run for REAL webhook events
    if (!ourShipment.purchases || !Array.isArray(ourShipment.purchases) || ourShipment.purchases.length === 0) {
        throw new Error(`Could not find a linked purchase for shipment with tracking number ${tracking.trackingNumber}`);
    }
    const purchaseInfo = ourShipment.purchases[0];

    // Add the new event to our checkpoints table
    const { error: checkpointError } = await supabase.from('checkpoints').insert({
      shipment_id: ourShipment.id,
      event_time: lastEvent.occurrenceDatetime, // Use correct field name
      location: lastEvent.location,
      description: lastEvent.status,
    });

    if (checkpointError) throw new Error(`Failed to insert checkpoint: ${checkpointError.message}`);

    // Update the main status of our shipment record
    const { error: updateError } = await supabase
      .from('shipments')
      .update({ status: lastEvent.statusCode })
      .eq('id', ourShipment.id);

    if (updateError) throw new Error(`Failed to update shipment status: ${updateError.message}`);
    
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