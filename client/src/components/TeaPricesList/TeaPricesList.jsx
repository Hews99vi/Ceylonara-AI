import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import './teaPricesList.css';

const TeaPricesList = () => {
  const [prices, setPrices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();
  
  useEffect(() => {
    fetchTeaPrices();
  }, []);
  
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
        console.log("Prices data:", data);
        setPrices(data);
      } else {
        console.error('Failed to fetch tea prices');
        // Use dummy data for now only if API call fails
        setPrices([
          { factoryName: 'Athukorala Tea Factory', price: '350', date: new Date().toISOString() },
          { factoryName: 'Nuwara Eliya Tea Factory', price: '380', date: new Date().toISOString() },
          { factoryName: 'Dimbula Valley Tea', price: '365', date: new Date().toISOString() }
        ]);
      }
    } catch (error) {
      console.error('Error fetching tea prices:', error);
      // Use dummy data on error
      setPrices([
        { factoryName: 'Athukorala Tea Factory', price: '350', date: new Date().toISOString() },
        { factoryName: 'Nuwara Eliya Tea Factory', price: '380', date: new Date().toISOString() },
        { factoryName: 'Dimbula Valley Tea', price: '365', date: new Date().toISOString() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date to a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  return (
    <div className="teaPricesList">
      <h1>Monthly Tea Prices</h1>
      <p className="subtitle">Current tea leaf buying prices from factories</p>
      
      {isLoading ? (
        <div className="loading">Loading prices...</div>
      ) : prices.length === 0 ? (
        <div className="noPrices">No tea prices available at this time</div>
      ) : (
        <div className="pricesContainer">
          {prices.map((priceData, index) => (
            <div key={index} className="priceCard">
              <h2>{priceData.factoryName}</h2>
              <div className="priceAmount">Rs. {priceData.price} <span className="perKg">per kg</span></div>
              <div className="updateDate">Updated: {formatDate(priceData.date)}</div>
              <Link 
                to={`/dashboard/request-collection?factory=${encodeURIComponent(priceData.factoryName)}`} 
                className="requestCollectionBtn"
              >
                Request Collection
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeaPricesList; 