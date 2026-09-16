const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const Counter = require('../models/counter');

async function nextTicketId() {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'task' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return `TASK-${counter.seq}`;
}

// GET all tasks for a specific column
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ column: req.query.column }).populate(
      'assignee',
      'username'
    );
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new task
router.post('/', async (req, res) => {
  try {
    const ticketId = await nextTicketId();
    const task = new Task({
      title: req.body?.title,
      description: req.body?.description,
      column: req.body?.column,
      label: req.body?.label,
      dueDate: req.body?.dueDate || null,
      assignee: req.body?.assignee || null,
      ticketId,
    });
    const savedTask = await task.save();
    const populatedTask = await savedTask.populate('assignee', 'username');
    req.app.get('io').emit('task:created', populatedTask);
    res.status(201).json(populatedTask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT (update) a task by id — also used to move it to a different column
router.put('/:id', async (req, res) => {
  try {
    const updates = {};
    for (const field of ['title', 'description', 'column', 'order', 'label', 'dueDate', 'assignee']) {
      if (req.body?.[field] !== undefined) updates[field] = req.body[field];
    }
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updates, { new: true }).populate(
      'assignee',
      'username'
    );
    req.app.get('io').emit('task:updated', updatedTask);
    res.json(updatedTask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a task by id
router.delete('/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    req.app.get('io').emit('task:deleted', { _id: req.params.id });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
