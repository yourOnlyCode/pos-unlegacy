import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import InventoryManagement from './admin/InventoryManagement';
import OrdersList from './admin/OrdersList';
import BusinessSettings from './admin/BusinessSettings';
import QRCodeGenerator from './QRCodeGenerator';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminDashboard() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    if (!token) {
      navigate('/');
      return null;
    }
  const [tabValue, setTabValue] = useState(0);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (businessId) {
      fetchBusinessData();
    }
  }, [businessId]);

  const fetchBusinessData = async () => {
    try {
      const response = await fetch('/api/admin/tenants');
      const businesses = await response.json();
      const foundBusiness = businesses.find((b: any) => b.id === businessId);
      
      if (!foundBusiness) {
        setError('Business not found');
      } else {
        setBusiness(foundBusiness);
      }
    } catch (err) {
      setError('Failed to load business data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !business) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Business not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              {business.businessName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Business Phone: {business.phoneNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Business ID: {business.id}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Orders" />
          <Tab label="Inventory" />
          <Tab label="QR Code" />
          <Tab label="Settings" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <OrdersList businessId={business.id} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <InventoryManagement 
          businessId={business.id}
          initialMenu={business.menu}
          onMenuUpdate={fetchBusinessData}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <QRCodeGenerator 
          businessId={business.id}
          businessName={business.businessName}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <BusinessSettings businessId={business.id} />
      </TabPanel>
    </Container>
  );
}
