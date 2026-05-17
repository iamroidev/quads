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

let isShuttingDown = false;

const shutdownServer = (reason: string, err?: unknown): void => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.error(reason, err);

  httpServer.close(() => {
    process.exit(1);
  });

  setTimeout(() => {
    process.exit(1);
  }, 10000).unref();
};

const registerProcessErrorHandlers = (): void => {
  if (process.listenerCount('unhandledRejection') === 0) {
    process.on('unhandledRejection', (reason) => {
      shutdownServer('Unhandled Promise Rejection:', reason);
    });
  }

  if (process.listenerCount('uncaughtException') === 0) {
    process.on('uncaughtException', (error) => {
      shutdownServer('Uncaught Exception:', error);
    });
  }
};

// Trust proxy for Cloudflare/Nginx
app.set('trust proxy', 1);

// Socket.io setup
const io = new SocketServer(httpServer, {
  cors: {
    origin: env.NODE_ENV === 'production'
      ? [env.CLIENT_URL, 'https://quadsmarket.tech', 'https://www.quadsmarket.tech']
      : [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5200', 'http://127.0.0.1:5200', 'http://localhost:19006'],
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
   'http://localhost:5200',
   'http://127.0.0.1:5200',
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

// Input sanitization — runs on every request AFTER body parsing
app.use(sanitizeInput);

// Body size validation
app.use(validateBodySize(10 * 1024 * 1024)); // 10MB max

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

// Auth routes — stricter limits applied per route in auth.routes.ts
// app.use('/api/auth', authLimiter);

// Payment routes — protect against payment abuse
app.use('/api/payments', paymentLimiter);

// Upload routes — protect storage abuse
app.use('/api/products', uploadLimiter); // product creation has image uploads

// ========================
// Routes
// ========================

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'QUADS API',
    version: '1.0.0',
    description: 'Marketplace for buyers and sellers on QUADS',
    docs: '/api/health',
  });
});

app.use('/api', routes);

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

        // Self-heal QUADS AI Support avatar to high-compatibility Base64
        import('./models/User').then(({ default: User }) => {
          const AI_EMAIL = 'support@quadsmarket.tech';
          const AI_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxMDAgMTAwJyBmaWxsPSdub25lJz48cmVjdCB3aWR0aD0nMTAwJyBoZWlnaHQ9JzEwMCcgcng9JzEyJyBmaWxsPScjZmZkNzAwJy8+PGNpcmNsZSBjeD0nNTAnIGN5PSc1MCcgcj0nMzAnIGZpbGw9JyMwMDAwMDAnLz48Y2lyY2xlIGN4PSc0MCcgY3k9JzQ1JyByPSc1JyBmaWxsPScjZmY2YjZiJy8+PGNpcmNsZSBjeD0nNjAnIGN5PSc0NScgcj0nNScgZmlsbD0nI2ZmNmI2YicvPjxyZWN0IHg9JzQyJyB5PSc2NScgd2lkdGg9JzE2JyBoZWlnaHQ9JzQnIGZpbGw9JyNmZmZmZmYnLz48cGF0aCBkPSdNNTAgMTB2MTAnIHN0cm9rZT0nIzAwMDAwMCcgc3Ryb2tlLXdpZHRoPSc0Jy8+PGNpcmNsZSBjeD0nNTAnIGN5PSc4JyByPSc0JyBmaWxsPScjZmY2YjZiJy8+PC9zdmc+';
          User.updateOne(
            { email: AI_EMAIL },
            { $set: { avatar: AI_AVATAR } }
          ).then((res) => {
            console.log('Self-healed AI support avatar database record:', res);
          }).catch((err) => {
            console.error('Failed to self-heal AI support avatar:', err);
          });
        });
      })
      .catch((err) => {
        console.error('Initial MongoDB connection failed:', err);
      });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

registerProcessErrorHandlers();
startServer();

export { app, io };
