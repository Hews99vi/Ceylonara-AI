import "./explorePage.css";
import { useNavigate } from "react-router-dom";

const ExplorePage = () => {
  const navigate = useNavigate();

  return (
    <div className="explorePage">
      <div className="exploreContainer">
        <button className="closeButton" onClick={() => navigate("/dashboard")}>×</button>
        <div className="exploreHeader">
          <img src="/logo.png" alt="Ceylonara Logo" />
          <h1>Explore Ceylonara</h1>
        </div>
        
        <div className="exploreLayout">
          <div className="exploreSection">
            <h2>Discover Tea Excellence</h2>
            <div className="featureGrid">
              <div className="featureCard">
                <div className="featureIcon">🍃</div>
                <div className="featureContent">
                  <h3>Tea Analysis</h3>
                  <p>Advanced AI-powered analysis of tea leaves for quality assessment and grading.</p>
                </div>
              </div>
              
              <div className="featureCard">
                <div className="featureIcon">🔍</div>
                <div className="featureContent">
                  <h3>Disease Detection</h3>
                  <p>Early detection of tea plant diseases using image recognition technology.</p>
                </div>
              </div>
              
              <div className="featureCard">
                <div className="featureIcon">📊</div>
                <div className="featureContent">
                  <h3>Quality Metrics</h3>
                  <p>Comprehensive quality metrics and detailed reports for tea production.</p>
                </div>
              </div>
              
              <div className="featureCard">
                <div className="featureIcon">🌱</div>
                <div className="featureContent">
                  <h3>Growth Monitoring</h3>
                  <p>Track and monitor tea plant growth patterns and health indicators.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="infoSection">
            <div className="infoCard">
              <h2>Why Choose Ceylonara?</h2>
              <ul className="benefitsList">
                <li>
                  <span className="checkmark">✓</span>
                  <p>Advanced AI Technology for precise tea analysis</p>
                </li>
                <li>
                  <span className="checkmark">✓</span>
                  <p>Real-time disease detection and prevention</p>
                </li>
                <li>
                  <span className="checkmark">✓</span>
                  <p>Comprehensive quality assessment tools</p>
                </li>
                <li>
                  <span className="checkmark">✓</span>
                  <p>Expert support for tea cultivation</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;