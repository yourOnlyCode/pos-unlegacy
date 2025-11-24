import { useState } from 'react';
import { api, BusinessData } from '../utils/api';

export interface OnboardingState {
  step: 'business-info' | 'stripe-setup' | 'complete';
  loading: boolean;
  error: string | null;
  businessData: BusinessData | null;
  phoneNumber: string | null;
  stripeAccountId: string | null;
}

export const useOnboarding = () => {
  const [state, setState] = useState<OnboardingState>({
    step: 'business-info',
    loading: false,
    error: null,
    businessData: null,
    phoneNumber: null,
    stripeAccountId: null,
  });

  const createBusiness = async (businessData: BusinessData) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await api.createBusiness(businessData);
      
      setState(prev => ({
        ...prev,
        businessData,
        phoneNumber: response.phoneNumber,
        step: 'stripe-setup',
        loading: false,
      }));
      
      return response;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: (error as Error).message,
        loading: false,
      }));
      throw error;
    }
  };

  const setupStripeAccount = async () => {
    if (!state.businessData || !state.phoneNumber) {
      throw new Error('Business data not available');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Create Stripe account
      const accountResponse = await api.createStripeAccount({
        businessId: state.businessData.id,
        businessName: state.businessData.businessName,
        email: state.businessData.email,
        phoneNumber: state.phoneNumber,
      });

      // Create onboarding link
      const linkResponse = await api.createAccountLink(accountResponse.accountId);
      
      setState(prev => ({
        ...prev,
        stripeAccountId: accountResponse.accountId,
        loading: false,
      }));

      // Redirect to Stripe onboarding
      window.location.href = linkResponse.url;
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: (error as Error).message,
        loading: false,
      }));
      throw error;
    }
  };

  const completeOnboarding = () => {
    setState(prev => ({ ...prev, step: 'complete' }));
  };

  const resetOnboarding = () => {
    setState({
      step: 'business-info',
      loading: false,
      error: null,
      businessData: null,
      phoneNumber: null,
      stripeAccountId: null,
    });
  };

  return {
    state,
    createBusiness,
    setupStripeAccount,
    completeOnboarding,
    resetOnboarding,
  };
};