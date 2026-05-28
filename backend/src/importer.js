const { parse } = require('csv-parse/sync');
const { pool } = require('./db');

function normalizeNumber(value) {
  const cleaned = String(value ?? '').trim().replace(/[$€]/g, '').replace(/\s+/g, '');

  if (!cleaned) {
    return null;
  }

  const normalized = cleaned.includes(',') && !cleaned.includes('.')
    ? cleaned.replace(/,/g, '.')
    : cleaned.replace(/,/g, '');

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeString(value) {
  return String(value ?? '').trim();
}

function parseImportText(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const dataLines = lines.slice(1);

  return dataLines
    .map((line, index) => ({ index, line }))
    .map(({ index, line }) => {
      const delimiter = line.includes(';') ? ';' : ',';

      let record;
      try {
        record = parse(line, {
          delimiter,
          relaxQuotes: true,
          trim: true,
          columns: false,
        });
      } catch (error) {
        return {
          lineNumber: index + 2,
          raw: line,
          error: `CSV parse error: ${error.message}`,
        };
      }

      const parsedRecord = Array.isArray(record) && Array.isArray(record[0]) ? record[0] : record;

      if (parsedRecord.length !== 6) {
        return {
          lineNumber: index + 2,
          raw: parsedRecord,
          error: `Expected 6 columns, received ${parsedRecord.length}`,
        };
      }

      const [productId, productName, warehouse, quantityRaw, priceRaw, categoryRaw] = parsedRecord;
      const quantity = normalizeNumber(quantityRaw);
      const price = normalizeNumber(priceRaw);

      if (!productId || !productName || !warehouse) {
        return {
          lineNumber: index + 2,
          raw: record,
          error: 'product_id, product_name, and warehouse are required',
        };
      }

      if (quantity === null || Number.isNaN(quantity) || !Number.isInteger(quantity) || quantity < 0) {
        return {
          lineNumber: index + 2,
          raw: record,
          error: 'quantity must be a non-negative integer',
        };
      }

      if (price === null || Number.isNaN(price) || price < 0) {
        return {
          lineNumber: index + 2,
          raw: record,
          error: 'price must be a non-negative number',
        };
      }

      return {
        lineNumber: index + 2,
        row: {
          product_id: normalizeString(productId),
          product_name: normalizeString(productName),
          warehouse: normalizeString(warehouse),
          quantity,
          price,
          category: normalizeString(categoryRaw) || null,
        },
      };
    });
}

async function ensureWarehouse(warehouseName) {
  const existingWarehouse = await pool.query('SELECT id FROM warehouses WHERE name = $1 LIMIT 1', [warehouseName]);

  if (existingWarehouse.rowCount > 0) {
    return existingWarehouse.rows[0].id;
  }

  const createdWarehouse = await pool.query(
    'INSERT INTO warehouses (name, city) VALUES ($1, $2) RETURNING id',
    [warehouseName, warehouseName]
  );

  return createdWarehouse.rows[0].id;
}

async function importRows(csvText, commit = false) {
  const parsed = parseImportText(csvText);
  const validRows = parsed.filter((entry) => entry.row);
  const rejectedRows = parsed.filter((entry) => entry.error);

  if (!commit) {
    return {
      accepted: validRows.length,
      rejected: rejectedRows.length,
      rejectedRows,
      validRows,
    };
  }

  const acceptedRows = [];

  for (const entry of validRows) {
    const { row } = entry;
    const warehouseId = await ensureWarehouse(row.warehouse);

    const productResult = await pool.query(
      `INSERT INTO products (name, price, category, external_product_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (name) DO UPDATE
       SET price = EXCLUDED.price,
           category = EXCLUDED.category,
           external_product_id = COALESCE(products.external_product_id, EXCLUDED.external_product_id)
       RETURNING id, name, external_product_id`,
      [row.product_name, row.price, row.category, row.product_id]
    );

    const product = productResult.rows[0];

    await pool.query(
      `INSERT INTO inventory (product_id, warehouse_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (product_id, warehouse_id)
       DO UPDATE SET quantity = EXCLUDED.quantity`,
      [product.id, warehouseId, row.quantity]
    );

    acceptedRows.push({
      lineNumber: entry.lineNumber,
      product_id: row.product_id,
      product_name: row.product_name,
      warehouse: row.warehouse,
      quantity: row.quantity,
      price: row.price,
      category: row.category,
      product_id_db: product.id,
    });
  }

  return {
    accepted: acceptedRows.length,
    rejected: rejectedRows.length,
    rejectedRows,
    acceptedRows,
  };
}

module.exports = {
  parseImportText,
  importRows,
};
