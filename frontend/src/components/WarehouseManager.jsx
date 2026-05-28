import { useState } from 'react';

export function WarehouseManager({ warehouses, onCreate }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onCreate({ name, city });
    setName('');
    setCity('');
  };

  return (
    <div className="stack">
      <form className="form-stack" onSubmit={handleSubmit}>
        <label>
          Warehouse name
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>

        <label>
          City
          <input value={city} onChange={(event) => setCity(event.target.value)} required />
        </label>

        <button className="primary-button" type="submit">Add warehouse</button>
      </form>

      <div className="mini-list">
        {warehouses.map((warehouse) => (
          <div className="mini-item" key={warehouse.id}>
            <div>
              <strong>{warehouse.name}</strong>
              <p>{warehouse.city}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
