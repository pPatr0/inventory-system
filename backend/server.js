require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, initializeDatabase } = require('./src/db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api', (req, res, next) => {
  if (!process.env.DATABASE_URL && req.path !== '/health') {
    return res.status(503).json({
      error: 'DATABASE_URL is not configured. Add your Neon connection string to backend/.env to enable inventory routes.',
    });
  }

  next();
});

async function loadRoutes() {
  const warehousesRouter = require('./src/routes/warehouses');
  const productsRouter = require('./src/routes/products');
  const stockRouter = require('./src/routes/stock');
  const importRouter = require('./src/routes/imports');

  app.use('/api/warehouses', warehousesRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/stock', stockRouter);
  app.use('/api/import', importRouter);

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
}

async function startServer() {
  try {
    await initializeDatabase();
    await loadRoutes();

    app.listen(PORT, () => {
      console.log(`Inventory backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
