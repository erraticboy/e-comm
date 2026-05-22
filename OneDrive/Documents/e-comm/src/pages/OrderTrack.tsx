import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Compass, Terminal } from 'lucide-react';

export const OrderTrack = () => {
  const { trackingCode, setTrackingCode } = useApp();
  const [inputCode, setInputCode] = useState(trackingCode);
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeSegment, setActiveSegment] = useState(2); // 0: Hub, 1: Sealed, 2: Glide, 3: Arrived
  const [droneBattery, setDroneBattery] = useState(96);
  const [altitude, setAltitude] = useState(480);
  
  // Drone coordinate animation coordinates on SVG grid
  const [droneX, setDroneX] = useState(120);
  const [droneY, setDroneY] = useState(280);

  const fetchOrder = async (code: string) => {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/orders/track/${code}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        
        // Map status to segment
        if (data.status === 'Pending') {
          setActiveSegment(0);
          setDroneX(120);
          setDroneY(280);
          setDroneBattery(100);
          setAltitude(0);
        } else if (data.status === 'Accepted') {
          setActiveSegment(1);
          setDroneX(120);
          setDroneY(280);
          setDroneBattery(100);
          setAltitude(0);
        } else if (data.status === 'Shipped') {
          setActiveSegment(2);
          setDroneX(180);
          setDroneY(220);
          setDroneBattery(85);
          setAltitude(480);
        } else if (data.status === 'Delivered') {
          setActiveSegment(3);
          setDroneX(320);
          setDroneY(110);
          setDroneBattery(68);
          setAltitude(12);
        } else {
          // Cancelled
          setActiveSegment(-1);
          setDroneX(120);
          setDroneY(280);
          setDroneBattery(0);
          setAltitude(0);
        }
      } else {
        const errData = await res.json();
        setError(errData.error || "Tracking code not found.");
        setOrder(null);
      }
    } catch (err) {
      setError("Cannot connect to delivery tracking server.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // Sync state if tracking code changes globally
  useEffect(() => {
    setInputCode(trackingCode);
    fetchOrder(trackingCode);
  }, [trackingCode]);

  // Telemetry updates simulation (runs only if order status is Shipped)
  useEffect(() => {
    if (!order || order.status !== 'Shipped') return;

    const interval = setInterval(() => {
      setDroneBattery(prev => Math.max(70, prev - 1));
      setAltitude(prev => Math.max(120, prev + Math.floor(Math.random() * 20 - 10)));
      
      // Animate drone node coordinates on map towards target (320, 110)
      setDroneX(prev => {
        if (prev < 320) return prev + 2;
        return prev;
      });
      setDroneY(prev => {
        if (prev > 110) return prev - 1.7; // 120 -> 320 is +200, 280 -> 110 is -170
        return prev;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [order]);

  const handleQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      setTrackingCode(inputCode.toUpperCase().trim());
    }
  };

  const steps = [
    { label: "Order Confirmed", desc: "Order received and processed at local warehouse." },
    { label: "Package Prepared", desc: "Order packed and secured for delivery drone." },
    { label: "In Transit", desc: "Delivery drone has departed and is en route." },
    { label: "Delivered", desc: "Drone has landed and order has been delivered." }
  ];

  return (
    <div className="relative min-h-screen text-white select-none pb-20">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
        
        {/* Header */}
        <div className="text-left border-b border-white/5 pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 mb-1">
              <Compass className="w-4 h-4" />
              <span className="font-orbitron font-extrabold text-[9px] tracking-[0.3em] uppercase">DELIVERY STATUS</span>
            </div>
            <h1 className="font-orbitron font-black text-3xl sm:text-5xl uppercase tracking-tight">
              Order <span className="text-cyan-400 font-normal">Tracking</span>
            </h1>
          </div>

          {/* Form filter */}
          <form onSubmit={handleQuery} className="flex space-x-2 bg-zinc-950 border border-white/10 p-1 rounded-xl focus-within:border-cyan-400/40 max-w-sm w-full">
            <input 
              type="text" 
              placeholder="e.g. CYBER-7798-X" 
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-orbitron font-extrabold text-white pl-3 flex-1 uppercase tracking-widest placeholder-zinc-700"
            />
            <button 
              type="submit"
              disabled={loading}
              className="py-2.5 px-4 bg-gradient-to-r from-cyan-400 to-purple-600 hover:brightness-125 text-black font-orbitron font-bold text-xs uppercase rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? "SEARCHING..." : "Trace"}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-500/30 rounded-xl text-red-400 text-xs font-orbitron text-left">
            ⚠️ ERROR: {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Live Map Telemetry SVG Display (takes 7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* SVG Interactive Map */}
            <div className="glassmorphism rounded-2xl border-white/5 p-6 relative overflow-hidden h-[400px] flex flex-col justify-between">
              
              {/* Background grids */}
              <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
              <div className="absolute inset-0 cyber-dots opacity-40 pointer-events-none" />

              {/* Map Title overlay */}
              <div className="flex justify-between items-center z-10 text-[9px] font-orbitron text-left">
                <span className="text-cyan-400 font-extrabold flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
                  <span>DRONE DELIVERY SYSTEM: ACTIVE TELEMETRY</span>
                </span>
                <span className="text-zinc-500">SECTOR: TOKYO-DECK-7</span>
              </div>

              {/* Map Canvas SVG Area */}
              <div className="flex-1 relative z-10 w-full h-full my-4 border border-dashed border-white/5 rounded-lg bg-zinc-950/20">
                <svg className="w-full h-full min-h-[220px]" viewBox="0 0 450 300">
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="150" x2="450" y2="150" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  <line x1="225" y1="0" x2="225" y2="300" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  
                  {/* Launch Base Sector Node */}
                  <circle cx="120" cy="280" r="10" fill="none" stroke="#8A2BE2" strokeWidth="2" className="animate-pulse" />
                  <circle cx="120" cy="280" r="3" fill="#8A2BE2" />
                  <text x="120" y="260" fill="#8A2BE2" fontSize="8" fontFamily="Orbitron" textAnchor="middle">WAREHOUSE DEPARTURE</text>

                  {/* Destination Pin Coords */}
                  <circle cx="320" cy="110" r="10" fill="none" stroke="#00F5FF" strokeWidth="2" className="animate-pulse" />
                  <polygon points="320,105 323,113 317,113" fill="#00F5FF" />
                  <text x="320" y="90" fill="#00F5FF" fontSize="8" fontFamily="Orbitron" textAnchor="middle">DELIVERY ADDRESS</text>

                  {/* Flight Trail path line */}
                  <path 
                    d="M 120 280 Q 200 240 320 110" 
                    fill="none" 
                    stroke="rgba(138, 43, 226, 0.3)" 
                    strokeWidth="1.5" 
                    strokeDasharray="4,4" 
                  />

                  {/* Drone Vector Node coordinates */}
                  <g transform={`translate(${droneX}, ${droneY})`}>
                    <circle cx="0" cy="0" r="16" fill="rgba(0, 245, 255, 0.05)" stroke="rgba(0, 245, 255, 0.3)" strokeWidth="1" className="animate-ping" />
                    {/* Quadcopter shape outline */}
                    <line x1="-10" y1="-10" x2="10" y2="10" stroke="#00F5FF" strokeWidth="1.5" />
                    <line x1="-10" y1="10" x2="10" y2="-10" stroke="#00F5FF" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="4" fill="#8A2BE2" />
                    {/* Propellers */}
                    <circle cx="-10" cy="-10" r="2.5" fill="none" stroke="#00F5FF" strokeWidth="0.8" />
                    <circle cx="10" cy="-10" r="2.5" fill="none" stroke="#00F5FF" strokeWidth="0.8" />
                    <circle cx="-10" cy="10" r="2.5" fill="none" stroke="#00F5FF" strokeWidth="0.8" />
                    <circle cx="10" cy="10" r="2.5" fill="none" stroke="#00F5FF" strokeWidth="0.8" />
                  </g>

                </svg>
              </div>

              {/* Lower telemetry panel */}
              <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4 text-left font-orbitron text-[9px]">
                <div>
                  <span className="text-zinc-500">SPEED</span>
                  <span className="text-cyan-400 font-extrabold block mt-0.5">
                    {order ? (
                      order.status === 'Pending' || order.status === 'Accepted' ? "0 mph (Stationary)" :
                      order.status === 'Shipped' ? "35 mph (In Flight)" :
                      order.status === 'Delivered' ? "0 mph (Delivered)" : "OFFLINE"
                    ) : "35 mph (In Flight)"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">BATTERY</span>
                  <span className="text-cyan-400 font-extrabold block mt-0.5">{droneBattery}% BATTERY</span>
                </div>
                <div>
                  <span className="text-zinc-500">ALTITUDE</span>
                  <span className="text-cyan-400 font-extrabold block mt-0.5">{altitude}m Flight</span>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT: Chrono Status timeline (takes 5 cols) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            
            {order && (
              <div className="glassmorphism p-5 rounded-2xl border-white/5 space-y-3">
                <span className="font-orbitron font-bold text-[9px] text-zinc-500 tracking-widest uppercase block border-b border-white/5 pb-2">
                  ORDER SUMMARY
                </span>
                <div className="text-xs space-y-1.5 font-orbitron">
                  <div className="flex justify-between"><span className="text-zinc-400">ORDER ID:</span> <span className="text-cyan-400 font-mono text-[10px]">{order.id}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">TOTAL AMOUNT:</span> <span className="text-purple-400">{order.totalAmount.toFixed(2)} CR</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">DELIVERY STATUS:</span> <span className={`px-2 py-0.5 rounded text-[10px] ${
                    order.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    order.status === 'Shipped' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse' :
                    order.status === 'Cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>{order.status.toUpperCase()}</span></div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <span className="font-orbitron font-semibold text-[9px] text-zinc-400 tracking-wider block mb-2">ORDERED PRODUCTS</span>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] font-inter text-zinc-300">
                        <span>{item.name} <span className="text-zinc-500">x{item.quantity}</span></span>
                        <span className="text-zinc-400 font-mono">{(item.price * item.quantity).toFixed(2)} CR</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Timeline status info */}
            <div className="glassmorphism p-6 rounded-2xl border-white/5 space-y-6">
              
              <h3 className="font-orbitron font-extrabold text-xs tracking-widest text-zinc-300 border-b border-white/5 pb-3 uppercase flex items-center justify-between">
                <span>LIVE SIGNAL STATUS</span>
                <span className={`text-[10px] lowercase flex items-center ${order && order.status === 'Cancelled' ? 'text-red-400' : 'text-emerald-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 animate-ping ${order && order.status === 'Cancelled' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  {order && order.status === 'Cancelled' ? 'Signal Disconnected' : 'Signal Connected'}
                </span>
              </h3>

              <div className="space-y-6 relative pl-6 border-l border-white/5 ml-3 pt-1">
                {steps.map((st, idx) => {
                  const isCompleted = activeSegment >= idx;
                  const isCurrent = activeSegment === idx;
                  return (
                    <div key={idx} className="relative text-left">
                      
                      {/* Ring index marker */}
                      <div className={`absolute -left-[31px] w-4.5 h-4.5 rounded bg-[#050505] border flex items-center justify-center ${
                        isCompleted 
                          ? 'border-cyan-400 text-cyan-300 neon-border-cyan' 
                          : 'border-white/5 text-zinc-600'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-cyan-400' : 'bg-zinc-800'}`} />
                      </div>

                      <div className="space-y-1">
                        <h4 className={`font-orbitron font-bold text-xs tracking-wider uppercase ${
                          isCompleted ? 'text-white' : 'text-zinc-500'
                        } ${isCurrent ? 'text-cyan-400 font-extrabold' : ''}`}>
                          {st.label}
                        </h4>
                        <p className="font-inter text-[11px] text-zinc-500 leading-relaxed">
                          {st.desc}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

            {/* Diagnostic Logs terminal block */}
            <div className="glassmorphism p-5 rounded-2xl border-white/5 space-y-3">
              <span className="font-orbitron font-bold text-[9px] text-zinc-500 tracking-widest uppercase flex items-center">
                <Terminal className="w-3.5 h-3.5 text-cyan-400 mr-2" />
                <span>SYSTEM DIAGNOSTICS</span>
              </span>
              <pre className="font-mono text-[9px] text-zinc-500 leading-normal scrollbar-none h-24 overflow-y-auto">
                <code>
                  {`[SYSTEM] Querying order tracking code: ${trackingCode}...
[DELIVERY] Verified destination coordinates.
[DRONE] Battery power level: ${droneBattery}%.
[ROUTE] Navigation path calculated successfully.
[ENVIRONMENT] Weather conditions: Clear.
[DELIVERY] Current status: ${order ? order.status.toUpperCase() : 'UNKNOWN'}
[SYSTEM] Diagnostics finished.`}
                </code>
              </pre>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
