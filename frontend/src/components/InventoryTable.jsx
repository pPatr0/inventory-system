import { useState } from 'react';

export function InventoryTable({ products, warehouses, onUpdateQuantity, onDeleteProduct, threshold }) {
  const [editing, setEditing] = useState({});

  const updateQuantity = async (productId, warehouseId, quantity) => {
    await onUpdateQuantity(productId, warehouseId, Number(quantity));
    setEditing((current) => ({ ...current, [warehouseId]: false }));
  };

  return (
    <div className="table-wrap">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Category</th>
            <th>Tags</th>
            <th>Warehouse stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <strong>{product.name}</strong>
              </td>
              <td>{product.price.toFixed(2)}</td>
              <td>{product.category || '—'}</td>
              <td>{product.tags.length ? product.tags.join(', ') : 'No tags'}</td>
              <td>
                <div className="stock-list">
                  {product.stock.length ? product.stock.map((entry) => (
                    <div className="stock-line" key={`${product.id}-${entry.warehouse_id}`}>
                      <span>{entry.warehouse_name} ({entry.city})</span>
                      <span className={`stock-badge ${Number(entry.quantity) < threshold ? 'alert' : ''}`}>{entry.quantity}</span>
                      <div className="edit-inline">
                        <input
                          type="number"
                          min="0"
                          value={editing[`${product.id}-${entry.warehouse_id}`] ?? entry.quantity}
                          onChange={(event) => setEditing((current) => ({
                            ...current,
                            [`${product.id}-${entry.warehouse_id}`]: Number(event.target.value),
                          }))}
                        />
                        <button
                          className="small-button"
                          onClick={() => updateQuantity(product.id, entry.warehouse_id, editing[`${product.id}-${entry.warehouse_id}`] ?? entry.quantity)}
                        >Save</button>
                      </div>
                    </div>
                  )) : <span className="muted">No stock recorded</span>}
                </div>
              </td>
              <td>
                <button className="danger-button" onClick={() => onDeleteProduct(product.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
