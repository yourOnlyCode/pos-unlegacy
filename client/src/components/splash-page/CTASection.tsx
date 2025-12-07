import { Link } from 'react-router-dom';
import { Box, Container, Typography, Button } from '@mui/material';

interface CTASectionProps {
  onNavigate: (sectionId: string) => void;
}

export default function CTASection({ onNavigate }: CTASectionProps) {
  return (
    <Box
      sx={{
        bgcolor: '#2563eb',
        color: 'white',
        py: 8,
      }}
    >
      <Container maxWidth="md">
        <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 700 }}>
          Ready to get started?
        </Typography>
        <Typography variant="h6" align="center" sx={{ mb: 4, opacity: 0.9 }}>
          Join hundreds of businesses already using SWOOP
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            component={Link}
            to="/register"
            variant="contained"
            size="large"
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
            onClick={() => onNavigate('contact')}
            sx={{
              borderColor: 'white',
              color: 'white',
              '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              px: 4,
              py: 1.5,
            }}
          >
            Schedule Demo
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
