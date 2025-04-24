import React, { useEffect, useState } from "react";

const ChatPartnerList = ({ onSelectPartner }) => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/chat-partners", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setPartners(data.partners || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading partners...</div>;
  if (!partners.length) return <div>No partners found.</div>;

  return (
    <div>
      <h3>Select a Chat Partner</h3>
      <ul>
        {partners.map(partner => (
          <li key={partner.userId}>
            <button onClick={() => onSelectPartner(partner)}>
              {partner.name} <span style={{ color: '#888', fontSize: '0.9em' }}>({partner.role})</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatPartnerList;
