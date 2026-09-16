// One-time script: gives every existing task without a ticketId a
// TASK-N id, using the same shared counter that new tasks use — so
// numbering continues correctly afterwards instead of colliding.
//
// Run once from the server folder:
//   node scripts/backfill-ticket-ids.js

const { webcrypto } = require('node:crypto');
globalThis.crypto ??= webcrypto;

const mongoose = require('mongoose');
require('dotenv').config();

const Task = require('../models/task');
const Counter = require('../models/counter');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const tasksMissingId = await Task.find({
    $or: [{ ticketId: { $exists: false } }, { ticketId: null }],
  }).sort('createdAt');

  if (tasksMissingId.length === 0) {
    console.log('Nothing to do — every task already has a ticket ID.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${tasksMissingId.length} task(s) without a ticket ID. Assigning...`);

  for (const task of tasksMissingId) {
    const counter = await Counter.findOneAndUpdate(
      { _id: 'task' },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    task.ticketId = `TASK-${counter.seq}`;
    await task.save();
    console.log(`  "${task.title}" -> ${task.ticketId}`);
  }

  console.log('Done.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
