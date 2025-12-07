import { Link } from 'react-router-dom';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

interface PricingTier {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  popular: boolean;
}

interface PricingSectionProps {
  tiers: PricingTier[];
}

export default function PricingSection({ tiers }: PricingSectionProps) {
  return (
    <Box id="pricing" sx={{ bgcolor: '#f1f5f9', py: 10 }}>
      <Container maxWidth="lg">
        <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
          Simple, Transparent Pricing
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
          Choose the plan that's right for your business
        </Typography>
        <Grid container spacing={4} sx={{ pt: 2 }}>
          {tiers.map((tier, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                elevation={tier.popular ? 8 : 2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: tier.popular ? '2px solid #2563eb' : 'none',
                  overflow: 'visible',
                }}
              >
                {tier.popular && (
                  <Chip
                    label="MOST POPULAR"
                    color="primary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 1000,
                    }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1, p: 4 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    {tier.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 3 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {tier.price}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {tier.period}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    {tier.features.map((feature, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <CheckCircle sx={{ color: '#10b981', mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">{feature}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Button
                    component={Link}
                    to={tier.name === 'Expansion' ? '#contact' : '/register'}
                    variant={tier.popular ? 'contained' : 'outlined'}
                    fullWidth
                    size="large"
                    sx={{
                      mt: 'auto',
                      ...(tier.popular && {
                        bgcolor: '#2563eb',
                        '&:hover': { bgcolor: '#1d4ed8' },
                      }),
                    }}
                  >
                    {tier.cta}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
