import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Alert, CircularProgress } from '@mui/material';
import OrderingPortal from './OrderingPortal';

interface Business {
  id: string;
  businessName: string;
  menu: Record<string, number>;
}

export default function PublicOrderPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!businessId) {
        setError('Business ID is required');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/business/${businessId}/public`);
        
        if (!response.ok) {
          throw new Error('Business not found');
        }

        const businessData = await response.json();
        setBusiness(businessData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load business');
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [businessId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !business) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">
          {error || 'Business not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <OrderingPortal 
      businessId={business.id} 
      businessName={business.businessName} 
    />
  );
}