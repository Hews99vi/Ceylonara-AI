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

  // Get the partner name from the chat
  const getPartnerName = () => {
    if (!chat || !chat.participants) return 'Unknown';
    const partner = chat.participants.find(p => p.userId !== user?.id && p.userId !== user?.userId);
    // Make sure we display the actual name, not "You"
    return partner && partner.name !== 'You' ? partner.name : (partner?.role === 'factory' ? 'Factory' : 'Farmer');
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSendMessage(message);
    setMessage('');
  };

  if (!chat) {
    return (
      <div className="chatWindow">
        <div className="noChatSelected">
          <div className="emptyState">
            <p>Welcome to Direct Messages</p>
            <p>Select a factory from the list to start a conversation</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chatWindow">
      <div className="chatHeader">
        <h3>{getPartnerName()}</h3>
      </div>

      <div className="messagesContainer">
        {chat.messages && chat.messages.length > 0 ? (
          chat.messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.sender === user?.id || msg.sender === user?.userId ? 'sent' : 'received'}`}
            >
              <div className="messageContent">{msg.text}</div>
              <div className="messageTime">
                {new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        ) : (
          <div className="emptyState">
            <p>No messages yet</p>
            <p>Type a message below to start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="messageForm" onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="messageInput"
          autoFocus
        />
        <button
          type="submit"
          className="sendButton"
          disabled={!message.trim()}
          title="Send message"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
