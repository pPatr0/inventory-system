import { useState } from 'react';

export function TransferForm({ warehouses, products, onTransfer }) {
  const [productId, setProductId] = useState('');
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    await onTransfer({
      product_id: Number(productId),
      from_warehouse_id: Number(fromWarehouseId),
      to_warehouse_id: Number(toWarehouseId),
      quantity: Number(quantity),
    });

    setProductId('');
    setFromWarehouseId('');
    setToWarehouseId('');
    setQuantity('');
  };

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <label>
        Product
        <select value={productId} onChange={(event) => setProductId(event.target.value)} required>
          <option value="">Select product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </select>
      </label>

      <div className="inline-two">
        <label>
          From warehouse
          <select value={fromWarehouseId} onChange={(event) => setFromWarehouseId(event.target.value)} required>
            <option value="">Select warehouse</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
            ))}
          </select>
        </label>

        <label>
          To warehouse
          <select value={toWarehouseId} onChange={(event) => setToWarehouseId(event.target.value)} required>
            <option value="">Select warehouse</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Quantity to move
        <input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
      </label>

      <button className="primary-button" type="submit">Move stock</button>
    </form>
  );
}
