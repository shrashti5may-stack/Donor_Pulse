const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

let mongoose;
try {
  mongoose = require('mongoose');
} catch (e) {
  mongoose = null;
}

let Server;
try {
  Server = require('socket.io').Server;
} catch (e) {
  Server = null;
}

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const PUBLIC_DIR = __dirname;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/donorpulse';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Socket.io if available
let io = null;
if (Server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // 4. Selective Real-Time Event Routing:
    // Do not broadcast globally to the 'donors' room.
    // Each connected donor must join a private room identified by their database ID: `socket.join("user_" + donorUser._id)`
    socket.on('join_room', (room) => {
      if (typeof room === 'string' && room.startsWith('user_')) {
        socket.join(room);
      }
    });

    socket.on('authenticate', (data) => {
      if (data && (data.userId || data._id || data.id)) {
        const id = data.userId || data._id || data.id;
        socket.join(`user_${id}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
}

// Connect to MongoDB
if (mongoose) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB database (DonorPulse)');
    })
    .catch((err) => {
      console.warn('MongoDB connection note: Running in database-ready mode (' + err.message + ')');
    });
}

// Mount Request Routes
try {
  const createRequestRouter = require('./routes/requestRoutes');
  app.use('/api/requests', createRequestRouter(io));
} catch (err) {
  console.warn('Request routes router initialization note:', err.message);
}

// MIME Types for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf'
};

// Static File Serving & Clean URLs
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  const cleanPath = req.path;
  let safePath = path.normalize(path.join(PUBLIC_DIR, cleanPath));

  if (!safePath.startsWith(PUBLIC_DIR)) {
    return res.status(403).send('403 - Forbidden');
  }

  if (fs.existsSync(safePath) && fs.statSync(safePath).isDirectory()) {
    safePath = path.join(safePath, 'index.html');
  }

  if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    const ext = path.extname(safePath).toLowerCase();
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(safePath);
  }

  const htmlPath = safePath + '.html';
  if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.sendFile(htmlPath);
  }

  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.sendFile(indexPath);
  }

  return res.status(404).send('404 - Not Found');
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`  DonorPulse Server is Running!`);
    console.log(`  Local URL:   http://localhost:${port}`);
    console.log(`  Pipeline:    Strict Compatibility & Proximity Active`);
    console.log(`======================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is in use. Trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

if (require.main === module) {
  startServer(DEFAULT_PORT);
}

module.exports = { app, server, io };
