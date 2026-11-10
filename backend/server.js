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

const PORT = Number(process.env.PORT) || 5001;
// Loopback by default, so a development server is never reachable from the
// local network. Managed platforms route traffic into the container and need an
// all-interfaces bind, so they are detected by their own env markers; HOST
// overrides both.
const HOST =
  process.env.HOST ||
  (process.env.RENDER ||
  process.env.FLY_APP_NAME ||
  process.env.RAILWAY_ENVIRONMENT ||
  process.env.DYNO
    ? '0.0.0.0'
    : '127.0.0.1');

server.listen(PORT, HOST, () => console.log(`Server running on http://${HOST}:${PORT}`));

// Drain in-flight requests and close sockets when the platform replaces the
// container, so a deploy does not drop live cab-location streams abruptly.
function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  io.close(() => server.close(() => process.exit(0)));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { server, io };
