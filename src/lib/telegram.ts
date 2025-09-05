export async function sendTelegramMessage(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Telegram Bot Token or Chat ID is not configured in .env.local');
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const body = {
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML',
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const responseData = await response.json();
    
    if (responseData.ok) {
      console.log('Telegram message sent successfully!');
    } else {
      console.error('Failed to send Telegram message:', responseData);
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}