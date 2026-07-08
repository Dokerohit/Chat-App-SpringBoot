import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import toast from 'react-hot-toast'
import { baseURL, httpClient } from '../config/AxiosHelper'

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const inputRef = useRef(null);
  const chatBoxRef = useRef(null);
  // useRef avoids stale closure — useState would make sendMessage read an old reference
  const stompClientRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const roomId = location.state?.roomId || "";
  const name = location.state?.name || "Guest";

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    // Fetch previous messages on mount
    const fetchMessages = async () => {
      try {
        const response = await httpClient.get(`/api/v1/rooms/${roomId}/messages`);
        setMessages(response.data);
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };
    fetchMessages();

    // Establish STOMP over SockJS WebSocket
    const client = new Client({
      webSocketFactory: () => new SockJS(`${baseURL}/chat`),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("STOMP Connected ✅");
        setConnected(true);
        toast.success(`You joined room "${roomId}" 🎉`, { duration: 3000 });
        client.subscribe(`/topic/room/${roomId}`, (message) => {
          const newMessage = JSON.parse(message.body);
          setMessages((prev) => [...prev, newMessage]);
        });
      },
      onDisconnect: () => {
        console.log("STOMP Disconnected");
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
        setConnected(false);
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [roomId, navigate]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    const client = stompClientRef.current;
    if (!input.trim()) return;
    if (!client || !client.connected) {
      console.warn("STOMP not connected yet, cannot send.");
      return;
    }
    const messageRequest = {
      sender: name,
      content: input,
      roomId: roomId
    };
    client.publish({
      destination: `/app/sendMessage/${roomId}`,
      body: JSON.stringify(messageRequest)
    });
    setInput("");
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  const handleLeave = () => {
    toast(`You left room "${roomId}"`, {
      icon: '🚪',
      duration: 2500,
    });
    // Short delay so the toast is visible before unmounting
    setTimeout(() => navigate('/'), 300);
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col font-sans">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm">
              Room: <span className="text-zinc-300">{roomId}</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {/* Live WebSocket status dot */}
              <span className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-500'}`}></span>
              <p className="text-zinc-500 text-xs">
                {connected ? `Connected as ${name}` : 'Connecting...'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLeave}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-red-400 text-sm font-medium px-4 py-2 rounded-xl transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Leave Room
        </button>
      </header>

      {/* Chat messages */}
      <div
        ref={chatBoxRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-zinc-500 text-sm">No messages yet</p>
            <p className="text-zinc-600 text-xs mt-1">Start the conversation below</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.sender === name;
            return (
              <div
                key={index}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                    isOwn
                      ? "bg-white text-black rounded-br-sm"
                      : "bg-zinc-800 text-white rounded-bl-sm"
                  }`}
                >
                  {/* Show sender name only for messages from others */}
                  {!isOwn && (
                    <p className="text-xs font-semibold text-zinc-400 mb-1">
                      {msg.sender}
                    </p>
                  )}
                  <p>{msg.content}</p>
                  <p className="text-[10px] mt-1 text-zinc-500">
                    {formatTime(msg.timeStamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input area */}
      <div className="px-6 py-4 bg-zinc-900 border-t border-zinc-800">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-3">

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={connected ? "Type a message..." : "Waiting for connection..."}
            disabled={!connected}
            className="flex-1 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Photo Upload */}
          <label className="cursor-pointer p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <input type="file" accept="image/*" className="hidden" />
          </label>

          {/* Send */}
          <button
            type="submit"
            disabled={!connected}
            className="bg-white hover:bg-zinc-200 text-black rounded-xl p-3 transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage