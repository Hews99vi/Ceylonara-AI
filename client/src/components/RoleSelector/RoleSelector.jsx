import React from 'react';
import './roleSelector.css';

const RoleSelector = ({ selectedRole, onRoleSelect }) => {
  return (
    <div className="roleSelector">
      <h2>Select Your Role</h2>
      <div className="roleCards">
        <div 
          className={`roleCard ${selectedRole === 'farmer' ? 'selected' : ''}`}
          onClick={() => onRoleSelect('farmer')}
        >
          <img src="/farmer-icon.png" alt="Farmer" />
          <h3>Farmer</h3>
          <p>Access harvest planning, tea analysis, and connect with factories</p>
        </div>
        <div 
          className={`roleCard ${selectedRole === 'factory' ? 'selected' : ''}`}
          onClick={() => onRoleSelect('factory')}
        >
          <img src="/factory-icon.png" alt="Factory" />
          <h3>Factory</h3>
          <p>Manage tea purchases, set prices, and connect with farmers</p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;