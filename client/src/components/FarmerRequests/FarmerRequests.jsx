import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './farmerRequests.css';

const FarmerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userId } = useAuth();
  
  // Get API URL from environment variables
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  // Fetch requests when component mounts
  useEffect(() => {
    fetchRequests();
  }, []);
  
  // Helper function to get auth token
  const getToken = async () => {
    try {
      return await window.Clerk.session.getToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };
  
  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching farmer collection requests...');
      
      // Get authentication token
      const token = await getToken();
      
      // Fetch requests for this farmer
      const response = await axios.get(`${apiUrl}/api/farmer/collection-requests`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        }
      });
      
      console.log('Farmer collection requests response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setRequests(response.data);
      } else {
        setError('Received invalid data from server');
      }
    } catch (error) {
      console.error('Error fetching farmer collection requests:', error);
      setError('Failed to load collection requests');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get status badge class based on status
  const getStatusClass = (status) => {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-pending';
    }
  };
  
  return (
    <div className="farmer-requests-container">
      <h2>My Collection Requests</h2>
      
      <div className="announcements-link-container">
        <Link to="/dashboard/announcements" className="view-announcements-btn">
          View Latest Announcements
        </Link>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading">Loading your requests...</div>}
      
      {!isLoading && requests.length === 0 ? (
        <div className="no-requests">
          <p>You haven't submitted any collection requests yet.</p>
        </div>
      ) : (
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Factory</th>
                <th>Quantity (kg)</th>
                <th>Collection Date</th>
                <th>Collection Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request._id} className={getStatusClass(request.status)}>
                  <td>{request.factoryName || 'Unknown Factory'}</td>
                  <td>{request.quantity} kg</td>
                  <td>{formatDate(request.date)}</td>
                  <td>{request.time || 'Not specified'}</td>
                  <td>
                    <span className={`status-badge ${request.status}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <button className="refresh-btn" onClick={fetchRequests} disabled={isLoading}>
        {isLoading ? 'Refreshing...' : 'Refresh Requests'}
      </button>
    </div>
  );
};

export default FarmerRequests; 