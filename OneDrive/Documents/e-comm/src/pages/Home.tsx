import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { Zap, Shield, Rocket, ArrowRight, Activity, Terminal } from 'lucide-react';

export const Home: React.FC = () => {
  const { setCurrentPage, products } = useApp();
  const [stats, setStats] = useState({ users: 1100000, volume: 8300000, speed: 2.1 });

  // Animate stats values on mount
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        users: prev.users + Math.floor(Math.random() * 10),
        volume: prev.volume + Math.floor(Math.random() * 200),
        speed: +(prev.speed + (Math.random() * 0.1 - 0.05)).toFixed(2)
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen text-white select-none overflow-hidden pb-20">
      
      {/* Background radial highlight */}
      <div className="absolute top-[10%] left-0 w-full h-[500px] pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full glow-radial-cyan opacity-40" />
      </div>

      {/* Hero Section Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-20 lg:pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero text panel (takes 7 cols on desktop) */}
          <div className="lg:col-span-7 text-left space-y-6">
            
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glassmorphism border-cyan-400/20 text-cyan-400">
              <Zap className="w-3.5 h-3.5 animate-bounce text-cyan-400" />
              <span className="font-orbitron font-extrabold text-[10px] tracking-[0.2em] uppercase">SYSTEM PROTOCOL 7B INITIALIZED</span>
            </div>

            <h1 className="font-orbitron font-black text-4xl sm:text-6xl lg:text-7xl leading-tight tracking-tight uppercase">
              The Future of <br />
              <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-amber-300 bg-clip-text text-transparent neon-text-cyan">
                Online Shopping
              </span>
            </h1>

            <p className="font-inter text-zinc-400 text-sm sm:text-base max-w-xl leading-relaxed">
              Unlock the neural grid. Acquire premium physical hardware, bio-implants, and vector vehicles synced directly to your physical coords via MagLev quantum drone networks. Bypassing state lines, instantly encrypted, 100% decentralized.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
              <button 
                onClick={() => setCurrentPage('shop')}
                className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-purple-600 hover:brightness-125 text-black font-orbitron font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-300 neon-border-cyan flex items-center justify-center space-x-2"
              >
                <span>Access Node Store</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  const el = document.getElementById('featured-grid');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 glassmorphism hover:bg-white/5 border-white/10 hover:border-cyan-400/30 text-white font-orbitron font-bold text-xs uppercase tracking-widest rounded-xl transition-all duration-300"
              >
                Inspect Telemetry
              </button>
            </div>

            {/* Micro holographic stats cards */}
            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="glassmorphism p-3 rounded-lg border-white/5 text-left">
                <span className="text-[9px] font-orbitron text-zinc-500 tracking-wider block">GLIDE VELOCITY</span>
                <span className="font-orbitron font-extrabold text-sm sm:text-lg text-cyan-400 tracking-wider">
                  MACH {stats.speed}
                </span>
              </div>
              <div className="glassmorphism p-3 rounded-lg border-white/5 text-left">
                <span className="text-[9px] font-orbitron text-zinc-500 tracking-wider block">SECURE INDEX</span>
                <span className="font-orbitron font-extrabold text-sm sm:text-lg text-purple-400 tracking-wider">
                  100% AES-Q
                </span>
              </div>
              <div className="glassmorphism p-3 rounded-lg border-white/5 text-left">
                <span className="text-[9px] font-orbitron text-zinc-500 tracking-wider block">TRANSACTION VOL</span>
                <span className="font-orbitron font-extrabold text-sm sm:text-lg text-amber-400 tracking-wider truncate block">
                  {(stats.volume / 1000000).toFixed(2)}M CR
                </span>
              </div>
            </div>

          </div>

          {/* Right Floating hologram widgets (takes 5 cols on desktop) */}
          <div className="lg:col-span-5 relative flex items-center justify-center h-80 lg:h-auto">
            {/* Visual spacer to prevent text overlap with background 3D canvas */}
            <div className="hidden lg:block w-full h-[400px] border border-dashed border-white/5 rounded-2xl bg-[#050505]/20 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute inset-0 cyber-dots opacity-40" />
              <div className="absolute inset-0 flex flex-col justify-between p-6">
                
                {/* Console Log Panel */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between text-[9px] font-orbitron text-cyan-400 border-b border-cyan-500/20 pb-1.5">
                    <span className="flex items-center space-x-1">
                      <Terminal className="w-3 h-3 mr-1 animate-pulse" />
                      <span>SYS_STATUS: RUNNING</span>
                    </span>
                    <span>SEC_LEVEL: ALPHA</span>
                  </div>
                  <pre className="font-mono text-[9px] text-zinc-500 leading-normal scrollbar-none overflow-hidden">
                    <code>
                      {`[NETRUN] Syncing nodes with grid...
[GRID] Secure handshake authenticated.
[DRONE] Drone base 7B reports active payload.
[SYS] WebGL 3D context loaded (60.2 FPS).
[CORTEX] Synchronizing cortex sync vectors...
[NET] Cybernetix index decrypted successfully.`}
                    </code>
                  </pre>
                </div>

                {/* Simulated live chart */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-orbitron text-zinc-400">
                    <span>DRONE DEPLOYMENT RANGE</span>
                    <span className="text-cyan-400">92% CAP</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-950 rounded-full border border-white/5 overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-purple-600 rounded-full w-[92%] animate-pulse" />
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Statistics telemetry row */}
      <div className="bg-[#0a0a0f]/80 border-y border-white/5 py-10 mt-20 relative z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <h3 className="font-orbitron text-2xl md:text-3xl font-black text-cyan-400 neon-text-cyan">
              {stats.users.toLocaleString()}
            </h3>
            <span className="text-[10px] font-orbitron tracking-widest text-zinc-500 uppercase mt-1 block">ACTIVE NEURAL NODES</span>
          </div>
          <div className="text-center">
            <h3 className="font-orbitron text-2xl md:text-3xl font-black text-purple-400 neon-text-purple">
              45,000+
            </h3>
            <span className="text-[10px] font-orbitron tracking-widest text-zinc-500 uppercase mt-1 block">MAGLEV QUAD-DRONES</span>
          </div>
          <div className="text-center">
            <h3 className="font-orbitron text-2xl md:text-3xl font-black text-amber-400 neon-text-gold">
              0.02 MS
            </h3>
            <span className="text-[10px] font-orbitron tracking-widest text-zinc-500 uppercase mt-1 block">GRID SYNC LATENCY</span>
          </div>
          <div className="text-center">
            <h3 className="font-orbitron text-2xl md:text-3xl font-black text-emerald-400">
              100% CO2-O
            </h3>
            <span className="text-[10px] font-orbitron tracking-widest text-zinc-500 uppercase mt-1 block">CARBON NEUTRAL INDEX</span>
          </div>
        </div>
      </div>

      {/* Featured collection cards */}
      <div id="featured-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 relative z-10">
        
        {/* Header Title */}
        <div className="text-left mb-12">
          <div className="flex items-center space-x-2 text-cyan-400 mb-2">
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="font-orbitron font-extrabold text-[10px] tracking-[0.3em] uppercase">SYSTEM RECOMMENDATIONS</span>
          </div>
          <h2 className="font-orbitron font-black text-2xl sm:text-4xl text-white uppercase tracking-tight">
            Trending Cyberware <span className="text-cyan-400 font-normal">Catalog</span>
          </h2>
          <p className="font-inter text-xs sm:text-sm text-zinc-500 mt-2 max-w-xl">
            Acquire top-grade tactical equipment and bio-engineering patches compiled directly from authorized corporate index bases.
          </p>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 3).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

      </div>

      {/* Holographic specs bento grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="glassmorphism p-6 rounded-xl border-white/5 text-left space-y-3 md:col-span-2">
            <div className="w-10 h-10 bg-cyan-400/10 border border-cyan-400/20 rounded-lg flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-orbitron font-bold text-sm tracking-wider text-white uppercase">Secured Quantum Encryption</h3>
            <p className="font-inter text-xs text-zinc-400 leading-relaxed">
              Every transaction generates a temporary cryptographic orbital hash that self-destructs upon cargo confirmation. Bypasses standard corporate registers to keep your credentials fully anonymous.
            </p>
          </div>

          <div className="glassmorphism p-6 rounded-xl border-white/5 text-left space-y-3">
            <div className="w-10 h-10 bg-purple-500/10 border border-purple-400/20 rounded-lg flex items-center justify-center text-purple-400">
              <Rocket className="w-5 h-5" />
            </div>
            <h3 className="font-orbitron font-bold text-sm tracking-wider text-white uppercase">Automated Delivery Vector</h3>
            <p className="font-inter text-xs text-zinc-400 leading-relaxed">
              Drones utilize hypersonic magnetic glide rails. Simply submit your GPS coordinates or click order tracking to view shipping updates in real-time.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
