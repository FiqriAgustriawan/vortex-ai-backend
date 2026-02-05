import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat';
import conversationsRoutes from './routes/conversations';
import imageRoutes from './routes/image';
import authRoutes from './routes/auth';
import guestRoutes from './routes/guest';
import { connectToDatabase } from './database/connection';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'Vortex AI Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      chat: '/api/chat',
      conversations: '/api/conversations',
      image: '/api/image'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/image', imageRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    const dbConnected = await connectToDatabase();
    
    if (!dbConnected) {
      console.log('⚠️ Running without MongoDB (in-memory mode)');
      console.log('   Data will not persist after restart');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Vortex AI Backend running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📍 API docs: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
