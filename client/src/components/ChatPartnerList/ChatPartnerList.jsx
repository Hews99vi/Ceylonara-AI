import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { FaSearch } from 'react-icons/fa';
import './chatPartnerList.css';

const ChatPartnerList = ({ onSelectPartner }) => {
  const { getToken, user } = useAuth();
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter partners when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPartners(partners);
    } else {
      const filtered = partners.filter(partner =>
        partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPartners(filtered);
    }
  }, [searchTerm, partners]);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const userRole = user?.publicMetadata?.role;
        const partnerRole = userRole === 'farmer' ? 'factory' : 'farmer';

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
        <div className="searchContainer">
          <input
            type="text"
            placeholder="Search partners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="searchInput"
          />
          <FaSearch className="searchIcon" />
        </div>
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
                  const userRole = user?.publicMetadata?.role;
                  const partnerRole = userRole === 'farmer' ? 'factory' : 'farmer';

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
            }}
            style={{
              padding: '6px 12px',
              marginTop: '10px',
              background: 'linear-gradient(to right, #218608, #23ce7e)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(35, 206, 126, 0.3)',
              transition: 'all 0.2s ease',
              fontSize: '0.9rem'
            }}
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
          {filteredPartners.map(partner => (
            <div
              key={partner.userId}
              className="partnerItem"
              onClick={() => onSelectPartner(partner)}
            >
              <div className="partnerName">{partner.name}</div>
              <div className="partnerRole">{partner.role}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatPartnerList;
