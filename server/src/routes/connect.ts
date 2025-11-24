import express from 'express';
import Stripe from 'stripe';
import { getTenantByPhone, updateTenant } from '../services/tenantService';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Create Stripe Connect account for business
router.post('/create-account', async (req, res) => {
  try {
    const { businessId, businessName, email, phoneNumber } = req.body;

    // Create Stripe Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: email,
      business_profile: {
        name: businessName,
        support_phone: phoneNumber,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Update tenant with Stripe account ID
    updateTenant(phoneNumber, { stripeAccountId: account.id });

    res.json({
      accountId: account.id,
      businessId,
      status: 'created'
    });

  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Create account link for onboarding
router.post('/create-account-link', async (req, res) => {
  try {
    const { accountId } = req.body;

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.BASE_URL || 'http://localhost:3000'}/connect/refresh`,
      return_url: `${process.env.BASE_URL || 'http://localhost:3000'}/connect/success`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });

  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Check account status
router.get('/account-status/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await stripe.accounts.retrieve(accountId);

    res.json({
      accountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements?.currently_due || []
    });

  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;