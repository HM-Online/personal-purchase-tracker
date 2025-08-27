// This function will be our reusable message sender
export async function sendTelegramMessage(message: string) {
  // 1. Securely get the Bot Token and your Chat ID from the .env.local file
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // 2. Check if the secrets are actually there
  if (!botToken || !chatId) {
    console.error('Telegram Bot Token or Chat ID is not configured in .env.local');
    // Silently fail without crashing the app
    return;
  }

  // 3. This is the official URL for the Telegram Bot API's "sendMessage" method
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  // 4. We prepare the message payload
  const body = {
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML', // This allows us to use HTML tags like <b> for bold, <i> for italic
  };

  // 5. We send the message using the fetch API
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseData = await response.json();
    
    // Log the result for debugging purposes
    if (responseData.ok) {
      console.log('Telegram message sent successfully!');
    } else {
      console.error('Failed to send Telegram message:', responseData);
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}