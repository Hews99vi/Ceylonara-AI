import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './requestCollection.css';
import LocationPicker from '../LocationPicker/LocationPicker';

const RequestCollection = () => {
  const [factories, setFactories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFactoryId, setSelectedFactoryId] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState(null);
  const { userId } = useAuth();
  const navigate = useNavigate();
  const location_url = useLocation();

  // Get the API URL from environment variables
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  // Fetch factories when component mounts
  useEffect(() => {
    fetchFactories();
  }, []);

  const fetchFactories = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching factories from:', `${apiUrl}/api/factories`);

      // Get authentication token from Clerk
      const token = await getToken();
      console.log('Auth token available:', !!token);

      // Include the token in the request
      const response = await axios.get(`${apiUrl}/api/factories`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        }
      });

      console.log('Factories response:', response.data);

      if (response.data && Array.isArray(response.data)) {
        setFactories(response.data);
        console.log(`Successfully loaded ${response.data.length} factories`);

        // Check if a factory was specified in the URL query parameters
        const params = new URLSearchParams(location_url.search);
        const factoryNameFromURL = params.get('factory');

        if (factoryNameFromURL) {
          console.log('Factory specified in URL:', factoryNameFromURL);

          // Find the factory with the matching name
          const matchingFactory = response.data.find(
            factory => factory.name === factoryNameFromURL
          );

          if (matchingFactory) {
            console.log('Found matching factory:', matchingFactory);
            setSelectedFactoryId(matchingFactory.id);
          } else {
            console.log('No matching factory found for:', factoryNameFromURL);
          }
        }
      } else {
        console.error('Invalid response format from API:', response.data);
        setError('Received invalid data from server');
      }
    } catch (error) {
      console.error('Error fetching factories:', error);
      setError(`Failed to load factories: ${error.response?.status === 401 ? 'Authentication required' : error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get auth token
  const getToken = async () => {
    try {
      return await window.Clerk.session.getToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const handleFactorySelect = (e) => {
    setSelectedFactoryId(e.target.value);
  };

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
    console.log('Selected location:', selectedLocation);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFactoryId || !selectedTime || !quantity || !date) {
      setError('Please fill in all required fields');
      return;
    }

    if (!location || (!location.lat && !location.lng)) {
      setError('Please select a collection location on the map');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Find the selected factory to get its name
      const selectedFactory = factories.find(factory => factory.id === selectedFactoryId);
      const factoryName = selectedFactory ? selectedFactory.name : '';

      // Get authentication token
      const token = await getToken();
      console.log('Auth token available for submission:', !!token);

      // Fetch farmer profile to get name and NIC number
      const farmerProfileResponse = await axios.get(
        `${apiUrl}/api/farmer/profile`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        }
      );

      const farmerProfile = farmerProfileResponse.data;
      const farmerName = farmerProfile.farmerName || 'Unknown Farmer';
      const nicNumber = farmerProfile.nicNumber || 'N/A';

      console.log('Farmer profile retrieved:', farmerProfile);

      console.log('Submitting collection request:', {
        factoryId: selectedFactoryId,
        factoryName,
        time: selectedTime,
        quantity,
        date,
        farmerId: userId,
        farmerName,
        nicNumber,
        location
      });

      const response = await axios.post(
        `${apiUrl}/api/collection-requests`,
        {
          factoryId: selectedFactoryId,
          factoryName,
          time: selectedTime,
          quantity,
          date,
          farmerId: userId,
          farmerName,
          nicNumber,
          location
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Request submitted successfully:', response.data);
      alert('Collection request submitted successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting collection request:', error);
      setError(`Failed to submit request: ${error.response?.status === 401 ? 'Authentication required' : error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="requestCollection">
      <div className="page-header">
        <h1>Request Tea Collection</h1>
        <div className="subtitle-container">
          <p className="subtitle">Schedule a tea leaf collection from your tea estate</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>Loading factories and preparing form...</span>
        </div>
      ) : (
        <div className="requestForm">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="formGroup">
                <div className="field-label">Select Factory</div>
                <label htmlFor="factory">
                  <i className="form-icon factory-icon"></i>
                  Select Factory
                </label>
                <select
                  id="factory"
                  value={selectedFactoryId}
                  onChange={handleFactorySelect}
                  required
                  disabled={isLoading}
                  className="factorySelect"
                >
                  <option value="">-- Select a factory --</option>
                  {factories.map(factory => (
                    <option key={factory.id} value={factory.id}>
                      {factory.name} ({factory.mfNumber || 'No MF Number'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="formGroup">
                <div className="field-label">Collection Time</div>
                <label htmlFor="time">
                  <i className="form-icon time-icon"></i>
                  Collection Time
                </label>
                <select
                  id="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  required
                >
                  <option value="">-- Select a time --</option>
                  <option value="morning">Morning (8:00 AM - 12:00 PM)</option>
                  <option value="afternoon">Afternoon (12:00 PM - 4:00 PM)</option>
                  <option value="evening">Evening (4:00 PM - 7:00 PM)</option>
                </select>
              </div>

              <div className="formGroup">
                <div className="field-label">Quantity (kg)</div>
                <label htmlFor="quantity">
                  <i className="form-icon quantity-icon"></i>
                  Quantity (kg)
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  placeholder="Enter quantity in kilograms"
                  required
                />
              </div>

              <div className="formGroup">
                <div className="field-label">Collection Date</div>
                <label htmlFor="date">
                  <i className="form-icon date-icon"></i>
                  Collection Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={today}
                  required
                />
              </div>
            </div>

            <div className="formGroup location-group">
              <div className="field-label">Select Collection Location</div>
              <label>
                <i className="form-icon location-icon"></i>
                Select Collection Location
              </label>
              <div className="mapContainer">
                <LocationPicker onLocationSelect={handleLocationSelect} />
              </div>
            </div>

            <div className="form-actions submit-only">
              <button type="submit" className="submitButton" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="submit-icon"></i>
                    Submit Collection Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RequestCollection;