import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';

interface NavigationProps {
  onNavigate: (sectionId: string) => void;
}

export default function Navigation({ onNavigate }: NavigationProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar position="sticky" sx={{ bgcolor: 'white', color: 'text.primary', boxShadow: 1 }}>
      <Toolbar>
        <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700, color: '#2563eb' }}>
          SWOOP
        </Typography>
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 3, mr: 3 }}>
            <Button color="inherit" onClick={() => onNavigate('features')}>
              Features
            </Button>
            <Button color="inherit" onClick={() => onNavigate('pricing')}>
              Pricing
            </Button>
            <Button color="inherit" onClick={() => onNavigate('contact')}>
              Contact
            </Button>
          </Box>
        )}
        <Button component={Link} to="/login" variant="outlined" sx={{ mr: 1 }}>
          Sign In
        </Button>
        <Button
          component={Link}
          to="/register"
          variant="contained"
          sx={{
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' },
          }}
        >
          Get Started
        </Button>
        {isMobile && (
          <IconButton color="inherit">
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
}
