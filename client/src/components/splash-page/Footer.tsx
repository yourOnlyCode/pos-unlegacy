import { Link } from 'react-router-dom';
import { Box, Container, Grid, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box sx={{ bgcolor: '#1e293b', color: 'white', py: 6 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
              SWOOP
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Modern SMS ordering for modern businesses
            </Typography>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Product
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <a href="#features" style={{ color: 'inherit', opacity: 0.8, textDecoration: 'none' }}>
                Features
              </a>
              <a href="#pricing" style={{ color: 'inherit', opacity: 0.8, textDecoration: 'none' }}>
                Pricing
              </a>
              <a href="#demo" style={{ color: 'inherit', opacity: 0.8, textDecoration: 'none' }}>
                Demo
              </a>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Company
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <a href="#contact" style={{ color: 'inherit', opacity: 0.8, textDecoration: 'none' }}>
                Contact
              </a>
              <Link to="/register" style={{ color: 'inherit', opacity: 0.8, textDecoration: 'none' }}>
                Sign Up
              </Link>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Legal
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <a href="#" style={{ color: 'inherit', opacity: 0.8, textDecoration: 'none' }}>
                Privacy
              </a>
              <a href="#" style={{ color: 'inherit', opacity: 0.8, textDecoration: 'none' }}>
                Terms
              </a>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Support
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <a href="#" style={{ color: 'inherit', opacity: 0.8, textDecoration: 'none' }}>
                Help Center
              </a>
              <a href="#contact" style={{ color: 'inherit', opacity: 0.8, textDecoration: 'none' }}>
                Contact Us
              </a>
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <Typography variant="body2" sx={{ opacity: 0.6 }}>
            © 2025 SWOOP. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
