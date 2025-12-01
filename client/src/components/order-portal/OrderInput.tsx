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
    <Paper elevation={3} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 0 }}>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <TextField
          fullWidth
          multiline
          maxRows={2}
          placeholder="Type your order here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={onKeyPress}
          disabled={loading}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiInputBase-input': {
              fontSize: { xs: '0.9rem', sm: '1rem' },
              padding: { xs: '8px 10px', sm: '10px 12px' }
            }
          }}
        />
        <Button
          variant="contained"
          onClick={onSendMessage}
          disabled={!inputText.trim() || loading}
          sx={{
            minWidth: { xs: 48, sm: 52 },
            height: { xs: 40, sm: 44 },
            '& .MuiSvgIcon-root': {
              fontSize: { xs: '1.1rem', sm: '1.2rem' }
            }
          }}
        >
          <Send />
        </Button>
      </Box>

      <Alert severity="info" sx={{ mt: 1, py: 0.5 }}>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
          {cartItemsCount > 0
            ? `Cart: ${cartItemsCount} items ready to send`
            : 'Try: "2 coffee, 1 sandwich" or "menu" to see options'
          }
        </Typography>
      </Alert>
    </Paper>
  );
}