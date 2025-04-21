import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import AveragePriceDisplay from '../AveragePriceDisplay/AveragePriceDisplay';
import './teaPricesPage.css';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TeaPricesPage = () => {
  const [prices, setPrices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averagePrice, setAveragePrice] = useState(null);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const { getToken } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableMonths, setAvailableMonths] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);

  useEffect(() => {
    // Initial data load
    fetchAveragePrice();
    fetchAvailableMonths();
    fetchTeaPrices();
  }, []);

  // Effect to fetch data when month changes
  useEffect(() => {
    if (selectedMonth !== null && selectedYear !== null) {
      fetchTeaPricesByMonth(selectedMonth, selectedYear);
      fetchHistoricalData();
    }
  }, [selectedMonth, selectedYear]);

  const fetchAvailableMonths = async () => {
    // In a real application, this would fetch from an API
    // For now, we'll create mock data for the last 6 months
    const months = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      months.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        label: date.toLocaleString('default', { month: 'long', year: 'numeric' })
      });
    }
    setAvailableMonths(months);
  };

  const fetchHistoricalData = async () => {
    try {
      // In a real app, this would fetch from the backend
      // For now, we'll create mock data
      const mockData = generateMockHistoricalData();
      setHistoricalData(mockData);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  // Generate mock historical data for demonstration
  const generateMockHistoricalData = () => {
    const factories = ['Athukorala Tea Factory', 'Katandola Tea Factory', 'Divithura Tea Factory', 'HEWS Tea Factory'];
    const data = [];
    
    // Generate data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleString('default', { month: 'short' });
      
      const entry = {
        month: monthStr,
        averagePrice: 250 + Math.random() * 50,
      };
      
      // Add prices for each factory
      factories.forEach(factory => {
        const basePrice = 250 + Math.random() * 100;
        entry[factory] = basePrice;
      });
      
      data.push(entry);
    }
    
    return data;
  };

  const fetchAveragePrice = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/tea-prices/average`);
      if (response.data && response.data.success) {
        const price = response.data.averagePrice;
        console.log("API returned average price:", price); // Debug log
        setAveragePrice(price !== null ? parseFloat(price) : null);
        setMonth(response.data.monthName || new Date().toLocaleString('default', { month: 'long' }));
        setYear(response.data.year || new Date().getFullYear().toString());
      } else {
        console.log("API response missing data:", response.data);
        // Set default values for testing
        setAveragePrice(null);
        setMonth(new Date().toLocaleString('default', { month: 'long' }));
        setYear(new Date().getFullYear().toString());
      }
    } catch (error) {
      console.error('Error fetching average price:', error);
      setAveragePrice(null);
      setMonth(new Date().toLocaleString('default', { month: 'long' }));
      setYear(new Date().getFullYear().toString());
    }
  };

  const fetchTeaPrices = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/prices`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPrices(data);
      } else {
        setPrices([
          { factoryName: 'Athukorala Tea Factory', price: '350', date: new Date().toISOString() },
          { factoryName: 'Nuwara Eliya Tea Factory', price: '380', date: new Date().toISOString() },
          { factoryName: 'Dimbula Valley Tea', price: '365', date: new Date().toISOString() }
        ]);
      }
    } catch (error) {
      setPrices([
        { factoryName: 'Athukorala Tea Factory', price: '350', date: new Date().toISOString() },
        { factoryName: 'Nuwara Eliya Tea Factory', price: '380', date: new Date().toISOString() },
        { factoryName: 'Dimbula Valley Tea', price: '365', date: new Date().toISOString() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeaPricesByMonth = async (monthIndex, year) => {
    try {
      setIsLoading(true);
      // In a real application, we would call an API endpoint that accepts month and year parameters
      // For now, we'll just use dummy data
      setTimeout(() => {
        // Dummy data with slight variations for different months
        const variation = (monthIndex * 10) % 50;
        setPrices([
          { factoryName: 'Athukorala Tea Factory', price: (350 + variation).toString(), date: new Date(year, monthIndex, 15).toISOString() },
          { factoryName: 'Katandola Tea Factory', price: (270 + variation).toString(), date: new Date(year, monthIndex, 15).toISOString() },
          { factoryName: 'Divithura Tea Factory', price: (250 + variation).toString(), date: new Date(year, monthIndex, 15).toISOString() },
          { factoryName: 'HEWS Tea Factory', price: (300 + variation).toString(), date: new Date(year, monthIndex, 15).toISOString() }
        ]);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching prices by month:', error);
      setIsLoading(false);
    }
  };

  // Format date to a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Calculate percentage difference from average
  const getPercentageDiff = (factoryPrice) => {
    if (!averagePrice) return null;
    const diff = ((factoryPrice - averagePrice) / averagePrice) * 100;
    return diff;
  };

  const handleMonthSelect = (monthIndex, year) => {
    setSelectedMonth(monthIndex);
    setSelectedYear(year);
  };

  console.log('Rendering TeaPricesPage - averagePrice:', averagePrice, 'month:', month, 'year:', year); // <-- Add logging here

  return (
    <div className="teaPricesPage">
      <h1>Monthly Tea Prices</h1>
      <p className="subtitle">Current tea leaf buying prices from factories</p>
      
      {/* Average Price Display with props */}
      <AveragePriceDisplay averagePrice={averagePrice} month={month} year={year} />
      
      {/* Month selector */}
      <div className="monthSelector">
        {availableMonths.map((monthData, index) => (
          <div 
            key={index}
            className={`monthTab ${selectedMonth === monthData.month && selectedYear === monthData.year ? 'active' : ''}`}
            onClick={() => handleMonthSelect(monthData.month, monthData.year)}
          >
            {monthData.label}
          </div>
        ))}
      </div>
      
      <Link to="/dashboard/announcements" className="viewAnnouncementsBtn">
        View Latest Announcements
      </Link>
      
      {/* Historical Price Chart */}
      <div className="chartContainer">
        <h2>Historical Price Trends</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="averagePrice" stroke="#4CAF50" name="Average Price" strokeWidth={2} />
            <Line type="monotone" dataKey="Athukorala Tea Factory" stroke="#2196F3" strokeWidth={2} />
            <Line type="monotone" dataKey="Katandola Tea Factory" stroke="#FFC107" strokeWidth={2} />
            <Line type="monotone" dataKey="Divithura Tea Factory" stroke="#9C27B0" strokeWidth={2} />
            <Line type="monotone" dataKey="HEWS Tea Factory" stroke="#FF5722" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {isLoading ? (
        <div className="loading">Loading prices...</div>
      ) : prices.length === 0 ? (
        <div className="noPrices">No prices available for this period</div>
      ) : (
        <div className="pricesContainer">
          {prices.map((price, index) => {
            const percentDiff = getPercentageDiff(parseFloat(price.price));
            return (
              <div key={index} className="priceCard">
                <h2>{price.factoryName}</h2>
                <div className="priceAmount">
                  Rs. {price.price}<span className="perKg"> per kg</span>
                </div>
                {percentDiff && (
                  <div className={percentDiff >= 0 ? 'perc-above' : 'perc-below'}>
                    {percentDiff >= 0 ? '+' : ''}{percentDiff.toFixed(1)}% vs Average
                  </div>
                )}
                <div className="updateDate">
                  Updated: {formatDate(price.date)}
                </div>
                <button className="requestCollectionBtn">
                  Request Collection
                </button>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Analytics section */}
      <div className="analyticsSection">
        <div className="analyticsHeader">
          <h2 className="analyticsTitle">Tea Prices Analytics</h2>
        </div>
        
        <div className="graphContainer">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={historicalData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="averagePrice" stroke="#8884d8" activeDot={{ r: 8 }} name="Tea Board Average" />
              <Line type="monotone" dataKey="Athukorala Tea Factory" stroke="#82ca9d" />
              <Line type="monotone" dataKey="Katandola Tea Factory" stroke="#ff7300" />
              <Line type="monotone" dataKey="Divithura Tea Factory" stroke="#0088fe" />
              <Line type="monotone" dataKey="HEWS Tea Factory" stroke="#ff3399" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <p className="subtitle">
          This chart shows price trends over the last 6 months. You can compare how each factory's prices have changed relative to the Tea Board's average price.
        </p>
      </div>
    </div>
  );
};

export default TeaPricesPage;