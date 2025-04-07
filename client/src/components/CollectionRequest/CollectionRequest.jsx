import React, { useState } from 'react';
import './collectionRequest.css';

const CollectionRequest = () => {
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState('');

  const submitRequest = (e) => {
    e.preventDefault();
    // Add API call to submit request
  };

  return (
    <div className="collectionRequest">
      <h2>Request Tea Collection</h2>
      <form onSubmit={submitRequest}>
        <div className="formGroup">
          <label>Select Factory</label>
          <select 
            value={selectedFactory}
            onChange={(e) => setSelectedFactory(e.target.value)}
          >
            <option value="">Choose a factory</option>
            {factories.map(factory => (
              <option key={factory.id} value={factory.id}>
                {factory.name} - {factory.price}LKR/kg
              </option>
            ))}
          </select>
        </div>

        <div className="formGroup">
          <label>Quantity (kg)</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className="formGroup">
          <label>Collection Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <button type="submit">Submit Request</button>
      </form>
    </div>
  );
};

export default CollectionRequest;