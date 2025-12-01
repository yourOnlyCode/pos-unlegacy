import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  Avatar,
  Chip,
  Alert,
} from '@mui/material';
import { Send, Restaurant, Person } from '@mui/icons-material';
import SwipableMenu from './SwipableMenu';
import FloatingCart from './FloatingCart';
import { CartItem, addToCart, removeFromCart, formatCartOrder } from '../ordering-helpers/cartHelpers';
import { Message, createCustomerMessage, createSystemMessage, createErrorMessage } from '../ordering-helpers/messageHelpers';
import { sendChatMessage, fetchBusinessMenu, fetchNotifications } from '../ordering-helpers/apiHelpers';



interface OrderingPortalProps {
  businessId: string;
  businessName: string;
}

interface BusinessMenu {
  [key: string]: number;
}



export default function OrderingPortal({ businessId, businessName }: OrderingPortalProps) {
  const [sessionId] = useState(() => `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Welcome to ${businessName}! Here's our menu:`,
      sender: 'system',
      timestamp: new Date(),
      type: 'info'
    }
  ]);
  const menuSentRef = useRef(false);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [businessMenu, setBusinessMenu] = useState<BusinessMenu>({});
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`/api/business/${businessId}/public`);
        const business = await response.json();
        setBusinessMenu(business.menu || {});

        // Auto-send menu after fetching
        if (!menuSentRef.current) {
          menuSentRef.current = true;
          const menuResponse = await fetch('/api/orders/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessId,
              message: 'menu',
              customerPhone: sessionId,
            }),
          });

          const result = await menuResponse.json();
          const menuMessage: Message = {
            id: '2',
            text: result.response,
            sender: 'system',
            timestamp: new Date(),
            type: 'info'
          };

          setMessages(prev => [...prev, menuMessage]);
        }
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      }
    };
    fetchMenu();
  }, [businessId, sessionId]);

  // Poll for notifications
  useEffect(() => {
    const pollNotifications = async () => {
      try {
        const response = await fetch(`/api/orders/notifications/${sessionId}`);
        const result = await response.json();

        if (result.notifications && result.notifications.length > 0) {
          result.notifications.forEach((notification: any) => {
            const systemMessage: Message = {
              id: notification.id,
              text: notification.message,
              sender: 'system',
              timestamp: new Date(notification.timestamp),
              type: 'info'
            };
            setMessages(prev => [...prev, systemMessage]);
          });
        }
      } catch (error) {
        // Silently fail - notifications are not critical
      }
    };

    const interval = setInterval(pollNotifications, 2000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const customerMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'customer',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, customerMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch('/api/orders/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          message: inputText,
          customerPhone: sessionId,
        }),
      });

      const result = await response.json();

      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: result.response,
        sender: 'system',
        timestamp: new Date(),
        type: result.type || 'info',
        paymentLink: result.paymentLink,
        orderId: result.orderId,
        total: result.total,
        orderItems: result.orderItems,
      };

      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, something went wrong. Please try again.',
        sender: 'system',
        timestamp: new Date(),
        type: 'info',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAddToOrder = (item: string, quantity: number) => {
    setCartItems(prev => addToCart(prev, item, quantity));
  };

  const handleRemoveFromCart = (itemName: string) => {
    setCartItems(prev => removeFromCart(prev, itemName));
  };

  const handleSendCart = async () => {
    if (cartItems.length === 0) return;

    const orderText = formatCartOrder(cartItems);
    setCartItems([]);
    setInputText('');
    
    setMessages(prev => [...prev, createCustomerMessage(orderText)]);
    
    setLoading(true);
    try {
      const result = await sendChatMessage(businessId, orderText, sessionId);
      const systemMessage = createSystemMessage(result.response, result.type, {
        paymentLink: result.paymentLink,
        orderId: result.orderId,
        total: result.total,
        orderItems: result.orderItems,
      });
      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      setMessages(prev => [...prev, createErrorMessage()]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <FloatingCart items={cartItems} onRemoveItem={handleRemoveFromCart} />
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Restaurant color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>{businessName}</Typography>
          <Chip label="Online Ordering" size="medium" color="success" />
        </Box>
      </Paper>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
        <List sx={{ p: 0 }}>
          {messages.map((message) => (
            <ListItem
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.sender === 'customer' ? 'flex-end' : 'flex-start',
                mb: 1,
                p: 0,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 1,
                  maxWidth: '90%',
                  width: '100%',
                  flexDirection: message.sender === 'customer' ? 'row-reverse' : 'row',
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: message.sender === 'customer' ? 'primary.main' : 'grey.500',
                  }}
                >
                  {message.sender === 'customer' ? <Person /> : <Restaurant />}
                </Avatar>

                <Paper
                  elevation={1}
                  sx={{
                    p: { xs: 2.5, sm: 3 },
                    bgcolor: message.sender === 'customer' ? 'primary.main' : 'white',
                    color: message.sender === 'customer' ? 'white' : 'text.primary',
                    borderRadius: 2,
                    width: '100%',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    ...(message.type === 'payment' && {
                      border: '2px solid',
                      borderColor: 'success.main',
                    }),
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      lineHeight: 1.5
                    }}
                  >
                    {message.text}
                  </Typography>

                  {message.sender === 'system' && message.text.includes('Menu:') && (
                    <Box sx={{ mt: 2, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                      <SwipableMenu
                        menu={businessMenu}
                        onAddToOrder={handleAddToOrder}
                      />
                    </Box>
                  )}

                  {message.type === 'payment' && message.paymentLink && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="large"
                        onClick={() => window.open(message.paymentLink, '_blank')}
                        sx={{
                          fontSize: { xs: '1rem', sm: '1.1rem' },
                          py: { xs: 1.5, sm: 2 },
                          px: { xs: 3, sm: 4 },
                          fontWeight: 600,
                          mb: 1,
                        }}
                      >
                        💳 Pay ${message.total?.toFixed(2)}
                      </Button>

                      <Box sx={{ mt: 1 }}>
                        <Button
                          variant="outlined"
                          size="medium"
                          onClick={async () => {
                            // Restore order items to cart
                            if (message.orderItems) {
                              const itemEmojis: Record<string, string> = {
                                coffee: '☕',
                                latte: '☕',
                                cappuccino: '☕',
                                sandwich: '🥪',
                                bagel: '🥯',
                                pastry: '🧁',
                                muffin: '🧁',
                              };

                              const restoredItems = message.orderItems.map(item => ({
                                name: item.name,
                                quantity: item.quantity,
                                emoji: itemEmojis[item.name] || '🍽️'
                              }));

                              setCartItems(restoredItems);
                            }

                            // Send menu request automatically
                            setLoading(true);
                            try {
                              const response = await fetch('/api/orders/chat', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  businessId,
                                  message: 'menu',
                                  customerPhone: sessionId,
                                }),
                              });

                              const result = await response.json();

                              const systemMessage: Message = {
                                id: (Date.now() + 1).toString(),
                                text: result.response,
                                sender: 'system',
                                timestamp: new Date(),
                                type: result.type || 'info',
                              };

                              setMessages(prev => [...prev, systemMessage]);
                            } catch (error) {
                              console.error('Failed to fetch menu:', error);
                            } finally {
                              setLoading(false);
                            }
                          }}
                          sx={{
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            py: { xs: 1, sm: 1.2 },
                            px: { xs: 2, sm: 3 },
                          }}
                        >
                          🛍️ Add More Items
                        </Button>
                      </Box>
                    </Box>
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 1,
                      opacity: 0.7,
                      fontSize: { xs: '0.8rem', sm: '0.85rem' },
                    }}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Paper>
              </Box>
            </ListItem>
          ))}
        </List>
        <div ref={messagesEndRef} />
      </Box>

      {/* Cart Actions */}
      {cartItems.length > 0 && (
        <Paper elevation={2} sx={{ p: 2, bgcolor: 'transparent', border: 'none', boxShadow: 'none' }}>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Button
              onClick={handleSendCart}
              sx={{
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '20px',
                color: 'rgba(0, 0, 0, 0.8)',
                fontSize: '0.95rem',
                fontWeight: 700,
                px: 3,
                py: 1.5,
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.4)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.25), 0 6px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                },
                '&:active': {
                  transform: 'translateY(0px)',
                }
              }}
            >
              🚀 Send Cart ({cartItems.length} items)
            </Button>
            <Button
              onClick={() => setCartItems([])}
              sx={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '20px',
                color: 'rgba(0, 0, 0, 0.7)',
                fontSize: '0.9rem',
                fontWeight: 600,
                px: 2.5,
                py: 1.5,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.25)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              ✕ Clear
            </Button>
          </Box>
        </Paper>
      )}

      {/* Input */}
      <Paper elevation={3} sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Type your order here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            variant="outlined"
            size="medium"
            sx={{
              '& .MuiInputBase-input': {
                fontSize: { xs: '1rem', sm: '1.1rem' },
                padding: { xs: '12px 14px', sm: '14px 16px' }
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || loading}
            sx={{
              minWidth: { xs: 56, sm: 64 },
              height: { xs: 48, sm: 56 },
              '& .MuiSvgIcon-root': {
                fontSize: { xs: '1.2rem', sm: '1.4rem' }
              }
            }}
          >
            <Send />
          </Button>
        </Box>

        <Alert severity="info" sx={{ mt: 2, py: 1 }}>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            {cartItems.length > 0
              ? `Cart: ${cartItems.length} items ready to send`
              : 'Try: "2 coffee, 1 sandwich" or "menu" to see options'
            }
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
}