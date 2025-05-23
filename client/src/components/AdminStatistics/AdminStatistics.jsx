import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import './AdminStatistics.css';

const AdminStatistics = () => {
  const [stats, setStats] = useState(null);
  const [factoryAverages, setFactoryAverages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('statistics');
  const { getToken } = useAuth();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      
      if (activeTab === 'statistics') {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/tea-prices/statistics`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        setStats(response.data);
      } else if (activeTab === 'factory-averages') {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/tea-prices/factory-averages?month=${currentMonth}&year=${currentYear}`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        setFactoryAverages(response.data);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. ' + (err.response?.data?.error || ''));
    } finally {
      setLoading(false);
    }
  };

  const renderStatistics = () => {
    if (!stats) return null;
    
    const statistics = stats.statistics;
    if (!statistics) return null;

    return (
      <div className="statistics-container">
        <div className="stats-header">
          <h3>Tea Price Statistics</h3>
          <p>{stats.monthName} {stats.year}</p>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">Rs. {statistics.minimumPrice}</div>
            <div className="stat-label">Minimum Average Price</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{statistics.activeFactories}</div>
            <div className="stat-label">Active Factories</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">Rs. {statistics.averageFactoryPrice}</div>
            <div className="stat-label">Average Factory Price</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">Rs. {statistics.lowestPrice}</div>
            <div className="stat-label">Lowest Factory Price</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">Rs. {statistics.highestPrice}</div>
            <div className="stat-label">Highest Factory Price</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{statistics.belowAverageCount}</div>
            <div className="stat-label">Factories Below Minimum</div>
          </div>
          
          <div className="stat-card full-width">
            <div className="stat-value">{statistics.totalTransactions}</div>
            <div className="stat-label">Total Collection Transactions</div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderFactoryAverages = () => {
    if (!factoryAverages) return null;
    
    return (
      <div className="factory-averages-container">
        <div className="averages-header">
          <h3>Factory Price Averages</h3>
          <p>{factoryAverages.monthName} {factoryAverages.year}</p>
        </div>
        
        {factoryAverages.factories.length > 0 ? (
          <table className="factory-averages-table">
            <thead>
              <tr>
                <th>Factory Name</th>
                <th>Average Price</th>
                <th>Total Collections</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {factoryAverages.factories.map((factory, index) => (
                <tr key={index}>
                  <td>{factory.name}</td>
                  <td>Rs. {factory.averagePrice.toFixed(2)}</td>
                  <td>{factory.totalCollections}</td>
                  <td>{new Date(factory.lastUpdated).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <p>No factory data available for this period.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="admin-statistics">
      <h2 className="page-title">Tea Price Analytics</h2>
      
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          Statistics
        </button>
        <button 
          className={`tab-button ${activeTab === 'factory-averages' ? 'active' : ''}`}
          onClick={() => setActiveTab('factory-averages')}
        >
          Factory Averages
        </button>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchData} className="retry-button">
            Retry
          </button>
        </div>
      ) : (
        <div className="content-container">
          {activeTab === 'statistics' && renderStatistics()}
          {activeTab === 'factory-averages' && renderFactoryAverages()}
        </div>
      )}
    </div>
  );
};

export default AdminStatistics; 