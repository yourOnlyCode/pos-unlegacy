import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  CircularProgress,
  Alert,
  TextField,
  IconButton
} from '@mui/material';
import { Edit as EditIcon, Check as CheckIcon } from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface Order {
  id: string;
  items: Array<{ name: string; quantity: number; price: number; modifications?: string[] }>;
  total: number;
  status: string;
  customerPhone: string;
  businessPhone?: string;
  stripeAccountId?: string;
  customerName?: string;
}

function CheckoutForm({ order, onSuccess }: { order: Order; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setPaying(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/pay/${order.id}/success`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setPaying(false);
    } else {
      // Mark order as paid
      try {
        await fetch(`/api/sms/order/${order.id}/paid`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        onSuccess();
      } catch (err) {
        setError('Payment succeeded but order update failed');
        setPaying(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <PaymentElement />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={!stripe || paying}
        sx={{ mb: 2 }}
      >
        {paying ? (
          <>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            Processing Payment...
          </>
        ) : (
          `Pay $${order.total.toFixed(2)}`
        )}
      </Button>

      <Typography variant="body2" color="text.secondary" textAlign="center">
        Secure payment powered by Stripe
      </Typography>
    </form>
  );
}

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    // Load customer name from localStorage
    const savedName = localStorage.getItem('customerName');
    if (savedName) {
      setCustomerName(savedName);
    }
  }, []);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  const handleNameChange = (newName: string) => {
    setCustomerName(newName);
    localStorage.setItem('customerName', newName);
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    if (customerName.trim() && order) {
      // Update the order with the new name
      setOrder({ ...order, customerName: customerName.trim() });
    }
  };

  const fetchOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/sms/order/${id}`);
      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
        // Set customer name from order or localStorage
        const savedName = localStorage.getItem('customerName');
        if (orderData.customerName) {
          setCustomerName(orderData.customerName);
          localStorage.setItem('customerName', orderData.customerName);
        } else if (savedName) {
          setCustomerName(savedName);
        }
        // Create payment intent
        await createPaymentIntent(orderData);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const createPaymentIntent = async (orderData: Order) => {
    try {
      const orderDetails = orderData.items
        .map(item => {
          const mods = item.modifications ? ` (${item.modifications.join(', ')})` : '';
          return `${item.quantity}x ${item.name}${mods} ($${(item.price * item.quantity).toFixed(2)})`;
        })
        .join('\n');

      const paymentResponse = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: orderData.total,
          orderId: orderData.id,
          businessPhone: orderData.businessPhone || '',
          customerPhone: orderData.customerPhone,
          orderDetails: `${orderDetails}\nTotal: $${orderData.total.toFixed(2)}`,
          stripeAccountId: orderData.stripeAccountId
        }),
      });

      const data = await paymentResponse.json();
      
      if (!paymentResponse.ok) {
        console.error('Payment intent creation failed:', data);
        setError(data.error || 'Failed to initialize payment');
        return;
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error('Payment intent error:', err);
      setError('Failed to initialize payment');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (success) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="success" sx={{ mb: 3 }}>
          Payment successful! You'll receive an SMS confirmation shortly.
        </Alert>
        <Typography variant="h5">Thank you for your order!</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Order #{order?.id}
        </Typography>
      </Box>
    );
  }

  if (!order || !clientSecret) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Order not found</Alert>
      </Box>
    );
  }

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <Box sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Complete Your Order
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Order #{order.id}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            {isEditingName ? (
              <>
                <TextField
                  size="small"
                  fullWidth
                  value={customerName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter your name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleNameSave();
                    }
                  }}
                />
                <IconButton size="small" onClick={handleNameSave} color="primary">
                  <CheckIcon />
                </IconButton>
              </>
            ) : (
              <>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Customer Name
                  </Typography>
                  <Typography variant="body1">
                    {customerName || 'Not provided'}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => setIsEditingName(true)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Box>
          
          <List>
            {order.items.map((item, index) => (
              <Box key={index}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary={`${item.quantity}x ${item.name}`}
                    secondary={`$${(item.price * item.quantity).toFixed(2)}`}
                  />
                </ListItem>
                {item.modifications && item.modifications.length > 0 && (
                  <Box sx={{ ml: 2, mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Notes: {item.modifications.join(', ')}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h5" color="primary">
            Total: ${order.total.toFixed(2)}
          </Typography>
        </CardContent>
      </Card>

      <Elements stripe={stripePromise} options={stripeOptions}>
        <CheckoutForm order={order} onSuccess={() => setSuccess(true)} />
      </Elements>
    </Box>
  );
}