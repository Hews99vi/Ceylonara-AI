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
    
    // Reset previous results
    setResult(null);
    
    if (!selectedFile) {
      return;
    }
    
    // Check file type
    if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
      setError('Please select a JPEG or PNG image file');
      return;
    }
    
    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    
    setFile(selectedFile);
    
    // Create preview
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
    console.log('Form submitted. File:', file);

    if (!file) {
      setError('Please select an image file');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create form data with correct filename and content type
      const formData = new FormData();
      // Add file with original filename to help with MIME type detection
      formData.append('image', file, file.name);
      
      // Debug the form data
      console.log('FormData created with file:', file.name, file.type, file.size);
      
      // Determine API URL - use environment variable or default to local
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      
      // Try the non-authenticated test endpoint first
      const testApiUrl = `${baseUrl}/api/test-tea-disease`;
      console.log('Sending request to test endpoint:', testApiUrl);
      
      try {
        // Try the test endpoint without authentication
        const response = await axios.post(testApiUrl, formData);
        console.log('Response received from test endpoint:', response.status);
        console.log('Response data:', response.data);
        
        setResult(response.data.result || response.data);
      } catch (testError) {
        console.error('Test endpoint failed, trying authenticated endpoint');
        
        // If test endpoint fails, fall back to authenticated endpoint
        const token = await getToken();
        console.log('Token available:', !!token);
        
        const apiUrl = `${baseUrl}/api/tea-disease/detect`;
        console.log('Sending request to:', apiUrl);
        
        const response = await axios.post(apiUrl, formData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Response received:', response.status);
        console.log('Response data:', response.data);
        
        setResult(response.data.result || response.data);
      }
    } catch (err) {
      console.error('Error detecting disease:', err);
      console.error('Error response:', err.response?.data);
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
    <div className="tea-disease-detection">
      <div className="detection-header">
        <h2>Tea Leaf Disease Detection</h2>
        <p>Upload a clear image of tea leaves to detect diseases</p>
      </div>
      
      <div className="detection-content">
        <div className="upload-section">
          <form onSubmit={handleSubmit}>
            <div className="file-upload-container">
              <input 
                type="file" 
                onChange={handleFileChange} 
                className="file-input"
                ref={fileInputRef}
                accept="image/jpeg, image/png"
              />
              <div className="upload-btn">
                <FaUpload />
                <span>Choose Image</span>
              </div>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            {preview && (
              <div className="preview-container">
                <img src={preview} alt="Tea leaf preview" className="image-preview" />
                <button type="button" className="reset-btn" onClick={resetForm}>
                  <FaTimes />
                </button>
              </div>
            )}
            
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={!file || processing}
            >
              {processing ? (
                <>
                  <FaSpinner className="spinner" />
                  Analyzing...
                </>
              ) : 'Detect Disease'}
            </button>
          </form>
        </div>
        
        {displayResult && (
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeaDiseaseDetection; 