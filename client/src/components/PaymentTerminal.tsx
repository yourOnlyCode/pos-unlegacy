import { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Card, 
  CardContent,
  CircularProgress,
  Alert 
} from '@mui/material';

interface PaymentTerminalProps {
  amount: number;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
}

export default function PaymentTerminal({ 
  amount, 
  onPaymentSuccess, 
  onPaymentError 
}: PaymentTerminalProps) {
  const [processing, setProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<string | null>(null);

  const createPaymentIntent = async () => {
    try {
      setProcessing(true);
      
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const { clientSecret, id } = await response.json();
      setPaymentIntent(id);
      
      // Simulate card processing (in production, connects to Stripe Terminal)
      setTimeout(() => {
        capturePayment(id);
      }, 2000);
      
    } catch (error) {
      onPaymentError('Failed to create payment intent');
      setProcessing(false);
    }
  };

  const capturePayment = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/capture-payment/${paymentId}`, {
        method: 'POST',
      });

      const result = await response.json();
      
      if (result.status === 'succeeded') {
        onPaymentSuccess(paymentId);
      } else {
        onPaymentError('Payment failed');
      }
    } catch (error) {
      onPaymentError('Failed to process payment');
    } finally {
      setProcessing(false);
      setPaymentIntent(null);
    }
  };

  return (
    <Card sx={{ minWidth: 300 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Payment Terminal
        </Typography>
        
        <Typography variant="h4" color="primary" gutterBottom>
          ${amount.toFixed(2)}
        </Typography>

        {processing ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>
              {paymentIntent ? 'Processing card...' : 'Creating payment...'}
            </Typography>
          </Box>
        ) : (
          <Button 
            variant="contained" 
            size="large" 
            fullWidth
            onClick={createPaymentIntent}
            disabled={amount <= 0}
          >
            Process Payment
          </Button>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          Demo mode - connects to Stripe Terminal hardware in production
        </Alert>
      </CardContent>
    </Card>
  );
}