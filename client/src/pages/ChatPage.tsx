import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Image, X, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { chatAPI } from "@/lib/api";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";

interface ChatMessage {
  _id: string | number;
  content: string;
  type: "text" | "image";
  imageUrl?: string | null;
  sender: { anonId: string; alias: string };
  createdAt: string;
}

const ChatPage = () => {
  const { isAuthenticated, anonId } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load existing messages
  useEffect(() => {
    if (!isAuthenticated) return;
    chatAPI
      .getMessages("global", 50)
      .then((msgs) => {
        setMessages(msgs);
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      })
      .catch(() => setLoading(false));
  }, [isAuthenticated]);

  // Connect socket
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = connectSocket();

    socket.on("chat:message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(scrollToBottom, 50);
    });

    socket.on("room:count", (count: number) => {
      setOnlineCount(count);
    });

    socket.on("chat:typing", ({ alias }: { alias: string }) => {
      setTypingUsers((prev) => (prev.includes(alias) ? prev : [...prev, alias]));
    });

    socket.on("chat:stop-typing", ({ alias }: { alias: string }) => {
      setTypingUsers((prev) => prev.filter((a) => a !== alias));
    });

    socket.on("user:joined", ({ alias }: { alias: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          _id: `sys-join-${Date.now()}`,
          content: `${alias} connected`,
          type: "text",
          sender: { anonId: "system", alias: "SYSTEM" },
          createdAt: new Date().toISOString(),
        },
      ]);
    });

    socket.on("user:left", ({ alias }: { alias: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          _id: `sys-leave-${Date.now()}`,
          content: `${alias} disconnected`,
          type: "text",
          sender: { anonId: "system", alias: "SYSTEM" },
          createdAt: new Date().toISOString(),
        },
      ]);
    });

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated]);

  const handleTyping = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("chat:typing");

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("chat:stop-typing");
    }, 2000);
  };

  const sendMessage = async () => {
    const socket = getSocket();
    if (!socket) return;

    // Image message
    if (imageFile) {
      setUploading(true);
      try {
        const { imageUrl } = await chatAPI.uploadImage(imageFile);
        socket.emit("chat:message", {
          content: input.trim() || "📷 Image",
          type: "image",
          imageUrl,
        });
      } catch (err) {
        console.error("Image upload failed:", err);
      }
      setUploading(false);
      setImageFile(null);
      setImagePreview(null);
      setInput("");
      return;
    }

    // Text message
    const text = input.trim();
    if (!text) return;

    socket.emit("chat:message", { content: text, type: "text" });
    socket.emit("chat:stop-typing");
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB limit

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="font-terminal text-xl text-primary text-glow tracking-wider">
            &gt;_ Global Chat
          </h1>
          <span className="text-xs text-muted-foreground/50 font-terminal">
            [ messages auto-delete in 24h ]
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground font-terminal">
              {onlineCount} online
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 border border-border rounded-sm bg-card/50 p-4 space-y-3 overflow-y-auto scanline mb-4 max-h-[60vh]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground font-terminal">Loading messages...</span>
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground font-terminal">
                No messages yet. Be the first to speak.
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isSystem = msg.sender.anonId === "system";
            const isOwn = msg.sender.anonId === anonId;

            return (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.5) }}
                className="group"
              >
                {isSystem ? (
                  <div className="text-center text-xs text-muted-foreground/40 font-terminal py-1">
                    — {msg.content} —
                  </div>
                ) : (
                  <div className="flex items-start gap-3 text-sm">
                    <span className="text-muted-foreground/40 font-terminal text-xs mt-0.5 shrink-0">
                      {formatTime(msg.createdAt)}
                    </span>
                    <span
                      className={`font-terminal text-xs shrink-0 ${
                        isOwn ? "text-primary" : "text-accent"
                      }`}
                    >
                      {msg.sender.alias}
                    </span>
                    <div className="flex-1">
                      {msg.type === "image" && msg.imageUrl ? (
                        <div>
                          <img
                            src={msg.imageUrl}
                            alt="shared"
                            className="max-w-xs max-h-48 rounded-sm border border-border cursor-pointer hover:border-primary/50 transition-colors"
                            onClick={() => window.open(msg.imageUrl!, "_blank")}
                          />
                          {msg.content && msg.content !== "📷 Image" && (
                            <p className="text-secondary-foreground font-mono mt-1">
                              {msg.content}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-secondary-foreground font-mono">
                          {msg.content}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="text-xs text-muted-foreground/50 font-terminal mb-2 pl-1">
            {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
          </div>
        )}

        {/* Image preview */}
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img
              src={imagePreview}
              alt="preview"
              className="max-h-32 rounded-sm border border-primary/30"
            />
            <button
              onClick={clearImage}
              className="absolute -top-2 -right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 border border-border rounded-sm bg-card text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
            title="Share image"
          >
            <Image size={16} />
          </button>
          <div className="flex-1 flex items-center border border-border rounded-sm bg-card px-3 focus-within:border-primary/50 transition-colors">
            <span className="text-primary/60 text-sm mr-2 font-terminal">$</span>
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                handleTyping();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 bg-transparent py-3 text-sm text-secondary-foreground font-mono outline-none placeholder:text-muted-foreground/30"
              disabled={!isAuthenticated}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={uploading || (!input.trim() && !imageFile)}
            className="px-4 border border-primary/30 rounded-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
