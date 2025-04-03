const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:63827',
      'http://192.168.0.103:63827',
      'http://192.168.0.103:3000',
      'http://192.168.0.103:5000',
      'https://inventory-management-et0z.onrender.com',
      'https://inventory-management-et0z.onrender.com/',
      'https://your-netlify-domain.netlify.app',
      'https://your-netlify-domain.netlify.app/',
      /\.netlify\.app$/,  // Allow all Netlify subdomains
      /\.onrender\.com$/  // Allow all Render subdomains
    ];

    // For development, allow any origin
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // For production, check against allowed origins
    if (allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    })) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Cache-Control',
    'Origin',
    'X-Content-Type-Options'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // Cache preflight requests for 24 hours
};

module.exports = cors(corsOptions); 