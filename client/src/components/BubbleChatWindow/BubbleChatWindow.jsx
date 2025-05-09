import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './bubbleChatWindow.css';

const BubbleChatWindow = ({ chat, onSendMessage }) => {
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

    const currentUserId = user?.id || user?.userId;
    console.log("BubbleChat getSenderName - Message sender:", msg.sender, "Current user:", currentUserId);
    console.log("BubbleChat getSenderName - Chat participants:", chat.participants);

    // Check if the message is from the current user
    if (msg.sender === currentUserId) {
      return "You";
    }

    // If not the current user, it must be the partner
    // Find the participant who is not the current user
    const partner = chat.participants.find(p => p.userId !== currentUserId);

    console.log("BubbleChat getSenderName - Identified partner:", partner);

    // Return the partner's actual name
    if (partner && partner.name) {
      return partner.name;
    } else if (partner && partner.role) {
      // Fallback to capitalized role if no name
      return partner.role.charAt(0).toUpperCase() + partner.role.slice(1);
    }

    // Fallback to trying to find the exact sender (original approach)
    const exactSender = chat.participants.find(p => p.userId === msg.sender);
    return exactSender?.name || 'Unknown User';
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
      <div className="bubble-chat-window">
        <div className="bubble-no-chat-selected">
          <div className="bubble-empty-state">
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
    <div className="bubble-chat-window">
      <div className="bubble-chat-header">
        <div className="bubble-header-avatar">
          {getPartnerName().charAt(0).toUpperCase()}
        </div>
        <div className="bubble-header-info">
          <h3>{getPartnerName()}</h3>
          <span className="bubble-online-status">
            {chat.online ? 'Online' : 'Last seen ' + (chat.lastActive ? formatTime(chat.lastActive) : 'recently')}
          </span>
        </div>
        <div className="bubble-header-actions">
          <button className="bubble-icon-button" title="More options">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
        </div>
      </div>

      <div className="bubble-messages-container">
        {chat.messages && chat.messages.length > 0 ? (
          <>
            <div className="bubble-date-divider">
              <span>Today</span>
            </div>
            {chat.messages.map((msg, index) => {
              const isCurrentUser = msg.sender === user?.id || msg.sender === user?.userId;
              const senderName = getSenderName(msg);
              const senderInitial = senderName.charAt(0).toUpperCase();

              return (
                <div key={index} className={`bubble-message-row ${isCurrentUser ? 'bubble-sent' : 'bubble-received'}`}>
                  {!isCurrentUser && (
                    <div className="bubble-avatar">
                      {senderInitial}
                    </div>
                  )}

                  <div className="bubble-message-content">
                    <div className="bubble-sender-name">
                      {isCurrentUser ? 'You' : senderName}
                    </div>
                    <div className="bubble-message-bubble">
                      {msg.text}
                    </div>
                    <div className="bubble-timestamp">
                      {formatTime(msg.timestamp || msg.createdAt)}
                    </div>
                  </div>

                  {isCurrentUser && (
                    <div className="bubble-avatar">
                      {senderInitial}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <div className="bubble-empty-state">
            <p>No messages yet</p>
            <p>Type a message below to start the conversation with {getPartnerName()}!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="bubble-message-form" onSubmit={handleSubmit}>
        <button type="button" className="bubble-attach-button" title="Attach file">
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
          className="bubble-message-input"
          autoFocus
        />
        <button type="submit" className="bubble-send-button">
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default BubbleChatWindow;
