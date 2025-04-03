const express = require('express');
const router = express.Router();

// Store active SSE connections
const clients = new Set();

// Debug middleware for events routes
router.use((req, res, next) => {
  console.log('Events route accessed:', req.method, req.url);
  next();
});

// SSE endpoint for real-time updates
router.get('/', (req, res) => {
  console.log('New SSE connection established');
  
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Add this client to the set of active connections
  clients.add(res);
  console.log(`Active connections: ${clients.size}`);

  // Send initial heartbeat
  res.write('data: {"type":"heartbeat"}\n\n');

  // Keep connection alive
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write('data: {"type":"heartbeat"}\n\n');
    }
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    console.log('Client disconnected');
    clearInterval(heartbeat);
    clients.delete(res);
    console.log(`Active connections: ${clients.size}`);
  });

  // Handle client errors
  req.on('error', (error) => {
    console.error('Client connection error:', error);
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

// Test endpoint to verify route is working
router.get('/test', (req, res) => {
  res.json({ message: 'Events route is working' });
});

// Function to broadcast events to all connected clients
const broadcastEvent = (event) => {
  console.log(`Broadcasting event to ${clients.size} clients:`, event);
  const eventData = JSON.stringify(event);
  clients.forEach(client => {
    if (!client.writableEnded) {
      try {
        client.write(`data: ${eventData}\n\n`);
      } catch (error) {
        console.error('Error sending event to client:', error);
        clients.delete(client);
      }
    }
  });
};

module.exports = { router, broadcastEvent }; 