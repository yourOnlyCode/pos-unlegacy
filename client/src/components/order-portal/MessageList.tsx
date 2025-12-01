import { Box, List, ListItem, Avatar, Paper, Typography, Button } from '@mui/material';
import { Restaurant, Person } from '@mui/icons-material';
import { Message } from '../../ordering-helpers/messageHelpers';
import SwipableMenu from '../SwipableMenu';

interface MessageListProps {
  messages: Message[];
  businessMenu: Record<string, { price: number; image?: string } | number>;
  onAddToOrder: (item: string, quantity: number) => void;
  businessId: string;
  sessionId: string;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setCartItems: React.Dispatch<React.SetStateAction<any[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export default function MessageList({ 
  messages, 
  businessMenu, 
  onAddToOrder, 
  businessId, 
  sessionId, 
  setMessages, 
  setCartItems, 
  setLoading,
  messagesEndRef
}: MessageListProps) {
  
  const isMenuDisabled = (() => {
    const nameQuestionIndex = messages.findIndex(msg => msg.text.includes("What's your name?"));
    if (nameQuestionIndex === -1) return false;
    const hasCustomerResponseAfter = messages.slice(nameQuestionIndex + 1).some(msg => msg.sender === 'customer');
    return !hasCustomerResponseAfter;
  })();

  return (
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
                      onAddToOrder={onAddToOrder}
                      disabled={isMenuDisabled}
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
  );
}