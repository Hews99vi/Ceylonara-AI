import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import './factoryRegistration.css';

const FactoryRegistration = () => {
  const [factoryName, setFactoryName] = useState('');
  const [mfNumber, setMfNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { getToken, userId } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      console.log("Starting factory registration...");
      console.log("Form data:", { factoryName, mfNumber, address, userId });
      
      // Store factory data in localStorage as fallback
      localStorage.setItem('factoryData', JSON.stringify({
        factoryName,
        mfNumber,
        address
      }));
      
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        throw new Error('API URL is not defined. Check your environment variables.');
      }
      console.log("API URL:", apiUrl);
      
      const token = await getToken();
      console.log("Got auth token");
      
      const registerEndpoint = `${apiUrl}/api/factory/register`;
      console.log("Sending request to:", registerEndpoint);
      
      const response = await fetch(registerEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          factoryName, 
          mfNumber, 
          address,
          userId 
        })
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Failed to register factory: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json().catch(e => {
        console.log("Response isn't JSON, likely empty response");
        return {};
      });
      console.log("Registration successful, response data:", data);
      
      alert('Factory registered successfully');
      console.log("Navigating to /dashboard/factory");
      
      try {
        navigate('/dashboard/factory');
        console.log("Navigation triggered");
      } catch (navError) {
        console.error("Navigation error:", navError);
        // Fallback - try reloading the page to dashboard
        window.location.href = '/dashboard/factory';
      }
    } catch (error) {
      console.error('Error registering factory:', error);
      alert(`Error registering factory: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="factoryRegistration">
      <div className="container">
        <h2>Register Your Factory</h2>
        <p>Please provide your factory details to continue</p>
        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label>Factory Name</label>
            <input
              type="text"
              value={factoryName}
              onChange={(e) => setFactoryName(e.target.value)}
              placeholder="Enter factory name"
              required
            />
          </div>
          <div className="formGroup">
            <label>MF Number</label>
            <input
              type="text"
              value={mfNumber}
              onChange={(e) => setMfNumber(e.target.value)}
              placeholder="Enter MF number"
              required
            />
          </div>
          <div className="formGroup">
            <label>Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter factory address"
              required
            />
          </div>
          <button 
            type="submit" 
            className="submitButton"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering...' : 'Register Factory'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FactoryRegistration; 