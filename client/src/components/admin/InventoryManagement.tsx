import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Alert,
  Snackbar,
} from '@mui/material';
import { Add, Delete, Edit, Save, Cancel } from '@mui/icons-material';

interface InventoryManagementProps {
  businessId: string;
  initialMenu: Record<string, number>;
  onMenuUpdate: () => void;
}

export default function InventoryManagement({ 
  businessId, 
  initialMenu,
  onMenuUpdate 
}: InventoryManagementProps) {
  const [menu, setMenu] = useState<Record<string, number>>(initialMenu);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    setMenu(initialMenu);
  }, [initialMenu]);

  const handleSaveMenu = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/business/${businessId}/menu`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu }),
      });

      if (response.ok) {
        setSnackbar({ open: true, message: 'Menu updated successfully!', severity: 'success' });
        onMenuUpdate();
      } else {
        throw new Error('Failed to update menu');
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update menu', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    if (!newItemName.trim() || !newItemPrice.trim()) return;
    
    const price = parseFloat(newItemPrice);
    if (isNaN(price) || price <= 0) {
      setSnackbar({ open: true, message: 'Invalid price', severity: 'error' });
      return;
    }

    setMenu({ ...menu, [newItemName.trim().toLowerCase()]: price });
    setNewItemName('');
    setNewItemPrice('');
  };

  const handleDeleteItem = (itemName: string) => {
    const newMenu = { ...menu };
    delete newMenu[itemName];
    setMenu(newMenu);
  };

  const handleStartEdit = (itemName: string, price: number) => {
    setEditingItem(itemName);
    setEditName(itemName);
    setEditPrice(price.toString());
  };

  const handleSaveEdit = () => {
    if (!editName.trim() || !editPrice.trim() || !editingItem) return;
    
    const price = parseFloat(editPrice);
    if (isNaN(price) || price <= 0) {
      setSnackbar({ open: true, message: 'Invalid price', severity: 'error' });
      return;
    }

    const newMenu = { ...menu };
    delete newMenu[editingItem];
    newMenu[editName.trim().toLowerCase()] = price;
    setMenu(newMenu);
    setEditingItem(null);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditName('');
    setEditPrice('');
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Menu Items
          </Typography>

          <List>
            {Object.entries(menu).map(([itemName, price]) => (
              <ListItem
                key={itemName}
                secondaryAction={
                  editingItem === itemName ? (
                    <Box>
                      <IconButton onClick={handleSaveEdit} color="primary">
                        <Save />
                      </IconButton>
                      <IconButton onClick={handleCancelEdit}>
                        <Cancel />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box>
                      <IconButton onClick={() => handleStartEdit(itemName, price)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteItem(itemName)} color="error">
                        <Delete />
                      </IconButton>
                    </Box>
                  )
                }
              >
                {editingItem === itemName ? (
                  <Box sx={{ display: 'flex', gap: 2, flex: 1, mr: 2 }}>
                    <TextField
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      label="Item Name"
                      size="small"
                      fullWidth
                    />
                    <TextField
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      label="Price"
                      type="number"
                      size="small"
                      sx={{ width: 120 }}
                      InputProps={{ startAdornment: '$' }}
                    />
                  </Box>
                ) : (
                  <ListItemText
                    primary={itemName}
                    secondary={`$${price.toFixed(2)}`}
                  />
                )}
              </ListItem>
            ))}
          </List>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Add New Item
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                label="Item Name"
                size="small"
                fullWidth
              />
              <TextField
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                label="Price"
                type="number"
                size="small"
                sx={{ width: 150 }}
                InputProps={{ startAdornment: '$' }}
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddItem}
              >
                Add
              </Button>
            </Box>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveMenu}
              disabled={saving}
              size="large"
            >
              {saving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
