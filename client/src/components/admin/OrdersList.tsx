import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
} from '@mui/material';

interface Order {
  id: string;
  customerPhone: string;
  customerName?: string;
  tableNumber?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  status: string;
  createdAt: string;
}

interface OrdersListProps {
  businessId: string;
}

export default function OrdersList({ businessId }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0 });
  const [showCount, setShowCount] = useState(20);
  const [activeTab, setActiveTab] = useState<'today' | 'archive'>('today');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    // Refresh orders every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [businessId]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/business/${businessId}/orders`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setStats({
          totalOrders: data.totalOrders,
          totalRevenue: data.totalRevenue,
        });
      } else if (response.status === 401 || response.status === 403) {
        setError('Unauthorized. Please log in again.');
      } else {
        throw new Error('Failed to fetch orders');
      }
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'awaiting_payment':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // Helper functions
  const isToday = (date: string) => {
    const orderDate = new Date(date);
    const today = new Date();
    return (
      orderDate.getDate() === today.getDate() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear()
    );
  };

  const getDateKey = (date: string) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatDateDisplay = (dateKey: string) => {
    const [year, month, day] = dateKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Filter orders by tab
  const todayOrders = orders.filter(order => isToday(order.createdAt));
  const archivedOrders = orders.filter(order => !isToday(order.createdAt));
  
  // Group archived orders by date
  const ordersByDate = archivedOrders.reduce((acc, order) => {
    const dateKey = getDateKey(order.createdAt);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  const archiveDates = Object.keys(ordersByDate).sort((a, b) => b.localeCompare(a)); // Most recent first
  
  const displayOrders = activeTab === 'today' 
    ? todayOrders 
    : selectedDate 
      ? ordersByDate[selectedDate] || []
      : [];
  
  const visibleOrders = displayOrders.slice(0, showCount);
  const hasMoreOrders = displayOrders.length > showCount;

  const handleShowMore = () => {
    setShowCount(prev => prev + 20);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'today' | 'archive') => {
    setActiveTab(newValue);
    setShowCount(20);
    setSelectedDate(null);
  };

  const handleDateSelect = (dateKey: string) => {
    setSelectedDate(dateKey);
    setShowCount(20);
  };

  const handleBackToArchive = () => {
    setSelectedDate(null);
    setShowCount(20);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary">
              Total Orders
            </Typography>
            <Typography variant="h3">{stats.totalOrders}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary">
              Total Revenue
            </Typography>
            <Typography variant="h3" color="success.main">
              ${stats.totalRevenue.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label={`Today (${todayOrders.length})`} value="today" />
              <Tab label={`Archive (${archivedOrders.length})`} value="archive" />
            </Tabs>
          </Box>

          {/* Show date selector when in archive tab and no date selected */}
          {activeTab === 'archive' && !selectedDate && (
            <Box sx={{ mb: 3 }}>
              {archiveDates.length === 0 ? (
                <Alert severity="info">No archived orders</Alert>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    Select a Date
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {archiveDates.map(dateKey => (
                      <Button
                        key={dateKey}
                        variant="outlined"
                        onClick={() => handleDateSelect(dateKey)}
                        sx={{ 
                          justifyContent: 'space-between',
                          textAlign: 'left',
                          px: 2,
                          py: 1.5
                        }}
                      >
                        <Typography variant="body1">
                          {formatDateDisplay(dateKey)}
                        </Typography>
                        <Chip 
                          label={`${ordersByDate[dateKey].length} orders`}
                          size="small"
                          color="primary"
                        />
                      </Button>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          )}

          {/* Show orders table when viewing today or a selected archive date */}
          {(activeTab === 'today' || (activeTab === 'archive' && selectedDate)) && (
            <>
              {activeTab === 'archive' && selectedDate && (
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="outlined" onClick={handleBackToArchive}>
                    ← Back to Archive
                  </Button>
                  <Typography variant="h6">
                    {formatDateDisplay(selectedDate)}
                  </Typography>
                </Box>
              )}

              {displayOrders.length === 0 ? (
                <Alert severity="info">
                  {activeTab === 'today' ? 'No orders today' : 'No orders on this date'}
                </Alert>
              ) : (
                <>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Order ID</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Items</TableCell>
                          <TableCell>Total</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {visibleOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          #{order.id.slice(-8)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.customerName || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.tableNumber ? `Table ${order.tableNumber}` : order.customerPhone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {order.items.map((item, idx) => (
                            <Typography key={idx} variant="body2">
                              {item.quantity}x {item.name}
                            </Typography>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="bold">
                          ${order.total.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatStatus(order.status)}
                          color={getStatusColor(order.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(order.createdAt).toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
                  {hasMoreOrders && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Button variant="outlined" onClick={handleShowMore}>
                        Show More ({displayOrders.length - showCount} remaining)
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
