import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import apiRoutes from './routes';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';
import { authenticate } from './middleware/auth.middleware';

export const createApp = (): Application => {
  const app: Application = express();

  // Configure CORS
  const allowedOrigins = [
    env.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, postman)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive for local dev
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Request Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Parse Cookie headers for HttpOnly session tokens
  app.use(cookieParser());

  // Global identity middleware: extracts & verifies token from HttpOnly cookie or Bearer header
  app.use(authenticate);

  // Root welcome route
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'TeamFlow API',
      version: '1.0.0',
      description: 'Enterprise Project Management REST Backend',
      healthEndpoint: '/api/health'
    });
  });

  // Mount API Routes
  app.use('/api', apiRoutes);

  // 404 Fallback
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
