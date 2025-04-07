import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './teaPricesPage.css';

const TeaPricesPage = () => {
  const [price, setPrice] = useState('');
  const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const { getToken } = useAuth();
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Get current price on component mount
  useEffect(() => {
    fetchCurrentPrice();
  }, [month]);
  
  const fetchCurrentPrice = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/factory/price?month=${month}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPrice(data.price || '');
      } else {
        console.error('Failed to fetch current price');
      }
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  };
  
  const handlePriceUpdate = async (e) => {
    e.preventDefault();
    
    if (!price.trim()) {
      alert('Please enter a price');
      return;
    }
    
    setIsUpdating(true);
    setUpdateSuccess(false);
    
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/factory/price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ price, month })
      });
      
      if (response.ok) {
        setUpdateSuccess(true);
        setTimeout(() => {
          setUpdateSuccess(false);
        }, 3000);
      } else {
        alert('Failed to update price. Please try again.');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Failed to update price. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="teaPricesPage">
      <h2>Set Tea Prices</h2>
      <p className="subheading">Manage the price of tea for farmers this month</p>
      
      {updateSuccess && (
        <div className="successMessage">
          Price updated successfully!
        </div>
      )}
      
      <form onSubmit={handlePriceUpdate}>
        <div className="formGroup">
          <label htmlFor="month-select">Month</label>
          <select
            id="month-select"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="monthSelect"
          >
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        
        <div className="formGroup">
          <label htmlFor="price-input">Price per Kilogram (LKR)</label>
          <div className="priceInputContainer">
            <input
              id="price-input"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price per kg"
              className="priceInput"
              min="0"
              step="0.01"
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="updateButton"
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating...' : 'Update Price'}
        </button>
      </form>
      
      <div className="priceInfoCard">
        <h3>Current Price Information</h3>
        <p>The current tea price for {month} is: <span className="highlight">{price ? `LKR ${price}/kg` : 'Not set'}</span></p>
        <p className="infoText">Setting a fair price helps farmers plan their work and ensures a sustainable supply chain for your factory.</p>
      </div>
    </div>
  );
};

export default TeaPricesPage; 