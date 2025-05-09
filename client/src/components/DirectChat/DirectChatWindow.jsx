import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { FaPaperclip, FaImage, FaFile, FaTimes } from 'react-icons/fa';
import './DirectChatWindow.css';
import DirectChatMessage from './DirectChatMessage';

const DirectChatWindow = ({ chat, onSendMessage, onSendFileMessage }) => {
  const { user, getToken } = useAuth();
  const [message, setMessage] = useState('');
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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
    console.log("DirectChat getSenderName - Message sender:", msg.sender, "Current user:", currentUserId);
    console.log("DirectChat getSenderName - Chat participants:", chat.participants);

    // Check if the message is from the current user
    if (msg.sender === currentUserId) {
      return "You";
    }

    // If not the current user, it must be the partner
    // Find the participant who is not the current user
    const partner = chat.participants.find(p => p.userId !== currentUserId);

    console.log("DirectChat getSenderName - Identified partner:", partner);

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
    const currentUserId = user?.id || user?.userId;

    // Find the participant who is not the current user
    const partner = chat.participants.find(p => p.userId !== currentUserId);

    // Return the partner's actual name
    if (partner && partner.name) {
      return partner.name;
    } else if (partner && partner.role) {
      // Fallback to capitalized role if no name
      return partner.role.charAt(0).toUpperCase() + partner.role.slice(1);
    }

    return 'Unknown';
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please select a smaller file.');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      // For non-image files, just show the file name
      setFilePreview(null);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file upload and message sending
  const handleSendFile = async () => {
    if (!selectedFile || !chat) return;

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('message', message.trim());

      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/direct-chats/${chat._id}/file-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();

      // Clear the form
      setMessage('');
      setSelectedFile(null);
      setFilePreview(null);

      // Update the chat with the new message
      if (onSendFileMessage) {
        onSendFileMessage(data.chat);
      }
    } catch (error) {
      console.error('Error sending file:', error);
      alert('Failed to send file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedFile) {
      handleSendFile();
      return;
    }

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
              const currentUserId = user?.id || user?.userId;
              const isCurrentUser = msg.sender === currentUserId;
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

      {selectedFile && (
        <div className="file-preview-container">
          <div className="file-preview-header">
            <span className="file-preview-title">
              {selectedFile.type.startsWith('image/') ? 'Image' : 'File'} selected
            </span>
            <button
              type="button"
              className="remove-file-button"
              onClick={handleRemoveFile}
            >
              <FaTimes />
            </button>
          </div>

          <div className="file-preview-content">
            {filePreview ? (
              <img src={filePreview} alt="Preview" className="image-preview" />
            ) : (
              <div className="file-info">
                <FaFile className="file-icon" />
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <form className="message-form" onSubmit={handleSubmit}>
        <div className="message-input-container">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Type your message here..."
            className="message-input"
            disabled={isUploading}
            autoFocus
          />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept="image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          />

          <button
            type="button"
            className="attachment-button"
            onClick={() => fileInputRef.current.click()}
            disabled={isUploading || selectedFile !== null}
          >
            <FaPaperclip />
          </button>
        </div>

        <button
          type="submit"
          className="send-button"
          disabled={isUploading || (message.trim() === '' && !selectedFile)}
        >
          {isUploading ? (
            <div className="spinner"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default DirectChatWindow;
