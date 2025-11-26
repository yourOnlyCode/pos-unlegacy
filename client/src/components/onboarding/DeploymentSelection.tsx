import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import { Cloud, Memory } from '@mui/icons-material';

interface DeploymentSelectionProps {
  onSubmit: (deploymentType: 'cloud' | 'edge') => void;
  loading: boolean;
  error: string | null;
}

export default function DeploymentSelection({ onSubmit, loading, error }: DeploymentSelectionProps) {
  const [deploymentType, setDeploymentType] = useState<'cloud' | 'edge'>('cloud');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(deploymentType);
  };

  return (
    <Card sx={{ maxWidth: 700, mx: 'auto' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Choose Your Deployment
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Select how you want to process your SMS orders
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <RadioGroup 
            value={deploymentType} 
            onChange={(e) => setDeploymentType(e.target.value as 'cloud' | 'edge')}
          >
            <Card 
              variant="outlined" 
              sx={{ 
                mb: 2, 
                cursor: 'pointer',
                border: deploymentType === 'cloud' ? 2 : 1,
                borderColor: deploymentType === 'cloud' ? 'primary.main' : 'divider'
              }}
              onClick={() => setDeploymentType('cloud')}
            >
              <CardContent>
                <FormControlLabel 
                  value="cloud" 
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Cloud color="primary" />
                      <Typography variant="h6">Cloud Hosting</Typography>
                      <Chip label="Ready Instantly" color="success" size="small" />
                    </Box>
                  }
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 1 }}>
                  Orders processed on our secure cloud servers
                </Typography>
                <Stack direction="row" spacing={1} sx={{ ml: 4, mt: 1 }}>
                  <Chip label="$49/month" variant="outlined" />
                  <Chip label="No setup fee" variant="outlined" />
                  <Chip label="Instant activation" variant="outlined" />
                </Stack>
              </CardContent>
            </Card>

            <Card 
              variant="outlined" 
              sx={{ 
                cursor: 'pointer',
                border: deploymentType === 'edge' ? 2 : 1,
                borderColor: deploymentType === 'edge' ? 'primary.main' : 'divider'
              }}
              onClick={() => setDeploymentType('edge')}
            >
              <CardContent>
                <FormControlLabel 
                  value="edge" 
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Memory color="primary" />
                      <Typography variant="h6">Local Device</Typography>
                      <Chip label="Faster & Private" color="primary" size="small" />
                    </Box>
                  }
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 1 }}>
                  Raspberry Pi device processes orders locally with Ollama LLM
                </Typography>
                <Stack direction="row" spacing={1} sx={{ ml: 4, mt: 1 }}>
                  <Chip label="$29/month" variant="outlined" />
                  <Chip label="$120 setup" variant="outlined" />
                  <Chip label="3-5 day shipping" variant="outlined" />
                </Stack>
              </CardContent>
            </Card>
          </RadioGroup>

          {deploymentType === 'edge' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                What's included with your local device:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Pre-configured Raspberry Pi 4 with Ollama</li>
                <li>Faster order processing (local Llama 3.2 model)</li>
                <li>Your data stays on-premises</li>
                <li>Works offline during internet outages</li>
                <li>Remote support and automatic updates</li>
              </ul>
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Processing...' : 'Continue'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}