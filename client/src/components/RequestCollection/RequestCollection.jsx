import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './requestCollection.css';

const RequestCollection = () => {
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { getToken, user } = useAuth();
  
  useEffect(() => {
    fetchFactories();
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);
  }, []);
  
  const fetchFactories = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/factories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFactories(data);
        if (data.length > 0) {
          setSelectedFactory(data[0].id);
        }
      } else {
        console.error('Failed to fetch factories');
        // Use dummy data for now
        const dummyFactories = [
          { id: '1', name: 'Athukorala Tea Factory' },
          { id: '2', name: 'Nuwara Eliya Tea Factory' },
          { id: '3', name: 'Dimbula Valley Tea' }
        ];
        setFactories(dummyFactories);
        setSelectedFactory(dummyFactories[0].id);
      }
    } catch (error) {
      console.error('Error fetching factories:', error);
      // Use dummy data on error
      const dummyFactories = [
        { id: '1', name: 'Athukorala Tea Factory' },
        { id: '2', name: 'Nuwara Eliya Tea Factory' },
        { id: '3', name: 'Dimbula Valley Tea' }
      ];
      setFactories(dummyFactories);
      setSelectedFactory(dummyFactories[0].id);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFactory || !quantity || !date) {
      setErrorMessage('Please fill in all required fields');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const token = await getToken();
      const selectedFactoryObj = factories.find(factory => factory.id === selectedFactory);
      
      const requestData = {
        factoryId: selectedFactory,
        factoryName: selectedFactoryObj.name,
        quantity: parseFloat(quantity),
        date,
        note,
        farmerName: user?.fullName || 'Farmer',
        farmerId: user?.id
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/collection-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        setSuccessMessage('Collection request submitted successfully!');
        // Reset form
        setQuantity('');
        setNote('');
        
        // Set date to tomorrow again
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDate(tomorrow.toISOString().split('T')[0]);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting collection request:', error);
      setErrorMessage('An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
      
      // Clear success message after 5 seconds
      if (successMessage) {
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    }
  };
  
  return (
    <div className="requestCollection">
      <h1>Request Tea Collection</h1>
      <p className="subtitle">Submit a request for a factory to collect your tea leaves</p>
      
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <form onSubmit={handleSubmit} className="requestForm">
          <div className="formGroup">
            <label htmlFor="factory">Select Factory</label>
            <select
              id="factory"
              value={selectedFactory}
              onChange={(e) => setSelectedFactory(e.target.value)}
              disabled={isSubmitting}
              required
            >
              {factories.map(factory => (
                <option key={factory.id} value={factory.id}>{factory.name}</option>
              ))}
            </select>
          </div>
          
          <div className="formGroup">
            <label htmlFor="quantity">Quantity (kg)</label>
            <input
              id="quantity"
              type="number"
              min="1"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity in kilograms"
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div className="formGroup">
            <label htmlFor="date">Collection Date</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div className="formGroup">
            <label htmlFor="note">Additional Notes (Optional)</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any special instructions or information for collection"
              disabled={isSubmitting}
              rows="3"
            ></textarea>
          </div>
          
          {errorMessage && (
            <div className="errorMessage">{errorMessage}</div>
          )}
          
          {successMessage && (
            <div className="successMessage">{successMessage}</div>
          )}
          
          <button 
            type="submit" 
            className="submitButton"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      )}
      
      <div className="infoBox">
        <h3>About Collection Requests</h3>
        <p>Submit a collection request at least 24 hours in advance. Factories will review your request and confirm if they can collect on your requested date.</p>
        <p>Make sure your tea leaves are properly prepared for collection. For quality tips, check out our guide on tea leaf preparation.</p>
      </div>
    </div>
  );
};

export default RequestCollection; 