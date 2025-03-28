import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import transcriptRouter from './api/transcript';

const app = express();
const port = process.env.PORT || 3015;
const isDev = process.env.NODE_ENV === 'development';

console.log('Server environment:', {
  SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'set' : 'not set',
  SUPABASE_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'set' : 'not set',
  NODE_ENV: process.env.NODE_ENV,
  PORT: port,
});

// Middleware
app.use(cors({
  origin: isDev ? '*' : process.env.FRONTEND_URL || 'http://localhost:3015',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
}));
app.use(express.json());

// API Routes
app.use('/api/transcript', transcriptRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (!isDev) {
  // In production, serve static files from the dist directory
  app.use(express.static(path.join(process.cwd(), 'dist')));

  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  });
}

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
