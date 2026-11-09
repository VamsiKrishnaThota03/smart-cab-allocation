const http = require('http');
const { Server } = require('socket.io');
const { requireEnv } = require('./config/env');
const connectDB = require('./config/db');
const { app, corsOptions } = require('./app');

// Fail fast if required configuration is missing.
try {
  requireEnv('MONGO_URI');
  requireEnv('JWT_SECRET');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
if (!process.env.GOOGLE_MAPS_API_KEY) {
  console.warn('GOOGLE_MAPS_API_KEY is not set: /api/places, /api/place-details and /api/geocode will return 503.');
}

const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });

// Relays cab location updates to every connected client.
io.on('connection', (socket) => {
  socket.on('cabLocationUpdate', (data) => {
    io.emit('cabLocationUpdate', data);
  });
});

connectDB();

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
