import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function sendSMS(from: string, to: string, message: string): Promise<boolean> {
  const isTestMode = !process.env.TWILIO_ACCOUNT_SID || 
                     process.env.TWILIO_ACCOUNT_SID === 'test_account_sid' ||
                     process.env.TWILIO_ACCOUNT_SID.startsWith('test_');
  
  if (isTestMode) {
    console.log(`[TEST MODE] SMS from ${from} to ${to}: ${message}`);
    return true;
  }

  try {
    await client.messages.create({
      from,
      to,
      body: message
    });
    console.log(`SMS sent from ${from} to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}