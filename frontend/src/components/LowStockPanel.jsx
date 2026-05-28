export function LowStockPanel({ lowStock, threshold }) {
  if (!lowStock.length) {
    return <p className="muted">No products below {threshold} units right now.</p>;
  }

  return (
    <div className="low-stock-list">
      {lowStock.map((entry) => (
        <div className="low-stock-item" key={`${entry.product_id}-${entry.warehouse_id}`}>
          <div>
            <strong>{entry.product_name}</strong>
            <p>{entry.warehouse_name} • {entry.city}</p>
          </div>
          <span className="stock-badge alert">{entry.quantity} units</span>
        </div>
      ))}
    </div>
  );
}
