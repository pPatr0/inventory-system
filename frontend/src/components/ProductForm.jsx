import { useState } from 'react';

export function ProductForm({ onSubmit, warehouses }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    await onSubmit({
      name,
      price: Number(price) || 0,
      category: category || null,
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      warehouse_id: warehouseId ? Number(warehouseId) : null,
      initial_quantity: Number(initialQuantity) || 0,
    });

    setName('');
    setPrice('');
    setCategory('');
    setTags('');
    setWarehouseId('');
    setInitialQuantity('');
  };

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <label>
        Product name
        <input value={name} onChange={(event) => setName(event.target.value)} required />
      </label>

      <div className="inline-two">
        <label>
          Price
          <input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required />
        </label>

        <label>
          Category
          <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Optional" />
        </label>
      </div>

      <label>
        Tags
        <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="summer, frozen, shelf" />
      </label>

      <div className="inline-two">
        <label>
          Starting warehouse
          <select value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)}>
            <option value="">No warehouse yet</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.city})</option>
            ))}
          </select>
        </label>

        <label>
          Starting quantity
          <input type="number" min="0" value={initialQuantity} onChange={(event) => setInitialQuantity(event.target.value)} />
        </label>
      </div>

      <button className="primary-button" type="submit">Add product</button>
    </form>
  );
}
