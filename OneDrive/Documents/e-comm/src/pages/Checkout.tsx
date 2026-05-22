import { useState, useEffect, Fragment } from 'react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import { 
  CreditCard, Compass, ShieldCheck, Cpu, Terminal, 
  ArrowRight, ArrowLeft, CheckCircle2, Loader2, AlertTriangle
} from 'lucide-react';

export const Checkout = () => {
  const { cart, clearCart, user, setUser, token, trackingCode, setTrackingCode, setCurrentPage } = useApp();
  const [step, setStep] = useState<number>(1);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [syncedGPS, setSyncedGPS] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("neural");
  
  // Card details
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const [authLogs, setAuthLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const discount = subtotal > 1000 ? Math.floor(subtotal * 0.25) : 0; 
  const serviceTax = Math.floor((subtotal - discount) * 0.10);
  const total = subtotal - discount + serviceTax;

  // GPS Coordinates simulation
  const syncGPS = () => {
    setSyncedGPS(true);
    setLatitude("35.6762° N");
    setLongitude("139.6503° E"); // Neo Tokyo Sector
  };

  // Transaction validation terminal animation
  useEffect(() => {
    if (step === 3 && authLogs.length === 0) {
      const logs = [
        "Initializing secure connection...",
        `Validating user credentials (${user?.name || 'Customer'})...`,
        `Connection stable. Mapping delivery destination ${latitude || "35.6762° N"}...`,
        paymentMethod === 'neural' 
          ? "Deducting store credits from account balance..."
          : "Authorizing card payment secure processor...",
        paymentMethod === 'neural'
          ? "Credits payment approved. Preparing delivery package..."
          : "Card payment processed successfully. Syncing account...",
        "Payment finalized. Delivery drone scheduled for dispatch."
      ];
      
      let i = 0;
      const interval = setInterval(() => {
        if (i < logs.length) {
          setAuthLogs(prev => [...prev, `[SYS] ${logs[i]}`]);
          i++;
        } else {
          clearInterval(interval);
        }
      }, 400);

      return () => clearInterval(interval);
    }
  }, [step, user, paymentMethod, latitude]);

  const handleConfirmOrder = async () => {
    if (!token || !user) return;
    setIsProcessing(true);
    setCheckoutError("");

    try {
      // 1. If card, load credits first by creating payment intent & confirming
      if (paymentMethod === 'card') {
        // A. Create intent
        const intentRes = await fetch("http://localhost:5000/api/payments/create-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ amount: total })
        });
        const intentData = await intentRes.json();
        
        if (!intentRes.ok) {
          throw new Error(intentData.error || "PAYMENT GATEWAY REFUSED CONNECTION");
        }

        // B. Clear/Inject credit balance
        const creditRes = await fetch("http://localhost:5000/api/payments/credit-account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ amount: total })
        });
        const creditData = await creditRes.json();
        if (!creditRes.ok) {
          throw new Error(creditData.error || "CREDIT BALANCE INJECTION FAILED");
        }

        // Update local state user credits before order placement
        setUser(prev => prev ? { ...prev, credits: creditData.credits } : null);
      }

      // 2. Submit order to database
      const orderRes = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.id, quantity: i.quantity }))
        })
      });
      const orderData = await orderRes.json();

      if (orderRes.ok) {
        // Deduct user credits locally
        setUser(prev => prev ? { ...prev, credits: orderData.clientCredits } : null);
        setTrackingCode(orderData.order.trackingCode);

        setIsDone(true);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00F5FF', '#8A2BE2', '#FFFFFF']
        });
      } else {
        throw new Error(orderData.error || "ORDER LEDGER SUBMISSION FAULT");
      }

    } catch (err: any) {
      setCheckoutError(err.message || "CHECKOUT TRANSACTION FATAL ERROR");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuccessDone = () => {
    clearCart();
    setCurrentPage('track');
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 relative z-10 text-center pb-20">
        <div className="glassmorphism p-12 rounded-2xl border-purple-500/20 max-w-xl mx-auto space-y-6 flex flex-col items-center">
          <AlertTriangle className="w-12 h-12 text-purple-400 animate-bounce" />
          <h2 className="font-orbitron font-black text-xl tracking-widest text-white uppercase">Login Required</h2>
          <p className="font-inter text-xs text-zinc-400 leading-relaxed max-w-sm">
            Please log in or create an account to proceed with checkout.
          </p>
          <button 
            onClick={() => {
              setCurrentPage('portal');
            }}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-purple-600 text-black font-orbitron font-black text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg neon-border-cyan border border-cyan-400/30"
          >
            Go to Login Page
          </button>
        </div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 relative z-10 text-center pb-20 animate-float">
        <div className="glassmorphism p-12 rounded-2xl border-cyan-400/30 max-w-xl mx-auto space-y-6 text-center neon-border-cyan">
          <div className="w-16 h-16 bg-cyan-400/10 border border-cyan-400/20 rounded-full flex items-center justify-center mx-auto text-cyan-400">
            <CheckCircle2 className="w-10 h-10 animate-pulse-glow" />
          </div>
          <h2 className="font-orbitron font-black text-2xl tracking-widest text-white uppercase neon-text-cyan">Order Confirmed</h2>
          <p className="font-inter text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Payment authorized. Your order has been placed. Delivery drone {trackingCode} is on its way!
          </p>

          {/* Receipt details */}
          <div className="p-4 bg-zinc-950/60 border border-white/5 rounded-lg text-left space-y-2 font-orbitron text-xs">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-zinc-500">ORDER TRACKING ID</span>
              <span className="text-cyan-400 font-extrabold">{trackingCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">DELIVERY GPS COORDINATES</span>
              <span className="text-zinc-300 font-bold">{latitude || "35.6762° N"}, {longitude || "139.6503° E"}</span>
            </div>
            <div className="flex justify-between text-cyan-400 font-black border-t border-white/5 pt-2">
              <span>TOTAL AMOUNT PAID</span>
              <span>{total.toLocaleString()} Credits</span>
            </div>
          </div>

          <button 
            onClick={handleSuccessDone}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-purple-600 hover:brightness-125 text-black font-orbitron font-black text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center space-x-2"
          >
            <span>Track Order</span>
            <ArrowRight className="w-4 h-4" />
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
            <Cpu className="w-4 h-4" />
            <span className="font-orbitron font-extrabold text-[9px] tracking-[0.3em] uppercase">SECURE CHECKOUT</span>
          </div>
          <h1 className="font-orbitron font-black text-3xl sm:text-5xl uppercase tracking-tight">
            Checkout <span className="text-cyan-400 font-normal">Details</span>
          </h1>
        </div>

        {/* Step Progress indicators */}
        <div className="flex items-center justify-between max-w-xl mx-auto mb-10">
          {[1, 2, 3].map(s => (
            <Fragment key={s}>
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-orbitron text-xs font-bold border transition-all ${
                  step === s 
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 neon-border-cyan' 
                    : step > s 
                    ? 'bg-purple-600/20 border-purple-500/40 text-purple-400' 
                    : 'glassmorphism border-white/5 text-zinc-500'
                }`}>
                  {s}
                </div>
                <span className={`font-rajdhani text-xs font-bold uppercase tracking-wider hidden sm:block ${
                  step === s ? 'text-white' : 'text-zinc-500'
                }`}>
                  {s === 1 ? 'Destination' : s === 2 ? 'Payment Method' : 'Order Review'}
                </span>
              </div>
              {s < 3 && <div className={`flex-1 h-[1px] mx-4 border-t border-dashed ${step > s ? 'border-purple-500/40' : 'border-white/5'}`} />}
            </Fragment>
          ))}
        </div>

        <div className="max-w-2xl mx-auto text-left">
          
          {/* STEP 1: DESTINATION COORDINATES */}
          {step === 1 && (
            <div className="glassmorphism p-6 rounded-xl border-white/5 space-y-6">
              <h3 className="font-orbitron font-bold text-sm tracking-wider text-zinc-300 uppercase flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Delivery GPS Coordinates</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-orbitron text-[9px] text-zinc-500 tracking-widest uppercase">LATITUDE</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 35.6762 N" 
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full p-3 bg-zinc-950 border border-white/10 rounded-lg text-xs font-rajdhani font-bold text-white focus:border-cyan-400 focus:outline-none placeholder-zinc-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-orbitron text-[9px] text-zinc-500 tracking-widest uppercase">LONGITUDE</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 139.6503 E" 
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full p-3 bg-zinc-950 border border-white/10 rounded-lg text-xs font-rajdhani font-bold text-white focus:border-cyan-400 focus:outline-none placeholder-zinc-700"
                  />
                </div>
              </div>

              {/* GPS Sync */}
              <button 
                onClick={syncGPS}
                className={`w-full py-3 border font-orbitron font-bold text-xs tracking-wider uppercase rounded-lg transition-all ${
                  syncedGPS 
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                    : 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/10'
                }`}
              >
                {syncedGPS ? 'GPS COORDINATES SET' : 'Use Current GPS Location'}
              </button>

              {/* Navigation button */}
              <button 
                disabled={!latitude || !longitude}
                onClick={() => setStep(2)}
                className="w-full py-4 bg-gradient-to-r from-cyan-400 to-purple-600 hover:brightness-125 disabled:brightness-50 text-black font-orbitron font-black text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center space-x-1.5"
              >
                <span>Save and Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          )}

          {/* STEP 2: PAYMENT METHOD */}
          {step === 2 && (
            <div className="glassmorphism p-6 rounded-xl border-white/5 space-y-6">
              <h3 className="font-orbitron font-bold text-sm tracking-wider text-zinc-300 uppercase flex items-center space-x-1.5">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                <span>Choose Payment Method</span>
              </h3>

              <div className="space-y-3">
                <div 
                  onClick={() => setPaymentMethod("neural")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'neural' 
                      ? 'bg-cyan-500/15 border-cyan-400 neon-border-cyan' 
                      : 'bg-zinc-950/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-orbitron text-xs font-bold text-white uppercase tracking-wider">Account Store Credits</h4>
                      <p className="font-inter text-[10px] text-zinc-500 leading-normal">Deduct payment from your account store credits. (Balance: {user.credits.toLocaleString()} Credits)</p>
                    </div>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentMethod === 'neural' ? 'border-cyan-400' : 'border-zinc-700'}`}>
                    {paymentMethod === 'neural' && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                  </div>
                </div>

                <div 
                  onClick={() => setPaymentMethod("card")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'card' 
                      ? 'bg-cyan-500/15 border-cyan-400 neon-border-cyan' 
                      : 'bg-zinc-950/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-orbitron text-xs font-bold text-white uppercase tracking-wider">Credit / Debit Card</h4>
                      <p className="font-inter text-[10px] text-zinc-500 leading-normal">Pay securely using your credit or debit card.</p>
                    </div>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentMethod === 'card' ? 'border-cyan-400' : 'border-zinc-700'}`}>
                    {paymentMethod === 'card' && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                  </div>
                </div>
              </div>

              {/* Visa details form when card payment is selected */}
              {paymentMethod === 'card' && (
                <div className="p-4 bg-zinc-950/60 border border-white/5 rounded-xl space-y-4 animate-holo-flicker">
                  <span className="font-orbitron text-[9px] text-cyan-400 font-extrabold tracking-widest block uppercase">Card Details</span>
                  
                  <div className="space-y-1">
                    <label className="font-orbitron text-[8px] text-zinc-500 block uppercase">Cardholder Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. V RUNNER"
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                      className="w-full p-2 bg-zinc-900 border border-white/10 rounded text-xs font-rajdhani font-bold focus:border-cyan-400 focus:outline-none placeholder-zinc-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-orbitron text-[8px] text-zinc-500 block uppercase">Card Number</label>
                    <input 
                      type="text" 
                      maxLength={19}
                      placeholder="e.g. 4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      className="w-full p-2 bg-zinc-900 border border-white/10 rounded text-xs font-rajdhani font-bold focus:border-cyan-400 focus:outline-none placeholder-zinc-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-orbitron text-[8px] text-zinc-500 block uppercase">Expiration Date</label>
                      <input 
                        type="text" 
                        maxLength={5}
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value)}
                        className="w-full p-2 bg-zinc-900 border border-white/10 rounded text-xs font-rajdhani font-bold focus:border-cyan-400 focus:outline-none placeholder-zinc-700 text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-orbitron text-[8px] text-zinc-500 block uppercase">Security Code (CVC)</label>
                      <input 
                        type="password" 
                        maxLength={4}
                        placeholder="•••"
                        value={cardCvc}
                        onChange={e => setCardCvc(e.target.value)}
                        className="w-full p-2 bg-zinc-900 border border-white/10 rounded text-xs font-rajdhani font-bold focus:border-cyan-400 focus:outline-none placeholder-zinc-700 text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation button */}
              <div className="flex space-x-3 pt-3">
                <button 
                  onClick={() => setStep(1)}
                  className="py-4 px-6 glassmorphism hover:bg-white/5 border-white/10 text-zinc-400 hover:text-white rounded-xl transition-all flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button 
                  disabled={paymentMethod === 'card' && (!cardName || !cardNumber || !cardExpiry || !cardCvc)}
                  onClick={() => setStep(3)}
                  className="flex-1 py-4 bg-gradient-to-r from-cyan-400 to-purple-600 hover:brightness-125 text-black font-orbitron font-black text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center space-x-1.5"
                >
                  <span>Next: Order Review</span>
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: TRANSACTION TERMINAL AND LOGS */}
          {step === 3 && (
            <div className="glassmorphism p-6 rounded-xl border-white/5 space-y-6">
              
              <h3 className="font-orbitron font-bold text-sm tracking-wider text-zinc-300 uppercase flex items-center space-x-1.5">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Order Verification Terminal</span>
              </h3>

              {/* Animated log terminal */}
              <div className="bg-zinc-950 p-4 rounded-lg border border-white/5 h-44 overflow-y-auto space-y-1.5">
                {authLogs.map((log, idx) => (
                  <div key={idx} className="font-mono text-[10px] text-zinc-400 text-left">
                    {log}
                  </div>
                ))}
                {authLogs.length < 6 && (
                  <div className="flex items-center space-x-2 text-[10px] text-zinc-600 font-mono">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Establishing secure checkout channel...</span>
                  </div>
                )}
              </div>

              {checkoutError && (
                <div className="p-3 border border-rose-500/30 bg-rose-500/10 text-rose-400 rounded-lg text-[9px] font-orbitron tracking-wide text-center uppercase animate-pulse flex items-center justify-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-3">
                <button 
                  onClick={() => {
                    setStep(2);
                    setAuthLogs([]);
                  }}
                  className="py-4 px-6 glassmorphism hover:bg-white/5 border-white/10 text-zinc-400 hover:text-white rounded-xl transition-all flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button 
                  disabled={authLogs.length < 6 || isProcessing}
                  onClick={handleConfirmOrder}
                  className="flex-1 py-4 bg-gradient-to-r from-cyan-400 to-purple-600 hover:brightness-125 disabled:brightness-50 text-black font-orbitron font-black text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center space-x-1.5"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Place Order ({total.toLocaleString()} Credits)</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
