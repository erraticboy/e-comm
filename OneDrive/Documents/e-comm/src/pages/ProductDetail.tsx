import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Heart, ShoppingCart, Cpu, Truck, Check, Sparkles, 
  Rotate3d, Smartphone, Star, MessageSquare 
} from 'lucide-react';

export const ProductDetail = () => {
  const { 
    products, selectedProductId, addToCart, wishlist, toggleWishlist, 
    setCurrentPage, setSelectedProductId, modelRotationSpeed, setModelRotationSpeed 
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('specs');
  const [showQR, setShowQR] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedMessage, setAddedMessage] = useState<boolean>(false);

  const product = products.find(p => p.id === selectedProductId) || products[0];
  const isStarred = wishlist.includes(product.id);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 2000);
  };

  // Alternative recommendations (excluding current product)
  const recommendations = products
    .filter(p => p.id !== product.id)
    .slice(0, 3);

  // Simulated Reviews
  const reviews = [
    { user: "Netrunner_V", rating: 5, date: "2 Hours Ago", comment: "Latency is practically non-existent. Direct cortical sync was seamless on my cyberdeck. Highly recommended." },
    { user: "Zero_Cool", rating: 4, date: "1 Day Ago", comment: "Decent build, shielding is robust. Delivery drone ETA was delayed by 2 minutes due to sector interference, but cargo arrived intact." },
    { user: "T_Kiyoshi", rating: 5, date: "1 Week Ago", comment: "Excellent cyberware. The solid-state power supply holds its charge even under heavy load. A absolute necessity for corporate hacks." }
  ];

  return (
    <div className="relative min-h-screen text-white select-none pb-20">
      
      {/* Background Glow */}
      <div className="absolute top-[20%] left-0 w-full h-[500px] pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full glow-radial-cyan opacity-15" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs font-orbitron text-zinc-500 mb-8 text-left">
          <button onClick={() => setCurrentPage('home')} className="hover:text-cyan-400 transition-colors uppercase">Grid Core</button>
          <span>/</span>
          <button onClick={() => setCurrentPage('shop')} className="hover:text-cyan-400 transition-colors uppercase">Store</button>
          <span>/</span>
          <span className="text-zinc-300 uppercase truncate max-w-[200px]">{product.name}</span>
        </div>

        {/* Main Grid: 3D Scene Space vs Text Bento (takes 50% split) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          
          {/* LEFT: 3D Canvas Visualizer Controller (takes 5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            
            {/* Box displaying WebGL instruction tips */}
            <div className="glassmorphism p-6 rounded-xl border-white/5 text-left space-y-4 h-[350px] flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
              
              <div className="flex items-center justify-between z-10">
                <span className="font-orbitron font-extrabold text-[9px] tracking-[0.2em] text-cyan-400 uppercase">HOLOVISUAL ENGINE v4</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>

              {/* Orbital drag prompt */}
              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2 z-10">
                <Rotate3d className="w-10 h-10 text-cyan-400/50 animate-float" />
                <h4 className="font-orbitron font-bold text-xs tracking-wider text-zinc-300 uppercase">Interactive Node Active</h4>
                <p className="font-inter text-[10px] text-zinc-500 max-w-[240px] leading-relaxed">
                  Drag background WebGL screen directly to adjust cameras and orbit model coordinates.
                </p>
              </div>

              {/* WebGL Controller Speed Slider */}
              <div className="space-y-2 z-10 border-t border-white/5 pt-4">
                <div className="flex justify-between text-[8px] font-orbitron tracking-widest text-zinc-500">
                  <span>ORBIT VELOCITY</span>
                  <span className="text-cyan-400">{modelRotationSpeed}X</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="4" 
                  step="0.5"
                  value={modelRotationSpeed} 
                  onChange={(e) => setModelRotationSpeed(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-zinc-950 border border-white/5 h-1 rounded-full cursor-pointer"
                />
              </div>

            </div>

            {/* Quick Actions (AR Code sync) */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowQR(!showQR)}
                className="py-3 px-4 glassmorphism hover:bg-cyan-500/10 border-white/5 hover:border-cyan-400/30 text-zinc-300 hover:text-cyan-400 font-orbitron font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>AR Core Sync</span>
              </button>
              <button 
                onClick={() => toggleWishlist(product.id)}
                className={`py-3 px-4 glassmorphism border-white/5 hover:border-cyan-400/30 font-orbitron font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-2 ${
                  isStarred ? 'text-cyan-400 border-cyan-500/30' : 'text-zinc-300'
                }`}
              >
                <Heart className={`w-4 h-4 ${isStarred ? 'fill-cyan-400' : ''}`} />
                <span>{isStarred ? 'Saved Deck' : 'Save To Deck'}</span>
              </button>
            </div>

            {/* Simulated Holographic AR QR overlay */}
            {showQR && (
              <div className="p-4 glassmorphism-card border-cyan-400/30 rounded-xl text-center space-y-3 animate-holo-flicker">
                <span className="font-orbitron text-[9px] text-cyan-400 tracking-widest block font-bold">SCAN CORTICAL AR LINK</span>
                <div className="w-32 h-32 mx-auto bg-white p-2 rounded-lg flex items-center justify-center border-4 border-cyan-400">
                  {/* Procedural QR Code block representations */}
                  <div className="grid grid-cols-5 gap-1.5 w-full h-full bg-black p-1">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`rounded-sm ${(i % 3 === 0 || i % 7 === 1 || i < 5 || i > 20) ? 'bg-cyan-400' : 'bg-zinc-900'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="font-inter text-[9px] text-zinc-500 leading-relaxed max-w-[280px] mx-auto">
                  Scan matrix code using a cybernetic scanner to project this mesh into your local physical perimeter.
                </p>
              </div>
            )}

          </div>

          {/* RIGHT: Bento Specification Details (takes 7 cols) */}
          <div className="lg:col-span-7 text-left space-y-6">
            
            <div className="space-y-2">
              <span className="px-2.5 py-1 text-[9px] font-orbitron bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded uppercase tracking-wider font-extrabold">
                {product.category}
              </span>
              <h2 className="font-orbitron font-black text-3xl sm:text-5xl text-white tracking-tight uppercase">
                {product.name}
              </h2>
              
              {/* Rating */}
              <div className="flex items-center space-x-2">
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} />
                  ))}
                </div>
                <span className="font-orbitron text-xs font-bold text-zinc-400">({product.rating.toFixed(1)} Node Score)</span>
              </div>
            </div>

            {/* Description */}
            <p className="font-inter text-sm text-zinc-400 leading-relaxed border-b border-white/5 pb-6">
              {product.description}
            </p>

            {/* Price & Quantity & Checkout Protocol Card */}
            <div className="p-6 glassmorphism rounded-xl border-cyan-500/10 bg-[#0a0a0f]/40 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div>
                <span className="text-[10px] font-orbitron text-zinc-500 tracking-widest uppercase">QUANTUM CREDIT PROTOCOL</span>
                <div className="font-orbitron text-2xl sm:text-3xl font-black text-cyan-400 neon-text-cyan flex items-baseline mt-1">
                  {(product.price * quantity).toLocaleString()}
                  <span className="text-xs font-bold text-cyan-300 ml-1">CR</span>
                </div>
              </div>

              {/* Quantity selector & Add button */}
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-zinc-950/80 border border-white/10 rounded-lg p-1">
                  <button 
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 flex items-center justify-center font-orbitron text-sm text-zinc-400 hover:text-white"
                  >
                    -
                  </button>
                  <span className="font-orbitron text-xs font-bold text-white">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                    className="w-8 h-8 flex items-center justify-center font-orbitron text-sm text-zinc-400 hover:text-white"
                  >
                    +
                  </button>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  className="w-full py-3 bg-gradient-to-r from-cyan-400 to-purple-600 hover:brightness-125 text-black font-orbitron font-black text-xs tracking-wider uppercase rounded-lg transition-all flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Authorize Inject</span>
                </button>
              </div>
            </div>

            {/* Added success banner */}
            {addedMessage && (
              <div className="p-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-orbitron tracking-wide text-center flex items-center justify-center space-x-2 animate-pulse">
                <Check className="w-4 h-4" />
                <span>TRANSACTION MEMORY LOADED: {quantity} ITEM(S) ADDED</span>
              </div>
            )}

            {/* Specifications Tab Panel */}
            <div className="space-y-4">
              
              {/* Tab headers */}
              <div className="flex border-b border-white/5">
                {['specs', 'handshake', 'logistics'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2.5 px-4 font-orbitron font-bold text-xs tracking-wider uppercase border-b-2 transition-colors ${
                      activeTab === tab 
                        ? 'border-cyan-400 text-cyan-400' 
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {tab === 'specs' ? 'Specs' : tab === 'handshake' ? 'Sync Protocols' : 'Drone Logistics'}
                  </button>
                ))}
              </div>

              {/* Tab contents */}
              <div className="p-4 bg-zinc-950/20 rounded-lg border border-white/5 font-inter text-xs text-zinc-400 leading-relaxed min-h-[120px]">
                {activeTab === 'specs' && (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(product.specs).map(([key, val]) => (
                      <div key={key} className="border-b border-white/5 pb-2">
                        <span className="text-[10px] font-orbitron text-zinc-500 tracking-wider block uppercase">{key}</span>
                        <span className="font-rajdhani font-bold text-zinc-200 text-sm mt-0.5 block">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'handshake' && (
                  <div className="space-y-2 text-left">
                    <span className="flex items-center text-purple-400 font-orbitron font-bold text-[10px] uppercase">
                      <Cpu className="w-3.5 h-3.5 mr-1.5" /> Direct Neural Interface Ready
                    </span>
                    <p>
                      Enables high-frequency cognitive synchronization with the hardware. Includes telemetry feeds directly mapped to your neural core dashboard to monitor battery levels, thermal loads, and security handshakes.
                    </p>
                  </div>
                )}
                {activeTab === 'logistics' && (
                  <div className="space-y-2 text-left">
                    <span className="flex items-center text-cyan-400 font-orbitron font-bold text-[10px] uppercase">
                      <Truck className="w-3.5 h-3.5 mr-1.5" /> Quantum Drone Logistics
                    </span>
                    <p>
                      MagLev delivery quadrotors launch from Sector 7B within 60 seconds of transaction settlement. Automated route-planning calculations prevent transit delays from thermal layers or police air corridors.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* User reviews section */}
        <div className="border-t border-white/5 pt-12 text-left space-y-6">
          <h3 className="font-orbitron font-bold text-lg text-white uppercase tracking-wider flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            <span>Runner Logs (Feedback)</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev, i) => (
              <div key={i} className="glassmorphism p-5 rounded-xl border-white/5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-orbitron text-xs font-bold text-cyan-400 tracking-wider">{rev.user}</span>
                    <span className="text-[9px] font-orbitron text-zinc-500">{rev.date}</span>
                  </div>
                  <div className="flex text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star key={idx} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="font-inter text-xs text-zinc-400 leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations Panel */}
        <div className="border-t border-white/5 pt-12 mt-16 text-left space-y-8">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="font-orbitron font-bold text-lg text-white uppercase tracking-wider">Matched Augmentation Slots (Recommends)</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map(item => (
              <div 
                key={item.id}
                onClick={() => {
                  setSelectedProductId(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="glassmorphism hover:border-cyan-400/30 p-4 rounded-xl border-white/5 cursor-pointer transition-all flex items-center space-x-4 group"
              >
                <div className="w-12 h-12 rounded bg-zinc-950 border border-white/10 flex items-center justify-center text-cyan-400 font-bold group-hover:border-cyan-400/30 transition-all font-orbitron text-sm">
                  {item.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-orbitron font-bold text-xs text-white group-hover:text-cyan-400 transition-colors truncate">{item.name}</h4>
                  <span className="text-[9px] font-orbitron text-zinc-500 tracking-wider uppercase mt-0.5 block">{item.category}</span>
                </div>
                <span className="font-orbitron text-xs text-cyan-400 neon-text-cyan">{item.price} CR</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
