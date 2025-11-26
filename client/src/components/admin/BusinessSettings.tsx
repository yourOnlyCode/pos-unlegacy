import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment
} from '@mui/material';

interface Settings {
  currency: string;
  timezone: string;
  autoReply: boolean;
  checkInEnabled?: boolean;
  checkInTimerMinutes?: number;
}

interface BusinessSettingsProps {
  businessId: string;
}

export default function BusinessSettings({ businessId }: BusinessSettingsProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [businessId]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/business/${businessId}/settings`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      } else {
        setError('Failed to load settings');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/business/${businessId}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Failed to save settings');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof Settings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !settings) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!settings) {
    return <Alert severity="warning">No settings found</Alert>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Business Settings
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            General Settings
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Currency"
              value={settings.currency}
              onChange={(e) => updateSetting('currency', e.target.value)}
              fullWidth
            />

            <TextField
              label="Timezone"
              value={settings.timezone}
              onChange={(e) => updateSetting('timezone', e.target.value)}
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoReply}
                  onChange={(e) => updateSetting('autoReply', e.target.checked)}
                />
              }
              label="Enable Auto-Reply"
            />
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Customer Check-In
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Automatically send a check-in message to customers after their order is paid to confirm they received it.
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.checkInEnabled || false}
                  onChange={(e) => updateSetting('checkInEnabled', e.target.checked)}
                />
              }
              label="Enable Check-In Timer"
            />

            {settings.checkInEnabled && (
              <TextField
                label="Check-In Timer"
                type="number"
                value={settings.checkInTimerMinutes || 15}
                onChange={(e) => updateSetting('checkInTimerMinutes', parseInt(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
                }}
                helperText="How long after payment to send the check-in message"
                inputProps={{ min: 1, max: 120 }}
              />
            )}

            <Alert severity="info">
              When enabled, customers will receive a message asking if they got their order. 
              If they respond positively (yes, good, received, etc.), the order status will automatically update to "complete".
            </Alert>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={fetchSettings}
          disabled={saving}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
}
