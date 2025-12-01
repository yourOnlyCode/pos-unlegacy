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

interface Message {
  id: string;
  text: string;
  sender: 'customer' | 'system';
  timestamp: Date;
  type?: 'order' | 'payment' | 'info';
}

interface OrderingPortalProps {
  businessId: string;
  businessName: string;
}

interface BusinessMenu {
  [key: string]: number;
}

export default function OrderingPortal({ businessId, businessName }: OrderingPortalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Welcome to ${businessName}! Type your order or "menu" to see available items.`,
      sender: 'system',
      timestamp: new Date(),
      type: 'info'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [businessMenu, setBusinessMenu] = useState<BusinessMenu>({});
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
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      }
    };
    fetchMenu();
  }, [businessId]);

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
          customerPhone: 'web-customer', // Placeholder for web customers
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
    const orderText = `${quantity} ${item}`;
    setInputText(orderText);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
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
            Try: "2 coffee, 1 sandwich" or "menu" to see options
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
}