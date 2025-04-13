import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import './farmerRegistration.css';

const FarmerRegistration = () => {
  const [farmerName, setFarmerName] = useState('');
  const [nicNumber, setNicNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { getToken, userId } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError('');
      console.log("Starting farmer registration...");
      console.log("Form data:", { farmerName, nicNumber, address, userId });
      
      // Store farmer data in localStorage as fallback
      localStorage.setItem('farmerData', JSON.stringify({
        farmerName,
        nicNumber,
        address
      }));
      
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        throw new Error('API URL is not defined. Check your environment variables.');
      }
      console.log("API URL:", apiUrl);
      
      const token = await getToken();
      console.log("Got auth token");
      
      const registerEndpoint = `${apiUrl}/api/farmer/register`;
      console.log("Sending request to:", registerEndpoint);
      
      const response = await fetch(registerEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          farmerName, 
          nicNumber, 
          address,
          userId 
        })
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Failed to register farmer: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json().catch(e => {
        console.log("Response isn't JSON, likely empty response");
        return {};
      });
      console.log("Registration successful, response data:", data);
      
      alert('Farmer registered successfully');
      console.log("Navigating to /dashboard");
      
      try {
        navigate('/dashboard');
        console.log("Navigation triggered");
      } catch (navError) {
        console.error("Navigation error:", navError);
        // Fallback - try reloading the page to dashboard
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Error registering farmer:', error);
      setError(`Error registering farmer: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="farmerRegistration">
      <div className="container">
        <h2>Register as a Farmer</h2>
        <p>Please provide your details to continue</p>
        
        {error && <div className="errorMessage">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label>Farmer Name</label>
            <input
              type="text"
              value={farmerName}
              onChange={(e) => setFarmerName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div className="formGroup">
            <label>NIC Number</label>
            <input
              type="text"
              value={nicNumber}
              onChange={(e) => setNicNumber(e.target.value)}
              placeholder="Enter your NIC number"
              required
            />
          </div>
          
          <div className="formGroup">
            <label>Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="submitButton"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering...' : 'Register as Farmer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FarmerRegistration; 