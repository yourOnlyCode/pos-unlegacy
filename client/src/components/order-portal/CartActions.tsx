import { Box, Paper, Button } from '@mui/material';

interface CartActionsProps {
  cartItemsCount: number;
  onSendCart: () => void;
  onClearCart: () => void;
  disabled?: boolean;
}

export default function CartActions({ cartItemsCount, onSendCart, onClearCart, disabled = false }: CartActionsProps) {
  if (cartItemsCount === 0) return null;

  return (
    <Paper elevation={2} sx={{ p: 2, bgcolor: 'transparent', border: 'none', boxShadow: 'none' }}>
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
        <Button
          onClick={onSendCart}
          disabled={disabled}
          sx={{
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
        <Button
          onClick={onClearCart}
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
  );
}