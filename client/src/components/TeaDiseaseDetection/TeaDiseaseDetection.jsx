import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { FaUpload, FaSpinner } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import './TeaDiseaseDetection.css';

const TeaDiseaseDetection = ({ onResultUpdate }) => {
  const { t } = useTranslation();
  const { getToken, userId, isLoaded, isSignedIn } = useAuth();
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Show loading state while authentication is being loaded
  if (!isLoaded) {
    return (
      <div className="tea-disease-detection">
        <div className="detection-header">
          <h2>{t('diseaseDetection.title')}</h2>
          <p>{t('common.loading')}</p>
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
          <h2>{t('diseaseDetection.title')}</h2>
          <p>{t('common.unauthorized')}</p>
        </div>
        <div className="auth-message">
          <p>{t('common.unauthorized')}</p>
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
      setError(t('diseaseDetection.invalidFileType'));
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError(t('diseaseDetection.fileTooLarge'));
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
      setError(t('diseaseDetection.noImageSelected'));
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file, file.name);
      
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication token not available');
      }

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
    } catch (err) {
      console.error('Disease detection error:', err);
      
      // Handle different types of errors
      if (err.response) {
        switch (err.response.status) {
          case 401:
            setError(t('common.unauthorized'));
            break;
          case 413:
            setError(t('diseaseDetection.fileTooLarge'));
            break;
          case 415:
            setError(t('diseaseDetection.invalidFileType'));
            break;
          case 500:
            setError(t('common.serverError'));
            break;
          default:
            setError(t('diseaseDetection.processingError'));
        }
      } else if (err.request) {
        setError(t('common.networkError'));
      } else {
        setError(t('common.error'));
      }
      
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
          <div className="upload-icon">
            <FaUpload />
          </div>
          <div className="upload-text">{t('diseaseDetection.uploadInstructions')}</div>
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
            aria-label="Remove image"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
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
            {t('diseaseDetection.analyzing')}
          </>
        ) : t('diseaseDetection.detectDisease')}
      </button>
    </div>
  );
};

export default TeaDiseaseDetection; 