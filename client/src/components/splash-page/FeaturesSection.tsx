import { Container, Typography, Grid, Card, Box } from '@mui/material';

interface Feature {
  icon: JSX.Element;
  title: string;
  description: string;
}

interface FeaturesSectionProps {
  features: Feature[];
}

export default function FeaturesSection({ features }: FeaturesSectionProps) {
  return (
    <Container maxWidth="lg" id="features" sx={{ py: 10 }}>
      <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
        Why SWOOP?
      </Typography>
      <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
        Everything you need to modernize your ordering system
      </Typography>
      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                textAlign: 'center',
                p: 3,
                border: '1px solid #e2e8f0',
                '&:hover': {
                  boxShadow: 3,
                  borderColor: '#2563eb',
                },
                transition: 'all 0.3s',
              }}
            >
              <Box sx={{ color: '#2563eb', mb: 2 }}>{feature.icon}</Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {feature.description}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
