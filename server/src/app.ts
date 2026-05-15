import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import env from './config/env';
import connectDB from './config/db';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter, authLimiter, paymentLimiter, uploadLimiter } from './middleware/rateLimit';
import { sanitizeInput, validateBodySize } from './middleware/validateRequest';
import { setupSocketHandlers } from './socket';
import { startPayoutScheduler } from './services/payoutScheduler';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Trust proxy for Cloudflare/Nginx
app.set('trust proxy', 1);

// Socket.io setup
const io = new SocketServer(httpServer, {
  cors: {
    origin: env.NODE_ENV === 'production'
      ? [env.CLIENT_URL, 'https://quadsmarket.tech', 'https://www.quadsmarket.tech']
      : [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:19006'],
    credentials: true,
  },
});

// Make io accessible in routes
app.set('io', io);

// Setup Socket.io event handlers (auth, messaging, typing, presence)
setupSocketHandlers(io);

// ========================
// Middleware
// ========================

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // Fixed Google Login popup
  })
);

// CORS
const allowedOrigins = [
   env.CLIENT_URL,
   'https://quadsmarket.tech',
   'https://www.quadsmarket.tech',
   'http://localhost:5173',
   'http://localhost:19006',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked for origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Input sanitization — runs on every request BEFORE body parsing
app.use(sanitizeInput);

// Body size validation
app.use(validateBodySize(10 * 1024 * 1024)); // 10MB max

// Body parsing — capture raw body for Paystack webhook signature validation
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      // Store raw body for webhook signature verification
      if (req.originalUrl === '/api/payments/webhook') {
        req.rawBody = buf.toString();
      }
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Request logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// ========================
// Rate Limiting
// ========================
// Global API rate limiting — 100 requests per 15 minutes
app.use('/api', apiLimiter);

// Auth routes — stricter limits to prevent brute force
app.use('/api/auth', authLimiter);

// Payment routes — protect against payment abuse
app.use('/api/payments', paymentLimiter);

// Upload routes — protect storage abuse
app.use('/api/products', uploadLimiter); // product creation has image uploads

// ========================
// Routes
// ========================
app.use('/api', routes);

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'QUADS API',
    version: '1.0.0',
    description: 'Marketplace for buyers and sellers on QUADS',
    docs: '/api/health',
  });
});

// ========================
// Error Handling
// ========================
app.use(notFoundHandler);
app.use(errorHandler);

// ========================
// Start Server
// ========================
const startServer = async () => {
  try {
    // Start listening
    httpServer.listen(env.PORT, () => {
      console.log('='.repeat(50));
      console.log(`  QUADS API Server`);
      console.log(`  Environment: ${env.NODE_ENV}`);
      console.log(`  Port: ${env.PORT}`);
      console.log(`  URL: http://localhost:${env.PORT}`);
      console.log('='.repeat(50));
    });

    // Connect to MongoDB (non-blocking)
    connectDB()
      .then(() => {
        console.log('MongoDB connection established');
        // Start background payout scheduler only after DB is ready
        startPayoutScheduler(15);
      })
      .catch((err) => {
        console.error('Initial MongoDB connection failed:', err);
      });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, io };
