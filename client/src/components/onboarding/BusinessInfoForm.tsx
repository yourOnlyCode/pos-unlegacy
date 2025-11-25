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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setValidationErrors(['Passwords do not match']);
      return;
    }
    
    if (password.length < 6) {
      setValidationErrors(['Password must be at least 6 characters']);
      return;
    }

    const businessData: BusinessData = {
      id: generateBusinessId(businessName),
      businessName: businessName.trim(),
      email: email.trim(),
      password: password,
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

          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            helperText="Minimum 6 characters"
          />

          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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