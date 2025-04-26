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
  // To toggle search active state
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // State for partners search
  const [partnerSearchQuery, setPartnerSearchQuery] = useState("");

  // Load user's direct chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        console.log("Fetching direct chats with token:", token ? "Token exists" : "No token");
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/direct-chats`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch chats");
        }

        const data = await response.json();
        console.log("Direct chats response:", data);
        
        // Include all chats, even if they don't have messages yet
        // This ensures new chats without messages are still displayed
        const allChats = data.chats || [];
        console.log(`Found ${allChats.length} chats (including empty ones)`);
        
        setChats(allChats);
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
    if (!partner) return;

    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/direct-chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ partnerId: partner.userId })
      });

      if (!response.ok) {
        throw new Error("Failed to create chat");
      }

      const data = await response.json();
      
      // Check if we got a valid chat back
      if (data.chat) {
        // Set the selected chat and clear selected partner
        setSelectedChat(data.chat);
        setSelectedPartner(null);
        
        // Check if the chat is already in the list
        const chatExists = chats.some(chat => chat._id === data.chat._id);
        
        if (!chatExists) {
          // Add the new chat to the list
          setChats(prevChats => [data.chat, ...prevChats]);
        }
      }
    } catch (err) {
      console.error("Error creating chat:", err);
    }
  };

  // Send a message to the selected chat
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
    
    console.log("Current user ID:", user?.id, "userId:", user?.userId);
    console.log("Chat participants:", chat.participants);
    
    // Find the participant who is not the current user
    const partner = chat.participants.find(p => 
      p.userId !== user?.id && 
      p.userId !== user?.userId
    );
    
    console.log("Identified partner:", partner);
    
    // Always return the partner's actual name
    if (partner && partner.name) {
      return partner.name;
    } else if (partner && partner.role) {
      // Fallback to capitalized role if no name
      return partner.role.charAt(0).toUpperCase() + partner.role.slice(1);
    }
    
    return "Unknown";
  };

  // Check if a chat has unread messages
  const hasUnreadMessages = (chat) => {
    if (!chat || !chat.messages) return false;
    return chat.messages.some(msg => msg.sender !== user?.id && msg.sender !== user?.userId && !msg.read);
  };

  // Get the last message time in a formatted manner
  const getLastMessageTime = (chat) => {
    if (!chat || !chat.messages || chat.messages.length === 0) return '';
    
    const lastMsg = chat.messages[chat.messages.length - 1];
    const timestamp = lastMsg.timestamp || lastMsg.createdAt || new Date();
    const msgDate = new Date(timestamp);
    const today = new Date();
    
    // Check if the message is from today
    if (msgDate.toDateString() === today.toDateString()) {
      return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if the message is from yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Check if the message is from this week
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    if (msgDate >= weekStart) {
      return msgDate.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise, show date
    return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Handle main search icon click
  const toggleSearch = () => {
    setSearchActive(!searchActive);
    if (searchActive) {
      setSearchQuery(""); // Clear search when closing
    } else {
      // Focus the input when opening
      setTimeout(() => {
        document.querySelector('.searchInput')?.focus();
      }, 100);
    }
  };

  // Handle partners search
  const handlePartnerSearch = (e) => {
    setPartnerSearchQuery(e.target.value);
  };

  // Filter chats based on search query
  const filteredChats = chats.filter(chat => {
    if (!searchQuery.trim()) return true;
    const partnerName = getPartnerName(chat).toLowerCase();
    return partnerName.includes(searchQuery.trim().toLowerCase());
  });

  // Delete a chat
  const deleteChat = async (chatId, e) => {
    // Stop event propagation to prevent selecting the chat
    e.stopPropagation();
    
    if (!window.confirm("Are you sure you want to delete this conversation?")) {
      return;
    }
    
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/direct-chats/${chatId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      // Remove the deleted chat from the state
      setChats(prevChats => prevChats.filter(chat => chat._id !== chatId));
      
      // If the deleted chat was selected, clear the selection
      if (selectedChat && selectedChat._id === chatId) {
        setSelectedChat(null);
      }
    } catch (err) {
      console.error("Error deleting chat:", err);
      alert("Failed to delete the conversation. Please try again.");
    }
  };

  // Return chat item markup
  const renderChatItem = (chat) => {
    const partnerName = getPartnerName(chat);
    const lastMessage = chat.messages && chat.messages.length > 0
      ? chat.messages[chat.messages.length - 1].text
      : 'No messages yet';
    const isUnread = hasUnreadMessages(chat);
    const lastMessageTime = getLastMessageTime(chat);
    
    return (
      <div
        key={chat._id}
        className={`chatItem ${selectedChat?._id === chat._id ? 'active' : ''} ${isUnread ? 'unread' : ''}`}
        onClick={() => setSelectedChat(chat)}
      >
        <div className="chatAvatar">
          {partnerName.charAt(0).toUpperCase()}
        </div>
        <div className="chatInfo">
          <div className="chatName">{partnerName}</div>
          <div className="lastMessage">
            {lastMessage ? (lastMessage.substring(0, 30) + (lastMessage.length > 30 ? '...' : '')) : 'No messages yet'}
          </div>
        </div>
        <div className="chatMeta">
          <div className="chatTime">{lastMessageTime}</div>
          {isUnread && <div className="unreadBadge"></div>}
          <button 
            className="deleteButton" 
            onClick={(e) => deleteChat(chat._id, e)}
            title="Delete conversation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    );
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
      {/* Back button - with a more modern design */}
      <button className="backButton" onClick={() => navigate(-1)}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5"></path>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Back</span>
      </button>

      <div className="sidebar">
        <div className="sidebarHeader">
          <h2>Chats</h2>
          <div className={`searchContainer ${searchActive ? 'active' : ''}`}>
            <input 
              type="text" 
              placeholder="Search" 
              className="searchInput"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchActive(true)}
              onBlur={() => {
                // Only close if empty
                if (!searchQuery.trim()) {
                  setSearchActive(false);
                }
              }}
            />
            <svg 
              className="searchIcon" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              onClick={toggleSearch}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            {searchActive && searchQuery && (
              <button 
                className="clearSearch" 
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Available Partners section */}
        <div className="sectionTitle">New Conversation</div>
        <div className="partnersSearch">
          <div className="searchIconContainer">
            <svg 
              className="partnerSearchIcon" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search partners..." 
            className="partnerSearchInput"
            value={partnerSearchQuery}
            onChange={handlePartnerSearch}
          />
        </div>
        <ChatPartnerList
          onSelectPartner={(partner) => {
            setSelectedPartner(partner);
            createNewChat(partner);
          }}
          searchQuery={partnerSearchQuery}
        />

        {/* Chat List - Existing conversations */}
        <div className="sectionTitle">Recent Chats</div>
        <div className="chatList">
          {loading ? (
            <div className="loading">
              <div className="loadingSpinner"></div>
              <span>Loading conversations...</span>
            </div>
          ) : error ? (
            <div className="error">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  const fetchChats = async () => {
                    try {
                      const token = await getToken();
                      console.log("Retrying to fetch direct chats with token:", token ? "Token exists" : "No token");
                      
                      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/direct-chats`, {
                        headers: {
                          Authorization: `Bearer ${token}`
                        }
                      });

                      if (!response.ok) {
                        throw new Error("Failed to fetch chats");
                      }

                      const data = await response.json();
                      console.log("Retry direct chats response:", data);
                      
                      // Include all chats, even if they don't have messages yet
                      const allChats = data.chats || [];
                      console.log(`Retry found ${allChats.length} chats (including empty ones)`);
                      
                      setChats(allChats);
                      setLoading(false);
                    } catch (err) {
                      console.error("Error fetching chats:", err);
                      setError("Failed to load chats. Please try again.");
                      setLoading(false);
                    }
                  };
                  fetchChats();
                }}
                className="retryButton"
              >
                Try Again
              </button>
            </div>
          ) : filteredChats.length === 0 ? (
            searchQuery ? (
              <div className="emptyState">
                <p>No conversations match your search.</p>
              </div>
            ) : (
              <div className="emptyState">
                <p>No conversations yet.</p>
                <p>Start chatting by selecting a partner above!</p>
              </div>
            )
          ) : (
            filteredChats.map(chat => renderChatItem(chat))
          )}
        </div>
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
