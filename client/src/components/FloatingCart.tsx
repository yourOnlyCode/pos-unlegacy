import { Box, Chip, IconButton, Collapse, Avatar, Paper, Typography, Fade, Divider, List, ListItem, ListItemText } from '@mui/material';
import { Close, ShoppingCart, Remove, Add } from '@mui/icons-material';
import { useState, useEffect } from 'react';

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  emoji: string;
  instructions?: string;
}

interface FloatingCartProps {
  items: CartItem[];
  onRemoveItem: (itemId: string) => void;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const itemEmojis: Record<string, string> = {
  coffee: '☕',
  latte: '☕',
  cappuccino: '☕',
  sandwich: '🥪',
  bagel: '🥯',
  pastry: '🧁',
  muffin: '🧁',
};
export default function FloatingCart({ items, onRemoveItem, expanded: externalExpanded, onExpandedChange }: FloatingCartProps) {
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [displayItems, setDisplayItems] = useState<CartItem[]>(items);
  const [internalExpanded, setInternalExpanded] = useState(false);
  
  const expanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
  const setExpanded = onExpandedChange || setInternalExpanded;

  useEffect(() => {
    setDisplayItems(items);
  }, [items]);

  const handleRemove = (itemId: string) => {
    setRemovingItems(prev => new Set(prev).add(itemId));
    setTimeout(() => {
      onRemoveItem(itemId);
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }, 200);
  };
  if (displayItems.length === 0) return null;

  const totalItems = displayItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Fade in={expanded} timeout={300}>
        <Paper
          sx={{
            position: 'fixed',
            top: 120,
            left: '50%',
            transform: expanded ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0.9)',
            zIndex: 999,
            width: '90vw',
            maxWidth: 400,
            maxHeight: '60vh',
            overflowY: 'auto',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            opacity: expanded ? 1 : 0,
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'rgba(0, 0, 0, 0.87)' }}>
                Your Cart ({totalItems} item{totalItems !== 1 ? 's' : ''})
              </Typography>
              <IconButton
                size="small"
                onClick={() => setExpanded(false)}
                sx={{
                  color: 'rgba(0, 0, 0, 0.6)',
                  '&:hover': {
                    color: 'error.main',
                    transform: 'rotate(90deg)',
                    transition: 'all 0.3s ease',
                  },
                }}
              >
                <Close />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <List sx={{ p: 0 }}>
              {displayItems.map((item, index) => (
                <ListItem
                  key={item.id}
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    px: 0,
                    py: 1.5,
                    borderBottom: index < displayItems.length - 1 ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                      <Box
                        sx={{
                          fontSize: '1.75rem',
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(0, 115, 200, 0.1)',
                          borderRadius: 2,
                        }}
                      >
                        {itemEmojis[item.name] || '🍽️'}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            color: 'rgba(0, 0, 0, 0.87)',
                          }}
                        >
                          {item.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.85rem' }}>
                          Quantity: {item.quantity}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemove(item.id)}
                      sx={{
                        color: 'rgba(0, 0, 0, 0.4)',
                        '&:hover': {
                          color: 'error.main',
                          background: 'rgba(244, 67, 54, 0.08)',
                        },
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                  {item.instructions && (
                    <Box
                      sx={{
                        mt: 1,
                        p: 1.5,
                        background: 'rgba(255, 235, 59, 0.15)',
                        borderLeft: '3px solid #FFC107',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'rgba(0, 0, 0, 0.7)', mb: 0.5 }}>
                        Special Instructions:
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.8)', fontStyle: 'italic' }}>
                        {item.instructions}
                      </Typography>
                    </Box>
                  )}
                </ListItem>
              ))}
            </List>
          </Box>
        </Paper>
      </Fade>
    </>
  );
}