import { Box, Paper, Button, Avatar, Chip, Collapse, IconButton } from '@mui/material';
import { ShoppingCart, Close } from '@mui/icons-material';
import { useState } from 'react';

interface CartItem {
  name: string;
  quantity: number;
  emoji: string;
  instructions?: string;
}

interface CartActionsProps {
  cartItemsCount: number;
  onSendCart: () => void;
  onClearCart: () => void;
  disabled?: boolean;
  cartItems: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onCartClick: () => void;
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

export default function CartActions({ 
  cartItemsCount, 
  onSendCart, 
  onClearCart, 
  disabled = false,
  cartItems,
  onRemoveItem,
  onCartClick
}: CartActionsProps) {
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

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

  if (cartItemsCount === 0) return null;

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Paper elevation={0} sx={{ p: 0, bgcolor: 'white', border: 'none', boxShadow: 'none' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, py: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Button
            onClick={onSendCart}
            disabled={disabled}
            sx={{
              flexShrink: 0,
              opacity: disabled ? 0.5 : 1,
              pointerEvents: disabled ? 'none' : 'auto',
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
            🚀 Send Cart ({cartItemsCount} items)
          </Button>
          
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              onClick={onCartClick}
              sx={{
                background: 'rgba(0, 115, 200, 0.1)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                width: 36,
                height: 36,
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.3), 0 6px 20px rgba(0, 0, 0, 0.15)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
                '& .MuiSvgIcon-root': {
                  color: 'rgba(0, 115, 200, 0.8)',
                  filter: 'drop-shadow(0 1px 2px rgba(255, 255, 255, 0.5))',
                },
              }}
            >
              <ShoppingCart fontSize="medium" />
            </Avatar>
            {totalItems > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                  color: 'white',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(238, 90, 111, 0.4)',
                  border: '1.5px solid white',
                }}
              >
                {totalItems}
              </Box>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            alignItems: 'center',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          {cartItems.map((item, index) => {
            const isRemoving = removingItems.has(item.id);
            return (
              <Collapse 
                in={!isRemoving} 
                key={item.id} 
                timeout={200} 
                orientation="horizontal"
                sx={{ flexShrink: 0 }}
              >
                <Chip
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.25 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span>{itemEmojis[item.name] || '🍽️'}</span>
                        <span style={{ textTransform: 'capitalize' }}>{item.name}</span>
                        <span>({item.quantity})</span>
                      </Box>
                      {item.instructions && (
                        <Box
                          sx={{
                            fontSize: '0.7rem',
                            color: 'rgba(0, 0, 0, 0.6)',
                            fontStyle: 'italic',
                            maxWidth: 200,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.instructions}
                        </Box>
                      )}
                    </Box>
                  }
                  onDelete={() => handleRemove(item.id)}
                  deleteIcon={<Close fontSize="small" />}
                  sx={{
                    background: 'rgba(0, 115, 200, 0.1)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '16px',
                    color: 'rgba(0, 0, 0, 0.8)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    height: 'auto',
                    minHeight: 32,
                    py: 0.5,
                    px: 2,
                    boxShadow: 'none',
                    '& .MuiChip-label': {
                      px: 1,
                    },
                    '& .MuiChip-deleteIcon': {
                      color: 'rgba(0, 0, 0, 0.6)',
                      fontSize: '1.1rem',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: 'error.main',
                        transform: 'scale(1.1)',
                      },
                      '&:active': {
                        transform: 'scale(0.9)',
                      },
                    },
                    animation: isRemoving ? 'pop 0.2s ease-out forwards' : 'none',
                    '@keyframes pop': {
                      '0%': {
                        transform: 'scale(1)',
                      },
                      '50%': {
                        transform: 'scale(1.3)',
                      },
                      '100%': {
                        transform: 'scale(0)',
                        opacity: 0,
                      },
                    },
                  }}
                />
              </Collapse>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}