import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  IconButton,
  Alert,
} from '@mui/material';

import { BusinessData } from '../../utils/api';
import { validateBusinessForm, generateBusinessId } from '../../utils/validation';

interface BusinessInfoFormProps {
  onSubmit: (data: BusinessData) => Promise<any>;
  loading: boolean;
  error: string | null;
}

export default function BusinessInfoForm({ onSubmit, loading, error }: BusinessInfoFormProps) {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [operationsPassword, setOperationsPassword] = useState('');
  const [confirmOperationsPassword, setConfirmOperationsPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (adminPassword !== confirmAdminPassword) {
      setValidationErrors(['Admin passwords do not match']);
      return;
    }
    
    if (operationsPassword !== confirmOperationsPassword) {
      setValidationErrors(['Operations passwords do not match']);
      return;
    }
    
    if (adminPassword.length < 6 || operationsPassword.length < 6) {
      setValidationErrors(['Passwords must be at least 6 characters']);
      return;
    }

    const businessData: BusinessData = {
      id: generateBusinessId(businessName),
      businessName: businessName.trim(),
      email: email.trim(),
      adminPassword: adminPassword,
      operationsPassword: operationsPassword,
      menu: {}, // Empty menu - will be added later in admin dashboard
    };

    // Validate form
    const errors = validateBusinessForm(businessData);
    if (errors.length > 0) {
      setValidationErrors(errors.map(e => e.message));
      return;
    }

    setValidationErrors([]);
    await onSubmit(businessData);
  };

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Business Information
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Tell us about your business to get started with SMS ordering
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {validationErrors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationErrors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            helperText="Used for Stripe account setup and notifications"
          />

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
            Admin Login
          </Typography>
          
          <TextField
            fullWidth
            label="Admin Password"
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            margin="normal"
            required
            helperText="For business management dashboard"
          />

          <TextField
            fullWidth
            label="Confirm Admin Password"
            type="password"
            value={confirmAdminPassword}
            onChange={(e) => setConfirmAdminPassword(e.target.value)}
            margin="normal"
            required
          />

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
            Operations Login
          </Typography>
          
          <TextField
            fullWidth
            label="Operations Password"
            type="password"
            value={operationsPassword}
            onChange={(e) => setOperationsPassword(e.target.value)}
            margin="normal"
            required
            helperText="For kitchen operations dashboard"
          />

          <TextField
            fullWidth
            label="Confirm Operations Password"
            type="password"
            value={confirmOperationsPassword}
            onChange={(e) => setConfirmOperationsPassword(e.target.value)}
            margin="normal"
            required
          />



          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Creating...' : 'Continue'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}