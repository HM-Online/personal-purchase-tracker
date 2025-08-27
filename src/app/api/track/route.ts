import { NextResponse } from 'next/server';

// This function will be called when our app sends a request to /api/track
export async function POST(request: Request) {
  try {
    // 1. Get the tracking number and courier from the request sent by our app
    const { tracking_number, courier } = await request.json();

    if (!tracking_number || !courier) {
      return NextResponse.json({ error: 'Tracking number and courier are required.' }, { status: 400 });
    }

    // 2. Securely get our secret API key from the environment variables
    const apiKey = process.env.SHIP24_API_KEY;

    if (!apiKey) {
      throw new Error('Ship24 API key is not configured.');
    }

    // 3. Make the secure request from our server to the Ship24 API
    const ship24Response = await fetch('https://api.ship24.com/public/v1/trackers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trackingNumber: tracking_number,
        courier: courier,
      }),
    });
    
    // Check if the request to Ship24 was successful
    if (!ship24Response.ok) {
        const errorData = await ship24Response.json();
        console.error('Ship24 API Error:', errorData);
        return NextResponse.json({ error: 'Failed to create tracker with Ship24.', details: errorData }, { status: ship24Response.status });
    }

    const data = await ship24Response.json();

    // 4. Send the data we received from Ship24 back to our app
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error in /api/track:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}