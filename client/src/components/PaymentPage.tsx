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
  Alert
} from '@mui/material';

interface Order {
  id: string;
  items: Array<{ name: string; quantity: number; price: number; modifications?: string[] }>;
  total: number;
  status: string;
  customerPhone: string;
  businessPhone?: string;
  stripeAccountId?: string;
}

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/sms/order/${id}`);
      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    if (!order) return;
    
    setPaying(true);
    try {
      // Format order details for business notification
      const orderDetails = order.items
        .map(item => {
          const mods = item.modifications ? ` (${item.modifications.join(', ')})` : '';
          return `${item.quantity}x ${item.name}${mods} ($${(item.price * item.quantity).toFixed(2)})`;
        })
        .join('\n');

      // Create payment intent with order metadata
      const paymentResponse = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: order.total,
          orderId: order.id,
          businessPhone: order.businessPhone || '',
          customerPhone: order.customerPhone,
          orderDetails: `${orderDetails}\nTotal: $${order.total.toFixed(2)}`,
          stripeAccountId: order.stripeAccountId
        }),
      });

      const { clientSecret } = await paymentResponse.json();

      // Simulate payment processing (in production, use Stripe Elements)
      setTimeout(async () => {
        try {
          // In production, Stripe webhook will handle this automatically
          setSuccess(true);
        } catch (err) {
          setError('Payment failed');
        } finally {
          setPaying(false);
        }
      }, 2000);

    } catch (err) {
      setError('Payment failed');
      setPaying(false);
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

  if (!order) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Order not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Complete Your Order
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Order #{order.id}
          </Typography>
          
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

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={processPayment}
        disabled={paying || order.status === 'paid'}
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
        You'll receive an SMS confirmation after payment
      </Typography>
    </Box>
  );
}