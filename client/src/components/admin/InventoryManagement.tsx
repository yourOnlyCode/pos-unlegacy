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
  initialMenu: Record<string, { price: number; image?: string; description?: string } | number>;
  onMenuUpdate: () => void;
}

export default function InventoryManagement({ 
  businessId, 
  initialMenu,
  onMenuUpdate 
}: InventoryManagementProps) {
  const [menu, setMenu] = useState<Record<string, { price: number; image?: string; description?: string } | number>>(initialMenu);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemImage, setNewItemImage] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    setMenu(initialMenu);
  }, [initialMenu]);

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/business/${businessId}/upload-image`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    
    const result = await response.json();
    return result.imageUrl;
  };

  const saveMenuToServer = async (menuToSave: any) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/business/${businessId}/menu`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ menu: menuToSave }),
      });

      if (response.ok) {
        onMenuUpdate();
      } else {
        throw new Error('Failed to update menu');
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save menu', severity: 'error' });
    }
  };

  const handleSaveMenu = async () => {
    setSaving(true);
    try {
      await saveMenuToServer(menu);
      setSnackbar({ open: true, message: 'Menu updated successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update menu', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim() || !newItemPrice.trim()) return;
    
    const price = parseFloat(newItemPrice);
    if (isNaN(price) || price <= 0) {
      setSnackbar({ open: true, message: 'Invalid price', severity: 'error' });
      return;
    }

    const menuItem = price;
    
    const updatedMenu = { ...menu, [newItemName.trim().toLowerCase()]: menuItem };
    setMenu(updatedMenu);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemImage('');
    setNewImageFile(null);
    
    // Auto-save menu after adding item
    await saveMenuToServer(updatedMenu);
  };

  const handleDeleteItem = (itemName: string) => {
    const newMenu = { ...menu };
    delete newMenu[itemName];
    setMenu(newMenu);
  };

  const handleStartEdit = (itemName: string, menuItem: { price: number; image?: string; description?: string } | number) => {
    setEditingItem(itemName);
    setEditName(itemName);
    
    if (typeof menuItem === 'number') {
      setEditPrice(menuItem.toString());
      setEditImage('');
      setEditDescription('');
    } else {
      setEditPrice(menuItem.price.toString());
      setEditImage(menuItem.image || '');
      setEditDescription(menuItem.description || '');
    }
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editPrice.trim() || !editingItem) return;
    
    const price = parseFloat(editPrice);
    if (isNaN(price) || price <= 0) {
      setSnackbar({ open: true, message: 'Invalid price', severity: 'error' });
      return;
    }

    const menuItem = price;

    const newMenu = { ...menu };
    delete newMenu[editingItem];
    newMenu[editName.trim().toLowerCase()] = menuItem;
    setMenu(newMenu);
    setEditingItem(null);
    
    // Auto-save menu after editing item
    await saveMenuToServer(newMenu);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditName('');
    setEditPrice('');
    setEditImage('');
    setEditImageFile(null);
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Menu Items
          </Typography>

          <List>
            {Object.entries(menu).map(([itemName, menuItem]) => {
              const price = typeof menuItem === 'number' ? menuItem : menuItem.price;
              const image = typeof menuItem === 'object' ? menuItem.image : undefined;
              
              return (
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
                      <IconButton onClick={() => handleStartEdit(itemName, menuItem)}>
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
                      sx={{ width: 150 }}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                        style={{ display: 'none' }}
                        id={`edit-image-${itemName}`}
                      />
                      <label htmlFor={`edit-image-${itemName}`}>
                        <Button variant="outlined" component="span" size="small">
                          {editImageFile ? 'Change Image' : 'Upload Image'}
                        </Button>
                      </label>
                      {(editImageFile || image) && (
                        <img 
                          src={editImageFile ? URL.createObjectURL(editImageFile) : image} 
                          alt="Preview"
                          style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 4 }}
                        />
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    {image && (
                      <img 
                        src={image} 
                        alt={itemName}
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <ListItemText
                      primary={itemName}
                      secondary={`$${price.toFixed(2)}${image ? ' • Has image' : ''}`}
                    />
                  </Box>
                )}
              </ListItem>
              );
            })}
          </List>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Add New Item
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              <TextField
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                label="Item Name"
                size="small"
                sx={{ minWidth: 200 }}
              />
              <TextField
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                label="Price"
                type="number"
                size="small"
                sx={{ width: 120 }}
                InputProps={{ startAdornment: '$' }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                  id="new-item-image"
                />
                <label htmlFor="new-item-image">
                  <Button variant="outlined" component="span" size="small">
                    {newImageFile ? 'Change Image' : 'Upload Image'}
                  </Button>
                </label>
                {newImageFile && (
                  <img 
                    src={URL.createObjectURL(newImageFile)} 
                    alt="Preview"
                    style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 4 }}
                  />
                )}
              </Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddItem}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Add'}
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
