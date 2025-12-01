import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';

interface MenuItem {
  name: string;
  price: number;
  category: string;
  emoji: string;
}

interface SwipableMenuProps {
  menu: Record<string, number>;
  onAddToOrder: (item: string, quantity: number) => void;
}

const menuCategories = {
  drinks: { label: 'Drinks', emoji: '☕', items: ['coffee', 'latte', 'cappuccino'] },
  food: { label: 'Food', emoji: '🥪', items: ['sandwich', 'bagel'] },
  treats: { label: 'Treats', emoji: '🧁', items: ['pastry', 'muffin'] },
};

const itemEmojis: Record<string, string> = {
  coffee: '☕',
  latte: '☕',
  cappuccino: '☕',
  sandwich: '🥪',
  bagel: '🥯',
  pastry: '🧁',
  muffin: '🧁',
};

export default function SwipableMenu({ menu, onAddToOrder }: SwipableMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const updateQuantity = (item: string, change: number) => {
    const current = quantities[item] || 0;
    const newQuantity = Math.max(0, current + change);
    setQuantities(prev => ({ ...prev, [item]: newQuantity }));
  };

  const addToOrder = (item: string) => {
    const quantity = quantities[item] || 1;
    onAddToOrder(item, quantity);
    setQuantities(prev => ({ ...prev, [item]: 0 }));
  };

  if (selectedCategory) {
    const category = menuCategories[selectedCategory as keyof typeof menuCategories];
    const categoryItems = category.items.filter(item => menu[item]);

    return (
      <Card sx={{ mb: 2, bgcolor: '#f8f9fa', width: '100%', maxWidth: '100%' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              {category.emoji} {category.label}
            </Typography>
            <Button 
              size="small" 
              onClick={() => setSelectedCategory(null)}
              sx={{ minWidth: 'auto' }}
            >
              ← Back
            </Button>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5, 
            overflowX: 'auto',
            pb: 1,
            width: '100%',
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 3 }
          }}>
            {categoryItems.map((item) => (
              <Card 
                key={item}
                variant="outlined" 
                sx={{ 
                  minWidth: 140,
                  maxWidth: 140,
                  flexShrink: 0,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ mb: 0.5 }}>
                    {itemEmojis[item]}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'capitalize', display: 'block' }}>
                    {item}
                  </Typography>
                  <Typography variant="caption" color="success.main" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                    ${menu[item].toFixed(2)}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
                    <IconButton 
                      size="small" 
                      onClick={() => updateQuantity(item, -1)}
                      disabled={!quantities[item]}
                      sx={{ p: 0.5 }}
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                    <Chip 
                      label={quantities[item] || 0} 
                      size="small" 
                      sx={{ minWidth: 30, height: 24 }}
                    />
                    <IconButton 
                      size="small" 
                      onClick={() => updateQuantity(item, 1)}
                      sx={{ p: 0.5 }}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    onClick={() => addToOrder(item)}
                    disabled={!quantities[item]}
                    sx={{ fontSize: '0.7rem', py: 0.5 }}
                  >
                    Add {quantities[item] || 1}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2, bgcolor: '#f8f9fa', width: '100%', maxWidth: '100%' }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          🍽️ Menu Categories
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          overflowX: 'auto',
          pb: 1,
          width: '100%',
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 3 }
        }}>
          {Object.entries(menuCategories).map(([key, category]) => (
            <Card 
              key={key}
              variant="outlined" 
              sx={{ 
                minWidth: 140,
                maxWidth: 140,
                flexShrink: 0,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => setSelectedCategory(key)}
            >
              <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ mb: 0.5 }}>
                  {category.emoji}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                  {category.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {category.items.filter(item => menu[item]).length} items
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}