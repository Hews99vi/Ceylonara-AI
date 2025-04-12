import { Link } from "react-router-dom";
import "../chatList/chatList.css"; // Reuse the existing CSS
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";

const FactorySidebar = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedChatTitle, setSelectedChatTitle] = useState("");

  const { isPending, error, data, refetch } = useQuery({
    queryKey: ["userChats"],
    queryFn: async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/userchats`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch chats');
        }

        return response.json();
      } catch (error) {
        console.error("Error fetching chats:", error);
        throw new Error('Failed to load chats. Please try again.');
      }
    },
    retry: 2,
    retryDelay: 1000
  });

  const deleteMutation = useMutation({
    mutationFn: async (chatId) => {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userChats"] });
      setShowModal(false);
    },
    onError: (error) => {
      console.error("Error deleting chat:", error);
      alert("Failed to delete chat. Please try again.");
      setShowModal(false);
    }
  });

  const handleDelete = (e, chatId, chatTitle) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedChatId(chatId);
    setSelectedChatTitle(chatTitle);
    setShowModal(true);
  };

  const confirmDelete = () => {
    if (selectedChatId) {
      deleteMutation.mutate(selectedChatId);
    }
  };

  return (
    <div className="chatList">
      <span className="title">DASHBOARD</span>
      <Link to="/dashboard" className="navLink">Create a new Chat</Link>
      <Link to="/dashboard/set-tea-price" className="navLink">Set Tea Price</Link>
      <Link to="/dashboard/collection-requests" className="navLink">Tea Leaves Collection Requests</Link>
      <Link to="/dashboard/post-announcement" className="navLink">Post Announcements</Link>
      <hr />
      <span className="title">RECENT CHATS</span>
      <div className="List">
        {isPending ? (
          <div className="loading">
            <div className="loadingSpinner"></div>
            <span>Loading your chats</span>
          </div>
        ) : error ? (
          <div className="error">
            <span>{error.message}</span>
            <button className="retryButton" onClick={() => refetch()}>
              Try Again
            </button>
          </div>
        ) : data?.length === 0 ? (
          <span className="no-chats">No chats yet. Create a new one!</span>
        ) : (
          data?.map((chat) => (
            <Link 
              to={`/dashboard/chats/${chat._id}`} 
              key={chat._id} 
              className="chatLink"
            >
              <span>{chat.title}</span>
              <button 
                className="deleteBtn" 
                onClick={(e) => handleDelete(e, chat._id, chat.title)}
                title="Delete chat"
              >
                🗑️
              </button>
            </Link>
          ))
        )}
      </div>
      <hr />
      <div style={{ flex: 1 }}></div> {/* This will push the AI experience to bottom */}
      <div className="ai-experience">
        <img src="/ai-icon.png" alt="AI" />
        <span>Experience the Power of Tea AI</span>
      </div>
      
      {showModal && (
        <div className="deleteModal">
          <div className="modalContent">
            <h3>Delete Chat</h3>
            <p>Are you sure you want to delete "{selectedChatTitle}"?</p>
            <div className="modalButtons">
              <button className="cancelBtn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="confirmBtn" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactorySidebar; 