const mongoose = require('mongoose');

// A single shared counter for generating short human-readable ticket IDs
// (TASK-1, TASK-2, ...). findOneAndUpdate with $inc is atomic, so this is
// safe even if two tasks are created at the same instant.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
