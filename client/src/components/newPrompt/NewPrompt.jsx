import { useEffect, useRef, useState } from "react";
import "./newPrompt.css";
import "../../routes/chatPage/chatBubbleStyle.css";
import Upload from "../upload/Upload";
import { IKImage } from "imagekitio-react";
import model from "../../lib/gemini";
import Markdown from "react-markdown";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const NewPrompt = ({ data }) => {
  const [messages, setMessages] = useState(data?.history || []);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [img, setImg] = useState({
    isLoading: false,
    error: "",
    dbData: {},
    aiData: {},
  });

  // Remove the useEffect that updates messages when data changes
  // since we only want to initialize it once

  const chat = model.startChat({
    history: messages.map(({ role, parts }) => ({
      role: role === 'assistant' ? 'model' : role,
      parts: [{ text: parts[0].text }],
    })),
    generationConfig: {},
  });

  const endRef = useRef(null);
  const formRef = useRef(null);

  // Fix: Update dependency array to use currentQuestion and currentAnswer
  useEffect(() => {
    endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [data, currentQuestion, currentAnswer, img.dbData]);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chats/${data._id}/messages`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: currentQuestion,
          role: "user",
          images: img.dbData?.filePath ? [img.dbData.filePath] : []
        }),
      });

      if (currentAnswer) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/chats/${data._id}/messages`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: currentAnswer,
            role: "model",
            images: []
          }),
        });
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", data._id] });
      formRef.current.reset();
      setCurrentQuestion("");
      setCurrentAnswer("");
      setImg({
        isLoading: false,
        error: "",
        dbData: {},
        aiData: {},
      });
    },
    onError: (err) => {
      console.log(err);
    },
  });

  // Simple function to check if a question is likely tea-related
  const checkIfTeaRelated = (text) => {
    const teaKeywords = [
      'tea', 'ceylon', 'brew', 'steep', 'infuse', 'leaves', 'cup',
      'black tea', 'green tea', 'white tea', 'oolong', 'chai', 'matcha',
      'darjeeling', 'assam', 'earl grey', 'jasmine', 'herbal', 'teapot',
      'teacup', 'caffeine', 'antioxidant', 'camellia sinensis', 'sri lanka',
      'china tea', 'japanese tea', 'tea ceremony', 'tea estate', 'tea plantation'
    ];

    const lowerText = text.toLowerCase();
    return teaKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  };

  const add = async (text, isInitial) => {
    if (!isInitial) {
      setCurrentQuestion(text);
      // Add user message to history
      setMessages(prev => [...prev, {
        role: 'user',
        parts: [{ text }],
        img: img.dbData?.filePath
      }]);
    }

    try {
      const isTeaRelated = checkIfTeaRelated(text);

      if (!isTeaRelated && !isInitial) {
        const response = "Ayubowan,🙏 I am Ceylonara, your gentle guide through the serene world of tea...";
        setCurrentAnswer(response);
        setMessages(prev => [...prev, {
          role: 'model', // Changed from 'assistant' to 'model'
          parts: [{ text: response }]
        }]);
        mutation.mutate();
        return;
      }

      const result = await chat.sendMessageStream(
        Object.entries(img.aiData).length ? [img.aiData, text] : [text]
      );

      let accumulatedText = "";
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        accumulatedText += chunkText;
        setCurrentAnswer(accumulatedText);
      }

      // Add AI response to history
      setMessages(prev => [...prev, {
        role: 'model', // Changed from 'assistant' to 'model'
        parts: [{ text: accumulatedText }]
      }]);

      mutation.mutate();
    } catch (err) {
      console.log(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = e.target.text.value;
    if (!text) return;

    // Clear the input field immediately after getting its value
    e.target.text.value = '';

    add(text, false);
  };

  // IN PRODUCTION WE DON'T NEED IT
  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current) {
      if (data?.history?.length === 1) {
        add(data.history[0].parts[0].text, true);
      }
    }
    hasRun.current = true;
  }, []);

  return (
    <>
      {/* Only show current interaction that's not yet in messages */}
      {currentQuestion && (
        <div className="message-row user" style={{ backgroundColor: 'transparent' }}>
          <div className="avatar">Y</div>
          <div className="message-content">
            <div className="sender-name">You</div>
            <div className="message-bubble">
              {currentQuestion}
            </div>
            <div className="timestamp">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      )}
      {currentAnswer && (
        <div className="message-row model" style={{ backgroundColor: 'transparent' }}>
          <div className="avatar">A</div>
          <div className="message-content">
            <div className="sender-name">Ceylonara AI</div>
            <div className="message-bubble">
              <Markdown>{currentAnswer}</Markdown>
            </div>
            <div className="timestamp">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      )}

      <div className="endChat" ref={endRef}></div>
      <form className="newForm" onSubmit={handleSubmit} ref={formRef}>
        <Upload setImg={setImg} />
        <input id="file" type="file" multiple={false} hidden />
        <input type="text" name="text" placeholder="Ask anything about tea..." />
        <button type="submit" className="send-button">
          <i className="fas fa-paper-plane"></i>
          Send
        </button>
      </form>
    </>
  );
};

export default NewPrompt;