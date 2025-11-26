import express from 'express';

const router = express.Router();

// Mock SMS storage to simulate SMS responses
const mockSmsResponses: Array<{ to: string; message: string; timestamp: Date }> = [];

// Test endpoint - order processing now handled on frontend
router.post('/sms', (req, res) => {
  const { message, customerPhone, businessPhone } = req.body;

  if (!message || !customerPhone || !businessPhone) {
    return res.status(400).json({ 
      error: 'Missing required fields: message, customerPhone, businessPhone' 
    });
  }

  console.log(`\n📱 SMS received from ${customerPhone} to ${businessPhone}`);
  console.log(`Message: "${message}"\n`);
  console.log(`⚠️ Order processing moved to frontend - use client-side functions\n`);

  // Return minimal response - processing should be done on frontend
  res.json({
    success: true,
    message: 'SMS received - process on frontend using imported functions',
    data: { message, customerPhone, businessPhone }
  });
});

// SMS log endpoints - now handled on frontend
router.get('/sms-log', (req, res) => {
  res.json({ message: 'SMS logging moved to frontend' });
});

router.delete('/sms-log', (req, res) => {
  res.json({ message: 'SMS logging moved to frontend' });
});

export default router;
