export interface BusinessData {
  id: string;
  businessName: string;
  email: string;
  adminPassword: string;
  operationsPassword: string;
  menu?: Record<string, number>;
}

export interface OnboardingResponse {
  phoneNumber: string;
  nextStep: {
    action: string;
    endpoint: string;
    data: any;
  };
}

export interface StripeAccountResponse {
  accountId: string;
  businessId: string;
  status: string;
}

export interface AccountLinkResponse {
  url: string;
}

export interface AccountStatus {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements: string[];
}

export const api = {
  // Create business tenant
  createBusiness: async (data: BusinessData): Promise<OnboardingResponse> => {
    const response = await fetch('/api/admin/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create business');
    }
    
    return response.json();
  },

  // Create Stripe Connect account
  createStripeAccount: async (data: any): Promise<StripeAccountResponse> => {
    const response = await fetch('/api/connect/create-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create Stripe account');
    }
    
    return response.json();
  },

  // Create account onboarding link
  createAccountLink: async (accountId: string): Promise<AccountLinkResponse> => {
    const response = await fetch('/api/connect/create-account-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create account link');
    }
    
    return response.json();
  },

  // Check account status
  getAccountStatus: async (accountId: string): Promise<AccountStatus> => {
    const response = await fetch(`/api/connect/account-status/${accountId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get account status');
    }
    
    return response.json();
  },
};