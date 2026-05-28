const express = require('express');
const { pool } = require('../db');

const router = express.Router();

router.get('/low', async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 5;
    const result = await pool.query(
      `SELECT i.product_id, p.name AS product_name, p.price, p.category, i.warehouse_id, w.name AS warehouse_name, w.city, i.quantity
       FROM inventory i
       JOIN products p ON p.id = i.product_id
       JOIN warehouses w ON w.id = i.warehouse_id
       WHERE i.quantity < $1
       ORDER BY i.quantity ASC, p.name`,
      [threshold]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Failed to load low stock', error);
    res.status(500).json({ error: 'Failed to load low stock' });
  }
});

router.put('/:productId/:warehouseId', async (req, res) => {
  try {
    const { productId, warehouseId } = req.params;
    const { quantity } = req.body;

    const quantityValue = Number(quantity);
    if (Number.isNaN(quantityValue) || quantityValue < 0) {
      return res.status(400).json({ error: 'Quantity must be a non-negative number' });
    }

    const result = await pool.query(
      'INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (product_id, warehouse_id) DO UPDATE SET quantity = EXCLUDED.quantity RETURNING *',
      [productId, warehouseId, quantityValue]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update stock', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

router.post('/transfer', async (req, res) => {
  try {
    const { product_id, from_warehouse_id, to_warehouse_id, quantity } = req.body;
    const transferQuantity = Number(quantity);

    if (Number.isNaN(transferQuantity) || transferQuantity <= 0) {
      return res.status(400).json({ error: 'Transfer quantity must be a positive number' });
    }

    await pool.query('BEGIN');

    const currentStock = await pool.query(
      'SELECT quantity FROM inventory WHERE product_id = $1 AND warehouse_id = $2 FOR UPDATE',
      [product_id, from_warehouse_id]
    );

    if (currentStock.rowCount === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Source warehouse stock not found' });
    }

    const available = Number(currentStock.rows[0].quantity);
    if (available < transferQuantity) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Not enough stock to transfer' });
    }

    await pool.query(
      'UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2 AND warehouse_id = $3',
      [transferQuantity, product_id, from_warehouse_id]
    );

    await pool.query(
      'INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (product_id, warehouse_id) DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity',
      [product_id, to_warehouse_id, transferQuantity]
    );

    await pool.query('COMMIT');

    res.json({ success: true, transferred: transferQuantity, product_id, from_warehouse_id, to_warehouse_id });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Failed to transfer stock', error);
    res.status(500).json({ error: 'Failed to transfer stock' });
  }
});

module.exports = router;
