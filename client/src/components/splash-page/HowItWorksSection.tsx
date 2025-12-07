import { Container, Typography, Grid, Box } from '@mui/material';

const STEPS = [
  {
    step: '1',
    title: 'Customer Texts Order',
    description: 'Customer sends a message like "2 coffees, 1 sandwich for Sarah"',
  },
  {
    step: '2',
    title: 'AI Parses & Confirms',
    description: 'Our AI understands the order and sends a payment link',
  },
  {
    step: '3',
    title: 'Order Goes to Kitchen',
    description: 'Payment confirmed, order appears on your dashboard instantly',
  },
];

export default function HowItWorksSection() {
  return (
    <Container maxWidth="lg" sx={{ py: 10 }} id="demo">
      <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
        How It Works
      </Typography>
      <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
        Three simple steps to transform your ordering process
      </Typography>
      <Grid container spacing={4}>
        {STEPS.map((step, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: '#2563eb',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  fontSize: '2rem',
                  fontWeight: 700,
                }}
              >
                {step.step}
              </Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                {step.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {step.description}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
