import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [businessId, setBusinessId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (mode === 'register') {
      // Redirect to onboarding flow for new businesses
      navigate('/onboarding');
      return;
    }
    
    // Login flow
    const em = email.trim();
    const pw = password;
    if (!em || !pw) {
      setError('Email and password required');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em, password: pw })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('businessId', data.businessId);
      navigate(`/admin/${data.businessId}`);
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: businessId.trim() || undefined })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Test login failed');
        return;
      }
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('businessId', data.businessId);
      if (data.stripeAccountId) localStorage.setItem('stripeAccountId', data.stripeAccountId);
      navigate(`/admin/${data.businessId}`);
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleStripeLogin = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/stripe/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Stripe login failed');
        return;
      }
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('businessId', data.businessId);
      if (data.stripeAccountId) localStorage.setItem('stripeAccountId', data.stripeAccountId);
      navigate(`/admin/${data.businessId}`);
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" width="100%" sx={{ bgcolor: 'background.default' }}>
      <Paper elevation={6} sx={{ p: 5, width: '100%', maxWidth: 440, mx: 2 }}>
        <Typography variant="h5" gutterBottom>
          {mode === 'login' ? 'Admin Login' : 'Create Admin Account'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {mode === 'login' ? 'Access your business dashboard.' : 'Register an admin account for an existing business.'}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          {mode === 'login' && (
            <>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                autoFocus
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
              />
            </>
          )}
          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? <CircularProgress size={22} /> : (mode === 'login' ? 'Login' : 'Start Onboarding')}
          </Button>
        </Box>
        <Box mt={2} display="flex" justifyContent="space-between">
          <Button size="small" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} disabled={loading}>
            {mode === 'login' ? 'New Business? Register' : 'Have an account? Login'}
          </Button>
        </Box>
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle2" gutterBottom>Development</Typography>
        <Box display="flex" flexDirection="column" gap={1}>
          <TextField
            label="Business ID (optional)"
            size="small"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
          />
          <Button variant="outlined" onClick={handleTestLogin} disabled={loading}>Test Login</Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default AdminLogin;