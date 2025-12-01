import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import paymentRoutes from './routes/payments';
import authRoutes from './routes/auth';
import smsRoutes from './routes/sms';
import adminRoutes from './routes/admin';
import webhookRoutes from './routes/webhooks';
import connectRoutes from './routes/connect';
import exportRoutes from './routes/export';
import testRoutes from './routes/test';
import inventoryRoutes from './routes/inventory';
import tenantRoutes from './routes/tenants';
import orderRoutes from './routes/orders';
import businessRoutes from './routes/business';
import { BackupScheduler } from './services/backupScheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For Twilio webhooks

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'POS Server is running' });
});

app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/connect', connectRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/test', testRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/business', businessRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start automatic backup scheduler
  BackupScheduler.getInstance().start();
});