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
import { Add, Delete } from '@mui/icons-material';
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
  const [menuItems, setMenuItems] = useState<Array<{ name: string; price: string }>>([
    { name: '', price: '' }
  ]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const addMenuItem = () => {
    setMenuItems([...menuItems, { name: '', price: '' }]);
  };

  const removeMenuItem = (index: number) => {
    if (menuItems.length > 1) {
      setMenuItems(menuItems.filter((_, i) => i !== index));
    }
  };

  const updateMenuItem = (index: number, field: 'name' | 'price', value: string) => {
    const updated = [...menuItems];
    updated[index][field] = value;
    setMenuItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert menu items to object
    const menu: Record<string, number> = {};
    menuItems.forEach(item => {
      if (item.name.trim() && item.price.trim()) {
        menu[item.name.trim()] = parseFloat(item.price);
      }
    });

    const businessData: BusinessData = {
      id: generateBusinessId(businessName),
      businessName: businessName.trim(),
      email: email.trim(),
      menu,
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

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Menu Items
          </Typography>

          {menuItems.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <TextField
                label="Item Name"
                value={item.name}
                onChange={(e) => updateMenuItem(index, 'name', e.target.value)}
                sx={{ flex: 2 }}
              />
              <TextField
                label="Price"
                type="number"
                inputProps={{ step: '0.01', min: '0' }}
                value={item.price}
                onChange={(e) => updateMenuItem(index, 'price', e.target.value)}
                sx={{ flex: 1 }}
              />
              <IconButton
                onClick={() => removeMenuItem(index)}
                disabled={menuItems.length === 1}
                color="error"
              >
                <Delete />
              </IconButton>
            </Box>
          ))}

          <Button
            startIcon={<Add />}
            onClick={addMenuItem}
            variant="outlined"
            sx={{ mb: 3 }}
          >
            Add Menu Item
          </Button>

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