import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

// Create context
const SocketContext = createContext(null);

// Socket provider component
export const SocketProvider = ({ children }) => {
  const { user, isSignedIn } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Initialize socket connection when user is signed in
  useEffect(() => {
    if (!isSignedIn || !user) return;

    // For now, we're using a mock socket implementation
    console.log('Socket.io is not available, using mock implementation');
    setConnected(true);

    // Clean up on unmount
    return () => {
      console.log('Mock socket disconnected');
      setConnected(false);
    };
  }, [isSignedIn, user]);

  // Request notification permission
  useEffect(() => {
    if (isSignedIn && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, [isSignedIn]);

  // Clear notification for a specific chat
  const clearNotifications = (chatId) => {
    setNotifications(prev => prev.filter(n => n.chatId !== chatId));
  };

  // Send a message notification (mock implementation)
  const sendMessageNotification = (recipientId, chatId, messagePreview) => {
    console.log('Mock sending notification:', {
      recipientId,
      chatId,
      messagePreview
    });
    // In a real implementation, this would emit a socket event
  };

  return (
    <SocketContext.Provider value={{
      socket,
      connected,
      notifications,
      clearNotifications,
      sendMessageNotification
    }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
