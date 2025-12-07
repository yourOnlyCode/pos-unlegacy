import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import POSInterface from './components/POSInterface';
import AdminLogin from './components/AdminLogin';
import PaymentPage from './components/PaymentPage';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import ConnectSuccess from './components/ConnectSuccess';
import AdminDashboard from './components/AdminDashboard';
import OperationsDashboard from './components/OperationsDashboard';
import OperationsLogin from './components/OperationsLogin';
import PublicOrderPage from './components/PublicOrderPage';
import SplashPage from './components/SplashPage';

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
          <Routes>
          <Route path="/" element={<SplashPage />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/register" element={<OnboardingFlow />} />
          <Route 
            path="/pos" 
            element={
              <Container maxWidth="lg">
                <POSInterface />
              </Container>
            } 
          />
          <Route 
            path="/pay/:orderId" 
            element={
              <Container maxWidth="lg">
                <PaymentPage />
              </Container>
            } 
          />
            <Route path="/onboarding" element={<OnboardingFlow />} />
          <Route 
            path="/connect/success" 
            element={
              <Container maxWidth="lg">
                <ConnectSuccess />
              </Container>
            } 
          />
          <Route 
            path="/admin/:businessId" 
            element={
              <Container maxWidth="lg">
                <AdminDashboard />
              </Container>
            } 
          />
          <Route 
            path="/operations-login" 
            element={
              <Container maxWidth="lg">
                <OperationsLogin />
              </Container>
            } 
          />
          <Route 
            path="/operations/:businessId" 
            element={
              <Container maxWidth="lg">
                <OperationsDashboard />
              </Container>
            } 
          />
          <Route 
            path="/order/:businessId" 
            element={
              <Container maxWidth="lg">
                <PublicOrderPage />
              </Container>
            } 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;