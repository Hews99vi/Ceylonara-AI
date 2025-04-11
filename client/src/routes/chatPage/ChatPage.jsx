import "./chatPage.css";
import NewPrompt from "../../components/newPrompt/NewPrompt";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import Markdown from "react-markdown";
import { IKImage } from "imagekitio-react";

const ChatPage = () => {
  const path = useLocation().pathname;
  const chatId = path.split("/").pop();

  const { isPending, error, data } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {

      // Fetch both chat details and messages
      const [chatResponse, messagesResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}`, {
          credentials: "include",
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}/messages`, {
          credentials: "include",
        })
      ]);

      const chatData = await chatResponse.json();
      const messages = await messagesResponse.json();

      // Combine chat data with messages history
      return {
        ...chatData,
        history: messages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : msg.role,
          parts: [{ text: msg.text }],
          img: msg.images?.[0]
        }))
      };
    },
    refetchOnWindowFocus: false,
    staleTime: 0, // Ensure fresh data on mount
    cacheTime: 0  // Don't cache the data
  });

  return (
    <div className="chatPage">
      <div className="wrapper">
        <div className="chat">
          {isPending ? (
            <div className="loading">Loading...</div>
          ) : error ? (
            <div className="error">Something went wrong!</div>
          ) : (
            data?.history?.map((message, i) => (
              <div key={`message-${i}`} className="messageWrapper">
                {message.img && (
                  <IKImage
                    urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
                    path={message.img || null}
                    height="300"
                    width="400"
                    transformation={[{ height: 300, width: 400 }]}
                    loading="lazy"
                    lqip={{ active: true, quality: 20 }}
                    alt="Uploaded tea image"
                  />
                )}
                <div
                  className={
                    message.role === "user" ? "message user" : "message"
                  }
                >
                  <Markdown>{message.parts[0].text}</Markdown>
                </div>
              </div>
            ))
          )}
          {data && <NewPrompt data={data} />}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;