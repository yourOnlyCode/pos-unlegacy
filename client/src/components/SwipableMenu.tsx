import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add, Remove, Info } from '@mui/icons-material';

interface SwipableMenuProps {
  menu: Record<string, { price: number; image?: string; description?: string } | number>;
  onAddToOrder: (item: string, quantity: number, instructions?: string) => void;
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
  const [instructions, setInstructions] = useState<Record<string, string>>({});
  const [infoDialog, setInfoDialog] = useState<{ open: boolean; item: string; description: string }>({ open: false, item: '', description: '' });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedCategory && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [selectedCategory]);

  const updateQuantity = (item: string, change: number) => {
    const current = quantities[item] || 0;
    const newQuantity = Math.max(0, current + change);
    setQuantities(prev => ({ ...prev, [item]: newQuantity }));
  };

  const addToOrder = (item: string) => {
    const quantity = quantities[item] || 1;
    const itemInstructions = instructions[item]?.trim();
    onAddToOrder(item, quantity, itemInstructions || undefined);
    setQuantities(prev => ({ ...prev, [item]: 0 }));
    setInstructions(prev => ({ ...prev, [item]: '' }));
  };

  const renderDialog = () => {
    const item = infoDialog.item;
    const menuItem = menu[item];
    const price = typeof menuItem === 'number' ? menuItem : menuItem?.price || 0;
    
    return (
      <Dialog open={infoDialog.open} onClose={() => setInfoDialog({ open: false, item: '', description: '' })}>
        <DialogTitle sx={{ textTransform: 'capitalize' }}>{item}</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <Typography sx={{ mb: 2 }}>{infoDialog.description}</Typography>
          
          <Typography variant="h6" color="success.main" sx={{ mb: 2 }}>
            ${price.toFixed(2)}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="body2">Quantity:</Typography>
            <IconButton
              size="small"
              onClick={() => updateQuantity(item, -1)}
              disabled={!quantities[item]}
            >
              <Remove fontSize="small" />
            </IconButton>
            <Chip
              label={quantities[item] || 0}
              size="small"
              sx={{ minWidth: 40 }}
            />
            <IconButton
              size="small"
              onClick={() => updateQuantity(item, 1)}
            >
              <Add fontSize="small" />
            </IconButton>
          </Box>
          
          <TextField
            fullWidth
            size="small"
            placeholder="Special instructions (optional)"
            value={instructions[item] || ''}
            onChange={(e) => setInstructions(prev => ({ ...prev, [item]: e.target.value }))}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialog({ open: false, item: '', description: '' })}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              addToOrder(item);
              setInfoDialog({ open: false, item: '', description: '' });
            }}
            disabled={!quantities[item]}
          >
            Add {quantities[item] || 1} to Order
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (selectedCategory) {
    const category = menuCategories[selectedCategory as keyof typeof menuCategories];
    const categoryItems = category.items.filter(item => menu[item]);

    return (
      <>
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

            <Box 
              ref={scrollContainerRef}
              sx={{
                display: 'flex',
                gap: 1.5,
                overflowX: 'auto',
                pb: 1,
                width: '100%',
                '&::-webkit-scrollbar': { height: 6 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 3 }
              }}
            >
              {categoryItems.map((item) => {
                const menuItem = menu[item];
                const price = typeof menuItem === 'number' ? menuItem : menuItem.price;
                const image = typeof menuItem === 'object' ? menuItem.image : undefined;
                const description = typeof menuItem === 'object' ? menuItem.description : undefined;

                return (
                  <Card
                    key={item}
                    variant="outlined"
                    sx={{
                      flex: 1,
                      minWidth: 'calc(90% - 8px)',
                      flexShrink: 0,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.5 : 1,
                      pointerEvents: disabled ? 'none' : 'auto',
                      '&:hover': { bgcolor: disabled ? 'transparent' : 'action.hover' },
                      position: 'relative'
                    }}
                    onClick={() => !disabled && setInfoDialog({ open: true, item, description: description || `${item} - No description available` })}
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoDialog({ open: true, item, description: description || `${item} - No description available` });
                      }}
                      sx={{ 
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        zIndex: 1,
                        bgcolor: 'rgba(255,255,255,0.8)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                        p: 0.25
                      }}
                    >
                      <Info sx={{ fontSize: 14 }} />
                    </IconButton>
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
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = 'none';
                              const nextSibling = target.nextElementSibling as HTMLElement;
                              if (nextSibling) nextSibling.style.display = 'block';
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
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item, -1);
                          }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item, 1);
                          }}
                          disabled={disabled}
                          sx={{ p: 0.5 }}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </Box>

                      <TextField
                        size="small"
                        placeholder="Special instructions"
                        value={instructions[item] || ''}
                        onChange={(e) => setInstructions(prev => ({ ...prev, [item]: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                        disabled={disabled}
                        sx={{ mb: 1, fontSize: '0.7rem' }}
                        inputProps={{ style: { fontSize: '0.7rem', padding: '4px 8px' } }}
                      />
                      
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          addToOrder(item);
                        }}
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
        {renderDialog()}
      </>
    );
  }



  return (
    <>
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
                  flex: 1,
                  minWidth: 'calc(90% - 8px)',
                  flexShrink: 0,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 1,
                  pointerEvents: disabled ? 'none' : 'auto',
                  '&:hover': { bgcolor: disabled ? 'transparent' : 'action.hover' }
                }}
                onClick={() => !disabled && setSelectedCategory(key)}
              >
                <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {category.emoji}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
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

      {renderDialog()}
    </>
  );
}