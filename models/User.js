const mongoose = require('mongoose');

// Define the shape and validation rules for each user document.
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address.'] },
  age: { type: Number, min: 0 }
});

module.exports = mongoose.model('User', userSchema);
