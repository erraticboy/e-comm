import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingBag, Search, Mic, User, Menu, X, ArrowRight, ShieldCheck, Heart, 
  Grid, Compass, Cpu, LogOut, LayoutDashboard
} from 'lucide-react';

export const Navbar = () => {
  const { 
    currentPage, setCurrentPage, cart, wishlist, products, 
    searchQuery, setSearchQuery, setSelectedCategory, user, logout
  } = useApp();

  const [menuOpen, setMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceWave, setVoiceWave] = useState<number[]>([1, 1, 1, 1, 1]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearching(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Animate soundwaves during voice listening simulation
  useEffect(() => {
    let interval: any;
    if (isListening) {
      interval = setInterval(() => {
        setVoiceWave(Array.from({ length: 8 }, () => Math.floor(Math.random() * 24) + 4));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  // Voice Search Simulation
  const handleVoiceSearch = () => {
    if (isListening) return;
    setIsListening(true);
    setSearchQuery("Listening...");
    
    setTimeout(() => {
      setIsListening(false);
      const suggestions = ["Visor", "Drone", "Deck", "HyperCar", "Patch"];
      const randomWord = suggestions[Math.floor(Math.random() * suggestions.length)];
      setSearchQuery(randomWord);
      setCurrentPage('shop');
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 2500);
  };

  // Cart total items
  const cartTotalItems = cart.reduce((total, item) => total + item.quantity, 0);

  // Filtered search list inside navbar
  const autocompleteSuggestions = searchQuery.trim() && searchQuery !== "Listening..."
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 4)
    : [];

  return (
    <nav className="sticky top-0 left-0 w-full z-50 glassmorphism bg-[#050505]/40 border-b border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => setCurrentPage('home')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center mr-3 border border-cyan-300/30 neon-border-cyan animate-pulse-glow">
              <Cpu className="w-5 h-5 text-[#050505]" />
            </div>
            <span className="font-orbitron font-extrabold text-xl tracking-[0.15em] bg-gradient-to-r from-cyan-400 via-white to-purple-500 bg-clip-text text-transparent uppercase hover:opacity-80 transition-opacity">
              Cybernetix
            </span>
          </div>

          {/* Center Links (Mega menu & Navigation) */}
          <div className="hidden lg:flex items-center space-x-8">
            {currentPage === 'seller' ? (
              <>
                <div className="flex items-center space-x-2 border border-purple-500/30 bg-purple-500/5 px-3 py-1 rounded text-purple-400 font-orbitron text-xs font-black tracking-widest uppercase">
                  <span>Seller Panel</span>
                </div>
                <button 
                  onClick={() => setCurrentPage('shop')}
                  className="font-rajdhani font-semibold tracking-wider text-xs uppercase border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 px-2.5 py-1 rounded transition-colors cursor-pointer"
                >
                  Shopping Storefront
                </button>
              </>
            ) : currentPage === 'admin' ? (
              <>
                <div className="flex items-center space-x-2 border border-rose-500/30 bg-rose-500/5 px-3 py-1 rounded text-rose-400 font-orbitron text-xs font-black tracking-widest uppercase">
                  <span>Admin Panel</span>
                </div>
                <button 
                  onClick={() => setCurrentPage('shop')}
                  className="font-rajdhani font-semibold tracking-wider text-xs uppercase border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 px-2.5 py-1 rounded transition-colors cursor-pointer"
                >
                  Shopping Storefront
                </button>
              </>
            ) : currentPage === 'portal' ? (
              <>
                <div className="flex items-center space-x-2 border border-cyan-500/30 bg-cyan-500/5 px-3 py-1 rounded text-cyan-400 font-orbitron text-xs font-black tracking-widest uppercase animate-pulse">
                  <span>Authentication Portal</span>
                </div>
                <button 
                  onClick={() => setCurrentPage('home')}
                  className="font-rajdhani font-semibold tracking-wider text-xs text-zinc-400 hover:text-white uppercase cursor-pointer"
                >
                  Home
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setCurrentPage('home')}
                  className={`font-rajdhani font-semibold tracking-wider text-sm uppercase transition-colors duration-200 cursor-pointer ${currentPage === 'home' ? 'text-cyan-400 neon-text-cyan' : 'text-zinc-400 hover:text-white'}`}
                >
                  Home
                </button>
                
                {/* Mega Menu Toggle */}
                <div className="relative">
                  <button 
                    onMouseEnter={() => setMegaMenuOpen(true)}
                    onClick={() => { setMegaMenuOpen(!megaMenuOpen); }}
                    className={`font-rajdhani font-semibold tracking-wider text-sm uppercase flex items-center space-x-1 cursor-pointer transition-colors duration-200 ${currentPage === 'shop' || megaMenuOpen ? 'text-cyan-400' : 'text-zinc-400 hover:text-white'}`}
                  >
                    <span>Store</span>
                    <Grid className="w-3.5 h-3.5" />
                  </button>

                  {/* Mega Menu Dropdown */}
                  {megaMenuOpen && (
                    <div 
                      className="absolute top-12 left-1/2 transform -translate-x-1/2 w-[550px] p-6 glassmorphism-card text-left rounded-xl transition-all duration-300 grid grid-cols-2 gap-6 z-50 animate-holo-flicker"
                      onMouseLeave={() => setMegaMenuOpen(false)}
                    >
                      <div>
                        <h3 className="font-orbitron text-xs tracking-widest text-cyan-400 mb-3 uppercase border-b border-cyan-400/20 pb-1.5 font-bold">Categories</h3>
                        <div className="space-y-2">
                          {['All', 'Augmentations', 'Robotics', 'Hacking', 'Vehicles', 'Bio-Tech', 'Wearables'].map(cat => (
                            <button
                              key={cat}
                              onClick={() => {
                                setSelectedCategory(cat);
                                setCurrentPage('shop');
                                setMegaMenuOpen(false);
                              }}
                              className="w-full text-left font-rajdhani text-sm text-zinc-300 hover:text-cyan-400 hover:pl-2 transition-all flex items-center justify-between group cursor-pointer"
                            >
                              <span>{cat === 'All' ? 'Browse All Tech' : cat}</span>
                              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="bg-[#050505]/50 p-4 border border-white/5 rounded-lg flex flex-col justify-between">
                        <div>
                          <span className="inline-block px-2 py-0.5 text-[9px] font-orbitron bg-purple-500/20 border border-purple-400/30 text-purple-300 rounded mb-2 font-bold">PROMO</span>
                          <h4 className="font-orbitron text-sm font-bold text-white mb-1">Cybernetix Neural-Link</h4>
                          <p className="font-inter text-xs text-zinc-400 leading-relaxed">Unlock direct cortical shopping. Sync Cybernetix with your mind and get 15% off credits.</p>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedCategory("Augmentations");
                            setCurrentPage('shop');
                            setMegaMenuOpen(false);
                          }}
                          className="mt-4 w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:brightness-125 transition-all text-xs font-orbitron font-bold rounded flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <span>Shop Now</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setCurrentPage('track')}
                  className={`font-rajdhani font-semibold tracking-wider text-sm uppercase transition-colors duration-200 cursor-pointer ${currentPage === 'track' ? 'text-cyan-400 neon-text-cyan' : 'text-zinc-400 hover:text-white'}`}
                >
                  Track Order
                </button>

                {/* Dynamic Dashboard link based on role */}
                {user && (
                  <>
                    {user.role === 'client' && (
                      <button 
                        onClick={() => setCurrentPage('dashboard')}
                        className={`font-rajdhani font-semibold tracking-wider text-sm uppercase transition-colors duration-200 cursor-pointer ${currentPage === 'dashboard' ? 'text-cyan-400 neon-text-cyan' : 'text-zinc-400 hover:text-white'}`}
                      >
                        Customer Dashboard
                      </button>
                    )}
                    {user.role === 'seller' && (
                      <button 
                        onClick={() => setCurrentPage('seller')}
                        className={`font-rajdhani font-semibold tracking-wider text-sm uppercase text-purple-400 neon-text-purple border border-purple-500/30 px-2 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 cursor-pointer`}
                      >
                        Seller Panel
                      </button>
                    )}
                    {user.role === 'admin' && (
                      <button 
                        onClick={() => setCurrentPage('admin')}
                        className="font-rajdhani font-semibold tracking-wider text-sm uppercase text-purple-400 neon-text-purple border border-purple-500/30 px-2 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 cursor-pointer"
                      >
                        Admin Panel
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Right Area (Search & E-Comm States) */}
          <div className="flex items-center space-x-4">
            
            {/* Storefront actions hidden inside admin/seller/portal workspaces */}
            {!(currentPage === 'seller' || currentPage === 'admin' || currentPage === 'portal') && (
              <>
                {/* Search Input Box */}
                <div ref={searchRef} className="relative hidden md:block">
                  <div className="flex items-center bg-[#111111]/70 border border-white/10 rounded-full pl-3 pr-2 py-1.5 focus-within:border-cyan-400/50 transition-all duration-300">
                    <Search className="w-4 h-4 text-zinc-400 mr-2" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsSearching(true);
                      }}
                      onFocus={() => setIsSearching(true)}
                      className="bg-transparent border-none outline-none text-xs text-white font-rajdhani w-44 focus:w-56 transition-all duration-300 placeholder-zinc-500"
                    />
                    
                    {/* Voice Search Simulation Button */}
                    <button 
                      onClick={handleVoiceSearch}
                      className={`p-1.5 rounded-full hover:bg-white/5 transition-colors ${isListening ? 'text-cyan-400 animate-pulse' : 'text-zinc-400 hover:text-white'}`}
                      title="Voice Search"
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Voice Listening Overlay Waveform */}
                  {isListening && (
                    <div className="absolute top-12 left-0 right-0 p-3 glassmorphism-card rounded-xl text-center z-50 animate-pulse flex flex-col items-center">
                      <span className="font-orbitron text-[10px] text-cyan-400 tracking-wider mb-2">VOICE SEARCH ACTIVE</span>
                      <div className="flex items-end justify-center space-x-1 h-6">
                        {voiceWave.map((h, i) => (
                          <div 
                            key={i} 
                            className="w-1 bg-cyan-400 rounded-full transition-all duration-100" 
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Auto-Suggestions */}
                  {isSearching && autocompleteSuggestions.length > 0 && (
                    <div className="absolute top-12 left-0 right-0 p-4 glassmorphism-card rounded-xl z-50 text-left space-y-2 border border-cyan-400/20">
                      <span className="font-orbitron text-[9px] text-cyan-400 tracking-wider uppercase border-b border-white/5 pb-1 block mb-2 font-bold">Search Results</span>
                      {autocompleteSuggestions.map(product => (
                        <div
                          key={product.id}
                          onClick={() => {
                            setSelectedCategory(product.category);
                            setSearchQuery(product.name);
                            setIsSearching(false);
                            setCurrentPage('shop');
                          }}
                          className="flex items-center space-x-3 cursor-pointer p-1.5 rounded hover:bg-white/5 transition-all group"
                        >
                          <div className="w-8 h-8 rounded border border-white/10 bg-zinc-950 flex items-center justify-center text-xs font-bold text-cyan-400">
                            {product.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-rajdhani font-bold text-white truncate group-hover:text-cyan-400 transition-colors">{product.name}</h4>
                            <span className="text-[10px] font-inter text-zinc-500">{product.category}</span>
                          </div>
                          <span className="font-orbitron text-[10px] text-cyan-400">{product.price} CR</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Wishlist Button */}
                <button 
                  onClick={() => setCurrentPage('wishlist')}
                  className={`relative p-2.5 rounded-full glassmorphism hover:border-cyan-400/40 text-zinc-400 hover:text-white transition-all duration-200 group ${currentPage === 'wishlist' ? 'border-cyan-500/50 text-cyan-400' : ''}`}
                >
                  <Heart className={`w-4 h-4 group-hover:scale-110 transition-transform ${currentPage === 'wishlist' ? 'fill-cyan-400 text-cyan-400' : ''}`} />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 border border-[#050505] text-[#050505] rounded-full text-[9px] font-orbitron font-extrabold flex items-center justify-center animate-bounce">
                      {wishlist.length}
                    </span>
                  )}
                </button>

                {/* Cart Button */}
                <button 
                  onClick={() => setCurrentPage('cart')}
                  className={`relative p-2.5 rounded-full glassmorphism hover:border-cyan-400/40 text-zinc-400 hover:text-white transition-all duration-200 group ${currentPage === 'cart' ? 'border-cyan-500/50 text-cyan-400' : ''}`}
                >
                  <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  {cartTotalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 border border-[#050505] text-white rounded-full text-[9px] font-orbitron font-extrabold flex items-center justify-center animate-pulse">
                      {cartTotalItems}
                    </span>
                  )}
                </button>
              </>
            )}

            {/* User Profile / Menu Trigger */}
            <div className="relative">
              {!user ? (
                <button 
                  onClick={() => setCurrentPage('portal')}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-purple-600 text-[#050505] font-orbitron font-black text-xs tracking-wider uppercase rounded-xl hover:brightness-125 transition-all shadow-lg cursor-pointer flex items-center space-x-1.5 neon-border-cyan border border-cyan-400/30"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>LOGIN / SIGNUP</span>
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center space-x-2 p-1 rounded-full border border-white/10 hover:border-cyan-400/40 transition-all bg-zinc-950/60"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center text-xs font-orbitron text-black font-extrabold">
                      {user.name[0].toUpperCase()}
                    </div>
                    <span className="font-rajdhani text-xs font-bold text-zinc-300 pr-1.5 hidden md:block">{user.name}</span>
                  </button>

                  {/* Profile Dropdown */}
                  {profileOpen && (
                    <div 
                      className="absolute right-0 top-12 w-56 glassmorphism-card rounded-xl p-4 text-left z-50 space-y-3 animate-holo-flicker border border-cyan-400/20"
                      onMouseLeave={() => setProfileOpen(false)}
                    >
                      <div className="border-b border-white/5 pb-2">
                        <span className="font-orbitron text-[9px] text-zinc-500 uppercase">ACCOUNT ID ({user.role})</span>
                        <h4 className="font-rajdhani font-bold text-white truncate">{user.name}</h4>
                        <div className="flex items-center space-x-1.5 mt-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-orbitron text-[9px] text-emerald-400">CREDITS: {user.credits.toLocaleString()} CR</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        {user.role === 'client' && (
                          <button 
                            onClick={() => {
                              setCurrentPage('dashboard');
                              setProfileOpen(false);
                            }}
                            className="w-full text-left py-1.5 px-2 hover:bg-white/5 rounded font-rajdhani text-sm text-zinc-300 hover:text-white transition-colors flex items-center space-x-2"
                          >
                            <User className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Customer Dashboard</span>
                          </button>
                        )}
                        {user.role === 'seller' && (
                          <button 
                            onClick={() => {
                              setCurrentPage('seller');
                              setProfileOpen(false);
                            }}
                            className="w-full text-left py-1.5 px-2 hover:bg-white/5 rounded font-rajdhani text-sm text-zinc-300 hover:text-white transition-colors flex items-center space-x-2"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
                            <span>Seller Panel</span>
                          </button>
                        )}
                        {user.role === 'admin' && (
                          <button 
                            onClick={() => {
                              setCurrentPage('admin');
                              setProfileOpen(false);
                            }}
                            className="w-full text-left py-1.5 px-2 hover:bg-white/5 rounded font-rajdhani text-sm text-zinc-300 hover:text-white transition-colors flex items-center space-x-2"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                            <span>Admin Panel</span>
                          </button>
                        )}
                        
                        <button 
                          onClick={() => {
                            setCurrentPage('track');
                            setProfileOpen(false);
                          }}
                          className="w-full text-left py-1.5 px-2 hover:bg-white/5 rounded font-rajdhani text-sm text-zinc-300 hover:text-white transition-colors flex items-center space-x-2"
                        >
                          <Compass className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Track Order</span>
                        </button>
                        
                        {/* Logout button */}
                        <button 
                          onClick={() => {
                            logout();
                            setProfileOpen(false);
                          }}
                          className="w-full text-left py-1.5 px-2 hover:bg-rose-500/10 rounded font-rajdhani text-sm text-rose-400 hover:text-rose-300 transition-colors flex items-center space-x-2 border border-rose-500/20 bg-rose-500/5 mt-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Mobile Hamburger menu */}
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-full glassmorphism text-zinc-400 hover:text-white transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5 animate-pulse" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Sliding Navigation Menu */}
      {menuOpen && (
        <div className="lg:hidden glassmorphism bg-[#050505]/95 border-t border-white/5 p-6 space-y-6 absolute left-0 right-0 z-50 text-left animate-holo-flicker">
          <div className="flex flex-col space-y-4">
            {currentPage === 'seller' ? (
              <>
                <div className="flex items-center space-x-2 border border-purple-500/30 bg-purple-500/5 px-3 py-1 rounded text-purple-400 font-orbitron text-xs font-black tracking-widest uppercase">
                  <span>Seller Panel</span>
                </div>
                <button 
                  onClick={() => {
                    setCurrentPage('shop');
                    setMenuOpen(false);
                  }}
                  className="w-full text-left font-rajdhani font-semibold tracking-wider text-sm uppercase text-cyan-400 border border-cyan-400/30 px-3 py-1.5 rounded bg-cyan-400/5 hover:bg-cyan-400/10 transition-colors"
                >
                  Shopping Storefront
                </button>
              </>
            ) : currentPage === 'admin' ? (
              <>
                <div className="flex items-center space-x-2 border border-rose-500/30 bg-rose-500/5 px-3 py-1 rounded text-rose-400 font-orbitron text-xs font-black tracking-widest uppercase">
                  <span>Admin Panel</span>
                </div>
                <button 
                  onClick={() => {
                    setCurrentPage('shop');
                    setMenuOpen(false);
                  }}
                  className="w-full text-left font-rajdhani font-semibold tracking-wider text-sm uppercase text-cyan-400 border border-cyan-400/30 px-3 py-1.5 rounded bg-cyan-400/5 hover:bg-cyan-400/10 transition-colors"
                >
                  Shopping Storefront
                </button>
              </>
            ) : currentPage === 'portal' ? (
              <>
                <div className="flex items-center space-x-2 border border-cyan-500/30 bg-cyan-500/5 px-3 py-1 rounded text-cyan-400 font-orbitron text-xs font-black tracking-widest uppercase animate-pulse">
                  <span>Authentication Portal</span>
                </div>
                <button 
                  onClick={() => {
                    setCurrentPage('home');
                    setMenuOpen(false);
                  }}
                  className="w-full text-left font-rajdhani font-semibold tracking-wider text-sm text-zinc-400 hover:text-white uppercase"
                >
                  Home
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => {
                    setCurrentPage('home');
                    setMenuOpen(false);
                  }}
                  className={`font-orbitron text-sm font-bold uppercase ${currentPage === 'home' ? 'text-cyan-400' : 'text-zinc-400'}`}
                >
                  Home
                </button>
                <button 
                  onClick={() => {
                    setSelectedCategory('All');
                    setCurrentPage('shop');
                    setMenuOpen(false);
                  }}
                  className={`font-orbitron text-sm font-bold uppercase ${currentPage === 'shop' ? 'text-cyan-400' : 'text-zinc-400'}`}
                >
                  Store
                </button>
                <button 
                  onClick={() => {
                    setCurrentPage('track');
                    setMenuOpen(false);
                  }}
                  className={`font-orbitron text-sm font-bold uppercase ${currentPage === 'track' ? 'text-cyan-400' : 'text-zinc-400'}`}
                >
                  Track Order
                </button>
                {user && user.role === 'client' && (
                  <button 
                    onClick={() => {
                      setCurrentPage('dashboard');
                      setMenuOpen(false);
                    }}
                    className={`font-orbitron text-sm font-bold uppercase ${currentPage === 'dashboard' ? 'text-cyan-400' : 'text-zinc-400'}`}
                  >
                    Customer Dashboard
                  </button>
                )}
                {user && user.role === 'seller' && (
                  <button 
                    onClick={() => {
                      setCurrentPage('seller');
                      setMenuOpen(false);
                    }}
                    className={`font-orbitron text-sm font-bold uppercase text-purple-400`}
                  >
                    Seller Panel
                  </button>
                )}
                {user && user.role === 'admin' && (
                  <button 
                    onClick={() => {
                      setCurrentPage('admin');
                      setMenuOpen(false);
                    }}
                    className="font-orbitron text-sm font-bold uppercase text-purple-400"
                  >
                    Admin Panel
                  </button>
                )}
              </>
            )}
          </div>
          
          {/* Hide Search and credits for seller/admin/portal mobile views */}
          {!(currentPage === 'seller' || currentPage === 'admin' || currentPage === 'portal') && (
            <div className="border-t border-white/5 pt-4">
              <div className="flex items-center space-x-3 mb-4">
                <Search className="w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-b border-white/10 outline-none text-sm text-white font-rajdhani w-full pb-1 focus:border-cyan-400"
                />
              </div>
              {user && (
                <div className="flex items-center justify-between text-xs font-orbitron text-zinc-500">
                  <span>CREDITS:</span>
                  <span className="text-cyan-400 font-extrabold">{user.credits.toLocaleString()} CR</span>
                </div>
              )}
            </div>
          )}

          {user && (currentPage === 'seller' || currentPage === 'admin') && (
            <div className="border-t border-white/5 pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-orbitron text-zinc-500">
                <span>ROLE:</span>
                <span className="text-purple-400 font-extrabold uppercase">{user.role}</span>
              </div>
              <button 
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-orbitron font-bold rounded uppercase transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
