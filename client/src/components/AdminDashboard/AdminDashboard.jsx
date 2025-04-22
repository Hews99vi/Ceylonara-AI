import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfo, FaHistory, FaChartLine } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import './AdminDashboard.css';
import AdminStatistics from '../AdminStatistics/AdminStatistics';

const AdminDashboard = () => {
  const [averagePrice, setAveragePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [factoryPrices, setFactoryPrices] = useState([]);
  const [pricesHistory, setPricesHistory] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState('current');
  const [historyLoading, setHistoryLoading] = useState(false);
  const { getToken } = useAuth();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() + i - 2);

  useEffect(() => {
    fetchCurrentAveragePrice();
    fetchFactoryPrices();
  }, [selectedMonth, selectedYear]);

  const fetchCurrentAveragePrice = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/average-price?month=${selectedMonth + 1}&year=${selectedYear}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data && response.data.price) {
        setCurrentPrice(response.data.price);
      } else {
        setCurrentPrice(null);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching average price:', err);
      setError('Failed to fetch current average price. ' + (err.response?.data?.error || ''));
      setCurrentPrice(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchFactoryPrices = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/prices`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Sort prices and convert to numbers for comparison
      const formattedPrices = response.data.map(price => ({
        ...price,
        price: parseFloat(price.price)
      })).sort((a, b) => a.price - b.price);
      
      setFactoryPrices(formattedPrices);
    } catch (err) {
      console.error('Error fetching factory prices:', err);
    }
  };

  const handleSetAveragePrice = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    if (!averagePrice || averagePrice <= 0) {
      setError('Please enter a valid price greater than 0');
      setLoading(false);
      return;
    }

    try {
      console.log(`Setting average price: ${averagePrice} for month: ${selectedMonth + 1}, year: ${selectedYear}`);
      
      const token = await getToken();
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/set-average-price`, 
        {
          price: parseFloat(averagePrice),
          month: selectedMonth + 1,
          year: selectedYear
        }, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log("Set average price response:", response.data);
      
      setSuccess(true);
      fetchCurrentAveragePrice();
      fetchFactoryPrices();
      setAveragePrice('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error setting average price:', err);
      console.error('Error response:', err.response?.data);
      setError('Failed to set average price: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const viewPriceHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = await getToken();
      
      // This is a placeholder - you'd need to implement this API endpoint
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/price-history?year=${selectedYear}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setPricesHistory(response.data);
      setViewMode('history');
    } catch (err) {
      console.error('Error fetching price history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const isCurrentMonthAndYear = () => {
    const now = new Date();
    return selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
  };

  const isLowPriceFactory = (price) => {
    return currentPrice && price < currentPrice;
  };

  const getStatusBadge = (factoryPrice) => {
    if (!currentPrice) return null;
    
    const difference = factoryPrice - currentPrice;
    const percentage = (difference / currentPrice) * 100;
    
    if (factoryPrice < currentPrice) {
      return (
        <span className="price-warning">
          <FaExclamationTriangle />
          Below Minimum (Rs. {Math.abs(difference).toFixed(2)} less)
        </span>
      );
    } else if (percentage <= 5) {
      return (
        <span className="price-minimum">
          <FaInfo />
          At Minimum
        </span>
      );
    } else {
      return (
        <span className="price-approved">
          <FaCheckCircle />
          Above Minimum (+{percentage.toFixed(1)}%)
        </span>
      );
    }
  };

  return (
    <div className="admin-dashboard full-width">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p className="subtitle">Sri Lankan Tea Board Control Panel</p>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${viewMode === 'current' ? 'active' : ''}`}
          onClick={() => setViewMode('current')}
        >
          Current Prices
        </button>
        <button 
          className={`tab-button ${viewMode === 'history' ? 'active' : ''}`}
          onClick={viewPriceHistory}
          disabled={historyLoading}
        >
          {historyLoading ? 'Loading...' : 'Price History'}
        </button>
        <button 
          className={`tab-button ${viewMode === 'analytics' ? 'active' : ''}`}
          onClick={() => setViewMode('analytics')}
        >
          <FaChartLine /> Analytics
        </button>
      </div>

      {viewMode === 'current' && (
        <>
          <div className="dashboard-card">
            <h2>Set Average Tea Price</h2>
            <p className="description">
              Set the minimum average price for tea leaves that factories must adhere to.
              Factories cannot offer prices lower than this amount.
            </p>

            <div className="date-selector">
              <div className="select-container">
                <label>Month:</label>
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>{month}</option>
                  ))}
                </select>
              </div>
              <div className="select-container">
                <label>Year:</label>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {currentPrice ? (
              <div className="current-price">
                <h3>Current Average Price for {months[selectedMonth]} {selectedYear}</h3>
                <div className="price-display">Rs. {currentPrice.toFixed(2)} per kg</div>
              </div>
            ) : !loading && (
              <div className="no-price">
                <p>No average price has been set for {months[selectedMonth]} {selectedYear}</p>
              </div>
            )}

            {isCurrentMonthAndYear() && (
              <form onSubmit={handleSetAveragePrice} className="price-form">
                <div className="form-group">
                  <label htmlFor="averagePrice">New Average Price (Rs. per kg):</label>
                  <div className="input-with-prefix">
                    <span className="input-prefix">Rs.</span>
                    <input
                      type="number"
                      id="averagePrice"
                      min="1"
                      step="0.01"
                      value={averagePrice}
                      onChange={(e) => setAveragePrice(e.target.value)}
                      placeholder="Enter price in rupees"
                      required
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="submit-btn" 
                  disabled={loading}
                >
                  {loading ? 'Setting Price...' : 'Set Average Price'}
                </button>
              </form>
            )}

            {!isCurrentMonthAndYear() && (
              <div className="past-month-notice">
                <FaExclamationTriangle />
                <p>You can only set prices for the current month.</p>
              </div>
            )}

            {error && (
              <div className="error-message">
                <FaExclamationTriangle />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="success-message">
                <FaCheckCircle />
                <p>Average price successfully set!</p>
              </div>
            )}
          </div>

          <div className="dashboard-card">
            <h2>Factory Price Overview</h2>
            <p className="description">
              Review current factory tea prices and identify factories offering prices below the set average.
            </p>

            {factoryPrices.length > 0 ? (
              <div className="factory-prices">
                <table>
                  <thead>
                    <tr>
                      <th>Factory</th>
                      <th>Current Price (Rs.)</th>
                      <th>Status</th>
                      <th>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factoryPrices.map((item) => (
                      <tr key={item._id} className={isLowPriceFactory(item.price) ? 'low-price' : ''}>
                        <td>{item.factoryName}</td>
                        <td>Rs. {item.price.toFixed(2)}/kg</td>
                        <td>{getStatusBadge(item.price)}</td>
                        <td>{new Date(item.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No factory prices available</p>
            )}
          </div>
        </>
      )}

      {viewMode === 'history' && (
        <div className="dashboard-card">
          <h2>Tea Price History - {selectedYear}</h2>
          <p className="description">
            Historical data for tea prices set by the Tea Board and adhered to by factories.
          </p>
          
          {historyLoading ? (
            <div className="loading">Loading price history...</div>
          ) : pricesHistory.length > 0 ? (
            <div className="price-history">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Average Price (Rs.)</th>
                    <th>Lowest Factory Price</th>
                    <th>Highest Factory Price</th>
                  </tr>
                </thead>
                <tbody>
                  {pricesHistory.map((item) => (
                    <tr key={item.month}>
                      <td>{months[item.month - 1]}</td>
                      <td>Rs. {item.averagePrice ? item.averagePrice.toFixed(2) : 'Not set'}</td>
                      <td>Rs. {item.lowestPrice ? item.lowestPrice.toFixed(2) : 'N/A'}</td>
                      <td>Rs. {item.highestPrice ? item.highestPrice.toFixed(2) : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">No historical data available for {selectedYear}</p>
          )}
          
          <button className="back-button" onClick={() => setViewMode('current')}>
            Back to Current Prices
          </button>
        </div>
      )}

      {viewMode === 'analytics' && (
        <AdminStatistics />
      )}
    </div>
  );
};

export default AdminDashboard;