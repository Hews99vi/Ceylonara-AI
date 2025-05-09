import React from 'react';
import { FaImage, FaFile, FaDownload, FaCheck, FaCheckDouble } from 'react-icons/fa';
import './DirectChatMessage.css';

const DirectChatMessage = ({ message, isCurrentUser, senderName, formatTime }) => {
  const senderInitial = senderName.charAt(0).toUpperCase();

  // Function to render file content based on message type
  const renderMessageContent = () => {
    if (message.messageType === 'image' && message.fileUrl) {
      return (
        <div className="dm-file-content">
          <img
            src={`${import.meta.env.VITE_API_URL}${message.fileUrl}`}
            alt="Shared image"
            className="dm-image-attachment"
          />
          <div className="dm-file-caption">{message.text !== `Sent a image` ? message.text : ''}</div>
        </div>
      );
    } else if (message.messageType === 'file' && message.fileUrl) {
      return (
        <div className="dm-file-content">
          <div className="dm-file-attachment">
            <FaFile className="dm-file-icon" />
            <div className="dm-file-details">
              <div className="dm-file-name">{message.fileName}</div>
              <div className="dm-file-size">
                {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : ''}
              </div>
            </div>
            <a
              href={`${import.meta.env.VITE_API_URL}${message.fileUrl}`}
              download={message.fileName}
              className="dm-download-button"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaDownload />
            </a>
          </div>
          <div className="dm-file-caption">{message.text !== `Sent a file` ? message.text : ''}</div>
        </div>
      );
    } else {
      // Regular text message
      return message.text;
    }
  };

  // Render read status indicator
  const renderReadStatus = () => {
    if (isCurrentUser) {
      return message.read ?
        <FaCheckDouble className="dm-read-status read" title="Read" /> :
        <FaCheck className="dm-read-status" title="Sent" />;
    }
    return null;
  };

  if (isCurrentUser) {
    // MY MESSAGE - Right side of the chat
    return (
      <div className="dm-message-container sent">
        <div className="dm-message-wrapper sent">
          <div className="dm-sender-name">You</div>
          <div className={`dm-message-bubble sent ${message.messageType !== 'text' ? 'dm-file-bubble' : ''}`}>
            {renderMessageContent()}
          </div>
          <div className="dm-message-time">
            {formatTime(message.timestamp || message.createdAt)}
            {renderReadStatus()}
          </div>
        </div>
        <div className="dm-avatar sent">
          {senderInitial}
        </div>
      </div>
    );
  } else {
    // OTHER USER'S MESSAGE - Left side of the chat
    return (
      <div className="dm-message-container received">
        <div className="dm-avatar received">
          {senderInitial}
        </div>
        <div className="dm-message-wrapper received">
          <div className="dm-sender-name">{senderName}</div>
          <div className={`dm-message-bubble received ${message.messageType !== 'text' ? 'dm-file-bubble' : ''}`}>
            {renderMessageContent()}
          </div>
          <div className="dm-message-time">
            {formatTime(message.timestamp || message.createdAt)}
          </div>
        </div>
      </div>
    );
  }
};

export default DirectChatMessage;
