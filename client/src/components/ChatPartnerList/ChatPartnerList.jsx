import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { FaSearch, FaCircle } from 'react-icons/fa';
import './chatPartnerList.css';

const ChatPartnerList = ({ onSelectPartner, searchQuery = '', activeChats = [] }) => {
  const { getToken, user } = useAuth();
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to format timestamp to relative time
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';

    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now - messageTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return messageTime.toLocaleDateString();
  };

  // Filter partners when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPartners(partners);
    } else {
      const filtered = partners.filter(partner =>
        partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (partner.address && partner.address.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredPartners(filtered);
    }
  }, [searchQuery, partners]);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const token = await getToken();

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat-partners`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch partners');
        }

        const data = await response.json();
        // The API returns { success: true, partners } with a success flag
        if (data.success) {
          const partnersList = data.partners || [];
          setPartners(partnersList);
          setFilteredPartners(partnersList);
        } else {
          throw new Error(data.message || 'Failed to fetch partners');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching partners:', err);
        setError('Failed to load partners. Please try again.');
        setLoading(false);
      }
    };

    fetchPartners();
  }, [getToken, user]);

  return (
    <div className="chatPartnerList">
      <div className="partnerListHeader">
        <h3>Available Partners</h3>
      </div>

      {loading ? (
        <div className="loading">
          <span>Finding available partners...</span>
        </div>
      ) : error ? (
        <div className="error">
          <span>{error}</span>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              const fetchPartners = async () => {
                try {
                  const token = await getToken();

                  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat-partners`, {
                    headers: {
                      Authorization: `Bearer ${token}`
                    }
                  });

                  if (!response.ok) {
                    throw new Error('Failed to fetch partners');
                  }

                  const data = await response.json();
                  if (data.success) {
                    const partnersList = data.partners || [];
                    setPartners(partnersList);
                    setFilteredPartners(partnersList);
                  } else {
                    throw new Error(data.message || 'Failed to fetch partners');
                  }
                  setLoading(false);
                } catch (err) {
                  console.error('Error fetching partners:', err);
                  setError('Failed to load partners. Please try again.');
                  setLoading(false);
                }
              };
              fetchPartners();
            }}
            className="refreshButton"
          >
            Refresh Partners
          </button>
        </div>
      ) : partners.length === 0 ? (
        <div className="emptyState">
          <p>No partners available at the moment.</p>
          <p>Please check back later or contact support.</p>
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="emptyState">
          <p>No partners match your search.</p>
          <p>Try a different search term.</p>
        </div>
      ) : (
        <div className="partnersList">
          {filteredPartners.map(partner => {
            // Find if there's an active chat with this partner
            const activeChat = activeChats.find(chat =>
              chat.participants.some(p => p.userId === partner.userId)
            );

            // Check if there are unread messages
            const hasUnread = activeChat?.messages?.some(msg =>
              msg.sender === partner.userId && !msg.read
            );

            // Get last message preview and timestamp
            const lastMessage = activeChat?.messages?.length > 0
              ? activeChat.messages[activeChat.messages.length - 1]
              : null;

            const lastMessagePreview = activeChat?.lastMessagePreview || '';
            const lastMessageTime = lastMessage?.timestamp || activeChat?.updatedAt;

            return (
              <div
                key={partner.userId}
                className={`partnerItem ${hasUnread ? 'has-unread' : ''}`}
                onClick={() => onSelectPartner(partner)}
              >
                <div className="partnerAvatar">
                  {partner.name.charAt(0).toUpperCase()}
                </div>
                <div className="partnerInfo">
                  <div className="partnerName">
                    {partner.name}
                    {hasUnread && <FaCircle className="unread-indicator" />}
                  </div>
                  <div className="partnerRole">{partner.role}</div>
                  {lastMessagePreview && (
                    <div className="lastMessagePreview">
                      {lastMessagePreview.length > 30
                        ? lastMessagePreview.substring(0, 30) + '...'
                        : lastMessagePreview}
                    </div>
                  )}
                </div>
                {lastMessageTime && (
                  <div className="lastMessageTime">
                    {formatRelativeTime(lastMessageTime)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatPartnerList;
