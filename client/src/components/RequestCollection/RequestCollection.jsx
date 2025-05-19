import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import './requestCollection.css';
import LocationPicker from '../LocationPicker/LocationPicker';

const RequestCollection = () => {
  const [formData, setFormData] = useState({
    factoryId: '',
    time: '',
    quantity: '',
    date: '',
    location: null
  });
  const [factories, setFactories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userId } = useAuth();
  const navigate = useNavigate();
  const location_url = useLocation();

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateString = maxDate.toISOString().split('T')[0];

  useEffect(() => {
    fetchFactories();
  }, []);

  const fetchFactories = async () => {
    try {
      const token = await window.Clerk.session.getToken();
      const response = await axios.get(`${apiUrl}/api/factories`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });

      if (response.data?.length) {
        setFactories(response.data);
        const factoryFromURL = new URLSearchParams(location_url.search).get('factory');
        if (factoryFromURL) {
          const match = response.data.find(f => f.name === factoryFromURL);
          if (match) setFormData(prev => ({ ...prev, factoryId: match.id }));
        }
      }
    } catch (err) {
      setError('Could not load factories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'quantity' && value !== '') {
      const num = Number(value);
      if (num < 1 || num > 10000) return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({ ...prev, location }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.factoryId) return setError('Please select a factory');
    if (!formData.time) return setError('Please select a collection time');
    if (!formData.quantity) return setError('Please enter the quantity');
    if (!formData.date) return setError('Please select a collection date');
    if (!formData.location?.lat) return setError('Please select a collection location');

    try {
      setIsSubmitting(true);
      const token = await window.Clerk.session.getToken();
      
      // Get farmer profile
      const profileRes = await axios.get(`${apiUrl}/api/farmer/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Submit request
      const factory = factories.find(f => f.id === formData.factoryId);
      await axios.post(
        `${apiUrl}/api/collection-requests`,
        {
          ...formData,
          factoryName: factory?.name,
          quantity: Number(formData.quantity),
          farmerId: userId,
          farmerName: profileRes.data.farmerName || 'Unknown Farmer',
          nicNumber: profileRes.data.nicNumber || 'N/A'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate('/dashboard');
    } catch (err) {
      setError('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="requestCollection">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="requestCollection">
      <div className="page-header">
        <h1>Request Tea Collection</h1>
        <p className="subtitle">Schedule a pickup from your estate</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form className="requestForm" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="formGroup">
            <div className="field-label">Factory</div>
            <select
              name="factoryId"
              value={formData.factoryId}
              onChange={handleInputChange}
              disabled={isSubmitting}
            >
              <option value="">Select Factory</option>
              {factories.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.mfNumber || 'No MF#'})
                </option>
              ))}
            </select>
          </div>

          <div className="formGroup">
            <div className="field-label">Collection Time</div>
            <select
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              disabled={isSubmitting}
            >
              <option value="">Select Time</option>
              <option value="morning">Morning (8AM-12PM)</option>
              <option value="afternoon">Afternoon (12-4PM)</option>
              <option value="evening">Evening (4-7PM)</option>
            </select>
          </div>

          <div className="formGroup">
            <div className="field-label">Quantity (kg)</div>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              placeholder="Enter quantity"
              min="1"
              max="10000"
              disabled={isSubmitting}
            />
          </div>

          <div className="formGroup">
            <div className="field-label">Collection Date</div>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              min={today}
              max={maxDateString}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="location-group">
          <div className="field-label">Collection Location</div>
          <div className="mapContainer">
            <LocationPicker onLocationSelect={handleLocationSelect} />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submitButton" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestCollection;