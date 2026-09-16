const express = require('express');
const router = express.Router();
const Board = require('../models/board');

// GET all boards
router.get('/', async (req, res) => {
  try {
    const boards = await Board.find();
    res.json(boards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new board
router.post('/', async (req, res) => {
  try {
    const board = new Board({ name: req.body.name });
    const savedBoard = await board.save();
    res.status(201).json(savedBoard);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;