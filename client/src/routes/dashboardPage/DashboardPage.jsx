import { useMutation, useQueryClient } from "@tanstack/react-query";
import "./dashboardPage.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";

const DashboardPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.publicMetadata?.role === 'factory') {
      navigate('/dashboard/factory');
      return;
    }
  }, [user, navigate]);

  const mutation = useMutation({
    mutationFn: (text) => {
      return fetch(`${import.meta.env.VITE_API_URL}/api/chats`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      }).then((res) => res.json());
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["userChats"] });
      navigate(`/dashboard/chats/${id}`);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = e.target.text.value;
    if (!text) return;
    mutation.mutate(text);
  };

  return (
    <div className="dashboardPage">
      <div className="texts">
        <div className="logo">
          <img src="/logo.png" alt="" />
          <h1>Ceylonara</h1>
        </div>
        <div className="features">
          <button onClick={() => navigate('/dashboard/analyze-tea')} className="feature-button">
            <img src="/analyze-icon.png" alt="Analyze" />
            <h3>Analyze Tea Quality</h3>
            <p>Upload tea leaf images for quality analysis</p>
          </button>
          <button onClick={() => navigate('/dashboard/manage-estate')} className="feature-button">
            <img src="/estate-icon.png" alt="Estate" />
            <h3>Manage Estate</h3>
            <p>Track and manage your tea estate details</p>
          </button>
          <button onClick={() => navigate('/dashboard/harvest-plan')} className="feature-button">
            <img src="/harvest-icon.png" alt="Harvest" />
            <h3>Harvest Planning</h3>
            <p>Plan and optimize your tea harvesting schedule</p>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Ask anything about tea cultivation..."
            name="text"
          />
        </form>
      </div>
    </div>
  );
};

export default DashboardPage;