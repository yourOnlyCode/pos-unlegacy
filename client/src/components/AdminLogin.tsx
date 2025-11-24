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
    const bId = businessId.trim();
    const em = email.trim();
    const pw = password;
    if (mode === 'register' && (!bId || !em || !pw)) {
      setError('All fields required for registration');
      return;
    }
    if (mode === 'login' && (!em || !pw)) {
      setError('Email and password required');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId: bId, email: em, password: pw })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Registration failed');
          return;
        }
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('businessId', data.businessId);
        navigate(`/admin/${data.businessId}`);
      } else {
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
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleStripeRegister = async () => {
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
    setError(null);
    if (!businessId.trim() || !email.trim() || !password) {
      setError('Business ID, email, password required');
      return;
          <Button variant="contained" color="secondary" onClick={handleTestLogin} disabled={loading}>Test Admin Login</Button>
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/stripe/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: businessId.trim(), email: email.trim(), password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Stripe registration failed');
        return;
      }
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('businessId', data.businessId);
      localStorage.setItem('stripeAccountId', data.stripeAccountId);
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
          {mode === 'register' && (
            <TextField
              label="Business ID"
              fullWidth
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              autoFocus
              margin="normal"
            />
          )}
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
          />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? <CircularProgress size={22} /> : (mode === 'login' ? 'Login' : 'Register')}
          </Button>
        </Box>
        <Box mt={2} display="flex" justifyContent="space-between">
          <Button size="small" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} disabled={loading}>
            {mode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
          </Button>
        </Box>
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle2" gutterBottom>Stripe Integration</Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          Use these if your business has completed Stripe Connect onboarding.
        </Typography>
        <Box display="flex" flexDirection="column" gap={1}>
          <Button variant="outlined" onClick={handleStripeLogin} disabled={loading}>Stripe Login</Button>
          <Button variant="outlined" onClick={handleStripeRegister} disabled={loading}>Stripe Register</Button>
        </Box>
        <Box mt={3}>
          <Typography variant="caption" color="text.secondary">
            Haven't onboarded yet? Start at /onboarding to create a business.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default AdminLogin;