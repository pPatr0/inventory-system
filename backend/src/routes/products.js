const express = require('express');
const { pool } = require('../db');

const router = express.Router();

async function syncTags(productId, tags = []) {
  await pool.query('DELETE FROM product_tags WHERE product_id = $1', [productId]);

  if (!tags.length) {
    return;
  }

  for (const rawTag of tags) {
    const tagName = String(rawTag).trim();
    if (!tagName) continue;

    const tagResult = await pool.query(
      'INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
      [tagName]
    );

    await pool.query(
      'INSERT INTO product_tags (product_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [productId, tagResult.rows[0].id]
    );
  }
}

router.get('/', async (_req, res) => {
  try {
    const productsResult = await pool.query('SELECT * FROM products ORDER BY name');
    const tagsResult = await pool.query(
      'SELECT pt.product_id, t.name FROM product_tags pt JOIN tags t ON t.id = pt.tag_id ORDER BY pt.product_id, t.name'
    );
    const inventoryResult = await pool.query(
      'SELECT i.product_id, i.warehouse_id, w.name AS warehouse_name, w.city, i.quantity FROM inventory i JOIN warehouses w ON w.id = i.warehouse_id ORDER BY i.product_id, w.name'
    );

    const tagsByProduct = new Map();
    tagsResult.rows.forEach((row) => {
      if (!tagsByProduct.has(row.product_id)) {
        tagsByProduct.set(row.product_id, []);
      }
      tagsByProduct.get(row.product_id).push(row.name);
    });

    const stockByProduct = new Map();
    inventoryResult.rows.forEach((row) => {
      if (!stockByProduct.has(row.product_id)) {
        stockByProduct.set(row.product_id, []);
      }
      stockByProduct.get(row.product_id).push({
        warehouse_id: row.warehouse_id,
        warehouse_name: row.warehouse_name,
        city: row.city,
        quantity: Number(row.quantity),
      });
    });

    const products = productsResult.rows.map((product) => ({
      ...product,
      price: Number(product.price),
      tags: tagsByProduct.get(product.id) || [],
      stock: stockByProduct.get(product.id) || [],
    }));

    res.json(products);
  } catch (error) {
    console.error('Failed to load products', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, price, category, tags = [], warehouse_id, initial_quantity = 0, external_product_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const productResult = await pool.query(
      'INSERT INTO products (name, price, category, external_product_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name.trim(), Number(price) || 0, category?.trim() || null, external_product_id?.trim() || null]
    );

    const product = productResult.rows[0];
    await syncTags(product.id, tags);

    if (warehouse_id) {
      await pool.query(
        'INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (product_id, warehouse_id) DO UPDATE SET quantity = EXCLUDED.quantity',
        [product.id, warehouse_id, Number(initial_quantity) || 0]
      );
    }

    const combinedProduct = {
      ...product,
      price: Number(product.price),
      tags,
      stock: warehouse_id ? [{ warehouse_id, quantity: Number(initial_quantity) || 0 }] : [],
    };

    res.status(201).json(combinedProduct);
  } catch (error) {
    console.error('Failed to create product', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'A product with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, tags = [], external_product_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const result = await pool.query(
      'UPDATE products SET name = $1, price = $2, category = $3, external_product_id = $4 WHERE id = $5 RETURNING *',
      [name.trim(), Number(price) || 0, category?.trim() || null, external_product_id?.trim() || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = result.rows[0];
    await syncTags(product.id, tags);

    res.json({
      ...product,
      price: Number(product.price),
      tags,
    });
  } catch (error) {
    console.error('Failed to update product', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'A product with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete product', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
