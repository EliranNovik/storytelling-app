import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import storiesRoutes from './routes/stories';
import usersRoutes from './routes/users';
import { createServer } from 'http';
import CollaborativeEditingServer from './websocket';
import { connectDB } from './db/db';
import path from 'path';
import axios from 'axios';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket server
new CollaborativeEditingServer(server);

console.log('Starting server configuration...');

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',  
    'http://localhost:5174',  // Alternative Vite port
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://localhost:3000',  // Just in case using React's default port
    'https://storytelling-app-front.onrender.com' // Deployed frontend domain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
console.log('CORS configured');
app.use(express.json());
console.log('JSON middleware configured');

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  console.log('Request headers:', req.headers);
  console.log('Request origin:', req.get('origin'));
  res.json({ 
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    port: port
  });
});
console.log('Test endpoint configured');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/users', usersRoutes);
console.log('Auth routes, stories routes, and users routes configured');

// Test database connection
connectDB().then(() => {
  console.log('Connected to database');
});

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Storytelling App API' });
});

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Keep-alive ping function
function selfPing() {
  const urls = [
    'https://storytelling-app.onrender.com/api/test', // Backend
    'https://storytelling-app-front.onrender.com/'    // Frontend
  ];
  urls.forEach(url => {
    axios.get(url)
      .then(() => console.log(`[${new Date().toISOString()}] Pinged ${url}`))
      .catch((err: any) => console.error(`[${new Date().toISOString()}] Ping to ${url} failed:`, err.message));
  });
}

// Immediately ping on start
selfPing();
// Ping every 30 minutes
setInterval(selfPing, 30 * 60 * 1000);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    console.log('Connected to database');
    
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 