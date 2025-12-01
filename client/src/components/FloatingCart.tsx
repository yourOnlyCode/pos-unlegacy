import { Box, Chip, IconButton, Fade } from '@mui/material';
import { Close } from '@mui/icons-material';

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
  if (items.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        gap: 1,
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '90vw',
      }}
    >
      {items.map((item, index) => (
        <Fade in={true} key={`${item.name}-${index}`} timeout={300}>
          <Chip
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>{itemEmojis[item.name] || '🍽️'}</span>
                <span style={{ textTransform: 'capitalize' }}>{item.name}</span>
                <span>({item.quantity})</span>
              </Box>
            }
            onDelete={() => onRemoveItem(item.name)}
            deleteIcon={<Close fontSize="small" />}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.9rem',
              height: 40,
              px: 2,
              '& .MuiChip-label': {
                px: 1,
              },
              '& .MuiChip-deleteIcon': {
                color: 'white',
                fontSize: '1.1rem',
                '&:hover': {
                  color: 'error.light',
                },
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
          />
        </Fade>
      ))}
    </Box>
  );
}