import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './DirectChatWindow.css';
import DirectChatMessage from './DirectChatMessage';

const DirectChatWindow = ({ chat, onSendMessage }) => {
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

    // Find the participant who is not the current user
    const partner = chat.participants.find(p =>
      p.userId !== user?.id &&
      p.userId !== user?.userId
    );

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
      <div className="direct-chat-window">
        <div className="no-chat-selected">
          <div className="empty-state">
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
    <div className="direct-chat-window">
      <div className="chat-header">
        <div className="header-avatar">
          {getPartnerName().charAt(0).toUpperCase()}
        </div>
        <div className="header-info">
          <h3>{getPartnerName()}</h3>
          <span className="online-status">
            {chat.online ? 'Online' : 'Last seen ' + (chat.lastActive ? formatTime(chat.lastActive) : 'recently')}
          </span>
        </div>
        <div className="header-actions">
          <button className="icon-button" title="More options">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
        </div>
      </div>

      <div className="messages-container">
        {chat.messages && chat.messages.length > 0 ? (
          <>
            <div className="date-divider">
              <span>Today</span>
            </div>
            {chat.messages.map((msg, index) => {
              const isCurrentUser = msg.sender === user?.id || msg.sender === user?.userId;
              const senderName = getSenderName(msg);

              return (
                <DirectChatMessage
                  key={index}
                  message={msg}
                  isCurrentUser={isCurrentUser}
                  senderName={senderName}
                  formatTime={formatTime}
                />
              );
            })}
          </>
        ) : (
          <div className="empty-state">
            <p>No messages yet</p>
            <p>Type a message below to start the conversation with {getPartnerName()}!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="Type your message here..."
          className="message-input"
          autoFocus
        />
        <button type="submit" className="send-button">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default DirectChatWindow;
