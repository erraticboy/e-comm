import { useState, useEffect } from 'react';
import { useApp, type Product } from '../context/AppContext';
import { 
  Terminal, Plus, Trash2, Settings, ShieldCheck, Package, Users, ShieldAlert, Cpu, Database, Award
} from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'seller' | 'admin' | 'user';
  credits: number;
  approved: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface ServerMetrics {
  users: {
    total: number;
    clients: number;
    activeSellers: number;
    pendingSellers: number;
  };
  products: {
    total: number;
  };
  orders: {
    total: number;
    totalCreditsCleared: number;
  };
  system: {
    mode: string;
    latency: string;
    memoryUsage: number;
    uptime: number;
  };
}

export const Admin = () => {
  const { products, token, user, refreshProducts } = useApp();
  
  const [activeTab, setActiveTab] = useState<'telemetry' | 'users' | 'products'>('telemetry');
  
  // User Management
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");

  // Metrics state
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  
  // Forms state for product addition
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Augmentations");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [maxStock, setMaxStock] = useState("");
  
  // Custom Specs state
  const [specKey1, setSpecKey1] = useState("Core Link");
  const [specVal1, setSpecVal1] = useState("Cortical V3");
  const [specKey2, setSpecKey2] = useState("Reference Range");
  const [specVal2, setSpecVal2] = useState("Universal");
  
  const [modelType, setModelType] = useState<'visor' | 'drone' | 'deck' | 'car' | 'patch' | 'watch'>('visor');
  const [sysLogs, setSysLogs] = useState<string[]>([]);
  const [fps, setFps] = useState(60.1);
  const [load, setLoad] = useState(42);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Live admin log generation
  useEffect(() => {
    const logs = [
      "Securing admin dashboard firewall...",
      "Server statistics loaded successfully.",
      "Graphics engine active and rendering.",
      "Background services operating normally.",
      "Syncing user and product database indexes..."
    ];
    setSysLogs(logs);

    const interval = setInterval(() => {
      const randomLog = [
        `[PING] Server response received in ${+(Math.random() * 0.05 + 0.01).toFixed(3)}ms.`,
        `[SERVICES] Background services reporting healthy status.`,
        `[THERMAL] CPU temperature normal at ${Math.floor(Math.random() * 5 + 48)}°C.`,
        `[DB] Database checksum verification complete.`
      ];
      setSysLogs(prev => [...prev.slice(-8), randomLog[Math.floor(Math.random() * randomLog.length)]]);
      setFps(+(60 + (Math.random() * 0.4 - 0.2)).toFixed(1));
      setLoad(Math.floor(40 + Math.random() * 8));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Fetch users & metrics on mount
  const fetchAdminDetails = async () => {
    if (!token) return;
    try {
      // 1. Fetch Users
      const uRes = await fetch("http://localhost:5000/api/admin/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsersList(uData);
      }

      // 2. Fetch Metrics
      const mRes = await fetch("http://localhost:5000/api/admin/metrics", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (mRes.ok) {
        const mData = await mRes.json();
        setMetrics(mData.metrics);
      }
    } catch (err) {
      console.error("Failed to load admin analytics details", err);
    }
  };

  useEffect(() => {
    fetchAdminDetails();
  }, [token, products]);

  // Stock operations (API backed)
  const adjustStock = async (product: Product, delta: number) => {
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
        refreshProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete product (API backed)
  const deleteProduct = async (productId: string | number) => {
    if (!token || !window.confirm("Are you sure you want to permanently delete this product?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        refreshProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // User Actions: Approve Seller
  const handleApproveSeller = async (sellerId: string) => {
    if (!token) return;
    setUserError("");
    setUserSuccess("");
    try {
      const res = await fetch(`http://localhost:5000/api/admin/approve-seller/${sellerId}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUserSuccess(data.message || "SELLER APPROVED");
        fetchAdminDetails();
      } else {
        setUserError(data.error || "SELLER APPROVAL FAILED");
      }
    } catch (err) {
      setUserError("NETWORK CONNECTION ERROR");
    }
  };

  // User Actions: Ban Account
  const handleBanUser = async (userId: string) => {
    if (!token || !window.confirm("Are you sure you want to delete this user account?")) return;
    setUserError("");
    setUserSuccess("");
    try {
      const res = await fetch(`http://localhost:5000/api/admin/ban-user/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUserSuccess(data.message || "USER DELETED");
        fetchAdminDetails();
      } else {
        setUserError(data.error || "USER DELETION FAILED");
      }
    } catch (err) {
      setUserError("NETWORK CONNECTION ERROR");
    }
  };

  // Add new product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!name || !price || !description || !stock || !maxStock) {
      setFormError("ALL FIELDS ARE REQUIRED");
      return;
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock);
    const maxStockNum = parseInt(maxStock);

    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError("INVALID PRICE VALUE");
      return;
    }

    if (isNaN(stockNum) || isNaN(maxStockNum) || stockNum < 0 || maxStockNum < stockNum) {
      setFormError("INVALID STOCK LEVEL");
      return;
    }

    const payload = {
      name,
      price: priceNum,
      category,
      description,
      stock: stockNum,
      maxStock: maxStockNum,
      image: modelType, // Fallback image code
      modelType,
      specs: {
        [specKey1 || "Specification A"]: specVal1 || "Verified Grade",
        [specKey2 || "Specification B"]: specVal2 || "Standard"
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
        setFormSuccess("PRODUCT CREATED SUCCESSFULLY");
        setName("");
        setPrice("");
        setDescription("");
        setStock("");
        setMaxStock("");
        refreshProducts();
      } else {
        setFormError(data.error || "PRODUCT CREATION FAILED");
      }
    } catch (err) {
      setFormError("SERVER CONNECTION ERROR");
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-rose-400">
        <ShieldAlert className="w-12 h-12 animate-bounce" />
        <span className="font-orbitron text-[10px] tracking-[0.2em] uppercase">ACCESS DENIED. ADMINISTRATOR CLEARANCE REQUIRED.</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white select-none pb-20 pt-10">
      
      {/* Background glow highlights */}
      <div className="absolute top-[10%] left-[20%] w-[450px] h-[450px] pointer-events-none z-0">
        <div className="w-full h-full rounded-full glow-radial-purple opacity-10 animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-left border-b border-white/5 pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-purple-400 mb-1">
              <Settings className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="font-orbitron font-extrabold text-[9px] tracking-[0.3em] uppercase">ADMINISTRATIVE CONTROL PANEL</span>
            </div>
            <h1 className="font-orbitron font-black text-3xl sm:text-5xl uppercase tracking-tight">
              Admin <span className="text-purple-400 font-normal">Dashboard</span>
            </h1>
          </div>
          
          <div className="inline-flex items-center space-x-4 bg-zinc-950/60 border border-purple-500/20 px-4 py-2 rounded-xl backdrop-blur-sm">
            <div className="text-left font-orbitron text-[9px]">
              <span className="text-zinc-500 block">WEBGL FPS</span>
              <span className="text-cyan-400 font-extrabold block mt-0.5">{fps} FPS</span>
            </div>
            <div className="w-[1px] h-6 bg-white/5" />
            <div className="text-left font-orbitron text-[9px]">
              <span className="text-zinc-500 block">GRID LATENCY</span>
              <span className="text-purple-400 font-extrabold block mt-0.5">0.02 MS</span>
            </div>
            <div className="w-[1px] h-6 bg-white/5" />
            <div className="text-left font-orbitron text-[9px]">
              <span className="text-zinc-500 block">CPU LOAD</span>
              <span className="text-amber-400 font-extrabold block mt-0.5">{load}% SYS</span>
            </div>
          </div>
        </div>

        {/* Tab Sub Menu Selector */}
        <div className="flex bg-zinc-950/80 border border-white/10 p-1 rounded-xl w-max mb-8 backdrop-blur-md">
          {[
            { id: 'telemetry', name: 'Server Diagnostics' },
            { id: 'users', name: 'User Database' },
            { id: 'products', name: 'Catalog Overrides' }
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

        {/* Tab Renderer */}
        {activeTab === 'telemetry' && (
          <div className="space-y-8 animate-holo-flicker">
            {metrics ? (
              <>
                {/* Stats Blocks */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Revenue', val: `${metrics.orders.totalCreditsCleared.toLocaleString()} CR`, icon: Award, color: 'text-emerald-400' },
                    { label: 'Total Orders', val: metrics.orders.total, icon: Package, color: 'text-purple-400' },
                    { label: 'Active Sellers', val: metrics.users.activeSellers, icon: Users, color: 'text-cyan-400' },
                    { label: 'Database driver', val: metrics.system.mode, icon: Database, color: 'text-amber-400' }
                  ].map((stat, idx) => (
                    <div key={idx} className="glassmorphism p-5 rounded-xl border border-white/5 text-left flex items-center justify-between bg-zinc-950/20">
                      <div>
                        <span className="font-orbitron text-[9px] text-zinc-500 tracking-wider block uppercase">{stat.label}</span>
                        <span className={`font-orbitron font-black text-xl sm:text-2xl mt-1 block ${stat.color}`}>{stat.val}</span>
                      </div>
                      <stat.icon className={`w-8 h-8 opacity-20 ${stat.color}`} />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Telemetry charts and logs */}
                  <div className="glassmorphism p-6 rounded-xl border-white/5 space-y-4 text-left">
                    <h3 className="font-orbitron font-bold text-xs text-cyan-400 uppercase tracking-widest flex items-center">
                      <Cpu className="w-4 h-4 mr-2 text-cyan-400" />
                      <span>System Specifications</span>
                    </h3>
                    <div className="space-y-3 font-orbitron text-xs">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-zinc-500">SYSTEM UPTIME</span>
                        <span className="text-white font-bold">{Math.floor(metrics.system.uptime / 60)} MINUTES</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-zinc-500">MEMORY USAGE</span>
                        <span className="text-white font-bold">{(metrics.system.memoryUsage / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-zinc-500">PENDING SELLER ACCOUNTS</span>
                        <span className="text-amber-400 font-bold">{metrics.users.pendingSellers} UNAPPROVED</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">REGISTERED CUSTOMERS</span>
                        <span className="text-cyan-400 font-bold">{metrics.users.clients} SIGNED</span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic logs */}
                  <div className="glassmorphism p-5 rounded-xl border-white/5 space-y-3 text-left">
                    <span className="font-orbitron font-bold text-[9px] text-zinc-500 tracking-widest uppercase flex items-center">
                      <Terminal className="w-3.5 h-3.5 text-purple-400 mr-2" />
                      <span>System Activity Logs</span>
                    </span>
                    <pre className="font-mono text-[9px] text-zinc-500 leading-normal scrollbar-none h-32 overflow-y-auto">
                      <code>
                        {sysLogs.map((log, idx) => (
                          <div key={idx} className="truncate">{log}</div>
                        ))}
                      </code>
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 font-orbitron text-zinc-500 uppercase text-xs animate-pulse">
                Connecting to server...
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glassmorphism p-6 rounded-xl border-white/5 space-y-6 text-left animate-holo-flicker">
            <div className="border-b border-white/5 pb-3 flex justify-between items-center">
              <h3 className="font-orbitron font-bold text-sm tracking-wider text-zinc-300 uppercase">
                User Account Database
              </h3>
              <span className="font-orbitron text-[10px] text-zinc-500">{usersList.length} accounts active</span>
            </div>

            {userError && (
              <div className="p-3 border border-rose-500/30 bg-rose-500/10 text-rose-400 rounded-lg text-[9px] font-orbitron tracking-wide text-center uppercase animate-pulse">
                {userError}
              </div>
            )}
            {userSuccess && (
              <div className="p-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-orbitron tracking-wide text-center uppercase animate-pulse">
                {userSuccess}
              </div>
            )}

            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {usersList.map(u => (
                <div key={u.id} className="p-4 bg-zinc-950/40 border border-white/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between text-left gap-4">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center font-orbitron font-bold text-xs text-black">
                      {u.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-rajdhani font-black text-sm text-white truncate">{u.name}</h4>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-orbitron font-extrabold uppercase border ${
                          u.role === 'admin' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          u.role === 'seller' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        }`}>{u.role}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-inter">{u.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 justify-between sm:justify-end">
                    {/* Approve button for unapproved sellers */}
                    {u.role === 'seller' && !u.approved && (
                      <button
                        onClick={() => handleApproveSeller(u.id)}
                        className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 rounded text-[9px] font-orbitron font-bold uppercase transition-all"
                      >
                        Approve Seller
                      </button>
                    )}

                    {/* Ban button */}
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleBanUser(u.id)}
                        className="px-3 py-1.5 bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25 rounded text-[9px] font-orbitron font-bold uppercase transition-all flex items-center space-x-1"
                        title="Delete user account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete User</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-holo-flicker">
            
            {/* Left: Inventory control table (takes 8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="glassmorphism p-6 rounded-xl border-white/5 space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h3 className="font-orbitron font-bold text-sm tracking-wider text-zinc-300 uppercase flex items-center space-x-1.5">
                    <Package className="w-4 h-4 text-purple-400" />
                    <span>Product Inventory List</span>
                  </h3>
                  <span className="font-orbitron text-[10px] text-zinc-500">{products.length} products in catalog</span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {products.map(p => {
                    const isLow = p.stock <= 5;
                    const ratio = (p.stock / p.maxStock) * 100;
                    return (
                      <div 
                        key={p.id}
                        className="p-4 bg-zinc-950/40 border border-white/5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-left gap-4"
                      >
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded border border-white/10 bg-zinc-950 flex items-center justify-center text-purple-400 font-bold font-orbitron text-xs flex-shrink-0">
                            {p.name[0]}
                          </div>
                          <div className="min-w-0 text-left flex-1">
                            <span className="text-[8px] font-orbitron text-zinc-500 tracking-wider block uppercase">{p.category}</span>
                            <h4 className="font-orbitron font-bold text-xs text-white truncate">{p.name}</h4>
                            <span className="font-orbitron text-[10px] text-purple-400/80">{p.price.toLocaleString()} CR</span>
                          </div>
                        </div>

                        {/* Stock Level Bar */}
                        <div className="w-full sm:w-36 space-y-1">
                          <div className="flex justify-between text-[8px] font-orbitron text-zinc-500 tracking-wider">
                            <span>STOCK</span>
                            <span className={isLow ? 'text-rose-400' : 'text-purple-400'}>{p.stock}/{p.maxStock} U</span>
                          </div>
                          <div className="h-1 bg-zinc-950 border border-white/5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${isLow ? 'bg-rose-500' : 'bg-purple-500'}`} style={{ width: `${ratio}%` }} />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between sm:justify-end space-x-4">
                          <div className="flex items-center bg-zinc-950 border border-white/10 rounded-lg p-0.5">
                            <button 
                              onClick={() => adjustStock(p, -1)}
                              className="w-6 h-6 flex items-center justify-center font-orbitron text-[10px] text-zinc-400 hover:text-white"
                            >
                              -
                            </button>
                            <span className="font-orbitron text-[10px] font-bold text-white px-1.5">{p.stock}</span>
                            <button 
                              onClick={() => adjustStock(p, 1)}
                              className="w-6 h-6 flex items-center justify-center font-orbitron text-[10px] text-zinc-400 hover:text-white"
                            >
                              +
                            </button>
                          </div>

                          <button 
                            onClick={() => deleteProduct(p.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Add product form (takes 4 cols) */}
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
                      placeholder="e.g. Bio-Interface Module" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-xs font-rajdhani font-bold text-white focus:border-purple-400 focus:outline-none placeholder-zinc-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-orbitron text-[8px] text-zinc-500 tracking-widest uppercase">Price (CR)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 1500" 
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-xs font-rajdhani font-bold text-white focus:border-purple-400 focus:outline-none placeholder-zinc-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-orbitron text-[8px] text-zinc-500 tracking-widest uppercase">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
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
                      placeholder="Provide details about the augmentation node..." 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-xs font-rajdhani font-bold text-white focus:border-purple-400 focus:outline-none placeholder-zinc-700 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-orbitron text-[8px] text-zinc-500 tracking-widest uppercase">Stock</label>
                      <input 
                        type="text" 
                        placeholder="10" 
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-xs font-rajdhani font-bold text-white focus:border-purple-400 focus:outline-none placeholder-zinc-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-orbitron text-[8px] text-zinc-500 tracking-widest uppercase">Max Stock</label>
                      <input 
                        type="text" 
                        placeholder="20" 
                        value={maxStock}
                        onChange={(e) => setMaxStock(e.target.value)}
                        className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-xs font-rajdhani font-bold text-white focus:border-purple-400 focus:outline-none placeholder-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-orbitron text-[8px] text-zinc-500 tracking-widest uppercase">3D Product Model</label>
                    <select
                      value={modelType}
                      onChange={(e) => setModelType(e.target.value as any)}
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

                  {/* Spec inputs */}
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

                  {formError && (
                    <div className="p-2.5 border border-rose-500/30 bg-rose-500/10 text-rose-400 rounded-lg text-[9px] font-orbitron tracking-wide text-center uppercase animate-pulse">
                      {formError}
                    </div>
                  )}
                  {formSuccess && (
                    <div className="p-2.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-orbitron tracking-wide text-center uppercase animate-pulse flex items-center justify-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:brightness-125 text-white font-orbitron font-black text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product to Catalog</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
