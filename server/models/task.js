const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  column: { type: mongoose.Schema.Types.ObjectId, ref: 'Column', required: true },
  order: { type: Number, default: 0 },
  label: {
    type: String,
    enum: ['none', 'bug', 'feature', 'idea', 'urgent'],
    default: 'none',
  },
  dueDate: { type: Date, default: null },
  ticketId: { type: String, unique: true, sparse: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
