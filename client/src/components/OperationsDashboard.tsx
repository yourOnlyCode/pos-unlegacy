import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Alert
} from '@mui/material';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  modifications?: string[];
}

interface Order {
  id: string;
  customerName?: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  tableNumber?: string;
}

export default function OperationsDashboard() {
  const { businessId } = useParams<{ businessId: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token || !businessId) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`/api/admin/business/${businessId}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchOrders(); // Refresh orders
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'awaiting_payment': return 'warning';
      case 'paid': return 'info';
      case 'preparing': return 'primary';
      case 'complete': return 'success';
      default: return 'default';
    }
  };

  if (loading) return <Typography>Loading orders...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const activeOrders = orders.filter(order => 
    ['paid', 'preparing'].includes(order.status)
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Operations Dashboard
      </Typography>
      
      <Typography variant="h6" sx={{ mb: 2 }}>
        Active Orders ({activeOrders.length})
      </Typography>

      {activeOrders.length === 0 ? (
        <Alert severity="info">No active orders</Alert>
      ) : (
        activeOrders.map((order) => (
          <Card key={order.id} sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6">
                    Order #{order.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.customerName || 'Customer'} • {order.customerPhone}
                    {order.tableNumber && ` • Table ${order.tableNumber}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip 
                    label={order.status.replace('_', ' ').toUpperCase()} 
                    color={getStatusColor(order.status)}
                  />
                  <Typography variant="h6" color="primary">
                    ${order.total.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="center">Qty</TableCell>
                      <TableCell>Special Instructions</TableCell>
                      <TableCell align="right">Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {item.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={item.quantity} size="small" />
                        </TableCell>
                        <TableCell>
                          {item.modifications && item.modifications.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {item.modifications.map((mod, modIndex) => (
                                <Chip 
                                  key={modIndex}
                                  label={mod}
                                  size="small"
                                  variant="outlined"
                                  color="secondary"
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Standard preparation
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                {order.status === 'paid' && (
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                  >
                    Start Preparing
                  </Button>
                )}
                {order.status === 'preparing' && (
                  <Button 
                    variant="contained" 
                    color="success"
                    onClick={() => updateOrderStatus(order.id, 'complete')}
                  >
                    Mark Complete
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}