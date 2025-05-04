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
  // Check all possible locations for role
  const userRole = user?.publicMetadata?.role || user?.unsafeMetadata?.role;

  // Check localStorage for factory data as another indicator
  const hasFactoryData = localStorage.getItem('factoryData') !== null;

  // Check if user is a factory owner - also consider factory data in localStorage
  const isFactory = userRole === 'factory' || hasFactoryData;

  // Check if user is an admin
  const isAdmin = userRole === 'admin' || location.pathname.includes('/dashboard/admin');

  // Enhanced logging
  console.log("User role detection:", {
    userRole,
    publicRole: user?.publicMetadata?.role,
    unsafeRole: user?.unsafeMetadata?.role,
    hasFactoryData,
    isFactory,
    isAdmin
  });

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

      // If we're at the dashboard root and user is an admin, redirect to admin dashboard
      if (location.pathname === "/dashboard" && role === "admin") {
        navigate("/dashboard/admin");
      }
    }
  }, [isLoaded, userId, navigate, user, location.pathname]);

  // Don't render dashboard features if we're on a specific page
  const isSpecificPage = location.pathname !== "/dashboard";

  return (
    <div className={`dashboardLayout ${isAdmin ? 'admin-view' : ''}`}>
      {!isAdmin && (
        <div className="sidebar">
          {isFactory ? <FactorySidebar /> : <ChatList />}
        </div>
      )}
      <div className={`main-content ${isAdmin ? 'full-width' : ''}`}>
        {/* Only show factory header for factory users */}
        {isFactory && !isAdmin && (
          <FactoryHeader />
        )}

        {!isSpecificPage && userRole === 'farmer' && (
          <>
            <h1>Farmer Dashboard</h1>
            <div className="features-grid">
              <Link to="/dashboard/analyze-tea" className="feature-card">
                <img src="/icons/analyze-icon.svg" alt="Analyze" />
                <h3>Analyze Images</h3>
                <p>Analyze tea leaf quality</p>
              </Link>
              <Link to="/dashboard/manage-state" className="feature-card">
                <img src="/icons/estate-icon.svg" alt="Manage" />
                <h3>Manage My Tea Data</h3>
                <p>Track and manage your tea production</p>
              </Link>
              <Link to="/dashboard/harvest-plan" className="feature-card">
                <img src="/icons/harvest-icon.svg" alt="Harvest" />
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
              <Link to="/dashboard/set-tea-price" className="feature-card">
                <img src="/price-icon.png" alt="Price" />
                <h3>Set Tea Price</h3>
                <p>Manage tea leaf prices</p>
              </Link>
              <Link to="/dashboard/post-announcement" className="feature-card">
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
