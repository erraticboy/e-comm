import { useApp } from '../context/AppContext';
import { User, Activity, Terminal, Award } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useApp();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-cyan-400">
        <span className="font-orbitron text-[10px] tracking-[0.2em] uppercase animate-pulse">Unauthorized. Please log in to access your dashboard.</span>
      </div>
    );
  }

  // Simulated Purchases
  const purchases = [
    { id: "CY-9982-A", item: "Nova Visor V4", price: 1299, date: "2026-05-20", status: "Shipped (Drone)" },
    { id: "CY-7890-F", item: "Sentinel Bio-Patch", price: 299, date: "2026-05-18", status: "Delivered" },
    { id: "CY-5421-E", item: "Quantum Deck S9", price: 899, date: "2026-05-12", status: "Delivered" }
  ];

  return (
    <div className="relative min-h-screen text-white select-none pb-20">
      
      {/* Glow ambient highlight */}
      <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] pointer-events-none z-0">
        <div className="w-full h-full rounded-full glow-radial-cyan opacity-20" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
        
        {/* Header */}
        <div className="text-left border-b border-white/5 pb-6 mb-8">
          <div className="flex items-center space-x-2 text-cyan-400 mb-1">
            <User className="w-4 h-4" />
            <span className="font-orbitron font-extrabold text-[9px] tracking-[0.3em] uppercase">CUSTOMER PROFILE</span>
          </div>
          <h1 className="font-orbitron font-black text-3xl sm:text-5xl uppercase tracking-tight">
            Account <span className="text-cyan-400 font-normal">Panel</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          
          {/* LEFT COLUMN: Profile info (takes 4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* User Node Info */}
            <div className="glassmorphism p-6 rounded-xl border-white/5 space-y-6">
              
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center text-xl font-orbitron font-black text-black neon-border-cyan animate-pulse-glow">
                  {user.name[0]}
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-base text-white tracking-wider">{user.name}</h3>
                  <span className="text-[9px] font-orbitron text-zinc-500 tracking-widest uppercase">Address Verified</span>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-3 font-orbitron text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Node Status</span>
                  <span className="text-emerald-400 font-bold flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                    ONLINE
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Security Clearance</span>
                  <span className="text-purple-400 font-bold uppercase">{user.role} CODE</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-zinc-500">Credits Balance</span>
                  <span className="text-cyan-400 font-extrabold text-sm sm:text-base neon-text-cyan">
                    {user.credits.toLocaleString()} CR
                  </span>
                </div>
              </div>

            </div>

            {/* Expense SVG Polyline Chart card */}
            <div className="glassmorphism p-6 rounded-xl border-white/5 space-y-4">
              <span className="font-orbitron font-bold text-[9px] text-zinc-500 tracking-widest uppercase flex items-center">
                <Activity className="w-3.5 h-3.5 text-cyan-400 mr-2 animate-pulse" />
                <span>Expense Analytics (Past 5 months)</span>
              </span>
              
              <div className="h-28 w-full border border-white/5 rounded bg-zinc-950/20 p-2 relative flex items-end">
                <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                  {/* Grid guidelines */}
                  <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                  
                  {/* Expense polyline */}
                  <polyline 
                    fill="none" 
                    stroke="#00F5FF" 
                    strokeWidth="1.5"
                    points="0,45 25,15 50,35 75,5 100,20" 
                  />
                  {/* Data points */}
                  <circle cx="0" cy="45" r="1.5" fill="#8A2BE2" />
                  <circle cx="25" cy="15" r="1.5" fill="#8A2BE2" />
                  <circle cx="50" cy="35" r="1.5" fill="#8A2BE2" />
                  <circle cx="75" cy="5" r="1.5" fill="#8A2BE2" />
                  <circle cx="100" cy="20" r="1.5" fill="#8A2BE2" />
                </svg>
                <div className="absolute top-2 left-2 text-[8px] font-orbitron text-zinc-500">80K CR</div>
                <div className="absolute bottom-2 left-2 text-[8px] font-orbitron text-zinc-500">0 CR</div>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: Transaction History & Carbon footprint (takes 8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Bento charts details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Carbon Offset Radial Circle Indicator */}
              <div className="glassmorphism p-5 rounded-xl border-white/5 flex items-center space-x-6">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      className="text-zinc-900"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-cyan-400 animate-pulse"
                      strokeWidth="3.5"
                      strokeDasharray="80, 100"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-orbitron font-extrabold text-xs text-white">80%</span>
                </div>
                <div className="flex-1 space-y-1">
                  <span className="flex items-center text-cyan-400 font-orbitron font-bold text-[9px] uppercase tracking-wider">
                    <Award className="w-3.5 h-3.5 mr-1" /> Carbon Offset Tracking
                  </span>
                  <h4 className="font-orbitron font-bold text-xs text-zinc-200 uppercase">Eco-Friendly Delivery Status</h4>
                  <p className="font-inter text-[10px] text-zinc-500 leading-normal">Your eco-friendly drone deliveries offset 4.2kg of carbon emissions this month.</p>
                </div>
              </div>

              {/* Bio Sync status stats */}
              <div className="glassmorphism p-5 rounded-xl border-white/5 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-orbitron text-zinc-500 tracking-widest uppercase">
                  <span>SYSTEM CONNECTION STATUS</span>
                  <span className="text-purple-400 font-bold">STABLE</span>
                </div>
                <div className="h-2 w-full bg-zinc-950 border border-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-600 rounded-full w-[94%]" />
                </div>
                <p className="font-inter text-[10px] text-zinc-500 leading-normal text-left">
                  Your connection to our system is running at 94% strength. Page data updates automatically.
                </p>
              </div>

            </div>

            {/* Transaction Logs */}
            <div className="glassmorphism p-6 rounded-xl border-white/5 space-y-6">
              
              <h3 className="font-orbitron font-bold text-sm tracking-wider text-zinc-300 border-b border-white/5 pb-3 uppercase flex items-center space-x-1.5">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Order History Log</span>
              </h3>

              <div className="space-y-4">
                {purchases.map(pur => (
                  <div 
                    key={pur.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-950/40 border border-white/5 rounded-lg text-xs space-y-2 sm:space-y-0"
                  >
                    <div className="text-left font-orbitron">
                      <span className="text-zinc-500 text-[10px] tracking-wider block">{pur.id}</span>
                      <h4 className="font-bold text-white tracking-wide mt-0.5">{pur.item}</h4>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-6 font-orbitron">
                      <span className="text-zinc-400">{pur.date}</span>
                      <span className="font-bold text-cyan-400 neon-text-cyan">{pur.price} CR</span>
                      <span className={`px-2 py-0.5 text-[9px] border rounded uppercase ${
                        pur.status === 'Delivered' 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 animate-pulse'
                      }`}>
                        {pur.status}
                      </span>
                    </div>

                  </div>
                ))}
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
