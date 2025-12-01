import express from 'express';
import cors from 'cors';
import ordersRouter from '../src/routes/orders';
import paymentsRouter from '../src/routes/payments';
import adminRouter from '../src/routes/admin';
import businessRouter from '../src/routes/business';
import healthRouter from '../src/routes/health';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/business', businessRouter);
app.use('/api', healthRouter);

export default app;