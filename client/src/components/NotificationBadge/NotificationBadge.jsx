import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './NotificationBadge.css';

const NotificationBadge = () => {
  const { getToken } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        // Make sure we have a token before making the request
        const token = await getToken();
        if (!token) {
          console.log('No authentication token available');
          setLoading(false);
          return;
        }

        // Log the API URL for debugging
        console.log(`Fetching notifications from: ${import.meta.env.VITE_API_URL}/api/notifications`);

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications?unreadOnly=true&limit=1`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          console.error(`API response error: ${response.status} ${response.statusText}`);
          setError(true);
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log('Notification data received:', data);

        if (data && data.pagination && typeof data.pagination.unreadCount === 'number') {
          setUnreadCount(data.pagination.unreadCount);
        } else {
          console.warn('Unexpected response format:', data);
          setUnreadCount(0);
        }

        setError(false);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notification count:', error);
        setError(true);
        setLoading(false);
      }
    };

    // Only fetch if the user is authenticated
    if (getToken) {
      fetchUnreadCount();

      // Set up polling to check for new notifications every 30 seconds
      const intervalId = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(intervalId);
    }
  }, [getToken]);

  // Don't show anything while loading or if there's an error
  if (loading || error) return null;

  // Only show badge if there are unread notifications
  if (unreadCount === 0) return null;

  return (
    <div className="notification-badge">
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  );
};

export default NotificationBadge;
