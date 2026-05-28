const express = require('express');
const { importRows } = require('../importer');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { csv, commit = false } = req.body;

    if (typeof csv !== 'string' || csv.trim().length === 0) {
      return res.status(400).json({ error: 'CSV text is required' });
    }

    const result = await importRows(csv, Boolean(commit));

    res.json({
      ...result,
      commit: Boolean(commit),
    });
  } catch (error) {
    console.error('Failed to import data', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

module.exports = router;
