import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import "./dashboardLayout.css";
import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import ChatList from "../../components/chatList/ChatList";
import FactorySidebar from "../../components/FactorySidebar/FactorySidebar";
import FactoryHeader from "../../components/FactoryHeader/FactoryHeader";

const DashboardLayout = () => {
  const { userId, isLoaded, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = user?.publicMetadata?.role || user?.unsafeMetadata?.role;
  
  // Force factory role for now (for testing)
  const isFactory = true; // Temporarily force factory role
  
  console.log("User role:", userRole, "Is factory:", isFactory);

  useEffect(() => {
    if (isLoaded && !userId) {
      navigate("/sign-in");
      return;
    }
    
    if (user) {
      const role = user.publicMetadata.role;
      if (!role) {
        navigate("/select-role");
        return;
      }
      
      // If we're at the dashboard root and user is a factory owner, redirect to factory dashboard
      if (location.pathname === "/dashboard" && role === "factory") {
        navigate("/dashboard/factory");
      }
    }
  }, [isLoaded, userId, navigate, user, location.pathname]);

  useEffect(() => {
    // Log user role on component mount
    if (user) {
      console.log("User metadata:", user.publicMetadata, user.unsafeMetadata);
    }
  }, [user]);

  if (!isLoaded) return "Loading...";

  // Don't render dashboard features if we're on a specific page
  const isSpecificPage = location.pathname !== "/dashboard";

  return (
    <div className="dashboardLayout">
      <div className="sidebar">
        {isFactory ? <FactorySidebar /> : <ChatList />}
      </div>
      <div className="main-content">
        {isFactory && <FactoryHeader />}
        
        {!isSpecificPage && userRole === 'farmer' && (
          <>
            <h1>Farmer Dashboard</h1>
            <div className="features-grid">
              <Link to="/dashboard/analyze-tea" className="feature-card">
                <img src="/analyze-icon.png" alt="Analyze" />
                <h3>Analyze Images</h3>
                <p>Analyze tea leaf quality</p>
              </Link>
              <Link to="/dashboard/manage-state" className="feature-card">
                <img src="/manage-icon.png" alt="Manage" />
                <h3>Manage My Tea Data</h3>
                <p>Track and manage your tea production</p>
              </Link>
              <Link to="/dashboard/harvest-plan" className="feature-card">
                <img src="/harvest-icon.png" alt="Harvest" />
                <h3>Harvest Planning</h3>
                <p>Plan your harvest schedule</p>
              </Link>
            </div>
          </>
        )}
        {!isSpecificPage && userRole === 'factory' && (
          <>
            <h1>Factory Dashboard</h1>
            <div className="features-grid">
              <Link to="/dashboard/factory" className="feature-card">
                <img src="/price-icon.png" alt="Price" />
                <h3>Set Tea Price</h3>
                <p>Manage tea leaf prices</p>
              </Link>
              <Link to="/dashboard/factory" className="feature-card">
                <img src="/announcement-icon.png" alt="Announcements" />
                <h3>Post Announcements</h3>
                <p>Send updates to farmers</p>
              </Link>
              <Link to="/dashboard/request-collection" className="feature-card">
                <img src="/collection-icon.png" alt="Collection" />
                <h3>Collection Requests</h3>
                <p>Manage farmer collection requests</p>
              </Link>
            </div>
          </>
        )}
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;