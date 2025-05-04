import React from 'react';
import './fixedChatMessage.css';

const FixedChatMessage = ({ message, isCurrentUser, senderName, formatTime }) => {
  const senderInitial = senderName.charAt(0).toUpperCase();
  const messageClass = isCurrentUser ? "fixed-message-row fixed-sent" : "fixed-message-row fixed-received";
  
  return (
    <div className={messageClass}>
      <div className="fixed-avatar">{senderInitial}</div>
      <div className="fixed-content">
        <div className="fixed-sender">{isCurrentUser ? 'You' : senderName}</div>
        <div className="fixed-bubble">{message.text}</div>
        <div className="fixed-time">{formatTime(message.timestamp || message.createdAt)}</div>
      </div>
    </div>
  );
};

export default FixedChatMessage;
