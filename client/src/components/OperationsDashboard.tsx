import { useState, useEffect, useRef } from 'react';
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
  Alert,
  IconButton
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

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

interface SwipeState {
  orderId: string;
  startX: number;
  currentX: number;
  isSwiping: boolean;
}

export default function OperationsDashboard() {
  const { businessId } = useParams<{ businessId: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swipeState, setSwipeState] = useState<SwipeState | null>(null);

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

  const handleTouchStart = (orderId: string, e: React.TouchEvent) => {
    setSwipeState({
      orderId,
      startX: e.touches[0].clientX,
      currentX: e.touches[0].clientX,
      isSwiping: true
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeState || !swipeState.isSwiping) return;
    
    setSwipeState({
      ...swipeState,
      currentX: e.touches[0].clientX
    });
  };

  const handleTouchEnd = (order: Order) => {
    if (!swipeState || !swipeState.isSwiping) return;

    const swipeDistance = swipeState.startX - swipeState.currentX;
    const threshold = 100; // Minimum swipe distance in pixels

    if (swipeDistance > threshold) {
      // Swiped left - advance to next status
      if (order.status === 'paid') {
        updateOrderStatus(order.id, 'preparing');
      } else if (order.status === 'preparing') {
        updateOrderStatus(order.id, 'complete');
      }
    }

    setSwipeState(null);
  };

  const getSwipeOffset = (orderId: string) => {
    if (!swipeState || swipeState.orderId !== orderId) return 0;
    const offset = swipeState.startX - swipeState.currentX;
    return Math.max(0, Math.min(offset, 150)); // Clamp between 0 and 150px
  };

  const getNextAction = (status: string) => {
    if (status === 'paid') return { label: 'Start Preparing', color: 'primary' };
    if (status === 'preparing') return { label: 'Mark Complete', color: 'success' };
    return null;
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
        activeOrders.map((order) => {
          const nextAction = getNextAction(order.status);
          const swipeOffset = getSwipeOffset(order.id);
          
          return (
            <Box 
              key={order.id} 
              sx={{ 
                position: 'relative', 
                mb: 3,
                overflow: 'hidden',
                borderRadius: 1
              }}
            >
              {/* Background action indicator */}
              {nextAction && (
                <Box
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 150,
                    bgcolor: nextAction.color === 'primary' ? 'primary.main' : 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    opacity: Math.min(swipeOffset / 100, 1),
                    transition: swipeState?.orderId === order.id ? 'none' : 'opacity 0.3s'
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <ChevronRightIcon sx={{ fontSize: 40 }} />
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      {nextAction.label}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Swipeable card */}
              <Card 
                sx={{ 
                  transform: `translateX(-${swipeOffset}px)`,
                  transition: swipeState?.orderId === order.id ? 'none' : 'transform 0.3s',
                  touchAction: 'pan-y',
                  cursor: 'grab',
                  '&:active': {
                    cursor: 'grabbing'
                  }
                }}
                onTouchStart={(e) => handleTouchStart(order.id, e)}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd(order)}
              >
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
                        fullWidth
                      >
                        Start Preparing
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button 
                        variant="contained" 
                        color="success"
                        onClick={() => updateOrderStatus(order.id, 'complete')}
                        fullWidth
                      >
                        Mark Complete
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          );
        })
      )}
    </Box>
  );
}