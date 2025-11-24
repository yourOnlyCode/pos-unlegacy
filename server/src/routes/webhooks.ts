import express from 'express';
import Stripe from 'stripe';
import { getTenantByPhone } from '../services/tenantService';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Stripe webhook for payment confirmations
router.post('/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.log('Webhook signature verification failed:', err);
    return res.status(400).send('Webhook Error');
  }

  // Handle successful payment
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    // Get order details from metadata
    const orderId = paymentIntent.metadata.orderId;
    const businessPhone = paymentIntent.metadata.businessPhone;
    const customerPhone = paymentIntent.metadata.customerPhone;
    const orderDetails = paymentIntent.metadata.orderDetails;

    if (orderId && businessPhone && customerPhone && orderDetails) {
      // Notify business of paid order
      notifyBusinessOfOrder(businessPhone, orderId, orderDetails, customerPhone);
      
      // Send confirmation to customer
      sendCustomerConfirmation(customerPhone, orderId);
    }
  }

  res.json({ received: true });
});

async function notifyBusinessOfOrder(
  businessPhone: string, 
  orderId: string, 
  orderDetails: string,
  customerPhone: string
) {
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  const tenant = getTenantByPhone(businessPhone);
  if (!tenant) return;

  const message = `🔔 NEW PAID ORDER #${orderId}

${orderDetails}

Customer: ${customerPhone}
Status: PAID ✅

Reply "ready" when order is complete.`;

  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: businessPhone // Send TO the business owner's phone
    });
    console.log(`Order notification sent to business: ${businessPhone}`);
  } catch (error) {
    console.error('Failed to notify business:', error);
  }
}

async function sendCustomerConfirmation(customerPhone: string, orderId: string) {
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  const message = `✅ Payment confirmed! 

Order #${orderId} is being prepared.
You'll receive an SMS when it's ready for pickup.

Thank you for your order!`;

  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: customerPhone
    });
  } catch (error) {
    console.error('Failed to send customer confirmation:', error);
  }
}

export default router;