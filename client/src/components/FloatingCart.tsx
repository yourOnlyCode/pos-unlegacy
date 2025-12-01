import { Box, Chip, IconButton, Collapse, Avatar } from '@mui/material';
import { Close, ShoppingCart } from '@mui/icons-material';
import { useState, useEffect } from 'react';

interface CartItem {
  name: string;
  quantity: number;
  emoji: string;
}

interface FloatingCartProps {
  items: CartItem[];
  onRemoveItem: (itemName: string) => void;
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

export default function FloatingCart({ items, onRemoveItem }: FloatingCartProps) {
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [displayItems, setDisplayItems] = useState<CartItem[]>(items);

  useEffect(() => {
    setDisplayItems(items);
  }, [items]);

  const handleRemove = (itemName: string) => {
    setRemovingItems(prev => new Set(prev).add(itemName));
    setTimeout(() => {
      onRemoveItem(itemName);
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemName);
        return newSet;
      });
    }, 200);
  };

  if (displayItems.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        gap: 1,
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '90vw',
        alignItems: 'center',
      }}
    >
      <Avatar
        sx={{
          background: 'rgba(0, 115, 200, 0.1)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          width: 28,
          height: 28,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
          '& .MuiSvgIcon-root': {
            color: 'rgba(0, 115, 200, 0.8)',
            filter: 'drop-shadow(0 1px 2px rgba(255, 255, 255, 0.5))',
          },
          animation: 'bounce 0.5s ease-out',
          '@keyframes bounce': {
            '0%': {
              transform: 'scale(0) translateY(-20px)',
              opacity: 0,
            },
            '50%': {
              transform: 'scale(1.2) translateY(-10px)',
              opacity: 1,
            },
            '100%': {
              transform: 'scale(1) translateY(0)',
              opacity: 1,
            },
          },
        }}
      >
        <ShoppingCart fontSize="small" />
      </Avatar>
      {displayItems.map((item, index) => {
        const isRemoving = removingItems.has(item.name);
        return (
          <Collapse in={!isRemoving} key={`${item.name}-${index}`} timeout={200} orientation="horizontal">
            <Chip
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>{itemEmojis[item.name] || '🍽️'}</span>
                  <span style={{ textTransform: 'capitalize' }}>{item.name}</span>
                  <span>({item.quantity})</span>
                </Box>
              }
              onDelete={() => handleRemove(item.name)}
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
                height: 32,
                px: 2,
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                '& .MuiChip-label': {
                  px: 1,
                  textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
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

                animation: isRemoving ? 'pop 0.2s ease-out forwards' : 'bounce 0.5s ease-out',
                '@keyframes bounce': {
                  '0%': {
                    transform: 'scale(0) translateY(-20px)',
                    opacity: 0,
                  },
                  '50%': {
                    transform: 'scale(1.2) translateY(-10px)',
                    opacity: 1,
                  },
                  '100%': {
                    transform: 'scale(1) translateY(0)',
                    opacity: 1,
                  },
                },
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
  );
}