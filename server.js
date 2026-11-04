const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const app = express();

// Parse incoming JSON so POST and PUT can read req.body.
app.use(express.json());

// Reject malformed IDs before querying MongoDB.
app.param('id', (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ message: 'Invalid user ID.' });
  }
  next();
});

// Only accept the fields defined for users, never arbitrary update operators.
function userFields(body) {
  const data = {};
  for (const field of ['name', 'email', 'age']) {
    if (Object.prototype.hasOwnProperty.call(body, field)) data[field] = body[field];
  }
  return data;
}

// GET: return every user in the database.
app.get('/users', async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) { next(err); }
});

// POST: validate and save a new user, returning the created document.
app.post('/users', async (req, res, next) => {
  try {
    const user = await User.create(userFields(req.body || {}));
    res.status(201).json(user);
  } catch (err) { next(err); }
});

// PUT: edit a user by ID and return the updated document.
app.put('/users/:id', async (req, res, next) => {
  try {
    const changes = userFields(req.body || {});
    if (!Object.keys(changes).length) {
      return res.status(400).json({ message: 'Provide name, email, or age to update.' });
    }
    const user = await User.findByIdAndUpdate(req.params.id,
      { $set: changes }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json(user);
  } catch (err) { next(err); }
});

// DELETE: remove the requested user and return the removed document.
app.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ message: 'User deleted.', user });
  } catch (err) { next(err); }
});

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

// Return useful errors without exposing connection strings or internal details.
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation failed.',
      errors: Object.values(err.errors).map(error => error.message) });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body.' });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid field value.' });
  res.status(500).json({ message: 'A server error occurred.' });
});

module.exports = app;

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config/.env') });

async function startServer() {
  if (!process.env.MONGO_URI) throw new Error('Set MONGO_URI in config/.env first.');
  // Start listening only after a real database connection succeeds.
  await mongoose.connect(process.env.MONGO_URI);
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`API running at http://localhost:${port}`));
}

// Importing this file for tests does not start a server or connect to MongoDB.
if (require.main === module) {
  startServer().catch(() => {
    console.error('Could not start the API. Check config/.env and MongoDB connectivity.');
    process.exitCode = 1;
  });
}
