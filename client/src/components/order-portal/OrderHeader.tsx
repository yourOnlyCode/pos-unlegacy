import { Box, Paper, Typography, Chip } from '@mui/material';
import { Restaurant } from '@mui/icons-material';

interface OrderHeaderProps {
  businessName: string;
}

export default function OrderHeader({ businessName }: OrderHeaderProps) {
  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Restaurant color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
          {businessName}
        </Typography>
        <Chip label="Online Ordering" size="medium" color="success" />
      </Box>
    </Paper>
  );
}