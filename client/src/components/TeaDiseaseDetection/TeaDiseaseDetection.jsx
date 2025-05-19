import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { FaUpload, FaSpinner } from 'react-icons/fa';
import './TeaDiseaseDetection.css';

const TeaDiseaseDetection = ({ onResultUpdate }) => {
  console.log("TeaDiseaseDetection component mounted");
  
  // Get authentication from Clerk
  const { getToken, userId, isLoaded, isSignedIn } = useAuth();
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  console.log("Auth state:", { isLoaded, isSignedIn, userId });

  // Show loading state while authentication is being loaded
  if (!isLoaded) {
    return (
      <div className="tea-disease-detection">
        <div className="detection-header">
          <h2>Tea Leaf Disease Detection</h2>
          <p>Loading authentication...</p>
        </div>
        <div className="loading-indicator">
          <FaSpinner className="spinner" />
        </div>
      </div>
    );
  }

  // Check if user is signed in
  if (!isSignedIn) {
    return (
      <div className="tea-disease-detection">
        <div className="detection-header">
          <h2>Tea Leaf Disease Detection</h2>
          <p>Authentication required</p>
        </div>
        <div className="auth-message">
          <p>Please log in to use the disease detection feature.</p>
        </div>
      </div>
    );
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);
    if (onResultUpdate) onResultUpdate(null);
    
    if (!selectedFile) return;
    
    if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
      setError('Please select a JPEG or PNG image file');
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (onResultUpdate) onResultUpdate(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image file');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file, file.name);
      
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      const testApiUrl = `${baseUrl}/api/test-tea-disease`;
      
      try {
        const response = await axios.post(testApiUrl, formData);
        const resultData = response.data.result || response.data;
        if (onResultUpdate) {
          onResultUpdate(resultData);
        }
      } catch (testError) {
        const token = await getToken();
        const apiUrl = `${baseUrl}/api/tea-disease/detect`;
        
        const response = await axios.post(apiUrl, formData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const resultData = response.data.result || response.data;
        if (onResultUpdate) {
          onResultUpdate(resultData);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error processing image. Please try again.');
      if (onResultUpdate) {
        onResultUpdate(null);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="disease-detection-form">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png"
        style={{ display: 'none' }}
      />
      
      {!preview ? (
        <div 
          className="upload-area"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">📸</div>
          <div className="upload-text">Choose an image to analyze</div>
          <div className="upload-hint">JPG, PNG (Max: 5MB)</div>
        </div>
      ) : (
        <div className="image-preview-container">
          <img 
            src={preview} 
            alt="Preview" 
            className="image-preview"
          />
          <button 
            className="remove-image"
            onClick={resetForm}
            type="button"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button
        className="detect-disease-btn"
        onClick={handleSubmit}
        disabled={!file || processing}
      >
        {processing ? (
          <>
            <FaSpinner className="spinner" />
            Analyzing...
          </>
        ) : 'Detect Disease'}
      </button>
    </div>
  );
};

export default TeaDiseaseDetection; 