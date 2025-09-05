import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { tracking_number, courier } = await request.json();

    if (!tracking_number || !courier) {
      return NextResponse.json({ error: 'Tracking number and courier are required.' }, { status: 400 });
    }

    const apiKey = process.env.SHIP24_API_KEY;

    if (!apiKey) {
      throw new Error('Ship24 API key is not configured.');
    }

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
    
    if (!ship24Response.ok) {
        const errorData = await ship24Response.json();
        console.error('Ship24 API Error:', errorData);
        return NextResponse.json({ error: 'Failed to create tracker with Ship24.', details: errorData }, { status: ship24Response.status });
    }

    const data = await ship24Response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error in /api/track:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}