import { Link } from 'react-router-dom';
import { Box, Container, Typography, Button, Grid, Paper, Avatar, Chip } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';

interface Business {
  name: string;
  type: string;
  icon: JSX.Element;
  color: string;
  orders: string;
  description: string;
}

interface HeroSectionProps {
  currentBusiness: Business;
  businesses: Business[];
  currentBusinessIndex: number;
  onNavigate: (sectionId: string) => void;
}

export default function HeroSection({
  currentBusiness,
  businesses,
  currentBusinessIndex,
  onNavigate,
}: HeroSectionProps) {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        pt: 8,
        pb: 12,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h2" gutterBottom sx={{ fontWeight: 700 }}>
              Orders Made Simple.
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
              Turn SMS messages into orders. No app required for your customers.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{
                  bgcolor: 'white',
                  color: '#2563eb',
                  '&:hover': { bgcolor: '#f1f5f9' },
                  px: 4,
                  py: 1.5,
                }}
              >
                Start Free Trial
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => onNavigate('demo')}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                  px: 4,
                  py: 1.5,
                }}
              >
                Watch Demo
              </Button>
            </Box>
            <Typography variant="body2" sx={{ mt: 3, opacity: 0.8 }}>
              No credit card required • 14-day free trial • Cancel anytime
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={8}
              sx={{
                p: 4,
                borderRadius: 3,
                bgcolor: 'white',
                color: 'text.primary',
                transition: 'transform 0.3s',
                '&:hover': { transform: 'scale(1.02)' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: currentBusiness.color,
                    width: 60,
                    height: 60,
                    mr: 2,
                  }}
                >
                  {currentBusiness.icon}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {currentBusiness.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentBusiness.type}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                "{currentBusiness.description}"
              </Typography>
              <Chip label={`${currentBusiness.orders} orders processed`} color="primary" size="small" />
              <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: 'center' }}>
                {businesses.map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: index === currentBusinessIndex ? '#2563eb' : '#cbd5e1',
                      transition: 'all 0.3s',
                    }}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
