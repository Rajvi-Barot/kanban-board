const express = require('express');
const router = express.Router();
const Column = require('../models/column');

// GET all columns for a specific board
router.get('/', async (req, res) => {
  try {
    const columns = await Column.find({ board: req.query.board });
    res.json(columns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new column
router.post('/', async (req, res) => {
  try {
    const column = new Column({
      name: req.body?.name,
      board: req.body?.board,
    });
    const savedColumn = await column.save();
    res.status(201).json(savedColumn);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT (update) a column by its id
router.put('/:id', async (req, res) => {
  try {
    const updatedColumn = await Column.findByIdAndUpdate(
      req.params.id,
      { name: req.body?.name },
      { new: true }
    );
    res.json(updatedColumn);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a column by its id
router.delete('/:id', async (req, res) => {
  try {
    await Column.findByIdAndDelete(req.params.id);
    res.json({ message: 'Column deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;