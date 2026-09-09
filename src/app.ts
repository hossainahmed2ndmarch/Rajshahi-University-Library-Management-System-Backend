import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import path from 'path';
import config from './app/config';
import globalErrorHandler from './app/errors/globalErrorHandler';
import notFound from './app/errors/notFound';
import router from './app/routes';

const app: Application = express();

// Allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  config.client_url,
].filter(Boolean);

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded media files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Root Route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'RUIL Backend API Server is running smoothly',
  });
});

// Master Application API Router
app.use('/api/v1', router);

// Error Middlewares
app.use(globalErrorHandler);
app.use(notFound);

export default app;
