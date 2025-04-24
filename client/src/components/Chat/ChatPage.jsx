import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import ChatPartnerList from "./ChatPartnerList";
import ChatWindow from "./ChatWindow";

const ChatPage = () => {
  const { user } = useUser();
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load chat when partner is selected
  useEffect(() => {
    if (!selectedPartner) return;
    setLoading(true);
    // Try to find an existing chat
    fetch("/api/direct-chats", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        const existing = data.chats.find(c => c.participants.some(p => p.userId === selectedPartner.userId));
        if (existing) {
          setChat(existing);
          setLoading(false);
        } else {
          // No chat, create one
          fetch("/api/direct-chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              recipientId: selectedPartner.userId,
              recipientRole: selectedPartner.role,
              recipientName: selectedPartner.name,
              senderName: user?.firstName || user?.username || "You",
              senderRole: selectedPartner.role === "factory" ? "farmer" : "factory",
              initialMessage: ""
            })
          })
            .then(res => res.json())
            .then(data => {
              setChat(data.chat);
              setLoading(false);
            });
        }
      });
  }, [selectedPartner, user]);

  const handleSendMessage = msg => {
    if (!chat || !msg.trim()) return;
    fetch(`/api/direct-chats/${chat._id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message: msg })
    })
      .then(res => res.json())
      .then(data => {
        setChat(data.chat);
      });
  };

  return (
    <div style={{ display: "flex", gap: 24, padding: 24 }}>
      <div style={{ minWidth: 220 }}>
        <ChatPartnerList onSelectPartner={setSelectedPartner} />
      </div>
      <div style={{ flex: 1 }}>
        {loading ? (
          <div>Loading chat...</div>
        ) : (
          <ChatWindow
            chat={chat}
            userId={user?.id || user?.userId}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>
    </div>
  );
};

export default ChatPage;
