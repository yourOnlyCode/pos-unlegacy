import { useState } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import PaymentTerminal from './PaymentTerminal';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function POSInterface() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  // Sample products
  const products = [
    { id: '1', name: 'Coffee', price: 4.50 },
    { id: '2', name: 'Sandwich', price: 8.99 },
    { id: '3', name: 'Pastry', price: 3.25 },
  ];

  const addToCart = (product: typeof products[0]) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    setPaymentStatus(`Payment successful! ID: ${paymentId}`);
    setCart([]);
    setShowPayment(false);
  };

  const handlePaymentError = (error: string) => {
    setPaymentStatus(`Payment failed: ${error}`);
    setShowPayment(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        POS Terminal
      </Typography>

      {paymentStatus && (
        <Alert 
          severity={paymentStatus.includes('successful') ? 'success' : 'error'}
          sx={{ mb: 2 }}
          onClose={() => setPaymentStatus(null)}
        >
          {paymentStatus}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Products */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Products
          </Typography>
          <Grid container spacing={2}>
            {products.map(product => (
              <Grid item xs={6} key={product.id}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ height: 80, flexDirection: 'column' }}
                  onClick={() => addToCart(product)}
                >
                  <Typography variant="body2">{product.name}</Typography>
                  <Typography variant="h6">${product.price}</Typography>
                </Button>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Cart */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Cart
          </Typography>
          
          <List>
            {cart.map(item => (
              <ListItem key={item.id}>
                <ListItemText
                  primary={`${item.name} x${item.quantity}`}
                  secondary={`$${(item.price * item.quantity).toFixed(2)}`}
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h5" gutterBottom>
            Total: ${getTotal().toFixed(2)}
          </Typography>

          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={cart.length === 0}
            onClick={() => setShowPayment(true)}
            sx={{ mb: 2 }}
          >
            Checkout
          </Button>

          {showPayment && (
            <PaymentTerminal
              amount={getTotal()}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          )}
        </Grid>
      </Grid>
    </Box>
  );
}