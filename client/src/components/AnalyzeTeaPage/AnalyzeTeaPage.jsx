import "./AnalyzeTeaPage.css";
import { useNavigate } from "react-router-dom";
import React, { useEffect } from "react";
import TeaDiseaseDetection from "../TeaDiseaseDetection/TeaDiseaseDetection";

const AnalyzeTeaPage = () => {
  const navigate = useNavigate();

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

  return (
    <div className="analyzeTeaPage">
      <div className="analyzeTeaContainer">
        <div className="analyzeTeaHeader">
          <h1>Tea Analysis</h1>
        </div>
        <p>Advanced AI-powered tools for tea leaf analysis and disease detection</p>
      </div>

      <div className="analyzeTeaLayout">
        <div className="analyzeSection">
          <div className="disease-detection-card">
            <h2>Disease Detection</h2>
            <p>
              Upload clear images of your tea leaves for instant disease detection. 
              Our AI system will analyze and provide detailed insights.
            </p>
            <TeaDiseaseDetection />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzeTeaPage;