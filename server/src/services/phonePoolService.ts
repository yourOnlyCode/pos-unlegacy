import twilio from 'twilio';

// Only initialize Twilio if credentials are properly configured
let client: twilio.Twilio | null = null;
try {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (accountSid && authToken && accountSid.startsWith('AC')) {
    client = twilio(accountSid, authToken);
  }
} catch (error) {
  console.log('⚠️  Twilio initialization failed in phonePoolService:', error);
}

interface PhoneNumber {
  number: string;
  businessId: string;
  purchasedAt: Date;
  twilioSid: string;
}

// Track purchased numbers (in production, store in database)
const purchasedNumbers = new Map<string, PhoneNumber>();

export async function assignPhoneNumber(businessId: string): Promise<string | null> {
  // Check if we're in test mode (no real Twilio credentials)
  const isTestMode = !process.env.TWILIO_ACCOUNT_SID || 
                     process.env.TWILIO_ACCOUNT_SID === 'test_account_sid' ||
                     process.env.TWILIO_ACCOUNT_SID.startsWith('test_');
  
  if (isTestMode) {
    // Generate a mock phone number for testing
    return generateMockPhoneNumber(businessId);
  }
  
  // Production: Always purchase new number for each business
  return await purchaseNewNumber(businessId);
}

export async function releasePhoneNumber(businessId: string): Promise<boolean> {
  for (const [number, info] of purchasedNumbers) {
    if (info.businessId === businessId) {
      try {
        // Release the number back to Twilio (stops monthly charges)
        if (client) {
          await client.incomingPhoneNumbers(info.twilioSid).remove();
        }
        purchasedNumbers.delete(number);
        console.log(`Released phone number ${number} for ${businessId}`);
        return true;
      } catch (error) {
        console.error(`Failed to release ${number}:`, error);
        return false;
      }
    }
  }
  return false;
}

export function getPurchasedNumbers(): Array<{number: string, businessId: string, purchasedAt: Date}> {
  return Array.from(purchasedNumbers.values())
    .map(info => ({ 
      number: info.number, 
      businessId: info.businessId,
      purchasedAt: info.purchasedAt
    }));
}

export function getNumberByBusiness(businessId: string): string | null {
  for (const [number, info] of purchasedNumbers) {
    if (info.businessId === businessId) {
      return number;
    }
  }
  return null;
}

function generateMockPhoneNumber(businessId: string): string {
  // Generate a unique mock phone number for testing
  const timestamp = Date.now().toString().slice(-8);
  const mockNumber = `+1555${timestamp}`;
  
  // Track mock number
  purchasedNumbers.set(mockNumber, {
    number: mockNumber,
    businessId,
    purchasedAt: new Date(),
    twilioSid: `PN_mock_${businessId}_${timestamp}`
  });
  
  console.log(`[TEST MODE] Generated mock phone number ${mockNumber} for ${businessId}`);
  return mockNumber;
}

async function purchaseNewNumber(businessId: string): Promise<string | null> {
  if (!client) {
    console.log('Twilio not configured, returning mock number');
    return generateMockPhoneNumber(businessId);
  }
  
  try {
    // Search for available numbers
    const numbers = await client.availablePhoneNumbers('US').local.list({
      smsEnabled: true,
      limit: 1
    });

    if (numbers.length === 0) {
      console.error('No available phone numbers');
      return null;
    }

    // Purchase the number
    const purchasedNumber = await client.incomingPhoneNumbers.create({
      phoneNumber: numbers[0].phoneNumber,
      smsUrl: `${process.env.BASE_URL || 'https://your-domain.com'}/api/sms/webhook`,
      smsMethod: 'POST'
    });

    // Track purchased number
    purchasedNumbers.set(purchasedNumber.phoneNumber, {
      number: purchasedNumber.phoneNumber,
      businessId,
      purchasedAt: new Date(),
      twilioSid: purchasedNumber.sid
    });

    console.log(`Purchased and assigned ${purchasedNumber.phoneNumber} to ${businessId}`);
    return purchasedNumber.phoneNumber;

  } catch (error) {
    console.error('Failed to purchase phone number:', error);
    return null;
  }
}

async function configureWebhook(phoneNumber: string): Promise<void> {
  if (!client) return;
  
  try {
    // Find the Twilio phone number resource
    const numbers = await client.incomingPhoneNumbers.list({
      phoneNumber: phoneNumber
    });

    if (numbers.length > 0) {
      // Update webhook URL
      await client.incomingPhoneNumbers(numbers[0].sid).update({
        smsUrl: `${process.env.BASE_URL || 'https://your-domain.com'}/api/sms/webhook`,
        smsMethod: 'POST'
      });
      console.log(`Configured webhook for ${phoneNumber}`);
    }
  } catch (error) {
    console.error(`Failed to configure webhook for ${phoneNumber}:`, error);
  }
}