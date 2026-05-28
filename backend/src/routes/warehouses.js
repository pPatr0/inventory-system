const express = require('express');
const { pool } = require('../db');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM warehouses ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to load warehouses', error);
    res.status(500).json({ error: 'Failed to load warehouses' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, city } = req.body;

    if (!name || !city) {
      return res.status(400).json({ error: 'Warehouse name and city are required' });
    }

    const result = await pool.query(
      'INSERT INTO warehouses (name, city) VALUES ($1, $2) RETURNING *',
      [name.trim(), city.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to create warehouse', error);
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, city } = req.body;

    if (!name || !city) {
      return res.status(400).json({ error: 'Warehouse name and city are required' });
    }

    const result = await pool.query(
      'UPDATE warehouses SET name = $1, city = $2 WHERE id = $3 RETURNING *',
      [name.trim(), city.trim(), id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update warehouse', error);
    res.status(500).json({ error: 'Failed to update warehouse' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM warehouses WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete warehouse', error);
    res.status(500).json({ error: 'Failed to delete warehouse' });
  }
});

module.exports = router;
