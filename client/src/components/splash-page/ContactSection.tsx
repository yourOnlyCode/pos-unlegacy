import { Container, Typography, Grid, Paper, Button, Box } from '@mui/material';

export default function ContactSection() {
  return (
    <Container maxWidth="md" id="contact" sx={{ py: 10 }}>
      <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
        Get in Touch
      </Typography>
      <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
        Have questions? We'd love to hear from you.
      </Typography>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>
              Name *
            </Typography>
            <input
              type="text"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                fontSize: '16px',
              }}
              placeholder="Your name"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>
              Email *
            </Typography>
            <input
              type="email"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                fontSize: '16px',
              }}
              placeholder="your@email.com"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Business Name
            </Typography>
            <input
              type="text"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                fontSize: '16px',
              }}
              placeholder="Your business"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Message *
            </Typography>
            <textarea
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                fontSize: '16px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
              placeholder="Tell us about your needs..."
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              sx={{
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' },
                py: 1.5,
              }}
            >
              Send Message
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Prefer email? Reach us at{' '}
          <a href="mailto:hello@swooporders.com" style={{ color: '#2563eb' }}>
            hello@swooporders.com
          </a>
        </Typography>
      </Box>
    </Container>
  );
}
