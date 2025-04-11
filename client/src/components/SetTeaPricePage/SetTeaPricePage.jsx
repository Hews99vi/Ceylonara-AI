import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './setTeaPricePage.css';

const SetTeaPricePage = () => {
  const [price, setPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [factoryName, setFactoryName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { userId, getToken } = useAuth();

  useEffect(() => {
    fetchCurrentPrice();
  }, []);

  const fetchCurrentPrice = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      
      // Get factory profile first to get the name
      const factoryRes = await fetch(`${import.meta.env.VITE_API_URL}/api/factory/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (factoryRes.ok) {
        const factoryData = await factoryRes.json();
        setFactoryName(factoryData.factoryName);
      }
      
      // Get current price
      const priceRes = await fetch(`${import.meta.env.VITE_API_URL}/api/factory/price`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (priceRes.ok) {
        const priceData = await priceRes.json();
        setCurrentPrice(priceData.price || '');
        setPrice(priceData.price || '');
      }
    } catch (error) {
      console.error('Error fetching price data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceUpdate = async (e) => {
    e.preventDefault();
    if (!price.trim()) {
      alert('Please enter a price');
      return;
    }
    
    setIsSubmitting(true);
    setSuccessMessage('');
    
    try {
      const token = await getToken();
      
      const priceData = {
        price,
        factoryName,
        factoryId: userId,
        date: new Date().toISOString()
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/factory/price`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(priceData)
      });
      
      if (response.ok) {
        setSuccessMessage('Price updated successfully');
        setCurrentPrice(price);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Failed to update price');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Error updating price. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="setTeaPricePage">
      <h1>Set Tea Price</h1>
      <p className="subtitle">Update your factory's tea buying price for farmers</p>
      
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="priceCard current">
            <div className="cardHeader">
              <h2>Current Price</h2>
              <span className="dateLabel">As of {formatDate()}</span>
            </div>
            <div className="currentPriceDisplay">
              {currentPrice ? (
                <span className="price">Rs. {currentPrice} <span className="perKg">per kg</span></span>
              ) : (
                <span className="noPrice">No price set</span>
              )}
            </div>
          </div>
          
          <div className="priceCard update">
            <h2>Update Price</h2>
            <form onSubmit={handlePriceUpdate}>
              <div className="formGroup">
                <label htmlFor="price-input">New Price per Kilogram (Rs.)</label>
                <div className="inputWithPrefix">
                  <span className="prefix">Rs.</span>
                  <input
                    id="price-input"
                    type="number"
                    min="0"
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter new price"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
              
              {successMessage && (
                <div className="successMessage">{successMessage}</div>
              )}
              
              <button 
                type="submit" 
                className="updateButton"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Price'}
              </button>
            </form>
          </div>
          
          <div className="infoCard">
            <h3>Information</h3>
            <p>Setting a fair and competitive tea price helps farmers plan their harvests and ensures a sustainable supply chain.</p>
            <p>Your tea price will be visible to all farmers using the Ceylonara platform.</p>
          </div>
        </>
      )}
    </div>
  );
};

export default SetTeaPricePage; 