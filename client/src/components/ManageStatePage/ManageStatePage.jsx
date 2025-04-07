import "./manageStatePage.css";
import { useNavigate } from "react-router-dom";

const ManageStatePage = () => {
  const navigate = useNavigate();

  return (
    <div className="manageStatePage">
      <div className="manageStateContainer">
        <button className="closeButton" onClick={() => navigate("/dashboard")}>×</button>
        <div className="manageStateHeader">
          <img src="/logo.png" alt="Ceylonara Logo" />
          <h1>Manage Tea State</h1>
        </div>
        
        <div className="manageStateLayout">
          <div className="manageStateSection">
            <h2>Tea State Management</h2>
            <div className="stateGrid">
              <div className="stateCard">
                <div className="stateIcon">🌱</div>
                <div className="stateContent">
                  <h3>Plantation Overview</h3>
                  <p>Monitor your tea plantation's overall health and status.</p>
                </div>
              </div>
              
              <div className="stateCard">
                <div className="stateIcon">📊</div>
                <div className="stateContent">
                  <h3>Production Metrics</h3>
                  <p>Track daily production and quality metrics.</p>
                </div>
              </div>
              
              <div className="stateCard">
                <div className="stateIcon">🌿</div>
                <div className="stateContent">
                  <h3>Harvest Planning</h3>
                  <p>Schedule and optimize your tea harvesting cycles.</p>
                </div>
              </div>
              
              <div className="stateCard">
                <div className="stateIcon">⚡</div>
                <div className="stateContent">
                  <h3>Resource Management</h3>
                  <p>Manage workforce and equipment allocation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageStatePage;