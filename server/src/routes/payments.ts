import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Create payment intent for in-person transaction
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      payment_method_types: ['card_present'],
      capture_method: 'manual', // For in-person, capture after confirmation
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