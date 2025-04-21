import React, { useState, useEffect } from 'react';
import './AveragePriceDisplay.css';
import axios from 'axios';

const AveragePriceDisplay = ({ averagePrice: propAveragePrice, month: propMonth, year: propYear }) => {
  const [averagePrice, setAveragePrice] = useState(null);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If props are passed, use them directly
    if (propAveragePrice !== undefined) {
      setAveragePrice(propAveragePrice);
      if (propMonth) setMonth(propMonth);
      if (propYear) setYear(propYear);
    } else {
      // Otherwise fetch from API
      fetchAveragePrice();
    }
  }, [propAveragePrice, propMonth, propYear]);

  const fetchAveragePrice = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/tea-prices/average`);
      
      if (response.data && response.data.success) {
        setAveragePrice(response.data.averagePrice);
        setMonth(response.data.monthName);
        setYear(response.data.year);
      }
    } catch (error) {
      console.error('Error fetching average price:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format the price to always show 2 decimal places
  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(parseFloat(price))) {
      return '0.00';
    }
    return parseFloat(price).toFixed(2);
  };

  return (
    <div className="average-price-card">
      <div className="price-header">
        <div className="tea-board-logo">TB</div>
        <div className="price-title">
          <h3>Tea Board Minimum Price</h3>
          <p>{month} {year}</p>
        </div>
      </div>
      
      <div className="price-amount">
        <span className="currency">Rs.</span>
        <span className="amount">{formatPrice(averagePrice)}</span>
        <span className="unit">per kg</span>
      </div>
      
      <div className="price-info">
        <p>
          This is the minimum average price set by the Sri Lankan Tea Board. 
          All factories must offer prices equal to or above this amount.
        </p>
      </div>
    </div>
  );
};

export default AveragePriceDisplay;