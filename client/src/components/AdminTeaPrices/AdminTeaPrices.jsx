import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import './AdminTeaPrices.css';

const AdminTeaPrices = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [newPrice, setNewPrice] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { getToken } = useAuth();

  const years = Array.from({length: 5}, (_, i) => (new Date().getFullYear() + i - 2));

  useEffect(() => {
    fetchAveragePrices();
  }, [year]);

  const fetchAveragePrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/tea-prices/averages?year=${year}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setPrices(response.data.prices);
    } catch (err) {
      console.error('Error fetching average tea prices:', err);
      setError('Failed to fetch tea price data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newPrice || parseFloat(newPrice) <= 0) {
      setErrorMessage('Please enter a valid price greater than 0');
      return;
    }

    setSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const token = await getToken();
      const parsedPrice = parseFloat(newPrice);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/set-average-price`,
        {
          price: parsedPrice,
          month: selectedMonth,
          year: year,
          notes: "Set via Admin Dashboard"
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setSuccessMessage(`Successfully set average price for ${getMonthName(selectedMonth)} ${year}`);
      setNewPrice('');
      
      // Refresh prices data
      fetchAveragePrices();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error setting average price:', err);
      setErrorMessage('Failed to set average price: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const getMonthName = (monthNumber) => {
    return new Date(2000, monthNumber - 1, 1).toLocaleString('default', { month: 'long' });
  };

  const getFormattedDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const isCurrentMonth = (monthNumber) => {
    const now = new Date();
    return monthNumber === now.getMonth() + 1 && year === now.getFullYear();
  };

  return (
    <div className="admin-tea-prices">
      <div className="section-header">
        <h2>Average Tea Prices Management</h2>
        <p className="section-description">
          Set and manage monthly average tea prices that factories must adhere to.
        </p>
      </div>

      <div className="year-selector">
        <label>Select Year:</label>
        <select 
          value={year} 
          onChange={(e) => setYear(parseInt(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button onClick={fetchAveragePrices} className="refresh-btn">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading tea price data...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="prices-table-container">
          <table className="prices-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Average Price (Rs.)</th>
                <th>Last Updated</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((price) => (
                <tr 
                  key={price.month} 
                  className={isCurrentMonth(price.month) ? 'current-month' : ''}
                  onClick={() => setSelectedMonth(price.month)}
                >
                  <td>{price.monthName}</td>
                  <td>
                    {price.price !== null && price.price !== undefined ? (
                      <span className="price-value">Rs. {parseFloat(price.price).toFixed(2)}</span>
                    ) : (
                      <span className="not-set">Not Set</span>
                    )}
                  </td>
                  <td>{price.setAt ? getFormattedDate(price.setAt) : 'Never'}</td>
                  <td>
                    {isCurrentMonth(price.month) ? (
                      <span className="current-indicator">Current</span>
                    ) : price.price ? (
                      <span className="set-indicator">Set</span>
                    ) : (
                      <span className="not-set-indicator">Not Set</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="set-price-form">
        <h3>Set Average Price</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Month:</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                {prices.map((price) => (
                  <option key={price.month} value={price.month}>
                    {price.monthName} {isCurrentMonth(price.month) ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Average Price (Rs.):</label>
              <div className="price-input">
                <span className="price-prefix">Rs.</span>
                <input 
                  type="number" 
                  value={newPrice} 
                  onChange={(e) => setNewPrice(e.target.value)}
                  min="0.01"
                  step="0.01"
                  placeholder="Enter tea price per kg"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Set Price'}
              </button>
            </div>
          </div>

          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}
          
          {errorMessage && (
            <div className="error-message">{errorMessage}</div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminTeaPrices;