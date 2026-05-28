import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { warehousesAtom, productsAtom, lowStockAtom, thresholdAtom, loadingAtom, errorAtom } from './atoms/inventory';
import { ProductForm } from './components/ProductForm';
import { WarehouseManager } from './components/WarehouseManager';
import { InventoryTable } from './components/InventoryTable';
import { TransferForm } from './components/TransferForm';
import { LowStockPanel } from './components/LowStockPanel';
import { ImportPanel } from './components/ImportPanel';

const API_BASE = 'http://localhost:4000';

export default function App() {
  const [warehouses, setWarehouses] = useAtom(warehousesAtom);
  const [products, setProducts] = useAtom(productsAtom);
  const [lowStock, setLowStock] = useAtom(lowStockAtom);
  const [threshold, setThreshold] = useAtom(thresholdAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [error, setError] = useAtom(errorAtom);
  const [importSummary, setImportSummary] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [warehousesResponse, productsResponse, lowStockResponse] = await Promise.all([
        fetch(`${API_BASE}/api/warehouses`),
        fetch(`${API_BASE}/api/products`),
        fetch(`${API_BASE}/api/stock/low?threshold=${threshold}`),
      ]);

      if (!warehousesResponse.ok || !productsResponse.ok || !lowStockResponse.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const warehousesData = await warehousesResponse.json();
      const productsData = await productsResponse.json();
      const lowStockData = await lowStockResponse.json();

      setWarehouses(warehousesData);
      setProducts(productsData);
      setLowStock(lowStockData);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [threshold]);

  const handleCreateWarehouse = async (warehouse) => {
    const response = await fetch(`${API_BASE}/api/warehouses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(warehouse),
    });

    if (!response.ok) {
      throw new Error('Failed to create warehouse');
    }

    await loadData();
  };

  const handleCreateProduct = async (product) => {
    const response = await fetch(`${API_BASE}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      throw new Error('Failed to create product');
    }

    await loadData();
  };

  const handleUpdateQuantity = async (productId, warehouseId, quantity) => {
    const response = await fetch(`${API_BASE}/api/stock/${productId}/${warehouseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      throw new Error('Failed to update stock');
    }

    await loadData();
  };

  const handleDeleteProduct = async (productId) => {
    const response = await fetch(`${API_BASE}/api/products/${productId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete product');
    }

    await loadData();
  };

  const handleTransfer = async (transferData) => {
    const response = await fetch(`${API_BASE}/api/stock/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transferData),
    });

    if (!response.ok) {
      throw new Error('Failed to move stock');
    }

    await loadData();
  };

  const handleImportRequest = async (csvText, commit = false) => {
    setError(null);

    const response = await fetch(`${API_BASE}/api/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv: csvText, commit }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setImportSummary({ accepted: 0, rejected: payload.rejected ?? 0, rejectedRows: payload.rejectedRows ?? [], commit });
      throw new Error(payload.error || 'Failed to import data');
    }

    const summary = {
      ...payload,
      commit,
    };

    setImportSummary(summary);

    if (commit) {
      await loadData();
    }
  };

  return (
    <div className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Simple inventory dashboard</p>
          <h1>Warehouse inventory</h1>
          <p className="subcopy">Track products, stock per warehouse, low stock alerts, and simple stock transfers.</p>
        </div>
        <div className="summary-cards">
          <div className="summary-card">
            <h2>{products.length}</h2>
            <p>Products</p>
          </div>
          <div className="summary-card">
            <h2>{warehouses.length}</h2>
            <p>Warehouses</p>
          </div>
          <div className="summary-card">
            <h2>{lowStock.length}</h2>
            <p>Low stock alerts</p>
          </div>
        </div>
      </section>

      {error && <div className="status-banner error">{error}</div>}

      <section className="grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Create stock</p>
              <h2>Add a product</h2>
            </div>
          </div>
          <ProductForm onSubmit={handleCreateProduct} warehouses={warehouses} />
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Warehouse setup</p>
              <h2>Warehouses</h2>
            </div>
          </div>
          <WarehouseManager warehouses={warehouses} onCreate={handleCreateWarehouse} />
        </div>
      </section>

      <section className="grid wide">
        <div className="panel panel-wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Live stock</p>
              <h2>Inventory overview</h2>
            </div>
            <label className="threshold-control">
              Alert threshold
              <input
                type="number"
                min="0"
                value={threshold}
                onChange={(event) => setThreshold(Number(event.target.value) || 0)}
              />
            </label>
          </div>

          {loading ? <p>Loading inventory...</p> : (
            <InventoryTable
              products={products}
              warehouses={warehouses}
              onUpdateQuantity={handleUpdateQuantity}
              onDeleteProduct={handleDeleteProduct}
              threshold={threshold}
            />
          )}
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Move inventory</p>
              <h2>Transfer stock</h2>
            </div>
          </div>
          <TransferForm warehouses={warehouses} products={products} onTransfer={handleTransfer} />
        </div>
      </section>

      <ImportPanel
        onValidate={(csvText) => handleImportRequest(csvText, false)}
        onImport={(csvText) => handleImportRequest(csvText, true)}
        summary={importSummary}
      />

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Alerts</p>
            <h2>Products below threshold</h2>
          </div>
        </div>
        <LowStockPanel lowStock={lowStock} threshold={threshold} />
      </section>
    </div>
  );
}
