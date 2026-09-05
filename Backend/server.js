import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectCloudinary from './config/cloudinary.js';
import supabase, { isSupabaseConfigured } from './config/supabase.js';

import userRouter from './routes/userRoutes.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoutes.js';
import shopifyRouter from './routes/shopifyRoutes.js';
import salesforceRouter from './routes/salesforceRoutes.js';
import aiRouter from './routes/aiRoutes.js';

// App configuration
const app = express();
const port = process.env.PORT || 4000;

// CORS setup
app.use(cors());

// Preserve rawBody for webhook HMAC verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf ? buf.toString('utf8') : '';
    }
  })
);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AI-Powered Headless Commerce Platform API',
    status: 'online',
    version: '2.0.0',
    database: isSupabaseConfigured ? 'Supabase PostgreSQL (Live)' : 'Supabase Relational Store (Local Resilient)',
    architecture: 'Headless Composable Commerce (Shopify + Salesforce + Supabase + Python AI)'
  });
});

// Primary Commerce & Application API Endpoints
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);

// Integrations & AI Microservices Endpoints
app.use('/api', shopifyRouter);
app.use('/api', salesforceRouter);
app.use('/api', aiRouter);

const startServer = async () => {
  try {
    await connectCloudinary();
    console.log('[Cloudinary] Media service connected.');
  } catch (err) {
    console.warn('[Cloudinary] Init notice:', err.message);
  }

  console.log(`[Database] Supabase primary database active (Configured: ${isSupabaseConfigured}).`);

  app.listen(port, () => {
    console.log(`⚡ Server is running on port ${port}`);
    console.log(`🚀 Headless Commerce Gateway ready at http://localhost:${port}`);
  });
};

startServer();

export default app;
