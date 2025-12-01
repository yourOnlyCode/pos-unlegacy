import { Box, Paper, TextField, Button, Alert, Typography } from '@mui/material';
import { Send } from '@mui/icons-material';

interface OrderInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  loading: boolean;
  cartItemsCount: number;
}

export default function OrderInput({ 
  inputText, 
  setInputText, 
  onSendMessage, 
  onKeyPress, 
  loading, 
  cartItemsCount 
}: OrderInputProps) {
  return (
    <Paper elevation={3} sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 0 }}>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          placeholder="Type your order here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={onKeyPress}
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
          onClick={onSendMessage}
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
          {cartItemsCount > 0
            ? `Cart: ${cartItemsCount} items ready to send`
            : 'Try: "2 coffee, 1 sandwich" or "menu" to see options'
          }
        </Typography>
      </Alert>
    </Paper>
  );
}