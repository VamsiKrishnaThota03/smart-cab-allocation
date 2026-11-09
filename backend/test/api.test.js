// Smoke tests that exercise auth and validation without a database.
process.env.JWT_SECRET = 'test-only-secret';
delete process.env.GOOGLE_MAPS_API_KEY;

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const { app } = require('../app');

let server;
let base;
const token = (isAdmin) => jwt.sign({ userId: '64b000000000000000000001', isAdmin }, process.env.JWT_SECRET);

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const call = (path, { method = 'GET', headers = {}, body } = {}) =>
  fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body && JSON.stringify(body),
  });

test('health check responds', async () => {
  const res = await call('/');
  assert.strictEqual(res.status, 200);
});

test('adding a cab requires a token', async () => {
  const res = await call('/api/cabs/addCab', { method: 'POST', body: {} });
  assert.strictEqual(res.status, 401);
});

test('adding a cab requires an admin', async () => {
  const res = await call('/api/cabs/addCab', { method: 'POST', headers: { 'auth-token': token(false) }, body: {} });
  assert.strictEqual(res.status, 403);
});

test('admin cab payload is validated', async () => {
  const res = await call('/api/cabs/addCab', {
    method: 'POST',
    headers: { 'auth-token': token(true) },
    body: { name: 'A', phone: '1', email: 'a@b.co', latitude: 'abc', longitude: 10 },
  });
  assert.strictEqual(res.status, 400);
});

test('ending a trip requires a token', async () => {
  const res = await call('/api/cabs/endTrip/64b000000000000000000002', { method: 'POST', body: {} });
  assert.strictEqual(res.status, 401);
});

test('invalid cab ids are rejected before hitting the database', async () => {
  const res = await call('/api/cabs/bookCab/not-an-id', { method: 'POST', headers: { 'auth-token': token(false) } });
  assert.strictEqual(res.status, 400);
});

test('user listing is admin only', async () => {
  const res = await call('/api/admin/users', { headers: { 'auth-token': token(false) } });
  assert.strictEqual(res.status, 403);
});

test('a forged token is rejected', async () => {
  const forged = jwt.sign({ userId: 'x', isAdmin: true }, 'wrong-secret');
  const res = await call('/api/admin/users', { headers: { 'auth-token': forged } });
  assert.strictEqual(res.status, 401);
});

test('geocode proxy needs a login and reports a missing key', async () => {
  assert.strictEqual((await call('/api/geocode?lat=1&lng=2')).status, 401);
  const res = await call('/api/geocode?lat=1&lng=2', { headers: { 'auth-token': token(false) } });
  assert.strictEqual(res.status, 503);
});

test('register validates input', async () => {
  const res = await call('/api/auth/register', { method: 'POST', body: { name: 'ab', email: 'bad', password: '1' } });
  assert.strictEqual(res.status, 400);
});
