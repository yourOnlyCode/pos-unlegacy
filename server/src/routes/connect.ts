import express from 'express';
import Stripe from 'stripe';
import { getTenantByPhone, updateTenant } from '../services/tenantService';

const router = express.Router();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
    throw new Error('Stripe not configured - please set STRIPE_SECRET_KEY in .env');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-11-17.clover',
  });
}

// Create Stripe Connect account for business
router.post('/create-account', async (req, res) => {
  try {
    const { businessId, businessName, email, phoneNumber } = req.body;
    
    console.log('Creating Stripe account for:', { businessId, businessName, email });

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
      console.log('[TEST MODE] Skipping Stripe account creation - using mock account');
      
      // Mock Stripe account ID for testing
      const mockAccountId = `acct_test_${businessId}_${Date.now()}`;
      
      // Update tenant with mock Stripe account ID
      updateTenant(phoneNumber, { stripeAccountId: mockAccountId });
      
      return res.json({
        accountId: mockAccountId,
        businessId,
        status: 'created',
        testMode: true
      });
    }

    // Create real Stripe Express account
    const stripe = getStripe();
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
    
    console.log('Stripe account created:', account.id);

    res.json({
      accountId: account.id,
      businessId,
      status: 'created'
    });

  } catch (error) {
    console.error('Error creating Stripe account:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// Create account link for onboarding
router.post('/create-account-link', async (req, res) => {
  try {
    const { accountId } = req.body;
    
    console.log('Creating account link for:', accountId);

    // Check if in test mode
    if (!process.env.STRIPE_SECRET_KEY || 
        process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder' ||
        accountId.startsWith('acct_test_')) {
      console.log('[TEST MODE] Skipping Stripe onboarding - redirecting to success');
      
      // In test mode, skip Stripe onboarding and go straight to success
      const mockUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/connect/success`;
      return res.json({ url: mockUrl });
    }

    const stripe = getStripe();
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.BASE_URL || 'http://localhost:3000'}/connect/refresh`,
      return_url: `${process.env.BASE_URL || 'http://localhost:3000'}/connect/success`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });

  } catch (error) {
    console.error('Error creating account link:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// Check account status
router.get('/account-status/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    const stripe = getStripe();
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