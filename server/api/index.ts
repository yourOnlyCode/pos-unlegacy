import express from 'express';
import cors from 'cors';
import ordersRouter from '../src/routes/orders';
import paymentsRouter from '../src/routes/payments';
import adminRouter from '../src/routes/admin';
import businessRouter from '../src/routes/business';
import healthRouter from '../src/routes/health';
import authRouter from '../src/routes/auth';
import connectRouter from '../src/routes/connect';
import smsRouter from '../src/routes/sms';
import inventoryRouter from '../src/routes/inventory';
import webhooksRouter from '../src/routes/webhooks';
import businessConfigRouter from '../src/routes/businessConfig';
import tenantsRouter from '../src/routes/tenants';
import testRouter from '../src/routes/test';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/business', businessRouter);
app.use('/api/auth', authRouter);
app.use('/api/connect', connectRouter);
app.use('/api/sms', smsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/business-config', businessConfigRouter);
app.use('/api/tenants', tenantsRouter);
app.use('/api/test', testRouter);
app.use('/api', healthRouter);

export default app;