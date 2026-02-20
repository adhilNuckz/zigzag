import { useState, useEffect, useRef } from 'react';
import { connectSocket, getSocket, disconnectSocket } from '../lib/socket';
import { chatAPI } from '../lib/api';
import useAuthStore from '../stores/authStore';

export default function Chat() {
  const { alias, anonId, isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const messagesEnd = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Load recent messages
    chatAPI.getMessages().then(setMessages).catch(console.error);

    // Connect socket
    const socket = connectSocket();
    if (!socket) return;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('chat:message', (msg) => {
      setMessages((prev) => [...prev.slice(-199), msg]);
    });

    socket.on('chat:typing', ({ alias: who }) => {
      setTyping((prev) => (prev.includes(who) ? prev : [...prev, who]));
    });

    socket.on('chat:stop-typing', ({ alias: who }) => {
      setTyping((prev) => prev.filter((a) => a !== who));
    });

    socket.on('room:count', setOnlineCount);

    socket.on('user:joined', ({ alias: who }) => {
      setMessages((prev) => [
        ...prev,
        { _id: `sys-${Date.now()}`, type: 'system', content: `${who} joined`, createdAt: new Date() },
      ]);
    });

    socket.on('user:left', ({ alias: who }) => {
      setMessages((prev) => [
        ...prev,
        { _id: `sys-${Date.now()}`, type: 'system', content: `${who} left`, createdAt: new Date() },
      ]);
    });

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !connected) return;

    const socket = getSocket();
    socket.emit('chat:message', { content: input.trim(), type: 'text' });
    socket.emit('chat:stop-typing');
    setInput('');
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const socket = getSocket();
    if (!socket) return;

    socket.emit('chat:typing');
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('chat:stop-typing');
    }, 2000);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-20">
        <p className="text-dark-300 font-mono text-sm">Initializing anonymous session...</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn flex flex-col h-[calc(100vh-160px)]">
      {/* Chat Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-dark-400">
        <div className="flex items-center gap-3">
          <h1 className="font-pixel text-sm text-lime-500">{'>'} GLOBAL CHAT</h1>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-lime-500' : 'bg-red-500'} animate-pulse-slow`} />
            <span className="text-xs text-dark-300 font-mono">{connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
          </div>
        </div>
        <span className="text-xs text-dark-400 font-mono">{onlineCount} online</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 mb-4 pr-2">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-dark-400 text-xs font-mono">No messages yet. Say something.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg._id} className="animate-fadeIn">
            {msg.type === 'system' ? (
              <p className="text-dark-400 text-xs font-mono text-center py-1">
                --- {msg.content} ---
              </p>
            ) : (
              <div className={`group flex gap-2 py-0.5 hover:bg-lime-500/5 px-2 -mx-2 ${
                msg.sender?.anonId === anonId ? 'bg-lime-500/5' : ''
              }`}>
                <span className="text-dark-500 text-xs font-mono flex-shrink-0 pt-0.5">
                  {formatTime(msg.createdAt)}
                </span>
                <span className={`text-xs font-mono flex-shrink-0 ${
                  msg.sender?.anonId === anonId ? 'text-lime-400' : 'text-lime-500/70'
                }`}>
                  {msg.sender?.alias}:
                </span>
                <p className="text-xs font-mono text-dark-300 break-all">
                  {msg.content}
                </p>
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEnd} />
      </div>

      {/* Typing Indicator */}
      {typing.length > 0 && (
        <div className="mb-2 flex items-center gap-2">
          <div className="typing-dots text-lime-500 text-xs">
            <span>.</span><span>.</span><span>.</span>
          </div>
          <span className="text-xs text-dark-400 font-mono">
            {typing.slice(0, 3).join(', ')}{typing.length > 3 ? ` +${typing.length - 3}` : ''} typing
          </span>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <div className="flex-1 flex items-center bg-dark-800 border border-dark-400 focus-within:border-lime-500/50 transition-colors">
          <span className="text-lime-500/50 text-xs font-mono pl-3">{alias}{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 bg-transparent text-lime-500 font-mono text-sm px-2 py-2.5 focus:outline-none placeholder:text-dark-400"
            disabled={!connected}
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || !connected}
          className="btn-primary text-xs px-4"
        >
          SEND
        </button>
      </form>

      {/* Info Bar */}
      <div className="mt-2 text-center">
        <p className="text-xs text-dark-500 font-mono">
          Messages auto-delete after 24h • No permanent logs
        </p>
      </div>
    </div>
  );
}
