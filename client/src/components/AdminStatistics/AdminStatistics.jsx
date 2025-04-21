import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import './AdminStatistics.css';

const AdminStatistics = () => {
  const [stats, setStats] = useState(null);
  const [complianceData, setComplianceData] = useState(null);
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
      } else if (activeTab === 'compliance') {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/tea-prices/compliance`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        setComplianceData(response.data);
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
    } catch (err) {
      console.error(`Error fetching ${activeTab} data:`, err);
      setError(`Failed to load ${activeTab} data. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  const renderStatistics = () => {
    if (!stats || !stats.statistics) return null;
    
    const { statistics, month, year, monthName } = stats;
    
    return (
      <div className="statistics-container">
        <div className="stats-header">
          <h3>Tea Price Statistics</h3>
          <p>{monthName} {year}</p>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{statistics.adminAveragePrice ? `Rs. ${statistics.adminAveragePrice}` : 'Not Set'}</div>
            <div className="stat-label">Minimum Average Price</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{statistics.factoryCount}</div>
            <div className="stat-label">Active Factories</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{statistics.averageFactoryPrice ? `Rs. ${statistics.averageFactoryPrice}` : 'N/A'}</div>
            <div className="stat-label">Average Factory Price</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{statistics.lowestPrice ? `Rs. ${statistics.lowestPrice}` : 'N/A'}</div>
            <div className="stat-label">Lowest Price</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{statistics.highestPrice ? `Rs. ${statistics.highestPrice}` : 'N/A'}</div>
            <div className="stat-label">Highest Price</div>
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
  
  const renderCompliance = () => {
    if (!complianceData) return null;
    
    return (
      <div className="compliance-container">
        <div className="compliance-header">
          <h3>Compliance Report</h3>
          <p>{complianceData.monthName} {complianceData.year}</p>
        </div>
        
        <div className="compliance-summary">
          <div className="summary-stat">
            <span className="label">Minimum Price:</span>
            <span className="value">Rs. {complianceData.minimumPrice}</span>
          </div>
          <div className="summary-stat">
            <span className="label">Total Factories:</span>
            <span className="value">{complianceData.totalFactories}</span>
          </div>
          <div className="summary-stat">
            <span className="label">Non-Compliant:</span>
            <span className="value">{complianceData.nonCompliantCount}</span>
          </div>
        </div>
        
        {complianceData.nonCompliantFactories && complianceData.nonCompliantFactories.length > 0 ? (
          <table className="compliance-table">
            <thead>
              <tr>
                <th>Factory Name</th>
                <th>Status</th>
                <th>Current Price</th>
                <th>Required</th>
                <th>Difference</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {complianceData.nonCompliantFactories.map((factory, index) => (
                <tr key={index}>
                  <td>{factory.factoryName}</td>
                  <td>
                    <span className={`status-badge ${factory.status === 'No price set' ? 'no-price' : 'below-min'}`}>
                      {factory.status}
                    </span>
                  </td>
                  <td>{factory.currentPrice ? `Rs. ${factory.currentPrice}` : 'N/A'}</td>
                  <td>Rs. {factory.requiredPrice}</td>
                  <td>{factory.difference ? `Rs. ${factory.difference}` : 'N/A'}</td>
                  <td>{factory.lastUpdated ? new Date(factory.lastUpdated).toLocaleDateString() : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <p>All factories are compliant with the minimum price requirement.</p>
          </div>
        )}
      </div>
    );
  };
  
  const renderFactoryAverages = () => {
    if (!factoryAverages || !factoryAverages.factories) return null;
    
    return (
      <div className="factory-averages-container">
        <div className="averages-header">
          <h3>Factory Price Averages</h3>
          <p>{factoryAverages.monthName} {factoryAverages.year}</p>
        </div>
        
        <div className="admin-price-banner">
          <span className="label">Admin Average Price:</span>
          <span className="value">
            {factoryAverages.adminAveragePrice 
              ? `Rs. ${factoryAverages.adminAveragePrice}` 
              : 'Not Set'}
          </span>
        </div>
        
        {factoryAverages.factories.length > 0 ? (
          <table className="factory-averages-table">
            <thead>
              <tr>
                <th>Factory</th>
                <th>Average Price</th>
                <th>Latest Price</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {factoryAverages.factories.map((factory, index) => (
                <tr key={index} className={
                  factoryAverages.adminAveragePrice && 
                  factory.averagePrice < factoryAverages.adminAveragePrice 
                    ? 'below-average' 
                    : ''
                }>
                  <td>{factory.factoryName}</td>
                  <td>Rs. {factory.averagePrice}</td>
                  <td>Rs. {factory.latestPrice}</td>
                  <td>{new Date(factory.latestDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <p>No factory price data available for this period.</p>
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
          className={`tab-button ${activeTab === 'compliance' ? 'active' : ''}`}
          onClick={() => setActiveTab('compliance')}
        >
          Compliance
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
          {activeTab === 'compliance' && renderCompliance()}
          {activeTab === 'factory-averages' && renderFactoryAverages()}
        </div>
      )}
    </div>
  );
};

export default AdminStatistics; 