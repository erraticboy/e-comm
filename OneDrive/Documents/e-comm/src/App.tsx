import { lazy, Suspense, useEffect, useState } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { ChatBot } from './components/ChatBot';
import { ThreeCanvas } from './components/ThreeCanvas';

// Lazy-loaded Pages for bundle optimization
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Shop = lazy(() => import('./pages/Shop').then(m => ({ default: m.Shop })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then(m => ({ default: m.ProductDetail })));
const Cart = lazy(() => import('./pages/Cart').then(m => ({ default: m.Cart })));
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const Wishlist = lazy(() => import('./pages/Wishlist').then(m => ({ default: m.Wishlist })));
const OrderTrack = lazy(() => import('./pages/OrderTrack').then(m => ({ default: m.OrderTrack })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const Seller = lazy(() => import('./pages/Seller').then(m => ({ default: m.Seller })));
const Portal = lazy(() => import('./pages/Portal').then(m => ({ default: m.Portal })));

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-cyan-400">
    <div className="w-10 h-10 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin neon-border-cyan" />
    <span className="font-orbitron text-[10px] tracking-[0.2em] uppercase animate-pulse">Loading database...</span>
  </div>
);

import { Cpu } from 'lucide-react';
import './App.css';

export default function App() {
  const { currentPage } = useApp();
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  // Cyber Boot Animation state
  const [booting, setBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);

  // Sync booting progress
  useEffect(() => {
    const interval = setInterval(() => {
      setBootProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setBooting(false), 400);
          return 100;
        }
        return prev + Math.floor(Math.random() * 20 + 8);
      });
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Track cursor location
  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', updateCursor);
    return () => window.removeEventListener('mousemove', updateCursor);
  }, []);

  // Hover detection logic for custom cursor
  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target && (
          target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.closest('.group') ||
          target.closest('button') ||
          target.closest('a')
        )
      ) {
        setHovering(true);
      } else {
        setHovering(false);
      }
    };
    window.addEventListener('mouseover', handleMouseOver);
    return () => window.removeEventListener('mouseover', handleMouseOver);
  }, []);

  // Check if touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Page Routing switch
  const renderActivePage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'shop':
        return <Shop />;
      case 'detail':
        return <ProductDetail />;
      case 'cart':
        return <Cart />;
      case 'checkout':
        return <Checkout />;
      case 'wishlist':
        return <Wishlist />;
      case 'track':
        return <OrderTrack />;
      case 'dashboard':
        return <Dashboard />;
      case 'admin':
        return <Admin />;
      case 'seller':
        return <Seller />;
      case 'portal':
        return <Portal />;
      default:
        return <Home />;
    }
  };

  // Matrix-cyber booting screen
  if (booting) {
    return (
      <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center font-orbitron select-none p-6 text-cyan-400">
        <div className="absolute inset-0 cyber-grid opacity-25 pointer-events-none" />
        <div className="absolute inset-0 cyber-dots opacity-40 pointer-events-none" />
        <div className="space-y-6 text-center max-w-sm w-full relative z-10">
          
          <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center mx-auto border border-cyan-300/30 neon-border-cyan animate-pulse">
            <Cpu className="w-8 h-8 text-black" />
          </div>
          
          <div className="space-y-2">
            <h2 className="font-black text-xl tracking-[0.2em] text-white uppercase">CYBERNETIX STORE</h2>
            <p className="text-[10px] text-zinc-500 tracking-[0.3em] uppercase">CONNECTING SECURE SYSTEM</p>
          </div>

          <div className="w-full h-1 bg-zinc-950 border border-white/5 rounded-full overflow-hidden relative">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-purple-600 transition-all duration-100"
              style={{ width: `${Math.min(bootProgress, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-[9px] text-zinc-500 tracking-wider">
            <span>SYS_BOOT: {Math.min(bootProgress, 100)}%</span>
            <span>SECURE AES-Q</span>
          </div>

          <pre className="font-mono text-[8px] text-zinc-600 text-left bg-zinc-950/80 p-3 rounded border border-white/5 h-20 overflow-hidden leading-normal">
            <code>
              {`[DB] Connecting to database...
[NET] Loading secure network protocols...
[SYS] Initializing graphics engine...
[SEC] Secure connection established.`}
            </code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#F5F5F5] font-inter overflow-hidden select-none">
      
      {/* 1. Custom Futuristic Cursor nodes */}
      {!isTouchDevice && (
        <>
          <div 
            className={`custom-cursor ${hovering ? 'hovering-cursor' : ''}`}
            style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
          />
          <div 
            className={`custom-cursor-glow ${hovering ? 'hovering-cursor-glow' : ''}`}
            style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
          />
        </>
      )}

      {/* 2. Full-Page Fixed WebGL 3D Background */}
      <ThreeCanvas />

      {/* Background layer overlays */}
      <div className="fixed inset-0 cyber-dots opacity-20 pointer-events-none z-0" />
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-[#050505]/40 to-[#050505]/95 pointer-events-none z-0" />

      {/* 3. Sticky Responsive Header Navigation */}
      <Navbar />

      {/* 4. Main Page Container Content */}
      <main className="relative z-10 min-h-[calc(100vh-80px)] w-full">
        <Suspense fallback={<PageLoader />}>
          {renderActivePage()}
        </Suspense>
      </main>

      {/* 5. Floating AI Chatbot Assistant */}
      <ChatBot />

      {/* 6. Footer section */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-[10px] font-orbitron tracking-widest text-zinc-600 bg-[#050505]/90">
        <p className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          CYBERNETIX SECURE PORTAL // © 2026 CYBERNETIX INC. // ALL RIGHTS RESERVED
        </p>
      </footer>

    </div>
  );
}
