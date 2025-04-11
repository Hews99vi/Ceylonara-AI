import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './factoryHeader.css';

const FactoryHeader = () => {
  const [factoryName, setFactoryName] = useState('');
  const [mfNumber, setMfNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  // Check for saved factory data in localStorage on component mount
  useEffect(() => {
    const savedFactoryData = localStorage.getItem('factoryData');
    if (savedFactoryData) {
      try {
        const parsedData = JSON.parse(savedFactoryData);
        console.log("Found saved factory data:", parsedData);
      } catch (error) {
        console.error("Error parsing saved factory data:", error);
      }
    }
    
    // Fetch actual factory data
    fetchFactoryData();
  }, []);

  const fetchFactoryData = async () => {
    try {
      setIsLoading(true);
      console.log("FactoryHeader: Fetching factory data...");
      const token = await getToken();
      
      // Make sure this matches the API endpoint defined in your backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/factory/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("FactoryHeader: Factory profile response status:", response.status);
      
      if (response.ok) {
        const factoryData = await response.json();
        console.log("FactoryHeader: Factory data received:", factoryData);
        setFactoryName(factoryData.factoryName || "Your Factory");
        setMfNumber(factoryData.mfNumber || "Not set");
      } else {
        console.error("FactoryHeader: Error fetching factory data. Status:", response.status);
        // Fallback to localStorage data if API fails
        const savedFactoryData = localStorage.getItem('factoryData');
        if (savedFactoryData) {
          try {
            const parsedData = JSON.parse(savedFactoryData);
            setFactoryName(parsedData.factoryName || "Your Factory");
            setMfNumber(parsedData.mfNumber || "Not set");
            console.log("Using saved factory data as fallback");
          } catch (error) {
            console.error("Error parsing saved factory data:", error);
            setFactoryName("Your Factory");
            setMfNumber("Not set");
          }
        } else {
          setFactoryName("Your Factory");
          setMfNumber("Not set");
        }
      }
    } catch (error) {
      console.error('FactoryHeader: Error fetching factory data:', error);
      // Fallback to localStorage data if API errors
      const savedFactoryData = localStorage.getItem('factoryData');
      if (savedFactoryData) {
        try {
          const parsedData = JSON.parse(savedFactoryData);
          setFactoryName(parsedData.factoryName || "Your Factory");
          setMfNumber(parsedData.mfNumber || "Not set");
          console.log("Using saved factory data as fallback due to error");
        } catch (error) {
          console.error("Error parsing saved factory data:", error);
          setFactoryName("Your Factory");
          setMfNumber("Not set");
        }
      } else {
        setFactoryName("Your Factory");
        setMfNumber("Not set");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="factoryHeader">
        <div className="factoryInfo">
          <h1 className="factoryName">Loading factory data...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="factoryHeader">
      <div className="factoryInfo">
        <h1 className="factoryName">{factoryName}</h1>
        <div className="mfNumber">MF Number: {mfNumber}</div>
      </div>
    </div>
  );
};

export default FactoryHeader; 