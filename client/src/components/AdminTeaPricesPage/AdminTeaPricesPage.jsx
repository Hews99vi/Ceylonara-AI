import React from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import AdminTeaPrices from '../AdminTeaPrices/AdminTeaPrices';
import './AdminTeaPricesPage.css';

const AdminTeaPricesPage = () => {
  const { isLoaded, isSignedIn, user } = useAuth();
  
  // Check if user is authenticated and has admin role
  const isAdmin = isLoaded && isSignedIn && 
                  user.unsafeMetadata && 
                  user.unsafeMetadata.role === 'admin';
  
  if (!isLoaded) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!isSignedIn) {
    return <Navigate to="/sign-in" />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  return (
    <div className="admin-tea-prices-page">
      <div className="admin-header">
        <h1>Tea Price Management</h1>
        <p className="subtitle">Set and manage average tea prices for factories</p>
      </div>
      
      <div className="admin-content">
        <AdminTeaPrices />
        
        <div className="info-panel">
          <h3>About Tea Price Management</h3>
          <p>
            As an administrator for the Sri Lankan Tea Board, you have the authority to set 
            the minimum average price for tea that factories must adhere to when purchasing 
            tea leaves from farmers.
          </p>
          <p>
            When you set a new average price for the current month, all factories will be 
            required to offer at least this amount per kilogram to farmers. Factories 
            offering prices below the minimum will be highlighted in the factory management 
            section.
          </p>
          <h4>Guidelines for Setting Prices</h4>
          <ul>
            <li>Consider current market conditions and production costs</li>
            <li>Analyze price trends from previous months</li>
            <li>Take into account seasonal variations in tea quality</li>
            <li>Balance between fair compensation for farmers and sustainable operations for factories</li>
          </ul>
          <p className="note">
            Note: Only prices for the current month can be set or updated. Previous months 
            are shown for historical reference only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminTeaPricesPage; 