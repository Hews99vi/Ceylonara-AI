import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { FaUpload, FaSpinner, FaLeaf, FaVirusSlash, FaTimes } from 'react-icons/fa';
import './TeaDiseaseDetection.css';

const TeaDiseaseDetection = () => {
  console.log("TeaDiseaseDetection component mounted");
  
  // Get authentication from Clerk
  const { getToken, userId, isLoaded, isSignedIn } = useAuth();
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
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
    setResult(null);
    
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
    setResult(null);
    setError(null);
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
        setResult(response.data.result || response.data);
      } catch (testError) {
        const token = await getToken();
        const apiUrl = `${baseUrl}/api/tea-disease/detect`;
        
        const response = await axios.post(apiUrl, formData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setResult(response.data.result || response.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error processing image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Helper function to convert API response format to display format
  const processResultForDisplay = (resultData) => {
    console.log('Processing result for display:', resultData);
    
    if (!resultData) return null;
    
    // Handle different response formats from API
    const isHealthy = resultData.healthy || resultData.is_healthy || 
                     (resultData.prediction && resultData.prediction.toLowerCase() === 'healthy');
    
    const diseaseName = isHealthy ? 'Healthy' : resultData.prediction || resultData.disease || 'Unknown';
    
    const treatment = resultData.treatment || 
                     (isHealthy ? 'Continue with regular maintenance and preventive practices to keep plants healthy.' : '');
    
    // Build confidence scores
    let confidenceScores = {};
    if (resultData.all_predictions && Array.isArray(resultData.all_predictions)) {
      resultData.all_predictions.forEach(pred => {
        confidenceScores[pred.disease] = pred.confidence / 100; // normalize to 0-1 range
      });
    } else if (resultData.confidence) {
      confidenceScores[diseaseName] = resultData.confidence / 100;
      confidenceScores['Other'] = 1 - (resultData.confidence / 100);
    }
    
    return {
      isHealthy,
      diseaseName,
      treatment,
      confidenceScores
    };
  };
  
  // Process result for display
  const displayResult = result ? processResultForDisplay(result) : null;

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

      {result && (
        <div className="result-container">
          <h3 className="result-header">
            {displayResult.isHealthy ? (
              <>
                <FaLeaf className="healthy-icon" /> 
                <span className="disease-name healthy">Healthy Tea Leaves</span>
              </>
            ) : (
              <>
                <FaVirusSlash className="disease-icon" />
                <span className="disease-name">{displayResult.diseaseName}</span>
              </>
            )}
          </h3>
          
          <div className="result-details">
            {displayResult.isHealthy ? (
              <p>Your tea leaves appear healthy! Continue with your current care practices.</p>
            ) : (
              <>
                <h4>Recommended Treatment:</h4>
                <div className="treatment-details">
                  <p>{displayResult.treatment}</p>
                  <h4>General Care Tips:</h4>
                  <ul className="treatment-tips">
                    <li>Remove all infected leaves and dispose away from healthy plants</li>
                    <li>Ensure 4-6 inches of space between plants for air circulation</li>
                    <li>Water at soil level and avoid wetting leaves when possible</li>
                    <li>Apply recommended treatments in early morning or evening</li>
                    <li>Monitor plants regularly for signs of reinfection</li>
                  </ul>
                </div>
              </>
            )}
            <button
              className="check-another-btn"
              onClick={resetForm}
              type="button"
            >
              Check Another Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeaDiseaseDetection; 