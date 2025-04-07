import "./AnalyzeTeaPage.css";
import { useNavigate } from "react-router-dom";
import Upload from "../upload/Upload";

const AnalyzeTeaPage = () => {
  const navigate = useNavigate();

  return (
    <div className="analyzeTeaPage">
      <div className="analyzeTeaContainer">
        <button className="closeButton" onClick={() => navigate("/dashboard")}>×</button>
        <div className="analyzeTeaHeader">
          <img src="/logo.png" alt="Ceylonara Logo" />
          <h1>Tea Analysis</h1>
        </div>
        
        <div className="analyzeTeaLayout">
          <div className="analyzeSection">
            <div className="uploadCard">
              <div className="uploadIcon">🍃</div>
              <div className="uploadContent">
                <h3>Quality Check</h3>
                <p>Upload tea leaf images for quality analysis</p>
                <Upload />
              </div>
            </div>
            
            <div className="uploadCard">
              <div className="uploadIcon">🔍</div>
              <div className="uploadContent">
                <h3>Disease Detection</h3>
                <p>Scan tea plants for potential diseases</p>
                <Upload />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzeTeaPage;