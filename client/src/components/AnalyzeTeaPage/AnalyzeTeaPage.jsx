import "./AnalyzeTeaPage.css";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import TeaDiseaseDetection from "../TeaDiseaseDetection/TeaDiseaseDetection";
import { FaLeaf, FaVirusSlash } from 'react-icons/fa';

const AnalyzeTeaPage = () => {
  const navigate = useNavigate();
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    // Add no-scroll class when component mounts
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.classList.add('no-scroll');
    }

    // Remove no-scroll class when component unmounts
    return () => {
      if (mainContent) {
        mainContent.classList.remove('no-scroll');
      }
    };
  }, []);

  // Helper function to convert API response format to display format
  const processResultForDisplay = (resultData) => {
    if (!resultData) return null;
    
    // Handle different response formats from API
    const isHealthy = resultData.healthy || resultData.is_healthy || 
                     (resultData.prediction && resultData.prediction.toLowerCase() === 'healthy');
    
    const diseaseName = isHealthy ? 'Healthy' : resultData.prediction || resultData.disease || 'Unknown';
    
    const treatment = resultData.treatment || 
                     (isHealthy ? 'Continue with regular maintenance and preventive practices to keep plants healthy.' : '');
    
    return {
      isHealthy,
      diseaseName,
      treatment
    };
  };

  const displayResult = analysisResult ? processResultForDisplay(analysisResult) : null;

  return (
    <div className="analyzeTeaPage">
      <div className="analyzeTeaContainer">
        <div className="analyzeTeaHeader">
          <h1>Disease Detection</h1>
        </div>
        <p>Upload clear images of your tea leaves for instant disease detection. Our AI system will analyze and provide detailed insights.</p>
      </div>

      <div className="analyzeTeaLayout">
        <div className="analyzeSection">
          {/* Left side - Disease Detection Card */}
          <div className="left-section">
            <div className="disease-detection-card">
              <h2>Disease Detection</h2>
              <TeaDiseaseDetection onResultUpdate={setAnalysisResult} />
            </div>
          </div>
          
          {/* Right side - Results Area */}
          <div className="right-section">
            {displayResult && (
              <div className="results-card">
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
      </div>
    </div>
  );
};

export default AnalyzeTeaPage;