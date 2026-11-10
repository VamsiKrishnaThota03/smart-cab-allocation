/**
 * Covers the hardening added alongside the bind fix.
 *
 * The listener previously came up with `server.listen(PORT)`, which binds every
 * interface, and the app had no helmet, no rate limiting and no readiness
 * probe. These tests pin the parts that are observable over HTTP; the bind
 * itself is asserted by the CI job, which inspects the listening socket.
 */
process.env.JWT_SECRET = 'test-only-secret';
process.env.AUTH_RATE_LIMIT_MAX = '3';
delete process.env.GOOGLE_MAPS_API_KEY;

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

// Without this, every query against the disconnected database sits in
// Mongoose's buffer for 10s before failing, which made the limiter test take
// 40s. The limiter runs before the handler, so failing fast changes nothing
// about what is being asserted.
mongoose.set('bufferCommands', false);

const { app } = require('../app');

let server;
let base;

before(async () => {
  // Loopback explicitly: an ephemeral port on all interfaces would briefly
  // expose the test server to the local network.
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('liveness answers without a database connection', async () => {
  // Mongo was never connected in this suite, which is the point: liveness must
  // not depend on it, or a database blip would cause a restart loop.
  assert.strictEqual(mongoose.connection.readyState, 0);

  const res = await fetch(`${base}/health`);
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.status, 'ok');
  assert.strictEqual(typeof body.uptime, 'number');
});

test('readiness reports 503 with Retry-After while Mongo is disconnected', async () => {
  const res = await fetch(`${base}/health/ready`);
  assert.strictEqual(res.status, 503);
  assert.strictEqual(res.headers.get('retry-after'), '30');
  const body = await res.json();
  assert.strictEqual(body.status, 'unavailable');
  assert.strictEqual(body.database, 'disconnected');
});

test('security headers are set and the server is not fingerprintable', async () => {
  const res = await fetch(`${base}/health`);
  assert.strictEqual(res.headers.get('x-powered-by'), null);
  assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
  assert.match(res.headers.get('content-security-policy'), /default-src 'none'/);
  assert.strictEqual(res.headers.get('referrer-policy'), 'no-referrer');
});

test('the auth limiter blocks a burst and keys on IP plus email', async () => {
  const attempt = (email) =>
    fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'wrong-password' }),
    });

  // AUTH_RATE_LIMIT_MAX is 3 for this suite.
  const victim = 'target@example.test';
  let sawLimit = false;
  for (let i = 0; i < 5; i += 1) {
    const res = await attempt(victim);
    if (res.status === 429) {
      sawLimit = true;
      break;
    }
  }
  assert.ok(sawLimit, 'expected a 429 once the auth limit was exceeded');

  // A different email from the same IP is a different bucket, so one attacker
  // cannot lock every account reachable from a shared address.
  const other = await attempt('someone-else@example.test');
  assert.notStrictEqual(other.status, 429);
});

test('rate limit responses advertise the standard headers', async () => {
  const res = await fetch(`${base}/health`);
  // draft-7 uses the combined RateLimit header rather than X-RateLimit-*.
  assert.ok(res.headers.get('ratelimit') || res.headers.get('ratelimit-limit'));
  assert.strictEqual(res.headers.get('x-ratelimit-limit'), null);
});
