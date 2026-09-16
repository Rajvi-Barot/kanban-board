const express = require('express');
const router = express.Router();
const Task = require('../models/task');

// GET all tasks for a specific column
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ column: req.query.column });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new task
router.post('/', async (req, res) => {
  try {
    const task = new Task({
      title: req.body?.title,
      description: req.body?.description,
      column: req.body?.column,
    });
    const savedTask = await task.save();
    req.app.get('io').emit('task:created', savedTask);
    res.status(201).json(savedTask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT (update) a task by id — also used to move it to a different column
router.put('/:id', async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body?.title,
        description: req.body?.description,
        column: req.body?.column,
        order: req.body?.order,
      },
      { new: true }
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
