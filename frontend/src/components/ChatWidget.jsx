import React, { useState, useRef, useEffect } from "react";
import {
  FaRobot,
  FaPaperPlane,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import "../styles/ChatWidget.css";

const ChatWidget = () => {
  const [open, setOpen] = useState(true);
  const [history, setHistory] = useState([
    {
      role: "assistant",
      content: "Hi \uD83D\uDC4B — ask me anything about restaurants or menus!",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bodyRef = useRef(null);
  const sourceRef = useRef(null);

  // Auto‑scroll to newest message
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [history, open]);

  const closeStream = () => {
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
    setStreaming(false);
  };

  const send = () => {
    const text = input.trim();
    if (!text || streaming) return;

    const newHist = [...history, { role: "user", content: text }];
    setHistory(newHist);
    setInput("");
    setStreaming(true);

    fetch("http://localhost:5000/api/restaurant-bot", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
      },
      credentials: 'include',
      body: JSON.stringify({ messages: newHist }),
    }).then(async (resp) => {
      if (!resp.ok || !resp.body) {
        throw new Error("Network error");
      }
      
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantMessage = "";
      
      setHistory(h => [...h, { role: "assistant", content: "" }]);
    
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            if (line.startsWith("data:")) {
              const content = line.slice(5); // Remove trim()
              if (content) {
                assistantMessage += content;
                setHistory(h => [...h.slice(0, -1), 
                  { role: "assistant", content: assistantMessage }
                ]);
              }
            }
          }
        }
        
        // Process remaining content
        if (buffer.startsWith("data:")) {
          const content = buffer.slice(5); // Remove trim()
          if (content) {
            assistantMessage += content;
            setHistory(h => [...h.slice(0, -1), 
              { role: "assistant", content: assistantMessage }
            ]);
          }
        }
      } catch (error) {
        throw new Error("Stream processing error: " + error.message);
      }
    })
    .catch((error) => {
      console.error("Chat error:", error);
      setHistory(h => [...h, { 
        role: "assistant", 
        content: "Sorry – something went wrong. Please try again." 
      }]);
    })
    .finally(() => {
      setStreaming(false);
    });
  };

  return (
    <div className="tm-chat">
      <div className="tm-chat__card">
        {/* Header */}
        <div className="tm-chat__header" onClick={() => setOpen(!open)}>
          <div className="tm-chat__header-title">
            <FaRobot /> TableMate‑AI
          </div>
          {open ? <FaChevronDown /> : <FaChevronUp />}
        </div>

        {/* Body */}
        {open && (
          <>
            <div className="tm-chat__body" ref={bodyRef}>
              {history.map((m, i) => (
                <div
                  key={i}
                  className={`tm-chat__message ${
                    m.role === 'user' ? 'tm-chat__message--user' : ''
                  }`}
                >
                  <div
                    className={`tm-chat__bubble ${
                      m.role === 'assistant'
                        ? 'tm-chat__bubble--assistant'
                        : 'tm-chat__bubble--user'
                    }`}
                  >
                    {m.content || <span className="tm-chat__typing">...</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="tm-chat__input-container">
              <input
                type="text"
                className="tm-chat__input"
                placeholder="Type a message…"
                value={input}
                disabled={streaming}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button
                className="tm-chat__send-button"
                onClick={send}
                disabled={!input.trim() || streaming}
              >
                <FaPaperPlane />
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatWidget;
