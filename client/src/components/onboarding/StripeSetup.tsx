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
} from '@mui/material';
import { CheckCircle, Phone, CreditCard, AccountBalance } from '@mui/icons-material';

interface StripeSetupProps {
  businessName: string;
  phoneNumber: string;
  onSetupStripe: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function StripeSetup({ 
  businessName, 
  phoneNumber, 
  onSetupStripe, 
  loading, 
  error 
}: StripeSetupProps) {
  return (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Payment Setup
        </Typography>
        
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Business Created Successfully!</Typography>
          <Typography variant="body2">
            Your SMS number: <strong>{phoneNumber}</strong>
          </Typography>
        </Alert>

        <Typography variant="body1" sx={{ mb: 3 }}>
          Now let's set up payments for <strong>{businessName}</strong>. 
          You'll be redirected to Stripe to complete a quick 5-minute setup.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="h6" sx={{ mb: 2 }}>
          What you'll need:
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <AccountBalance color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Bank Account Information"
              secondary="For receiving payments from customers"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <CreditCard color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Business Details"
              secondary="Tax ID, business address, and verification documents"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <Phone color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Contact Information"
              secondary="Phone number and email for account verification"
            />
          </ListItem>
        </List>

        <Alert severity="info" sx={{ my: 3 }}>
          <Typography variant="subtitle2">Secure & Trusted</Typography>
          <Typography variant="body2">
            Stripe is used by millions of businesses worldwide. Your information is encrypted and secure.
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={onSetupStripe}
            disabled={loading}
            sx={{ minWidth: 200 }}
          >
            {loading ? 'Setting up...' : 'Setup Stripe Account'}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
          This will open Stripe's secure onboarding in a new window
        </Typography>
      </CardContent>
    </Card>
  );
}