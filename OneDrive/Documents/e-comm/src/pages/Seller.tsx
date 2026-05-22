import React, { useState, useEffect, useRef } from 'react';
import { useApp, type Product } from '../context/AppContext';
import { 
  TrendingUp, DollarSign, ShoppingBag, Users, Upload, Plus, Trash2, CheckCircle, Truck, Check, MessageSquare, Send, Cpu, AlertTriangle, X
} from 'lucide-react';

interface SellerOrder {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'Pending' | 'Accepted' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
}

interface ChatConversation {
  clientId: string;
  clientName: string;
  lastMessage: {
    sender: 'client' | 'seller';
    text: string;
    timestamp: string;
  } | null;
  updatedAt: string;
}

interface ChatMsg {
  sender: 'client' | 'seller';
  text: string;
  timestamp: string;
}

export const Seller = () => {
  const { user, token, socket, products, refreshProducts } = useApp();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'chat'>('dashboard');
  
  // Dashboard Analytics States
  const [revenue, setRevenue] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [clientsCount, setClientsCount] = useState(0);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  
  // Product Creation States
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodCategory, setProdCategory] = useState("Augmentations");
  const [prodDesc, setProdDesc] = useState("");
  const [prodStock, setProdStock] = useState("");
  const [prodMaxStock, setProdMaxStock] = useState("");
  const [prodModel, setProdModel] = useState<'visor' | 'drone' | 'deck' | 'car' | 'patch' | 'watch'>('visor');
  const [prodImage, setProdImage] = useState("");
  
  const [specKey1, setSpecKey1] = useState("Performance");
  const [specVal1, setSpecVal1] = useState("Optimized");
  const [specKey2, setSpecKey2] = useState("Clearance");
  const [specVal2, setSpecVal2] = useState("Level 2");

  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");


  
  // Chat States
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeChatClient, setActiveChatClient] = useState<string | null>(null);
  const [activeChatClientName, setActiveChatClientName] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Fetch initial seller dashboard telemetry
  const fetchSellerDashboard = async () => {
    if (!token || !user) return;
    try {
      // 1. Fetch vendor's products
      const pRes = await fetch(`http://localhost:5000/api/products?sellerId=${user.id}`);
      if (pRes.ok) {
        const pData = await pRes.json();
        setSellerProducts(pData);
      }

      // 2. Fetch vendor's orders
      const oRes = await fetch("http://localhost:5000/api/orders/seller-orders", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (oRes.ok) {
        const oData = await oRes.json();
        setOrders(oData);
        
        // Calculate metrics
        let totalRev = 0;
        let count = 0;
        const clientsSet = new Set<string>();
        
        oData.forEach((order: SellerOrder) => {
          if (order.status !== 'Cancelled') {
            totalRev += order.totalAmount;
            count += order.items.reduce((sum, item) => sum + item.quantity, 0);
            clientsSet.add(order.clientId);
          }
        });
        
        setRevenue(totalRev);
        setSalesCount(count);
        setClientsCount(clientsSet.size);
      }
    } catch (err) {
      console.error("Failed to load seller dashboard details", err);
    }
  };

  useEffect(() => {
    fetchSellerDashboard();
  }, [user, token, products]);

  // Load chat conversations & Socket subscriptions
  useEffect(() => {
    if (!socket || !user || user.role !== 'seller') return;

    // Load active threads
    socket.emit('seller_load_chats', { sellerId: user.id });

    // Thread updates listener
    const chatListEvent = `seller_chats_list_${user.id}`;
    const alertEvent = `new_message_alert_${user.id}`;

    socket.on(chatListEvent, (list: ChatConversation[]) => {
      // Sort conversations by updated date descending
      const sorted = [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setConversations(sorted);
    });

    socket.on(alertEvent, () => {
      // Re-trigger load
      socket.emit('seller_load_chats', { sellerId: user.id });
    });

    socket.on('receive_message', (msg: ChatMsg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.off(chatListEvent);
      socket.off(alertEvent);
      socket.off('receive_message');
    };
  }, [socket, user]);

  // Sync scroll to chat bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Open a specific user chat
  const handleSelectChat = (clientId: string, clientName: string) => {
    if (!socket || !user) return;
    setActiveChatClient(clientId);
    setActiveChatClientName(clientName);
    setChatMessages([]);
    socket.emit('join_chat', { clientId, sellerId: user.id });
  };

  // Dispatch live response message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !user || !activeChatClient || !newMessageText.trim()) return;

    socket.emit('send_message', {
      sender: 'seller',
      text: newMessageText,
      clientId: activeChatClient,
      sellerId: user.id
    });
    setNewMessageText("");
  };

  // Image Upload Form Trigger
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    setFormError("");
    setFormSuccess("");

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setProdImage(data.url);
        setFormSuccess("Image uploaded successfully");
      } else {
        setFormError(data.error || "Image upload failed");
      }
    } catch (err) {
      setFormError("CDN Server unreachable");
    } finally {
      setUploading(false);
    }
  };

  // Create Product Submit Handler
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!prodName || !prodPrice || !prodDesc || !prodStock || !prodMaxStock || !prodImage) {
      setFormError("All form fields must be completed");
      return;
    }

    const priceVal = parseFloat(prodPrice);
    const stockVal = parseInt(prodStock);
    const maxStockVal = parseInt(prodMaxStock);

    if (isNaN(priceVal) || priceVal <= 0) {
      setFormError("Price must be a valid number of credits");
      return;
    }

    if (isNaN(stockVal) || isNaN(maxStockVal) || stockVal < 0 || maxStockVal < stockVal) {
      setFormError("Invalid inventory stock configuration");
      return;
    }

    const payload = {
      name: prodName,
      price: priceVal,
      category: prodCategory,
      description: prodDesc,
      stock: stockVal,
      maxStock: maxStockVal,
      image: prodImage,
      modelType: prodModel,
      specs: {
        [specKey1 || "Performance"]: specVal1 || "Optimized",
        [specKey2 || "Clearance"]: specVal2 || "Level 2"
      }
    };

    try {
      const res = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setFormSuccess("New product added to inventory");
        
        // Reset form
        setProdName("");
        setProdPrice("");
        setProdDesc("");
        setProdStock("");
        setProdMaxStock("");
        setProdImage("");
        
        // Refresh items
        fetchSellerDashboard();
        refreshProducts();
      } else {
        setFormError(data.error || "Failed to add product to database");
      }
    } catch (err) {
      setFormError("Failed to save product due to connection issue");
    }
  };

  // Edit stock update helper
  const handleAdjustStock = async (product: Product, delta: number) => {
    if (!token) return;
    const newStock = Math.max(0, Math.min(product.maxStock, product.stock + delta));
    try {
      const res = await fetch(`http://localhost:5000/api/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ stock: newStock })
      });
      if (res.ok) {
        fetchSellerDashboard();
        refreshProducts();
      }
    } catch (err) {
      console.error("Failed to update stock", err);
    }
  };

  // Delete product register
  const handleDeleteProduct = async (productId: string | number) => {
    if (!token || !window.confirm("Are you sure you want to permanently delete this product?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSellerDashboard();
        refreshProducts();
      }
    } catch (err) {
      console.error("Failed to delete product", err);
    }
  };

  // Update order status trigger
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchSellerDashboard();
      }
    } catch (err) {
      console.error("Failed to update order status", err);
    }
  };

  if (!user || user.role !== 'seller') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-purple-400">
        <AlertTriangle className="w-12 h-12 animate-bounce" />
        <span className="font-orbitron text-[10px] tracking-[0.2em] uppercase">Access Denied. You must log in as a Seller to access this panel.</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white pb-20 pt-10">
      
      {/* Background glow highlights */}
      <div className="absolute top-[20%] right-[10%] w-[450px] h-[450px] pointer-events-none z-0">
        <div className="w-full h-full rounded-full glow-radial-purple opacity-10 animate-pulse" />
      </div>
      <div className="absolute bottom-[20%] left-[10%] w-[450px] h-[450px] pointer-events-none z-0">
        <div className="w-full h-full rounded-full glow-radial-blue opacity-10 animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-6 mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-purple-400 mb-1">
              <Cpu className="w-4 h-4 animate-pulse" />
              <span className="font-orbitron font-extrabold text-[9px] tracking-[0.3em] uppercase">SELLER PORTAL DASHBOARD</span>
            </div>
            <h1 className="font-orbitron font-black text-3xl sm:text-5xl uppercase tracking-tight">
              Seller <span className="text-purple-400 font-normal">Dashboard</span>
            </h1>
          </div>

          {/* Sub menu tabs */}
          <div className="flex bg-zinc-950/80 border border-white/10 p-1 rounded-xl backdrop-blur-md">
            {[
              { id: 'dashboard', name: 'Overview' },
              { id: 'products', name: 'Inventory' },
              { id: 'orders', name: 'Orders' },
              { id: 'chat', name: 'Support' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-orbitron font-bold uppercase rounded-lg transition-all ${activeTab === tab.id ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content renderer */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-holo-flicker">
            
            {/* Telemetry Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Earned Credits', val: `${revenue.toLocaleString()} CR`, icon: DollarSign, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' },
                { label: 'Total Sales', val: `${salesCount} Units`, icon: ShoppingBag, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5' },
                { label: 'Unique Customers', val: clientsCount, icon: Users, color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-500/5' },
                { label: 'Seller Authorization', val: user.approved ? 'AUTHORIZED' : 'PENDING', icon: CheckCircle, color: user.approved ? 'text-emerald-400' : 'text-amber-400', border: user.approved ? 'border-emerald-500/20' : 'border-amber-500/20', bg: user.approved ? 'bg-emerald-500/5' : 'bg-amber-500/5' }
              ].map((stat, idx) => (
                <div key={idx} className={`glassmorphism p-5 rounded-xl border ${stat.border} ${stat.bg} text-left flex items-center justify-between`}>
                  <div>
                    <span className="font-orbitron text-[9px] text-zinc-500 tracking-wider block uppercase">{stat.label}</span>
                    <span className={`font-orbitron font-black text-lg sm:text-2xl mt-1 block ${stat.color}`}>{stat.val}</span>
                  </div>
                  <stat.icon className={`w-8 h-8 opacity-20 ${stat.color}`} />
                </div>
              ))}
            </div>

            {/* Custom SVG line chart representing credit growth */}
            <div className="glassmorphism p-6 rounded-xl border-white/5 space-y-6">
              <h3 className="font-orbitron font-bold text-sm tracking-wider text-zinc-300 uppercase flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>Sales Growth Over Time</span>
              </h3>
              
              <div className="h-64 w-full relative">
                {/* SVG Chart */}
                <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  {[50, 125, 200, 275].map((y, i) => (
                    <line key={i} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" strokeDasharray="5,5" />
                  ))}

                  {/* Area path */}
                  <path 
                    d="M 0 300 L 100 250 L 250 260 L 400 180 L 600 120 L 750 160 L 900 60 L 1000 30 L 1000 300 Z" 
                    fill="url(#chart-glow)" 
                  />

                  {/* Line path */}
                  <path 
                    d="M 0 300 L 100 250 L 250 260 L 400 180 L 600 120 L 750 160 L 900 60 L 1000 30" 
                    fill="none" 
                    stroke="#8B5CF6" 
                    strokeWidth="3"
                    className="animate-dash"
                  />

                  {/* Dots */}
                  {[
                    {x: 100, y: 250}, {x: 250, y: 260}, {x: 400, y: 180},
                    {x: 600, y: 120}, {x: 750, y: 160}, {x: 900, y: 60}, {x: 1000, y: 30}
                  ].map((dot, i) => (
                    <g key={i}>
                      <circle cx={dot.x} cy={dot.y} r="6" fill="#8B5CF6" />
                      <circle cx={dot.x} cy={dot.y} r="10" fill="transparent" stroke="#00F5FF" strokeWidth="1.5" className="animate-ping" style={{ transformOrigin: `${dot.x}px ${dot.y}px` }} />
                    </g>
                  ))}
                </svg>

                <div className="absolute bottom-2 left-0 right-0 flex justify-between font-orbitron text-[8px] text-zinc-500 px-2 uppercase">
                  <span>Month 1</span>
                  <span>Month 2</span>
                  <span>Month 3</span>
                  <span>Month 4</span>
                  <span>Month 5</span>
                  <span>Current Month</span>
                </div>
              </div>
            </div>

            {/* Inventory stock alarm notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glassmorphism p-5 rounded-xl border-white/5 space-y-4">
                <span className="font-orbitron font-bold text-[9px] text-zinc-500 tracking-widest uppercase">Low Stock Alerts</span>
                <div className="space-y-3">
                  {sellerProducts.filter(p => p.stock <= 5).map(p => (
                    <div key={p.id} className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg flex items-center justify-between text-left">
                      <div>
                        <h4 className="font-orbitron font-bold text-xs text-rose-400">{p.name}</h4>
                        <span className="text-[10px] text-zinc-500 font-inter">Low stock warning: {p.stock} units left.</span>
                      </div>
                      <button 
                        onClick={() => handleAdjustStock(p, 10)}
                        className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded text-[9px] font-orbitron font-bold hover:bg-rose-500/20 uppercase"
                      >
                        Replenish
                      </button>
                    </div>
                  ))}
                  {sellerProducts.filter(p => p.stock <= 5).length === 0 && (
                    <div className="p-4 text-center text-xs text-zinc-500 font-orbitron">
                      All products have sufficient stock levels.
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div className="glassmorphism p-5 rounded-xl border-white/5 space-y-4">
                <span className="font-orbitron font-bold text-[9px] text-zinc-500 tracking-widest uppercase">Recent Customer Orders</span>
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {orders.slice(0, 4).map(o => (
                    <div key={o.id} className="p-3 bg-zinc-950/40 border border-white/5 rounded-lg flex items-center justify-between text-left">
                      <div>
                        <h4 className="font-orbitron font-bold text-xs text-white">{o.id}</h4>
                        <span className="text-[10px] text-zinc-500 font-inter">Customer: {o.clientName} | Total: {o.totalAmount} CR</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-orbitron font-extrabold uppercase ${o.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                        {o.status}
                      </span>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="p-4 text-center text-xs text-zinc-500 font-orbitron">
                      No orders found in recent transaction history.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-holo-flicker">
            
            {/* Left: Product List (8 cols) */}
            <div className="lg:col-span-8 glassmorphism p-6 rounded-xl border-white/5 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="font-orbitron font-bold text-sm tracking-wider text-zinc-300 uppercase">
                  Manage Products
                </h3>
                <span className="font-orbitron text-[10px] text-zinc-500">{sellerProducts.length} products found</span>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {sellerProducts.map(p => (
                  <div key={p.id} className="p-4 bg-zinc-950/40 border border-white/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between text-left gap-4">
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <img 
                        src={p.image.startsWith('http') || p.image.startsWith('data:') ? p.image : `/${p.image}.png`} 
                        alt={p.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200';
                        }}
                        className="w-14 h-14 rounded-lg object-cover border border-white/10 bg-zinc-950 flex-shrink-0"
                      />
                      <div className="min-w-0 text-left flex-1">
                        <span className="text-[8px] font-orbitron text-zinc-500 tracking-wider block uppercase">{p.category}</span>
                        <h4 className="font-orbitron font-bold text-sm text-white truncate">{p.name}</h4>
                        <span className="font-orbitron text-xs text-purple-400/80 font-bold block mt-0.5">{p.price.toLocaleString()} CR</span>
                      </div>
                    </div>

                    {/* Stock Controller */}
                    <div className="flex items-center space-x-4 justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-[9px] font-orbitron text-zinc-500 block uppercase">Stock Level</span>
                        <div className="flex items-center bg-zinc-950 border border-white/10 rounded-lg p-0.5 mt-1">
                          <button 
                            onClick={() => handleAdjustStock(p, -1)}
                            className="w-6 h-6 flex items-center justify-center font-orbitron text-[10px] text-zinc-400 hover:text-white"
                          >
                            -
                          </button>
                          <span className="font-orbitron text-[10px] font-bold text-white px-2">{p.stock}</span>
                          <button 
                            onClick={() => handleAdjustStock(p, 1)}
                            className="w-6 h-6 flex items-center justify-center font-orbitron text-[10px] text-zinc-400 hover:text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Delete */}
                      <button 
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-2 text-zinc-500 hover:text-rose-400 transition-colors border border-white/5 rounded-lg bg-zinc-950/20 mt-3 sm:mt-0"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {sellerProducts.length === 0 && (
                  <div className="text-center py-10 font-orbitron text-zinc-500 text-xs">
                    No products found. Add a product to get started.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Inject Node Form (4 cols) */}
            <div className="lg:col-span-4 text-left">
              <div className="glassmorphism p-6 rounded-xl border-white/5 space-y-6">
                <h3 className="font-orbitron font-bold text-sm tracking-wider text-zinc-300 border-b border-white/5 pb-3 uppercase flex items-center space-x-1.5">
                  <Plus className="w-4 h-4 text-purple-400" />
                  <span>Add New Product</span>
                </h3>

                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="space-y-1">
                    <label className="font-orbitron text-[8px] text-zinc-500 tracking-widest uppercase">Product Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Bio-Interface Module" 
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-xs font-rajdhani font-bold text-white focus:border-purple-400 focus:outline-none placeholder-zinc-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-orbitron text-[8px] text-zinc-500 tracking-widest uppercase">Price (CR)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. 1500" 
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-xs font-rajdhani font-bold text-white focus:border-purple-400 focus:outline-none placeholder-zinc-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-orbitron text-[8px] text-zinc-500 tracking-widest uppercase">Category</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-xs font-rajdhani font-bold text-zinc-300 focus:border-purple-400 focus:outline-none"
                      >
                        <option>Augmentations</option>
                        <option>Robotics</option>
                        <option>Hacking</option>
                        <option>Vehicles</option>
                        <option>Bio-Tech</option>
                        <option>Wearables</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-orbitron text-[8px] text-zinc-500 tracking-widest uppercase">Description</label>
                    <textarea 
                      required
                      placeholder="Provide details about the augmentation node..." 
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      rows={2}
                      className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-xs font-rajdhani font-bold text-white focus:border-purple-400 focus:outline-none placeholder-zinc-700 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-orbitron text-[8px] text-zinc-500 tracking-widest uppercase">Stock</label>
                      <input 
                        type="text" 
                        required
                        placeholder="10" 
                        value={prodStock}
                        onChange={(e) => setProdStock(e.target.value)}
                        className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-xs font-rajdhani font-bold text-white focus:border-purple-400 focus:outline-none placeholder-zinc-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-orbitron text-[8px] text-zinc-500 tracking-widest uppercase">Max Stock</label>
                      <input 
                        type="text" 
                        required
                        placeholder="20" 
                        value={prodMaxStock}
                        onChange={(e) => setProdMaxStock(e.target.value)}
                        className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-xs font-rajdhani font-bold text-white focus:border-purple-400 focus:outline-none placeholder-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-orbitron text-[8px] text-zinc-500 tracking-widest uppercase">Select 3D Model Shape</label>
                    <select
                      value={prodModel}
                      onChange={(e) => setProdModel(e.target.value as any)}
                      className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-xs font-rajdhani font-bold text-zinc-300 focus:border-purple-400 focus:outline-none"
                    >
                      <option value="visor">Neural Visor (3D Visor)</option>
                      <option value="drone">Hypersonic Drone (3D Drone)</option>
                      <option value="deck">Cyber Deck (3D Deck)</option>
                      <option value="car">Hyper Car Token (3D Car)</option>
                      <option value="patch">Sentinel Patch (3D Patch)</option>
                      <option value="watch">Wrist-Comm Watch (3D Watch)</option>
                    </select>
                  </div>

                  {/* Specifications */}
                  <div className="p-3 bg-zinc-950/60 border border-white/5 rounded-lg space-y-2">
                    <span className="font-orbitron text-[8px] text-zinc-500 tracking-widest block uppercase">Product Specifications</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        placeholder="Key (e.g. Range)" 
                        value={specKey1}
                        onChange={(e) => setSpecKey1(e.target.value)}
                        className="p-2 bg-zinc-900 border border-white/10 rounded text-[10px] font-rajdhani text-white focus:border-purple-400 focus:outline-none"
                      />
                      <input 
                        type="text" 
                        placeholder="Value (e.g. 50km)" 
                        value={specVal1}
                        onChange={(e) => setSpecVal1(e.target.value)}
                        className="p-2 bg-zinc-900 border border-white/10 rounded text-[10px] font-rajdhani text-white focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        placeholder="Key (e.g. Core)" 
                        value={specKey2}
                        onChange={(e) => setSpecKey2(e.target.value)}
                        className="p-2 bg-zinc-900 border border-white/10 rounded text-[10px] font-rajdhani text-white focus:border-purple-400 focus:outline-none"
                      />
                      <input 
                        type="text" 
                        placeholder="Value (e.g. V3)" 
                        value={specVal2}
                        onChange={(e) => setSpecVal2(e.target.value)}
                        className="p-2 bg-zinc-900 border border-white/10 rounded text-[10px] font-rajdhani text-white focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Image Selector & Preview */}
                  <div className="space-y-2">
                    <label className="font-orbitron text-[8px] text-zinc-500 tracking-widest block uppercase">Upload Product Image</label>
                    <div className="flex items-center space-x-3">
                      <label className="flex-1 flex flex-col items-center justify-center p-3 border border-white/10 border-dashed rounded-lg cursor-pointer bg-zinc-950/40 hover:bg-zinc-950/80 transition-colors">
                        <Upload className="w-4 h-4 text-purple-400 mb-1" />
                        <span className="font-rajdhani text-[11px] text-zinc-400 font-bold">
                          {uploading ? 'Uploading...' : 'Choose File'}
                        </span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                          className="hidden" 
                        />
                      </label>
                      {prodImage && (
                        <img 
                          src={prodImage} 
                          alt="Preview" 
                          className="w-14 h-14 rounded-lg object-cover border border-white/10 bg-zinc-950" 
                        />
                      )}
                    </div>
                  </div>

                  {formError && (
                    <div className="p-2.5 border border-rose-500/30 bg-rose-500/10 text-rose-400 rounded-lg text-[9px] font-orbitron tracking-wide text-center uppercase animate-pulse">
                      {formError}
                    </div>
                  )}
                  {formSuccess && (
                    <div className="p-2.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-orbitron tracking-wide text-center uppercase animate-pulse flex items-center justify-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={uploading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:brightness-125 text-white font-orbitron font-black text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product to Inventory</span>
                  </button>
                </form>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'orders' && (
          <div className="glassmorphism p-6 rounded-xl border-white/5 space-y-6 text-left animate-holo-flicker">
            
            <div className="border-b border-white/5 pb-3">
              <h3 className="font-orbitron font-bold text-sm tracking-wider text-zinc-300 uppercase">
                Order Management
              </h3>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {orders.map(order => (
                <div key={order.id} className="p-5 bg-zinc-950/40 border border-white/5 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-3 gap-2">
                    <div>
                      <h4 className="font-orbitron font-bold text-xs text-white">ORDER ID: {order.id}</h4>
                      <span className="text-[10px] text-zinc-500 font-inter">Customer: {order.clientName} ({order.clientEmail}) | Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="font-orbitron text-[9px] text-zinc-500 uppercase">Status:</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-orbitron font-extrabold uppercase border ${
                        order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        order.status === 'Shipped' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                        order.status === 'Accepted' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        order.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <span className="font-rajdhani font-bold text-zinc-300">{item.name} <span className="text-zinc-500 font-normal">x {item.quantity}</span></span>
                        <span className="font-orbitron text-purple-400/80">{item.price.toLocaleString()} CR</span>
                      </div>
                    ))}
                    <div className="border-t border-white/5 pt-2 flex justify-between items-center">
                      <span className="font-orbitron text-[9px] text-zinc-500 uppercase">Subtotal Amount</span>
                      <span className="font-orbitron font-black text-sm text-cyan-400">{order.totalAmount.toLocaleString()} CR</span>
                    </div>
                  </div>

                  {/* Flow controls */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {order.status === 'Pending' && (
                      <button 
                        onClick={() => handleUpdateOrderStatus(order.id, 'Accepted')}
                        className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-[10px] font-orbitron font-bold hover:bg-purple-500/40 uppercase flex items-center space-x-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Accept Order</span>
                      </button>
                    )}
                    {order.status === 'Accepted' && (
                      <button 
                        onClick={() => handleUpdateOrderStatus(order.id, 'Shipped')}
                        className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-[10px] font-orbitron font-bold hover:bg-cyan-500/40 uppercase flex items-center space-x-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Ship Order (Drone)</span>
                      </button>
                    )}
                    {order.status === 'Shipped' && (
                      <button 
                        onClick={() => handleUpdateOrderStatus(order.id, 'Delivered')}
                        className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-orbitron font-bold hover:bg-emerald-500/40 uppercase flex items-center space-x-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Confirm Delivery</span>
                      </button>
                    )}
                    
                    {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                      <button 
                        onClick={() => handleUpdateOrderStatus(order.id, 'Cancelled')}
                        className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-[10px] font-orbitron font-bold hover:bg-rose-500/20 uppercase ml-auto"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              ))}

                  {orders.length === 0 && (
                    <div className="text-center py-10 font-orbitron text-zinc-500 text-xs">
                      No orders found in database.
                    </div>
                  )}
            </div>

          </div>
        )}

        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-holo-flicker h-[600px]">
            
            {/* Conversations list sidebar (4 cols) */}
            <div className="lg:col-span-4 glassmorphism p-4 rounded-xl border-white/5 flex flex-col h-full text-left">
              <h3 className="font-orbitron font-bold text-xs tracking-wider text-zinc-400 border-b border-white/5 pb-3 uppercase mb-4">
                Active Customer Chats
              </h3>
              
              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {conversations.map(conv => {
                  const isActive = activeChatClient === conv.clientId;
                  return (
                    <div
                      key={conv.clientId}
                      onClick={() => handleSelectChat(conv.clientId, conv.clientName)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col text-left ${isActive ? 'bg-purple-500/15 border-purple-500/30' : 'bg-zinc-950/40 border-white/5 hover:border-white/10'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-rajdhani font-black text-sm text-white">{conv.clientName}</span>
                        <span className="text-[8px] font-orbitron text-zinc-500">{new Date(conv.updatedAt).toLocaleTimeString()}</span>
                      </div>
                      {conv.lastMessage && (
                        <p className="text-[11px] text-zinc-400 truncate mt-1">
                          <span className="text-zinc-600 font-bold uppercase mr-1">{conv.lastMessage.sender === 'seller' ? 'YOU' : 'CUSTOMER'}:</span>
                          {conv.lastMessage.text}
                        </p>
                      )}
                    </div>
                  );
                })}

                  {conversations.length === 0 && (
                  <div className="text-center py-10 font-orbitron text-zinc-500 text-[10px]">
                    No active support chats found.
                  </div>
                )}
              </div>
            </div>

            {/* Chat Box (8 cols) */}
            <div className="lg:col-span-8 glassmorphism rounded-xl border-white/5 flex flex-col h-full relative">
              {activeChatClient ? (
                <>
                  {/* Chat header */}
                  <div className="p-4 border-b border-white/5 flex justify-between items-center text-left">
                    <div>
                      <h4 className="font-orbitron font-bold text-xs text-purple-400 uppercase">Active Support Chat</h4>
                      <span className="font-rajdhani font-black text-sm text-white">Customer: {activeChatClientName}</span>
                    </div>
                    <button 
                      onClick={() => setActiveChatClient(null)} 
                      className="p-1 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((msg, i) => {
                      const isSeller = msg.sender === 'seller';
                      return (
                        <div key={i} className={`flex ${isSeller ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-3 rounded-xl border ${
                            isSeller 
                              ? 'bg-purple-500/10 border-purple-500/20 text-right text-purple-200' 
                              : 'bg-zinc-950/80 border-white/10 text-left text-cyan-200'
                          }`}>
                            <p className="text-xs leading-relaxed font-rajdhani font-semibold">{msg.text}</p>
                            <span className="text-[8px] font-orbitron text-zinc-500 block mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-zinc-950/40 rounded-b-xl flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Type your message..." 
                      value={newMessageText}
                      onChange={e => setNewMessageText(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 text-xs font-rajdhani focus:border-purple-400 focus:outline-none placeholder-zinc-700"
                    />
                    <button 
                      type="submit"
                      className="p-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:brightness-125 text-white rounded-lg transition-all flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-3 text-zinc-500 font-orbitron text-center">
                  <MessageSquare className="w-10 h-10 opacity-30 text-purple-400 animate-pulse" />
                  <p className="text-xs uppercase">Select a customer from the sidebar list to start chatting</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
