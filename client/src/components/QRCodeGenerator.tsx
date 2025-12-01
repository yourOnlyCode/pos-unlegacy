import { useState } from 'react';
import { Box, Paper, Typography, Button, Alert } from '@mui/material';
import { Download, Print } from '@mui/icons-material';

interface QRCodeGeneratorProps {
  businessId: string;
  businessName: string;
}

export default function QRCodeGenerator({ businessId, businessName }: QRCodeGeneratorProps) {
  const [showQR, setShowQR] = useState(false);
  
  const orderingUrl = `${window.location.origin}/order/${businessId}`;

  const downloadQR = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(orderingUrl)}`;
    const downloadLink = document.createElement('a');
    downloadLink.download = `${businessName}-qr-code.png`;
    downloadLink.href = qrUrl;
    downloadLink.click();
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head><title>QR Code - ${businessName}</title></head>
        <body style="text-align: center; padding: 20px;">
          <h2>${businessName}</h2>
          <p>Scan to Order</p>
          <div id="qr-container"></div>
          <p style="font-size: 12px; margin-top: 20px;">${orderingUrl}</p>
        </body>
      </html>
    `);
    
    const qrContainer = printWindow.document.getElementById('qr-container');
    if (qrContainer) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(orderingUrl)}`;
      qrContainer.innerHTML = `<img src="${qrUrl}" alt="QR Code" style="width: 300px; height: 300px;" />`;
    }
    
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        QR Code for Customer Orders
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        Generate a QR code that customers can scan to access your ordering portal
      </Alert>

      {!showQR ? (
        <Button 
          variant="contained" 
          onClick={() => setShowQR(true)}
          sx={{ mb: 2 }}
        >
          Generate QR Code
        </Button>
      ) : (
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ mb: 2, display: 'inline-block', p: 2, bgcolor: 'white', borderRadius: 1 }}>
            <img
              id="qr-code"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(orderingUrl)}`}
              alt="QR Code"
              style={{ width: 200, height: 200 }}
            />
          </Box>
          
          <Typography variant="body2" sx={{ mb: 2, wordBreak: 'break-all' }}>
            {orderingUrl}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={downloadQR}
            >
              Download PNG
            </Button>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={printQR}
            >
              Print
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
}