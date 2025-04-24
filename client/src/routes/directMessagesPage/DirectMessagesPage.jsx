import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import ChatPartnerList from "../../components/ChatPartnerList/ChatPartnerList";
import ChatWindow from "../../components/chatWindow/ChatWindow";
import "./directMessagesPage.css";

const DirectMessagesPage = () => {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);
  // Set fullscreen mode to false by default to show the sidebar
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load user's direct chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/direct-chats`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch chats");
        }

        const data = await response.json();
        // The API returns { chats } directly without a success flag
        // Filter out chats with no messages to avoid showing empty chats
        const validChats = (data.chats || []).filter(chat =>
          chat.messages && chat.messages.length > 0
        );
        setChats(validChats);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching chats:", err);
        setError("Failed to load chats. Please try again.");
        setLoading(false);
      }
    };

    fetchChats();
  }, [getToken]);

  // Load chat details when a chat is selected
  useEffect(() => {
    if (!selectedChat) return;

    const fetchChatDetails = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/direct-chats/${selectedChat._id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch chat details");
        }

        const data = await response.json();
        // The API returns { chat } directly without a success flag
        setSelectedChat(data.chat);

        // Mark messages as read
        await fetch(`${import.meta.env.VITE_API_URL}/api/direct-chats/${selectedChat._id}/read`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error("Error fetching chat details:", err);
      }
    };

    fetchChatDetails();
  }, [selectedChat?._id, getToken]);

  // Create a new chat with selected partner
  const createNewChat = async (partner) => {
    const chatPartner = partner || selectedPartner;
    if (!chatPartner) return;

    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/direct-chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: chatPartner.userId,
          recipientRole: chatPartner.role,
          recipientName: chatPartner.name,
          senderName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || user?.fullName || "Farmer",
          senderRole: user?.publicMetadata?.role || "farmer",
          initialMessage: ""
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create chat");
      }

      const data = await response.json();
      // The API returns { chat } directly without a success flag
      // Only add the chat to the list if it has messages
      if (data.chat && data.chat.messages && data.chat.messages.length > 0) {
        setChats(prevChats => [data.chat, ...prevChats]);
      }
      setSelectedChat(data.chat);
      setSelectedPartner(null);
    } catch (err) {
      console.error("Error creating chat:", err);
    }
  };

  // Send a message in the selected chat
  const sendMessage = async (e, messageText) => {
    e.preventDefault();
    const messageToSend = messageText || message;
    if (!selectedChat || !messageToSend.trim()) return;

    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/direct-chats/${selectedChat._id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: messageToSend })
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      // The API returns { chat } directly without a success flag
      setSelectedChat(data.chat);
      setMessage("");

      // Update the chat in the list if it has messages
      if (data.chat && data.chat.messages && data.chat.messages.length > 0) {
        // Check if the chat is already in the list
        const chatExists = chats.some(chat => chat._id === data.chat._id);

        if (chatExists) {
          // Update existing chat
          setChats(prevChats =>
            prevChats.map(chat =>
              chat._id === data.chat._id ? data.chat : chat
            )
          );
        } else {
          // Add new chat to the list
          setChats(prevChats => [data.chat, ...prevChats]);
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Get the partner name from a chat
  const getPartnerName = (chat) => {
    if (!chat || !chat.participants) return "Unknown";
    const partner = chat.participants.find(p => p.userId !== user?.id && p.userId !== user?.userId);
    // Make sure we display the actual name, not "You"
    return partner && partner.name !== 'You' ? partner.name : (partner?.role === 'factory' ? 'Factory' : 'Farmer');
  };

  // Check if a chat has unread messages
  const hasUnreadMessages = (chat) => {
    if (!chat || !chat.messages) return false;
    return chat.messages.some(msg => msg.sender !== user?.id && msg.sender !== user?.userId && !msg.read);
  };

  // Add a useEffect to set document body styles for full-page experience
  useEffect(() => {
    // Save original styles
    const originalStyle = document.body.style.cssText;
    
    // Set full page styles
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.width = '100vw';
    
    // Cleanup function to restore original styles
    return () => {
      document.body.style.cssText = originalStyle;
    };
  }, []);

  return (
    <div className={`directMessagesPage ${isFullscreen ? 'fullscreen-mode' : ''}`} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
      {/* Back button */}
      <button className="backButton" onClick={() => navigate(-1)}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5"></path>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Back</span>
      </button>

      <div className="sidebar">
        <h2>Direct Messages</h2>

        {/* Chat Partner List */}
        <ChatPartnerList
          onSelectPartner={(partner) => {
            setSelectedPartner(partner);
            createNewChat(partner);
          }}
        />

        {/* Chat List - Only show if there are chats */}
        {chats.length > 0 && (
        <div className="chatList">
          {loading ? (
            <div className="loading">Loading your conversations...</div>
          ) : error ? (
            <div className="error">
              <span>{error}</span>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  const fetchChats = async () => {
                    try {
                      const token = await getToken();
                      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/direct-chats`, {
                        headers: {
                          Authorization: `Bearer ${token}`
                        }
                      });

                      if (!response.ok) {
                        throw new Error("Failed to fetch chats");
                      }

                      const data = await response.json();
                      // The API returns { chats } directly without a success flag
                      // Filter out chats with no messages to avoid showing empty chats
                      const validChats = (data.chats || []).filter(chat =>
                        chat.messages && chat.messages.length > 0
                      );
                      setChats(validChats);
                      setLoading(false);
                    } catch (err) {
                      console.error("Error fetching chats:", err);
                      setError("Failed to load chats. Please try again.");
                      setLoading(false);
                    }
                  };
                  fetchChats();
                }}
                style={{
                  padding: '8px 16px',
                  marginTop: '15px',
                  background: 'linear-gradient(to right, #218608, #23ce7e)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(35, 206, 126, 0.3)',
                  transition: 'all 0.2s ease',
                  display: 'inline-block',
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}
              >
                Try Again
              </button>
            </div>
          ) : chats.length === 0 ? (
            <div className="emptyState">
              <p>No conversations yet.</p>
              <p>Select a partner from the list above to start chatting!</p>
            </div>
          ) : (
            chats.map(chat => (
              <div
                key={chat._id}
                className={`chatItem ${selectedChat?._id === chat._id ? 'active' : ''} ${hasUnreadMessages(chat) ? 'unread' : ''}`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="chatName">{getPartnerName(chat)}</div>
                <div className="lastMessage">
                  {chat.messages && chat.messages.length > 0
                    ? chat.messages[chat.messages.length - 1].text.substring(0, 30) + (chat.messages[chat.messages.length - 1].text.length > 30 ? '...' : '')
                    : 'No messages yet'}
                </div>
                <div className="chatTime">
                  {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            ))
          )}
        </div>
        )}
      </div>

      <div className="chatArea">
        <ChatWindow
          chat={selectedChat}
          onSendMessage={(messageText) => {
            if (selectedChat && messageText.trim()) {
              sendMessage({ preventDefault: () => {} }, messageText);
            }
          }}
        />
      </div>
    </div>
  );
};

export default DirectMessagesPage;
