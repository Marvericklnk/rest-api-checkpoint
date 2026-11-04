const { test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');
const User = require('../models/User');

test('HTTP routes call Mongoose and return correct responses (mock database)', async t => {
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://localhost:${server.address().port}`;
  const id = '507f1f77bcf86cd799439011';
  const user = { _id: id, name: 'Alex', email: 'alex@example.com', age: 25 };
  t.mock.method(User, 'find', async () => [user]);
  t.mock.method(User, 'create', async data => {
    assert.deepEqual(data, { name: 'Alex', email: 'alex@example.com', age: 25 });
    return user;
  });
  t.mock.method(User, 'findByIdAndUpdate', async (key, changes, options) => {
    assert.equal(key, id); assert.deepEqual(changes, { $set: { age: 26 } });
    assert.deepEqual(options, { new: true, runValidators: true });
    return { ...user, age: 26 };
  });
  t.mock.method(User, 'findByIdAndDelete', async key => { assert.equal(key, id); return user; });
  const request = (url, method, body) => fetch(base + url, {
    method, headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const all = await request('/users', 'GET');
  assert.equal(all.status, 200); assert.deepEqual(await all.json(), [user]);
  const created = await request('/users', 'POST', { name: 'Alex', email: 'alex@example.com', age: 25, ignored: true });
  assert.equal(created.status, 201); assert.deepEqual(await created.json(), user);
  const updated = await request('/users/' + id, 'PUT', { age: 26 });
  assert.equal(updated.status, 200); assert.equal((await updated.json()).age, 26);
  assert.equal((await request('/users/' + id, 'DELETE')).status, 200);
  assert.equal((await request('/users/bad-id', 'DELETE')).status, 400);
  assert.equal((await request('/users/' + id, 'PUT', {})).status, 400);
  User.findByIdAndDelete.mock.mockImplementation(async () => null);
  assert.equal((await request('/users/' + id, 'DELETE')).status, 404);
  User.find.mock.mockImplementation(async () => { throw new Error('private details'); });
  const failure = await request('/users', 'GET');
  assert.equal(failure.status, 500); assert.deepEqual(await failure.json(), { message: 'A server error occurred.' });
});

test('User schema requires name/email and validates email and age', () => {
  const errors = new User({ email: 'bad', age: -1 }).validateSync().errors;
  assert.ok(errors.name); assert.ok(errors.email); assert.ok(errors.age);
  assert.equal(new User({ name: 'Alex', email: 'alex@example.com', age: 25 }).validateSync(), undefined);
});
