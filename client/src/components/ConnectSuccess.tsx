import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';

export default function ConnectSuccess() {
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    // In a real app, you'd verify the account setup was successful
    // and update the business status in your database
    
    const accountId = searchParams.get('account');
    if (accountId) {
      console.log('Stripe account setup completed:', accountId);
      
      // Redirect to completion page after a brief delay
      setTimeout(() => {
        window.location.href = '/onboarding?step=complete';
      }, 2000);
    }
  }, [searchParams]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '50vh',
      textAlign: 'center'
    }}>
      <CircularProgress sx={{ mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Completing setup...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Your Stripe account has been configured successfully
      </Typography>
    </Box>
  );
}