import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import './collectionRequest.css';

const CollectionRequest = () => {
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
      
      // Get authentication token
      const token = await getToken();
      
      // Fetch requests for this factory
      const response = await axios.get(`${apiUrl}/api/factory/requests`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        }
      });
      
      console.log('Collection requests response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setRequests(response.data);
      } else {
        setError('Received invalid data from server');
      }
    } catch (error) {
      console.error('Error fetching collection requests:', error);
      setError('Failed to load collection requests');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStatusChange = async (requestId, newStatus) => {
    try {
      setIsLoading(true);
      
      // Get authentication token
      const token = await getToken();
      
      // Update request status
      await axios.put(
        `${apiUrl}/api/factory/requests/${requestId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Refresh requests after update
      fetchRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      setError('Failed to update request status');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="collection-requests-container">
      <h2>Tea Leaves Collection Requests</h2>
      
      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading">Loading requests...</div>}
      
      {!isLoading && requests.length === 0 ? (
        <div className="no-requests">No collection requests found</div>
      ) : (
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Farmer ID</th>
                <th>Quantity (kg)</th>
                <th>Collection Date</th>
                <th>Collection Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request._id} className={`status-${request.status}`}>
                  <td>{request.farmerId}</td>
                  <td>{request.quantity} kg</td>
                  <td>{formatDate(request.date)}</td>
                  <td>{request.time}</td>
                  <td>
                    <span className={`status-badge ${request.status}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  <td className="actions">
                    {request.status === 'pending' && (
                      <>
                        <button 
                          className="approve-btn"
                          onClick={() => handleStatusChange(request._id, 'approved')}
                        >
                          Approve
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => handleStatusChange(request._id, 'rejected')}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {request.status === 'approved' && (
                      <button 
                        className="complete-btn"
                        onClick={() => handleStatusChange(request._id, 'completed')}
                      >
                        Mark as Completed
                      </button>
                    )}
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

export default CollectionRequest;