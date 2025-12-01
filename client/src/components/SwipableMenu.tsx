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

interface SwipableMenuProps {
  menu: Record<string, { price: number; image?: string } | number>;
  onAddToOrder: (item: string, quantity: number) => void;
  disabled?: boolean;
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

export default function SwipableMenu({ menu, onAddToOrder, disabled = false }: SwipableMenuProps) {
  console.log('SwipableMenu render - disabled:', disabled);
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
            {categoryItems.map((item) => {
              const menuItem = menu[item];
              const price = typeof menuItem === 'number' ? menuItem : menuItem.price;
              const image = typeof menuItem === 'object' ? menuItem.image : undefined;

              return (
                <Card
                  key={item}
                  variant="outlined"
                  sx={{
                    minWidth: 140,
                    maxWidth: 140,
                    flexShrink: 0,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    pointerEvents: disabled ? 'none' : 'auto',
                    '&:hover': { bgcolor: disabled ? 'transparent' : 'action.hover' }
                  }}
                >
                  <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                    {image ? (
                      <Box sx={{ mb: 0.5, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                          src={image}
                          alt={item}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                          onError={(e) => {
                            // Fallback to emoji if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling!.style.display = 'block';
                          }}
                        />
                        <Typography variant="h5" sx={{ display: 'none' }}>
                          {itemEmojis[item]}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="h5" sx={{ mb: 0.5 }}>
                        {itemEmojis[item]}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'capitalize', display: 'block' }}>
                      {item}
                    </Typography>
                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                      ${price.toFixed(2)}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => updateQuantity(item, -1)}
                        disabled={disabled || !quantities[item]}
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
                        disabled={disabled}
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
                      disabled={disabled || !quantities[item]}
                      sx={{ fontSize: '0.7rem', py: 0.5 }}
                    >
                      Add {quantities[item] || 1}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
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
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                pointerEvents: disabled ? 'none' : 'auto',
                '&:hover': { bgcolor: disabled ? 'transparent' : 'action.hover' }
              }}
              onClick={() => !disabled && setSelectedCategory(key)}
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