import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Download, CloudDownload, Schedule } from '@mui/icons-material';

interface Backup {
  id: string;
  createdAt: string;
  size: string;
  type: 'auto' | 'manual';
}

interface DataExportProps {
  businessId: string;
}

export default function DataExport({ businessId }: DataExportProps) {
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [format, setFormat] = useState<'json' | 'csv'>('json');

  const exportData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/export/business/${businessId}/export?format=${format}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${businessId}-backup-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBackups = async () => {
    try {
      const response = await fetch(`/api/export/business/${businessId}/backups`);
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups);
      }
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  const downloadBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/export/business/${businessId}/download/${backupId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${backupId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Data Export & Backup
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Your data is automatically backed up daily. You can also export your complete business data anytime for local storage.
      </Alert>

      {/* Manual Export */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Export Current Data
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Download all your business data including orders, menu, and analytics
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Format</InputLabel>
              <Select
                value={format}
                label="Format"
                onChange={(e) => setFormat(e.target.value as 'json' | 'csv')}
              >
                <MenuItem value="json">JSON (Complete)</MenuItem>
                <MenuItem value="csv">CSV (Orders Only)</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={exportData}
              disabled={loading}
            >
              {loading ? 'Exporting...' : 'Export Data'}
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary">
            JSON includes complete business data. CSV includes orders only for spreadsheet analysis.
          </Typography>
        </CardContent>
      </Card>

      {/* Automatic Backups */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Schedule sx={{ mr: 1 }} />
            <Typography variant="h6">
              Automatic Backups
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            We automatically backup your data daily. Access previous backups below.
          </Typography>

          <Button
            variant="outlined"
            onClick={loadBackups}
            sx={{ mb: 2 }}
          >
            Load Available Backups
          </Button>

          {backups.length > 0 && (
            <List>
              {backups.map((backup) => (
                <ListItem key={backup.id} divider>
                  <ListItemText
                    primary={new Date(backup.createdAt).toLocaleDateString()}
                    secondary={`Size: ${backup.size} • ${backup.type === 'auto' ? 'Automatic' : 'Manual'}`}
                  />
                  <Box sx={{ mr: 2 }}>
                    <Chip
                      label={backup.type}
                      size="small"
                      color={backup.type === 'auto' ? 'primary' : 'secondary'}
                    />
                  </Box>
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => downloadBackup(backup.id)}
                    >
                      <CloudDownload />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="subtitle2">Data Ownership</Typography>
        <Typography variant="body2">
          All exported data belongs to you. Use it with any system, import to spreadsheets, or keep as local backups.
        </Typography>
      </Alert>
    </Box>
  );
}