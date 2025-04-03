require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('./cors');

const app = express();

// Set environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors);
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Origin:', req.headers.origin);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MongoDB URI is not defined in environment variables');
  process.exit(1);
}

const connectWithRetry = () => {
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      console.log('Retrying connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

// Import events route and broadcast function
const { router: eventsRouter, broadcastEvent } = require('./routes/events');

// Register events route first
app.use('/events', eventsRouter);

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const saleRoutes = require('./routes/sales');
const userRoutes = require('./routes/users');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/users', userRoutes);

// Handle new sale events
app.on('newSale', (event) => {
  console.log('New sale event received:', event);
  broadcastEvent(event);
});

// Root route handler
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Inventory Management API',
    status: 'running',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    endpoints: {
      events: '/events',
      auth: '/api/auth',
      products: '/api/products',
      sales: '/api/sales'
    }
  });
});

// Favicon handler
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Test MongoDB connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'MongoDB not connected',
        connectionState: mongoose.connection.readyState
      });
    }

    // Try to perform a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    res.json({
      status: 'success',
      message: 'MongoDB is connected and working',
      connectionState: mongoose.connection.readyState,
      collections: collections.map(c => c.name)
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error testing database connection',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log('Available routes:');
  console.log('- GET /events');
  console.log('- GET /events/test');
  console.log('- POST /api/auth/login');
  console.log('- POST /api/auth/register');
  console.log('- GET /api/products');
  console.log('- GET /api/sales');
  console.log('- POST /api/users/profile-image');
  console.log('- PUT /api/users/profile');
}); 