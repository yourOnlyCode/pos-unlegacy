import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { 
  CheckCircle, 
  Sms, 
  CreditCard, 
  Phone,
  Restaurant,
  Launch 
} from '@mui/icons-material';

interface OnboardingCompleteProps {
  businessName: string;
  phoneNumber: string;
  onStartOver: () => void;
}

export default function OnboardingComplete({ 
  businessName, 
  phoneNumber, 
  onStartOver 
}: OnboardingCompleteProps) {
  const sampleOrder = `2 coffee, 1 sandwich`;
  
  return (
    <Card sx={{ maxWidth: 700, mx: 'auto' }}>
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Welcome to SMS Ordering!
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {businessName} is now ready to receive orders
          </Typography>
        </Box>

        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="subtitle1">🎉 Setup Complete!</Typography>
          <Typography variant="body2">
            Your customers can now text orders to <strong>{phoneNumber}</strong>
          </Typography>
        </Alert>

        <Typography variant="h6" sx={{ mb: 2 }}>
          How it works:
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <Sms color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="1. Customer texts their order"
              secondary={`Example: "${sampleOrder}"`}
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <CreditCard color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="2. System sends payment link"
              secondary="Customer pays securely via Stripe"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <Restaurant color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="3. You receive paid order notification"
              secondary="Only confirmed, paid orders are sent to you"
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>
          Next steps:
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<Phone />}
            href={`sms:${phoneNumber}?body=${encodeURIComponent(sampleOrder)}`}
          >
            Test SMS Ordering
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Launch />}
            href="https://dashboard.stripe.com"
            target="_blank"
          >
            View Stripe Dashboard
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">💡 Pro Tips</Typography>
          <Typography variant="body2" component="div">
            • Share your SMS number: {phoneNumber}<br/>
            • Customers can text "menu" to see available items<br/>
            • You'll only receive orders after payment is confirmed<br/>
            • Reply "ready" to notify customers when orders are complete
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            href="/"
          >
            Go to Dashboard
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            onClick={onStartOver}
          >
            Add Another Business
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}