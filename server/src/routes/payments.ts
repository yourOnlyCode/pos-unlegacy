import express from 'express';
import Stripe from 'stripe';

const router = express.Router();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
    throw new Error('Stripe not configured - please set STRIPE_SECRET_KEY in .env');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-11-17.clover',
  });
}

// Create payment intent for SMS orders with Stripe Connect
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', orderId, businessPhone, customerPhone, orderDetails, stripeAccountId, customerName, tableNumber } = req.body;

    if (!stripeAccountId) {
      return res.status(400).json({ error: 'There was an error with the business payment portal' });
    }

    // Calculate platform fee (0.25% of order)
    const platformFeeAmount = Math.round(amount * 0.0025 * 100); // 0.25%

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      payment_method_types: ['card'],
      application_fee_amount: platformFeeAmount,
      transfer_data: {
        destination: stripeAccountId,
      },
      metadata: {
        orderId: orderId || 'unknown',
        businessPhone: businessPhone || '',
        customerPhone: customerPhone || '',
        orderDetails: orderDetails || '',
        customerName: customerName || '',
        tableNumber: tableNumber || ''
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
      platformFee: platformFeeAmount / 100
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// Create payment intent for in-person transactions
router.post('/create-terminal-payment', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      payment_method_types: ['card_present'],
      capture_method: 'manual',
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Capture payment after card is processed
router.post('/capture-payment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.capture(id);
    
    res.json({ 
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;