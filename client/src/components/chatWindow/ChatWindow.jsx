import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './chatWindow.css';

const ChatWindow = ({ chat, onSendMessage }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat?.messages]);

  // Also scroll to bottom when component mounts
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Get the sender name 
  const getSenderName = (msg) => {
    if (!chat || !chat.participants) return 'Unknown';
    
    // Check if the message is from the current user
    if (msg.sender === user?.id || msg.sender === user?.userId) {
      return "You";
    }
    
    // Find the participant who sent this message
    const sender = chat.participants.find(p => p.userId === msg.sender);
    
    // Always return the sender's actual name - if for some reason it's not available, 
    // use Unknown instead of generic role names
    return sender?.name || 'Unknown User';
  };

  // Get the partner name for the chat header
  const getPartnerName = () => {
    if (!chat || !chat.participants) return 'Unknown';
    
    console.log("ChatWindow - Current user ID:", user?.id, "userId:", user?.userId);
    console.log("ChatWindow - Chat participants:", chat.participants);
    
    // Find the participant who is not the current user
    const partner = chat.participants.find(p => 
      p.userId !== user?.id && 
      p.userId !== user?.userId
    );
    
    console.log("ChatWindow - Identified partner:", partner);
    
    // Return the partner's actual name
    if (partner && partner.name) {
      return partner.name;
    } else if (partner && partner.role) {
      // Fallback to capitalized role if no name
      return partner.role.charAt(0).toUpperCase() + partner.role.slice(1);
    }
    
    return 'Unknown';
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    try {
      onSendMessage(message.trim());
      setMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  // Handle input change with validation
  const handleInputChange = (e) => {
    // Limit to 500 characters
    const value = e.target.value;
    if (value.length <= 500) {
      setMessage(value);
    }
  };

  // Handle key press in the input
  const handleKeyPress = (e) => {
    // Send message on Enter (but not with Shift+Enter which creates a new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!chat) {
    return (
      <div className="chatWindow">
        <div className="noChatSelected">
          <div className="emptyState">
            <p>Welcome to Direct Messages</p>
            <p>Select a contact from the list to start a conversation</p>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chatWindow">
      <div className="chatHeader">
        <div className="headerAvatar">
          {getPartnerName().charAt(0).toUpperCase()}
        </div>
        <div className="headerInfo">
          <h3>{getPartnerName()}</h3>
          <span className="onlineStatus">
            {chat.online ? 'Online' : 'Last seen ' + (chat.lastActive ? formatTime(chat.lastActive) : 'recently')}
          </span>
        </div>
        <div className="headerActions">
          <button className="iconButton" title="Voice call">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </button>
          <button className="iconButton" title="Video call">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </button>
          <button className="iconButton" title="More options">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
        </div>
      </div>

      <div className="messagesContainer">
        {chat.messages && chat.messages.length > 0 ? (
          <>
            <div className="dateDivider">
              <span>Today</span>
            </div>
            {chat.messages.map((msg, index) => {
              const isCurrentUser = msg.sender === user?.id || msg.sender === user?.userId;
              const prevMsg = index > 0 ? chat.messages[index - 1] : null;
              const showSenderName = !isCurrentUser && (!prevMsg || prevMsg.sender !== msg.sender);
              
              return (
                <div key={index} className={`messageWrapper ${isCurrentUser ? 'sent' : 'received'}`}>
                  {showSenderName && !isCurrentUser && (
                    <div className="senderName">{getSenderName(msg)}</div>
                  )}
                  <div className="message">
                    <div className="messageContent">{msg.text}</div>
                    <div className="messageTime">
                      {formatTime(msg.timestamp || msg.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="emptyState">
            <p>No messages yet</p>
            <p>Type a message below to start the conversation with {getPartnerName()}!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="messageForm" onSubmit={handleSubmit}>
        <button type="button" className="attachButton" title="Attach file">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
        </button>
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="Type your message here..."
          className="messageInput"
          autoFocus
        />
        <button type="button" className="emojiButton" title="Add emoji">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
        </button>
        <button type="button" className="cameraButton" title="Add photo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
            <circle cx="12" cy="12" r="4"></circle>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
