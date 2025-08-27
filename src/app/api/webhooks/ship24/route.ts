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

  // --- Security Check: Verify the signature ---
  const signature = request.headers.get('ship24-signature');
  const requestBody = await request.text();
  
  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(requestBody);
  const expectedSignature = hmac.digest('hex');

  if (signature !== expectedSignature) {
    console.warn('Invalid Ship24 webhook signature received.');
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }
  // --- End of Security Check ---

  try {
    const event = JSON.parse(requestBody);
    const tracking = event.data.tracking;
    const lastEvent = tracking.events[tracking.events.length - 1];

    console.log(`Received webhook for tracker: ${tracking.trackingNumber}, Status: ${lastEvent.status}`);

    // Find the corresponding shipment in our database
    const { data: ourShipment, error: findError } = await supabase
      .from('shipments')
      .select('id, purchase_id, purchases(store_name, order_id)')
      .eq('tracking_number', tracking.trackingNumber)
      .single();

    if (findError || !ourShipment) {
      console.error('Could not find matching shipment in DB:', findError);
      return NextResponse.json({ status: 'ok', message: 'Shipment not found in our DB.' });
    }

    // --- THE CRITICAL FIX IS HERE ---
    // Verify that 'purchases' is a non-empty array before accessing it
    if (!ourShipment.purchases || !Array.isArray(ourShipment.purchases) || ourShipment.purchases.length === 0) {
      throw new Error(`Could not find a linked purchase for shipment with tracking number ${tracking.trackingNumber}`);
    }
    // Correctly access the single purchase object from the array
    const purchaseInfo = ourShipment.purchases[0];
    // --- END OF CRITICAL FIX ---


    // Add the new event to our checkpoints table
    const { error: checkpointError } = await supabase.from('checkpoints').insert({
      shipment_id: ourShipment.id,
      event_time: lastEvent.datetime,
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
    
    // Format and send a Telegram notification for the update
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