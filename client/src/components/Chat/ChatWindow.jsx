import React, { useEffect, useState, useRef } from "react";

const ChatWindow = ({ chat, userId, onSendMessage }) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat]);

  if (!chat) return <div style={{ minHeight: 200 }}>Select a chat to start messaging.</div>;

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 12, marginTop: 12 }}>
      <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 12 }}>
        {(chat.messages || []).map((msg, idx) => (
          <div
            key={idx}
            style={{
              textAlign: String(msg.sender) === String(userId) ? "right" : "left",
              margin: "6px 0"
            }}
          >
            <span
              style={{
                background: String(msg.sender) === String(userId) ? "#d1f7c4" : "#f0f0f0",
                padding: "6px 12px",
                borderRadius: 12,
                display: "inline-block"
              }}
            >
              {msg.text}
            </span>
            <div style={{ fontSize: "0.8em", color: "#888" }}>
              {(msg.timestamp || msg.createdAt)
                ? new Date(msg.timestamp || msg.createdAt).toLocaleString()
                : ""}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={e => {
          e.preventDefault();
          if (typeof onSendMessage === "function" && message.trim()) {
            onSendMessage(message);
            setMessage("");
          }
        }}
        style={{ display: "flex", gap: 8 }}
      >
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type your message..."
          style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
        />
        <button type="submit" style={{ padding: "8px 16px" }}>Send</button>
      </form>
    </div>
  );
};

export default ChatWindow;
