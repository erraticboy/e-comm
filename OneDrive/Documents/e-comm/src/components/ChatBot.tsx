import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, Send, Bot, Zap, Sparkles, Code } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'cyra';
  text: string;
  timestamp: string;
}

export const ChatBot = () => {
  const { 
    chatOpen, setChatOpen, products, setCurrentPage, 
    setSelectedProductId, setTrackingCode, user, socket, selectedProductId 
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live support states
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [sellerName, setSellerName] = useState("Hardware Vendor");
  const [targetSellerId, setTargetSellerId] = useState("");

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0 && !isLiveMode) {
      setMessages([
        {
          sender: 'cyra',
          text: "System Online. Welcome! I am CYRA v4.9, your AI shopping assistant. Looking to get discount codes, track your orders, or buy products? Tell me how I can help.",
          timestamp: getTimestamp()
        }
      ]);
    }
  }, [messages, isLiveMode]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Socket chat sync effect
  useEffect(() => {
    if (!socket || !isLiveMode || !user || !targetSellerId) return;

    // Join the support channel
    socket.emit('join_chat', { clientId: user.id, sellerId: targetSellerId });

    socket.on('chat_history', (history: any[]) => {
      const mapped: ChatMessage[] = history.map(h => ({
        sender: (h.sender === 'client' ? 'user' : 'cyra') as 'user' | 'cyra',
        text: h.text,
        timestamp: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setMessages(mapped);
    });

    socket.on('receive_message', (msg: any) => {
      // Map 'client' sender to 'user' bubble, and 'seller' to 'cyra' bubble (vendor style)
      const mappedMsg: ChatMessage = {
        sender: msg.sender === 'client' ? 'user' : 'cyra',
        text: msg.text,
        timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, mappedMsg]);
    });

    return () => {
      socket.off('chat_history');
      socket.off('receive_message');
    };
  }, [socket, isLiveMode, user, targetSellerId]);

  const getTimestamp = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleConnectLive = async () => {
    if (!user) {
      setCurrentPage('portal');
      setChatOpen(false);
      return;
    }

    const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];
    const targetId = selectedProduct?.sellerId;
    
    if (!targetId) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'cyra',
          text: "ERROR: Failed to connect to a seller for live communication. Please ensure active products exist in the store.",
          timestamp: getTimestamp()
        }
      ]);
      return;
    }

    setTargetSellerId(targetId);
    setIsLiveMode(true);
    setSellerName("Hardware Vendor");
    setMessages([]); // Cleared, will be filled by socket history

    // Resolve seller actual name public profile
    try {
      const res = await fetch(`http://localhost:5000/api/auth/public-profile/${targetId}`);
      if (res.ok) {
        const profile = await res.json();
        setSellerName(profile.name || "Hardware Vendor");
      }
    } catch (err) {
      console.warn("Could not query vendor public name registry.");
    }
  };

  const handleDisconnectLive = () => {
    setIsLiveMode(false);
    setTargetSellerId("");
    setMessages([
      {
        sender: 'cyra',
        text: "Support session disconnected. System Online. Welcome! I am CYRA v4.9, your AI shopping assistant. Looking to get discount codes, track your orders, or buy products? Tell me how I can help.",
        timestamp: getTimestamp()
      }
    ]);
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    if (isLiveMode) {
      if (socket && user && targetSellerId) {
        socket.emit('send_message', {
          sender: 'client',
          text,
          clientId: user.id,
          sellerId: targetSellerId
        });
        setInputVal("");
      }
      return;
    }

    // Add user message in AI simulation mode
    const userMsg: ChatMessage = {
      sender: 'user',
      text,
      timestamp: getTimestamp()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    // Simulate Cyra's AI response
    setTimeout(() => {
      let cyraReply = "";
      const lower = text.toLowerCase();

      if (lower.includes("voucher") || lower.includes("coupon") || lower.includes("discount") || lower.includes("code")) {
        cyraReply = "Here is a discount code for you! Enter code 'NEON25' at checkout to get 25% off your total purchase.";
      } else if (lower.includes("track") || lower.includes("order") || lower.includes("delivery") || lower.includes("shipment")) {
        setTrackingCode("CYBER-7798-X");
        cyraReply = "Tracking order... Delivery drone CYBER-7798-X is on its way. Click 'Track Order' in the menu to view live tracking details.";
      } else if (lower.includes("recommend") || lower.includes("suggest") || lower.includes("best") || lower.includes("visor")) {
        const topProduct = products[0]; // Nova Visor
        if (topProduct) {
          setSelectedProductId(topProduct.id);
          cyraReply = `I recommend checking out '${topProduct.name}' (${topProduct.price} CR). It is one of our top-rated items. Click 'Store' to view and purchase.`;
        } else {
          cyraReply = "Unable to get recommendations. The store inventory is currently empty.";
        }
      } else if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
        cyraReply = "Hello! How can I help you with your shopping today? I can get discount codes, check product details, or track your delivery.";
      } else if (lower.includes("checkout") || lower.includes("buy")) {
        setCurrentPage('cart');
        cyraReply = "Redirecting to your Cart. You can complete your purchase inside the cart page.";
      } else if (lower.includes("human") || lower.includes("seller") || lower.includes("support") || lower.includes("live") || lower.includes("agent")) {
        cyraReply = "Connecting you to Live Support. Please hold...";
        handleConnectLive();
        setIsTyping(false);
        return;
      } else {
        cyraReply = "Sorry, I didn't quite catch that. Try asking about: 'discounts', 'track order', 'recommendations', 'live support', or 'checkout'.";
      }

      setMessages(prev => [...prev, {
        sender: 'cyra',
        text: cyraReply,
        timestamp: getTimestamp()
      }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* Pulse Orb Chat Icon when closed */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center border border-cyan-400/40 text-black neon-border-cyan hover:scale-110 hover:brightness-125 transition-all shadow-xl group cursor-pointer"
        >
          <Bot className="w-6 h-6 animate-float" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
          </span>
          {/* Holographic Tooltip */}
          <span className="absolute right-16 top-3 bg-[#050505]/90 border border-cyan-500/30 text-cyan-400 font-orbitron text-[10px] py-1 px-2.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity tracking-widest backdrop-blur-md">
            Chat with CYRA
          </span>
        </button>
      )}

      {/* Holographic Chat window when open */}
      {chatOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] glassmorphism-card rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-cyan-400/30 neon-border-cyan animate-holo-flicker">
          
          {/* Header */}
          {!isLiveMode ? (
            <div className="p-4 bg-gradient-to-r from-[#11111a]/80 to-[#181825]/80 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 animate-pulse-glow">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-orbitron font-bold text-xs text-white tracking-widest">CYRA AI</span>
                    <span className="text-[8px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-1 rounded uppercase tracking-wider font-extrabold font-orbitron animate-pulse">v4.9</span>
                  </div>
                  <span className="text-[10px] font-inter text-emerald-400 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-ping" />
                    AI Assistant Active
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-r from-[#1a111e]/80 to-[#25182a]/80 border-b border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-purple-400/10 border border-purple-400/30 flex items-center justify-center text-purple-400 animate-pulse-glow">
                  <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
                <div className="text-left">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-orbitron font-bold text-xs text-white tracking-widest">{sellerName.toUpperCase()}</span>
                    <span className="text-[8px] bg-purple-500/20 text-purple-300 border border-purple-400/30 px-1 rounded uppercase tracking-wider font-extrabold font-orbitron animate-pulse">LIVE</span>
                  </div>
                  <span className="text-[10px] font-inter text-purple-400 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5 animate-ping" />
                    Connected to Seller
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleDisconnectLive}
                  className="px-2 py-1 bg-zinc-950 border border-white/10 hover:border-purple-400/30 text-[9px] font-orbitron font-bold text-zinc-400 hover:text-purple-300 rounded uppercase tracking-wider transition-all"
                  title="Switch to AI Assistant"
                >
                  CYRA AI
                </button>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Messages Logger */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#050505]/40 cyber-dots" ref={scrollRef}>
            {messages.map((msg, index) => (
              <div 
                key={index}
                className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div className={`p-3 rounded-xl text-xs font-inter leading-relaxed text-left ${
                  msg.sender === 'user' 
                    ? 'bg-purple-600/20 border border-purple-500/40 text-purple-100 rounded-tr-none' 
                    : isLiveMode
                      ? 'bg-purple-950/20 border border-purple-500/35 text-zinc-200 rounded-tl-none'
                      : 'bg-zinc-900/80 border border-white/5 text-zinc-200 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[9px] font-orbitron text-zinc-500 mt-1">{msg.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex flex-col mr-auto items-start max-w-[80%] animate-pulse">
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/5 flex items-center space-x-1.5 rounded-tl-none">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Quick-Suggestion Chips */}
          <div className="px-4 py-2 border-t border-white/5 bg-[#0a0a0f]/90 flex items-center space-x-2 overflow-x-auto whitespace-nowrap scrollbar-none">
            {!isLiveMode ? (
              <>
                <button 
                  onClick={() => handleSend("Gimme voucher code")}
                  className="px-2.5 py-1 rounded bg-[#111] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400/40 text-[10px] font-orbitron text-zinc-400 hover:text-cyan-300 transition-all flex items-center space-x-1"
                >
                  <Zap className="w-2.5 h-2.5" />
                  <span>Get Discount</span>
                </button>
                <button 
                  onClick={() => handleSend("Track my drone order")}
                  className="px-2.5 py-1 rounded bg-[#111] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400/40 text-[10px] font-orbitron text-zinc-400 hover:text-cyan-300 transition-all flex items-center space-x-1"
                >
                  <Code className="w-2.5 h-2.5" />
                  <span>Track Order</span>
                </button>
                <button 
                  onClick={() => handleSend("What do you recommend?")}
                  className="px-2.5 py-1 rounded bg-[#111] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400/40 text-[10px] font-orbitron text-zinc-400 hover:text-cyan-300 transition-all flex items-center space-x-1"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>AI Suggest</span>
                </button>
                <button 
                  onClick={handleConnectLive}
                  className="px-2.5 py-1 rounded bg-[#181125] hover:bg-purple-500/15 border border-purple-500/20 hover:border-purple-400/40 text-[10px] font-orbitron text-purple-400 hover:text-purple-300 transition-all flex items-center space-x-1"
                >
                  <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                  <span>Connect to Live Support</span>
                </button>
              </>
            ) : (
              <button 
                onClick={handleDisconnectLive}
                className="px-2.5 py-1 rounded bg-[#181125] hover:bg-purple-500/15 border border-purple-500/20 hover:border-purple-400/40 text-[10px] font-orbitron text-purple-400 hover:text-purple-300 transition-all flex items-center space-x-1"
              >
                <span>Disconnect Support</span>
              </button>
            )}
          </div>

          {/* Input Panel */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputVal);
            }}
            className="p-3 bg-zinc-950/80 border-t border-white/10 flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder={isLiveMode ? "Type message to support..." : "Ask a question..."}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-xs text-white font-rajdhani placeholder-zinc-500"
            />
            <button 
              type="submit"
              className={`p-2 rounded-lg transition-all ${
                isLiveMode 
                  ? 'bg-gradient-to-tr from-purple-500 to-indigo-600 text-white' 
                  : 'bg-gradient-to-tr from-cyan-400 to-purple-600 text-[#050505]'
              } hover:brightness-125`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
