import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import './collectionRequest.css';
import LocationViewer from '../LocationViewer/LocationViewer';

const CollectionRequest = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRequest, setExpandedRequest] = useState(null);
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
  
  // Toggle expanded view of a request
  const toggleRequestExpanded = (requestId) => {
    if (expandedRequest === requestId) {
      setExpandedRequest(null);
    } else {
      setExpandedRequest(requestId);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="collection-requests-container">
      <div className="page-header">
        <h1>Tea Leaves Collection Requests</h1>
        <div className="subtitle-container">
          <p className="subtitle">Manage and track tea leaf collection requests from farmers</p>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading">Loading requests...</div>}
      
      {!isLoading && requests.length === 0 ? (
        <div className="no-requests">No collection requests found</div>
      ) : (
        <div>
          <div className="table-container">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Factory</th>
                  <th>Quantity (kg)</th>
                  <th>Collection Date</th>
                  <th>Collection Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(request => (
                  <>
                    <tr key={request._id}>
                      <td>{request.farmerName}</td>
                      <td>{request.quantity}</td>
                      <td>{formatDate(request.date)}</td>
                      <td>{request.time || 'evening'}</td>
                      <td>
                        <span className={`status-cell status-${request.status}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="expand-button"
                          onClick={() => toggleRequestExpanded(request._id)}
                        >
                          {expandedRequest === request._id ? 'Hide Details' : 'Show Details'}
                        </button>
                      </td>
                    </tr>
                    {expandedRequest === request._id && (
                      <tr className="expanded-row">
                        <td colSpan="6">
                          <div className="expanded-content">
                            <div className="request-location">
                              <h4>Collection Location</h4>
                              {request.location && request.location.lat ? (
                                <LocationViewer location={request.location} />
                              ) : (
                                <p className="no-location">No location information provided</p>
                              )}
                            </div>
                            
                            {request.note && (
                              <div className="request-note">
                                <h4>Additional Notes</h4>
                                <p>{request.note}</p>
                              </div>
                            )}
                            
                            <div className="request-actions">
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
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="refresh-button-container">
            <button className="refresh-button" onClick={fetchRequests} disabled={isLoading}>
              {isLoading ? 'Refreshing...' : 'Refresh Requests'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionRequest;