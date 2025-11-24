import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import POSInterface from './components/POSInterface';
import PaymentPage from './components/PaymentPage';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import ConnectSuccess from './components/ConnectSuccess';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Container maxWidth="lg">
          <Routes>
            <Route path="/" element={<POSInterface />} />
            <Route path="/pay/:orderId" element={<PaymentPage />} />
            <Route path="/onboarding" element={<OnboardingFlow />} />
            <Route path="/connect/success" element={<ConnectSuccess />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;