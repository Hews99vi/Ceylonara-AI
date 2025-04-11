import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import './factoryDashboard.css';

const FactoryDashboard = () => {
  const [price, setPrice] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [requests, setRequests] = useState([]);
  const [factoryName, setFactoryName] = useState('');
  const [factoryData, setFactoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { userId, getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("FactoryDashboard component mounted");
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      
      console.log("Fetching factory data...");

      // Get factory data first
      const factoryRes = await fetch(`${import.meta.env.VITE_API_URL}/api/factory/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("Factory data response status:", factoryRes.status);
      
      if (!factoryRes.ok) {
        // If not registered, redirect to registration
        if (factoryRes.status === 404) {
          console.log("No factory found, redirecting to registration");
          navigate('/register-factory');
          return;
        }
        throw new Error(`Failed to fetch factory data: ${factoryRes.status}`);
      }
      
      const factoryData = await factoryRes.json();
      console.log("Factory data:", factoryData);
      
      setFactoryData(factoryData);
      // Check which property contains the factory name based on API response
      const name = factoryData.factoryName || factoryData.name || '';
      setFactoryName(name);
      
      // Get other data
      const [priceRes, requestsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/factory/price`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/factory/requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      if (priceRes.ok) {
        const priceData = await priceRes.json();
        setPrice(priceData.price || '');
      }
      
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setRequests(Array.isArray(requestsData) ? requestsData : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceUpdate = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/factory/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price })
      });
      alert('Price updated successfully');
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/factory/announcement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcement })
      });
      setAnnouncement('');
      alert('Announcement posted successfully');
    } catch (error) {
      console.error('Error posting announcement:', error);
    }
  };

  const handleRequest = async (requestId, status) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/factory/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData(); // Refresh the requests list
    } catch (error) {
      console.error('Error handling request:', error);
    }
  };

  return (
    <div className="factoryDashboard">
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="priceSection">
            <h2>Set Tea Price</h2>
            <form onSubmit={handlePriceUpdate} className="priceInput">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price per kg"
              />
              <button type="submit">Update Price</button>
            </form>
          </div>

          <div className="announcementSection">
            <h2>Post Announcement</h2>
            <form onSubmit={handleAnnouncementSubmit}>
              <textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Write your announcement here..."
              ></textarea>
              <button type="submit">Post Announcement</button>
            </form>
          </div>

          <div className="requestsSection">
            <h2>Collection Requests</h2>
            <div className="requestsList">
              {requests && requests.length > 0 ? (
                requests.map((request) => (
                  <div key={request._id} className="requestCard">
                    <div className="requestInfo">
                      <h3>{request.farmerName}</h3>
                      <p>Quantity: {request.quantity}kg</p>
                      <p>Date: {new Date(request.date).toLocaleDateString()}</p>
                    </div>
                    <div className="requestActions">
                      <button 
                        className="acceptBtn"
                        onClick={() => handleRequest(request._id, 'accepted')}
                      >
                        Accept
                      </button>
                      <button 
                        className="declineBtn"
                        onClick={() => handleRequest(request._id, 'declined')}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No collection requests available</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FactoryDashboard;