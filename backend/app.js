const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { listEnv } = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const cabRoutes = require('./routes/cabRoutes');
const placesRoute = require('./routes/placesRoute');
const adminRoutes = require('./routes/adminRoutes');

// CORS_ORIGIN is a comma-separated allow list. When unset every origin is allowed,
// which is fine for local development; set it in production.
const allowedOrigins = listEnv('CORS_ORIGIN');
const corsOptions = { origin: allowedOrigins.length ? allowedOrigins : true };

const app = express();
app.disable('x-powered-by');
// One proxy hop on Render and similar hosts, so req.ip is the real client
// address for the rate limiters. Trusting every hop would let a caller spoof
// X-Forwarded-For and bypass them.
app.set('trust proxy', 1);

app.use(
  helmet({
    // A JSON API on a different origin from the SPA: nothing here is ever
    // loaded as a subresource, so deny everything.
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        'default-src': ["'none'"],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'none'"],
        'form-action': ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'no-referrer' },
  })
);

app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX || 600),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// Tighter ceiling on credentials, keyed on IP plus the submitted email so one
// attacker behind a NAT cannot lock out everyone sharing that address.
// Successes count too, so a valid login cannot refill an attacker's budget.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return `${req.ip || 'unknown'}:${email}`;
  },
  message: { message: 'Too many authentication attempts, please try again in 15 minutes.' },
});

// The Google Maps proxy routes spend real money per call, so they get their own
// ceiling regardless of the global one.
const placesLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.PLACES_RATE_LIMIT_MAX || 30),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many map lookups, please slow down.' },
});

app.use(globalLimiter);

// Liveness: the process is accepting connections. Independent of Mongo, so a
// transient database blip does not make the platform restart a healthy process.
app.get('/', (req, res) => res.json({ status: 'ok', service: 'smart-cab-allocation-backend' }));
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Readiness: Mongoose reports connection state 1 only once it is usable.
app.get('/health/ready', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = states[mongoose.connection.readyState] || 'unknown';
  if (mongoose.connection.readyState === 1) {
    return res.json({ status: 'ready', database: state });
  }
  res.set('Retry-After', '30');
  return res.status(503).json({ status: 'unavailable', database: state });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/cabs', cabRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', placesLimiter, placesRoute);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// Malformed JSON bodies and other unexpected errors
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: 'Server error. Please try again later.' });
});

module.exports = { app, corsOptions };
