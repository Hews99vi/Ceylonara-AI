import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import './setTeaPricePage.css';

const SetTeaPricePage = () => {
  const [price, setPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [factoryName, setFactoryName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [averagePrice, setAveragePrice] = useState(null);
  const { userId, getToken } = useAuth();

  useEffect(() => {
    fetchCurrentPrice();
    fetchAveragePrice();
  }, []);

  const fetchAveragePrice = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/tea-prices/average`
      );

      if (response.data.success) {
        setAveragePrice(response.data.averagePrice);
      } else {
        console.error("Failed to fetch average price");
        setAveragePrice(null);
      }
    } catch (error) {
      console.error("Error fetching average price:", error);
      setAveragePrice(null);
    }
  };

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
      setErrorMessage('Please enter a price');
      return;
    }

    if (averagePrice && parseFloat(price) < averagePrice) {
      setErrorMessage(`Price cannot be lower than the Tea Board's minimum average price of Rs. ${averagePrice.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

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
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to update price');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      setErrorMessage('Error updating price. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="setTeaPricePage">
      <div className="pageHeader">
        <h1>Set Tea Price</h1>
        <p className="subtitle">Update your factory's tea buying price for farmers</p>
      </div>

      {averagePrice !== null && (
        <div className="minimumPriceAlert">
          <div className="alertIcon">ℹ️</div>
          <div className="alertContent">
            <h4 className="alertHeading">Minimum Price Notice</h4>
            <div className="alertMessage">
              The Tea Board has set a minimum average price of{' '}
              <span className="alertPrice">Rs. {averagePrice.toFixed(2)}</span>
              {' '}for this month. You cannot set your price below this amount.
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="priceContainer">
            <div className="currentPriceBox">
              <h2>Current Price</h2>
              <p className="date">As of {new Date().toLocaleDateString()}</p>
              <p className="price">
                Rs. {currentPrice || '0.00'}
                <span className="perKg">per kg</span>
              </p>
            </div>

            <div className="priceCard update">
              <h2>Update Price</h2>
              <form onSubmit={handlePriceUpdate}>
                <div className="formGroup">
                  <label htmlFor="price-input">New Price per Kilogram</label>
                  <div className="inputWithPrefix">
                    <span className="prefix">Rs.</span>
                    <input
                      id="price-input"
                      type="number"
                      min={averagePrice || 0}
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Enter new price"
                      required
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="errorMessage">{errorMessage}</div>
                )}

                {successMessage && (
                  <div className="successMessage">{successMessage}</div>
                )}

                <button
                  type="submit"
                  className="updatePriceBtn"
                  style={{ backgroundColor: '#4CAF50' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Price'}
                </button>
              </form>
            </div>
          </div>

          <div className="infoCard">
            <h3>Information</h3>
            <p>
              Setting a fair and competitive tea price helps farmers plan their harvests 
              and ensures a sustainable supply chain for all parties involved.
            </p>
            <p>
              Your tea price will be visible to all farmers using the Ceylonara platform, 
              helping them make informed decisions about their tea leaf sales.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default SetTeaPricePage;