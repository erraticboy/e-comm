import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Trash2, Tag, CreditCard, ArrowRight, ShieldCheck } from 'lucide-react';

export const Cart: React.FC = () => {
  const { cart, updateCartQuantity, removeFromCart, setCurrentPage } = useApp();
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'NEON25') {
      setCouponApplied(true);
      setCouponError("");
    } else {
      setCouponError("INVALID NODE ENCRYPTION");
      setCouponApplied(false);
    }
  };

  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const droneTransitFee = subtotal > 0 ? 50 : 0;
  const discountAmount = couponApplied ? Math.floor(subtotal * 0.25) : 0;
  const totalCredits = subtotal + droneTransitFee - discountAmount;

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 relative z-10 text-center pb-20">
        <div className="glassmorphism p-16 rounded-2xl border-white/5 max-w-lg mx-auto space-y-6">
          <div className="w-16 h-16 bg-cyan-400/10 border border-cyan-400/20 rounded-full flex items-center justify-center mx-auto text-cyan-400">
            <ShoppingBag className="w-8 h-8 animate-float" />
          </div>
          <h2 className="font-orbitron font-black text-xl tracking-wider text-zinc-300 uppercase">Cart Empty</h2>
          <p className="font-inter text-xs text-zinc-500 leading-relaxed">
            No active nodes loaded. Explore the hardware store page to initialize augmentations.
          </p>
          <button 
            onClick={() => setCurrentPage('shop')}
            className="px-8 py-3 bg-gradient-to-r from-cyan-400 to-purple-600 hover:brightness-125 text-black font-orbitron font-black text-xs uppercase tracking-widest rounded-xl transition-all"
          >
            Access Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white select-none pb-20">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
        
        {/* Header */}
        <div className="text-left border-b border-white/5 pb-6 mb-8">
          <div className="flex items-center space-x-2 text-cyan-400 mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span className="font-orbitron font-extrabold text-[9px] tracking-[0.3em] uppercase">TRANSACTION QUEUE</span>
          </div>
          <h1 className="font-orbitron font-black text-3xl sm:text-5xl uppercase tracking-tight">
            Cart <span className="text-cyan-400 font-normal">Deck</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Items List (takes 8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map(item => (
              <div 
                key={item.id} 
                className="glassmorphism p-4 rounded-xl border-white/5 flex flex-col sm:flex-row items-center justify-between text-left space-y-4 sm:space-y-0"
              >
                
                {/* Thumb + Name */}
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <div className="w-16 h-16 rounded border border-white/10 bg-zinc-950 flex items-center justify-center text-cyan-400 font-bold font-orbitron">
                    {item.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-orbitron text-zinc-500 tracking-wider block uppercase">{item.category}</span>
                    <h3 className="font-orbitron font-bold text-sm text-white truncate tracking-wider">{item.name}</h3>
                    <span className="font-orbitron text-xs text-cyan-400/80">{item.price.toLocaleString()} CR</span>
                  </div>
                </div>

                {/* Adjustments */}
                <div className="flex items-center justify-between sm:justify-end space-x-6 w-full sm:w-auto">
                  
                  {/* Quantity controls */}
                  <div className="flex items-center bg-zinc-950 border border-white/10 rounded-lg p-0.5">
                    <button 
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center font-orbitron text-xs text-zinc-400 hover:text-white"
                    >
                      -
                    </button>
                    <span className="font-orbitron text-xs font-bold text-white px-2">{item.quantity}</span>
                    <button 
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center font-orbitron text-xs text-zinc-400 hover:text-white"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <span className="font-orbitron font-black text-sm text-cyan-400 min-w-[80px] text-right">
                    {(item.price * item.quantity).toLocaleString()} CR
                  </span>

                  {/* Remove Button */}
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
                    title="Evict node from cart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>

              </div>
            ))}
          </div>

          {/* RIGHT: Transaction Summary (takes 4 cols) */}
          <div className="lg:col-span-4 text-left">
            <div className="glassmorphism p-6 rounded-xl border-white/5 space-y-6">
              
              <h3 className="font-orbitron font-extrabold text-xs tracking-widest text-zinc-300 border-b border-white/5 pb-3 uppercase">
                Summary Terminal
              </h3>

              {/* Fee matrix */}
              <div className="space-y-3 font-inter text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Items Credits Subtotal</span>
                  <span className="font-orbitron font-bold text-zinc-200">{subtotal.toLocaleString()} CR</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantum Drone Cargo Fee</span>
                  <span className="font-orbitron font-bold text-zinc-200">{droneTransitFee} CR</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Decentralized Discount (-25%)</span>
                    <span className="font-orbitron font-bold">-{discountAmount.toLocaleString()} CR</span>
                  </div>
                )}
                
                <div className="border-t border-white/5 pt-3 flex justify-between font-orbitron font-black text-sm text-white">
                  <span>NET TOTAL</span>
                  <span className="text-cyan-400 neon-text-cyan">{totalCredits.toLocaleString()} CR</span>
                </div>
              </div>

              {/* Coupon inputs */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <label className="font-orbitron text-[9px] text-zinc-500 tracking-widest uppercase">Inject Promo Code</label>
                <div className="flex space-x-2">
                  <div className="flex-1 bg-zinc-950 border border-white/10 rounded-lg pl-3 pr-2 py-1.5 focus-within:border-cyan-400/40 transition-colors flex items-center">
                    <Tag className="w-3.5 h-3.5 text-zinc-500 mr-2" />
                    <input 
                      type="text" 
                      placeholder="e.g. NEON25" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs text-white font-rajdhani w-full placeholder-zinc-600 uppercase"
                    />
                  </div>
                  <button 
                    onClick={applyCoupon}
                    className="px-4 py-2 bg-[#111] border border-white/10 hover:border-cyan-400/30 text-zinc-300 hover:text-cyan-400 text-xs font-orbitron font-bold rounded-lg transition-all"
                  >
                    Sync
                  </button>
                </div>
                
                {couponApplied && (
                  <div className="text-[9px] font-orbitron text-emerald-400 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>25% CREDIT DISCOUNT DETECTED: NEON25 VALID</span>
                  </div>
                )}
                {couponError && (
                  <div className="text-[9px] font-orbitron text-rose-400">
                    {couponError}
                  </div>
                )}
              </div>

              {/* Checkout link */}
              <button 
                onClick={() => setCurrentPage('checkout')}
                className="w-full py-4 bg-gradient-to-r from-cyan-400 to-purple-600 hover:brightness-125 text-black font-orbitron font-black text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Initialize Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
