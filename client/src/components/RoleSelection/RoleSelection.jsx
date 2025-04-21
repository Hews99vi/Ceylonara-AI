import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import "./roleSelection.css";

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminError, setAdminError] = useState('');
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();

  // Admin verification code - in a real app, this would be securely stored server-side
  const ADMIN_SECRET_CODE = "TEA_BOARD_SL_2024";

  const handleRoleSelect = (role) => {
    console.log("Selected role:", role);
    setSelectedRole(role);
    setAdminError('');
  };

  const verifyAdminCode = () => {
    if (adminCode === ADMIN_SECRET_CODE) {
      return true;
    }
    setAdminError('Invalid admin code. Please enter the correct code provided by system administrators.');
    return false;
  };

  const handleContinue = async () => {
    if (!selectedRole || isLoading) return;

    // Verify admin code if admin role is selected
    if (selectedRole === 'admin' && !verifyAdminCode()) {
      return;
    }

    try {
      setIsLoading(true);
      console.log("Setting user role to:", selectedRole);
      
      const token = await getToken();
      
      // First update the role in your backend
      console.log("Updating role in backend...");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ role: selectedRole })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }
      
      console.log("Backend role update successful");

      // Update user metadata directly
      console.log("Updating Clerk metadata...");
      await user.update({
        unsafeMetadata: {
          role: selectedRole,
          updatedAt: new Date().toISOString()
        }
      });
      console.log("Clerk metadata updated successfully");

      // Navigate based on role
      if (selectedRole === 'factory') {
        console.log("Redirecting to factory registration...");
        navigate('/register-factory');
      } else if (selectedRole === 'farmer') {
        console.log("Redirecting to farmer registration...");
        navigate('/register-farmer');
      } else if (selectedRole === 'admin') {
        console.log("Redirecting to admin dashboard...");
        navigate('/dashboard/admin');
      } else {
        console.log("Redirecting to dashboard...");
        navigate('/dashboard');
      }
      
    } catch (error) {
      console.error("Error details:", error);
      alert(`Failed to set role: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="roleSelection">
      <div className="roleContainer">
        <h1>Select Your Role</h1>
        <p>Please select a role to continue using Ceylonara</p>

        <div className="roleCards">
          <div
            className={`roleCard ${selectedRole === 'farmer' ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('farmer')}
          >
            <div className="roleIcon">🌱</div>
            <h2>Tea Farmer</h2>
            <p>Manage your tea plantation, analyze tea quality, and plan harvests</p>
          </div>

          <div
            className={`roleCard ${selectedRole === 'factory' ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('factory')}
          >
            <div className="roleIcon">🏭</div>
            <h2>Factory Owner</h2>
            <p>Set tea prices, post announcements, and manage collection requests</p>
          </div>
          
          <div
            className={`roleCard ${selectedRole === 'admin' ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('admin')}
          >
            <div className="roleIcon">🔐</div>
            <h2>Tea Board Admin</h2>
            <p>Set monthly average tea prices and monitor platform activities</p>
          </div>
        </div>
        
        {selectedRole === 'admin' && (
          <div className="adminCodeSection">
            <label htmlFor="adminCode">Enter Admin Verification Code:</label>
            <input
              type="password"
              id="adminCode"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              placeholder="Enter verification code"
              className="adminCodeInput"
            />
            {adminError && <div className="errorMessage">{adminError}</div>}
          </div>
        )}

        <button
          className="continueButton"
          disabled={!selectedRole || isLoading}
          onClick={handleContinue}
        >
          {isLoading ? "Processing..." : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default RoleSelection;