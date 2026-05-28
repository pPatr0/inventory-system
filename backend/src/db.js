const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL is not set. The backend will start, but database routes will fail until it is configured.');
}

const pool = new Pool({
  connectionString,
  ssl: connectionString ? { rejectUnauthorized: false } : undefined,
});

async function initializeDatabase() {
  if (!connectionString) {
    console.warn('DATABASE_URL not configured. Skipping database schema initialization until a Neon connection string is provided.');
    return;
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schema);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'products'
          AND column_name = 'external_product_id'
      ) THEN
        ALTER TABLE products ADD COLUMN external_product_id TEXT;
      END IF;
    END $$;
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_external_product_id ON products (external_product_id)`);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'warehouses_name_unique'
      ) THEN
        ALTER TABLE warehouses ADD CONSTRAINT warehouses_name_unique UNIQUE (name);
      END IF;
    END $$;
  `);

  console.log('Database schema verified');
}

module.exports = {
  pool,
  initializeDatabase,
};
