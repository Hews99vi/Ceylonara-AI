import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './factoryDashboard.css';

const FactoryDashboard = () => {
  const [price, setPrice] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [requests, setRequests] = useState([]);
  const { userId } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [priceRes, requestsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/factory/price`),
        fetch(`${import.meta.env.VITE_API_URL}/api/factory/requests`)
      ]);
      
      const priceData = await priceRes.json();
      const requestsData = await requestsRes.json();
      
      setPrice(priceData.price);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching data:', error);
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
          />
          <button type="submit">Post Announcement</button>
        </form>
      </div>

      <div className="requestsSection">
        <h2>Collection Requests</h2>
        <div className="requestsList">
          {requests.map((request) => (
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default FactoryDashboard;