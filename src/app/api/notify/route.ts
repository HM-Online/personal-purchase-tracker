import { sendTelegramMessage } from '@/lib/telegram';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    await sendTelegramMessage(message);

    return NextResponse.json({ success: true, message: 'Notification sent.' }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/notify:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}