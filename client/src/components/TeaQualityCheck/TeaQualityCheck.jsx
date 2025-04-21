import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { FaUpload, FaSpinner, FaLeaf, FaCheck, FaTimes } from 'react-icons/fa';
import './TeaQualityCheck.css';

const TeaQualityCheck = () => {
  console.log("TeaQualityCheck component mounted");
  
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
      <div className="tea-quality-check">
        <div className="quality-header">
          <h2>Tea Quality Analysis</h2>
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
      <div className="tea-quality-check">
        <div className="quality-header">
          <h2>Tea Quality Analysis</h2>
          <p>Authentication required</p>
        </div>
        <div className="auth-message">
          <p>Please log in to use the quality check feature.</p>
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
      
      // In a real app, this would call an API endpoint
      // For now, simulate a response after a delay
      setTimeout(() => {
        // Simulate a response
        const mockResult = {
          success: true,
          quality: "High",
          score: 92,
          features: {
            appearance: 9.3,
            color: 9.5,
            texture: 8.8,
            freshness: 9.1
          },
          feedback: "Excellent quality tea leaves with good color and texture. Optimal harvest time achieved."
        };
        
        setResult(mockResult);
        setProcessing(false);
      }, 2000);
      
    } catch (err) {
      console.error('Error analyzing quality:', err);
      setError('Error processing image. Please try again.');
      setProcessing(false);
    }
  };
  
  return (
    <div className="tea-quality-check">
      <div className="quality-header">
        <h2>Tea Leaf Quality Check</h2>
        <p>Upload a clear image of tea leaves to assess quality</p>
      </div>
      
      <div className="quality-content">
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
              ) : 'Check Quality'}
            </button>
          </form>
        </div>
        
        {result && (
          <div className="result-container">
            <h3 className="result-header">
              <FaCheck className="quality-icon" />
              <span className="quality-level">{result.quality} Quality</span>
            </h3>
            
            <div className="result-details">
              <div className="quality-score">
                <span className="score-value">{result.score}</span>
                <span className="score-label">/100</span>
              </div>
              
              <div className="quality-features">
                <h4>Quality Assessment</h4>
                <div className="feature-bars">
                  <div className="feature-bar-container">
                    <div className="feature-label">Appearance</div>
                    <div className="feature-bar-wrapper">
                      <div className="feature-bar" style={{ width: `${result.features.appearance * 10}%` }}></div>
                    </div>
                    <div className="feature-value">{result.features.appearance}</div>
                  </div>
                  
                  <div className="feature-bar-container">
                    <div className="feature-label">Color</div>
                    <div className="feature-bar-wrapper">
                      <div className="feature-bar" style={{ width: `${result.features.color * 10}%` }}></div>
                    </div>
                    <div className="feature-value">{result.features.color}</div>
                  </div>
                  
                  <div className="feature-bar-container">
                    <div className="feature-label">Texture</div>
                    <div className="feature-bar-wrapper">
                      <div className="feature-bar" style={{ width: `${result.features.texture * 10}%` }}></div>
                    </div>
                    <div className="feature-value">{result.features.texture}</div>
                  </div>
                  
                  <div className="feature-bar-container">
                    <div className="feature-label">Freshness</div>
                    <div className="feature-bar-wrapper">
                      <div className="feature-bar" style={{ width: `${result.features.freshness * 10}%` }}></div>
                    </div>
                    <div className="feature-value">{result.features.freshness}</div>
                  </div>
                </div>
              </div>
              
              <div className="quality-feedback">
                <h4>Feedback</h4>
                <p>{result.feedback}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeaQualityCheck; 