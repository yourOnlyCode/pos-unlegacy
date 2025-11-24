import { Box, Stepper, Step, StepLabel, Container } from '@mui/material';
import { useOnboarding } from '../../hooks/useOnboarding';
import BusinessInfoForm from './BusinessInfoForm';
import StripeSetup from './StripeSetup';
import OnboardingComplete from './OnboardingComplete';

const steps = ['Business Information', 'Payment Setup', 'Complete'];

export default function OnboardingFlow() {
  const { state, createBusiness, setupStripeAccount, resetOnboarding } = useOnboarding();

  const getActiveStep = () => {
    switch (state.step) {
      case 'business-info': return 0;
      case 'stripe-setup': return 1;
      case 'complete': return 2;
      default: return 0;
    }
  };

  const renderCurrentStep = () => {
    switch (state.step) {
      case 'business-info':
        return (
          <BusinessInfoForm
            onSubmit={createBusiness}
            loading={state.loading}
            error={state.error}
          />
        );
      
      case 'stripe-setup':
        return (
          <StripeSetup
            businessName={state.businessData?.businessName || ''}
            phoneNumber={state.phoneNumber || ''}
            onSetupStripe={setupStripeAccount}
            loading={state.loading}
            error={state.error}
          />
        );
      
      case 'complete':
        return (
          <OnboardingComplete
            businessName={state.businessData?.businessName || ''}
            phoneNumber={state.phoneNumber || ''}
            onStartOver={resetOnboarding}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Stepper activeStep={getActiveStep()} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {renderCurrentStep()}
    </Container>
  );
}