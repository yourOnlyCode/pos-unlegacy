import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress, Tabs, Tab } from '@mui/material';
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

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
      <Paper elevation={4} sx={{ p: 4, width: 400 }}>
        <Tabs value={mode} onChange={(_, v) => setMode(v)} sx={{ mb: 2 }}>
          <Tab label="Login" value="login" />
          <Tab label="Register" value="register" />
        </Tabs>
        <Typography variant="h5" gutterBottom>{mode === 'login' ? 'Admin Login' : 'Create Admin Account'}</Typography>
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