import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Mail, Lock, User, Terminal, ArrowLeft, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';

export const Portal = () => {
  const { login, user, setCurrentPage } = useApp();
  
  // Selection: null (dual selector) | 'client' | 'seller'
  const [selectedChannel, setSelectedChannel] = useState<'client' | 'seller' | null>(null);
  
  // Forms mode: 'login' | 'signup' | 'otp' | 'forgot' | 'reset'
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'otp' | 'forgot' | 'reset'>('login');
  
  // Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtpMsg, setDevOtpMsg] = useState('');

  const resetMessages = () => {
    setError('');
    setSuccess('');
    setDevOtpMsg('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => {
          if (data.user.role === 'seller') {
            setCurrentPage('seller');
          } else if (data.user.role === 'admin') {
            setCurrentPage('admin');
          } else {
            setCurrentPage('shop');
          }
          resetMessages();
        }, 1500);
      } else {
        if (data.unverified) {
          setError(data.error || "Email not verified. Sending verification code...");
          if (data.devOtp) {
            setDevOtpMsg(`[DEV BYPASS] OTP Key: ${data.devOtp}`);
          }
          setAuthMode('otp');
        } else {
          setError(data.error || "Incorrect email or password.");
        }
      }
    } catch (err) {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: selectedChannel })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess("Account created! Please log in.");
        setTimeout(() => {
          setAuthMode('login');
          resetMessages();
        }, 1500);
      } else {
        setError(data.error || "Registration failed. Try a different email.");
      }
    } catch (err) {
      setError("Network connection error.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess("Verification successful! Redirecting to login...");
        setTimeout(() => {
          setAuthMode('login');
          resetMessages();
        }, 1500);
      } else {
        setError(data.error || "Invalid or expired verification code.");
      }
    } catch (err) {
      setError("Verification timeout.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess("Password reset code sent to your email.");
        if (data.devOtp) {
          setDevOtpMsg(`[DEV BYPASS] OTP Key: ${data.devOtp}`);
        }
        setAuthMode('reset');
      } else {
        setError(data.error || "Email address not found.");
      }
    } catch (err) {
      setError("Reset timeout.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess("Password successfully reset! Redirecting to login...");
        setTimeout(() => {
          setAuthMode('login');
          resetMessages();
        }, 1500);
      } else {
        setError(data.error || "Failed to reset password.");
      }
    } catch (err) {
      setError("Password reset error.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSelect = () => {
    setSelectedChannel(null);
    setAuthMode('login');
    resetMessages();
  };

  // If already logged in, show active session panel
  if (user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center relative p-6">
        <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] pointer-events-none z-0">
          <div className="w-full h-full rounded-full glow-radial-purple opacity-20 blur-3xl animate-pulse" />
        </div>
        <div className="relative max-w-md w-full glassmorphism p-8 rounded-2xl border-white/5 text-center space-y-6 z-10 animate-holo-flicker">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center mx-auto border border-cyan-300/30 neon-border-cyan">
            <Cpu className="w-8 h-8 text-black" />
          </div>
          <div>
            <h2 className="font-orbitron font-black text-xl tracking-wider text-white uppercase">Already Logged In</h2>
            <p className="font-rajdhani text-xs text-zinc-500 tracking-widest mt-1 uppercase">Logged in as {user.role}</p>
          </div>
          <div className="p-4 bg-zinc-950/60 border border-white/5 rounded-xl text-left space-y-2">
            <div className="flex justify-between text-xs font-rajdhani">
              <span className="text-zinc-500">ID Key:</span>
              <span className="text-zinc-300 font-bold">{user.name}</span>
            </div>
            <div className="flex justify-between text-xs font-rajdhani">
              <span className="text-zinc-500">Node Email:</span>
              <span className="text-zinc-300 font-bold">{user.email}</span>
            </div>
            <div className="flex justify-between text-xs font-rajdhani">
              <span className="text-zinc-500">Credits:</span>
              <span className="text-cyan-400 font-extrabold">{user.credits.toLocaleString()} CR</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 pt-2">
            {user.role === 'seller' ? (
              <button 
                onClick={() => setCurrentPage('seller')}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:brightness-125 text-white font-orbitron font-black text-xs tracking-wider uppercase rounded-xl transition-all"
              >
                GO TO SELLER PORTAL
              </button>
            ) : user.role === 'admin' ? (
              <button 
                onClick={() => setCurrentPage('admin')}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:brightness-125 text-white font-orbitron font-black text-xs tracking-wider uppercase rounded-xl transition-all"
              >
                GO TO ADMIN PANEL
              </button>
            ) : (
              <button 
                onClick={() => setCurrentPage('shop')}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-125 text-white font-orbitron font-black text-xs tracking-wider uppercase rounded-xl transition-all"
              >
                GO TO SHOPPING PAGE
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 select-none pb-20 pt-10">
      
      {/* Background glow animations */}
      <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] pointer-events-none z-0">
        <div className="w-full h-full rounded-full glow-radial-cyan opacity-20 blur-3xl" />
      </div>
      <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] pointer-events-none z-0">
        <div className="w-full h-full rounded-full glow-radial-purple opacity-20 blur-3xl" />
      </div>

      <div className="max-w-4xl w-full relative z-10">
        
        {/* Selector Grid Mode */}
        {selectedChannel === null ? (
          <div className="space-y-10 animate-fade-in-up">
            
            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className="font-orbitron font-black text-4xl md:text-6xl tracking-tighter text-white uppercase">
                CYBERNETIX <span className="text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text">PORTAL</span>
              </h1>
              <p className="font-rajdhani text-sm text-zinc-500 tracking-[0.25em] uppercase">Select your account type to log in or register</p>
            </div>

            {/* Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              
              {/* Client Terminal Card */}
              <div 
                onClick={() => setSelectedChannel('client')}
                className="group relative cursor-pointer glassmorphism p-8 rounded-2xl border-cyan-500/10 hover:border-cyan-400/40 hover:shadow-cyan-400/10 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between h-[360px]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="space-y-2 text-left">
                    <h3 className="font-orbitron font-black text-xl text-white tracking-wider uppercase">CUSTOMER PORTAL</h3>
                    <p className="font-rajdhani text-sm text-zinc-400 leading-relaxed">
                      Access the marketplace, purchase cyberware, load credits, request live support, and track drone deliveries.
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-cyan-400 text-xs font-orbitron font-bold tracking-widest mt-6">
                  <span>ENTER PORTAL</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>

              {/* Merchant Deck Card */}
              <div 
                onClick={() => setSelectedChannel('seller')}
                className="group relative cursor-pointer glassmorphism p-8 rounded-2xl border-purple-500/10 hover:border-purple-400/40 hover:shadow-purple-400/10 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between h-[360px]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div className="space-y-2 text-left">
                    <h3 className="font-orbitron font-black text-xl text-white tracking-wider uppercase">SELLER PORTAL</h3>
                    <p className="font-rajdhani text-sm text-zinc-400 leading-relaxed">
                      Upload products, track vendor sales, monitor inventory stats, and chat with customers in real-time.
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-purple-400 text-xs font-orbitron font-bold tracking-widest mt-6">
                  <span>ENTER PORTAL</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* Form Login/Signup View */
          <div className="max-w-md mx-auto glassmorphism border-zinc-800 rounded-2xl p-6 sm:p-8 animate-holo-flicker text-left shadow-2xl relative">
            
            {/* Back Button */}
            <button 
              onClick={handleBackToSelect}
              className="absolute top-4 left-4 flex items-center space-x-1.5 text-zinc-500 hover:text-white font-rajdhani text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            {/* Header info */}
            <div className="flex items-center space-x-2 text-cyan-400 mb-6 border-b border-white/5 pb-3 pt-4 justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4" />
                <span className="font-orbitron font-extrabold text-[10px] tracking-[0.25em] uppercase">
                  {selectedChannel === 'client' ? 'Customer Portal' : 'Seller Portal'} //{' '}
                  {authMode === 'login' && 'Secure Login'}
                  {authMode === 'signup' && 'Create Account'}
                  {authMode === 'otp' && 'Verify OTP'}
                  {authMode === 'forgot' && 'Forgot Password'}
                  {authMode === 'reset' && 'Reset Password'}
                </span>
              </div>
            </div>

            {/* Status alerts */}
            {error && (
              <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-rajdhani text-xs font-semibold flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-rajdhani text-xs font-semibold flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}
            {devOtpMsg && (
              <div className="p-3 mb-4 rounded-lg bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 font-mono text-[10px] break-all leading-normal">
                {devOtpMsg}
              </div>
            )}

            {/* Forms switch */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-orbitron text-[9px] text-zinc-500 tracking-wider block uppercase">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                    <input 
                      type="email" 
                      required
                      placeholder={selectedChannel === 'client' ? 'customer@example.com' : 'seller@example.com'} 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-white/10 rounded-lg text-xs font-rajdhani font-bold focus:border-cyan-400 focus:outline-none placeholder-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-orbitron text-[9px] text-zinc-500 tracking-wider block uppercase">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-white/10 rounded-lg text-xs font-rajdhani font-bold focus:border-cyan-400 focus:outline-none placeholder-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="text-right">
                  <button 
                    type="button" 
                    onClick={() => { setAuthMode('forgot'); resetMessages(); }}
                    className="font-rajdhani text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-125 text-white font-orbitron font-black text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center space-x-1.5"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <span>LOG IN</span>}
                </button>

                <div className="text-center font-rajdhani text-xs text-zinc-500 mt-4">
                  Don't have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setAuthMode('signup'); resetMessages(); }}
                    className="text-cyan-400 hover:underline font-bold"
                  >
                    Register
                  </button>
                </div>
              </form>
            )}

            {authMode === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-orbitron text-[9px] text-zinc-500 tracking-wider block uppercase">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. John Doe" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-white/10 rounded-lg text-xs font-rajdhani font-bold focus:border-cyan-400 focus:outline-none placeholder-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-orbitron text-[9px] text-zinc-500 tracking-wider block uppercase">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                    <input 
                      type="email" 
                      required
                      placeholder="customer@example.com" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-white/10 rounded-lg text-xs font-rajdhani font-bold focus:border-cyan-400 focus:outline-none placeholder-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-orbitron text-[9px] text-zinc-500 tracking-wider block uppercase">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                    <input 
                      type="password" 
                      required
                      placeholder="Minimum 6 characters" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-white/10 rounded-lg text-xs font-rajdhani font-bold focus:border-cyan-400 focus:outline-none placeholder-zinc-700 text-white"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-125 text-white font-orbitron font-black text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center space-x-1.5"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <span>CREATE ACCOUNT</span>}
                </button>

                <div className="text-center font-rajdhani text-xs text-zinc-500 mt-4">
                  Already have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setAuthMode('login'); resetMessages(); }}
                    className="text-cyan-400 hover:underline font-bold"
                  >
                    Log In
                  </button>
                </div>
              </form>
            )}

            {authMode === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-orbitron text-[9px] text-zinc-500 tracking-wider block uppercase">Verification Code (OTP)</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                    <input 
                      type="text" 
                      required
                      maxLength={6}
                      placeholder="6-digit verification code" 
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-white/10 rounded-lg text-xs font-rajdhani font-bold focus:border-cyan-400 focus:outline-none placeholder-zinc-700 text-white tracking-widest text-center"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-125 text-white font-orbitron font-black text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <span>VERIFY CODE</span>}
                </button>
              </form>
            )}

            {authMode === 'forgot' && (
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-orbitron text-[9px] text-zinc-500 tracking-wider block uppercase">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                    <input 
                      type="email" 
                      required
                      placeholder="customer@example.com" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-white/10 rounded-lg text-xs font-rajdhani font-bold focus:border-cyan-400 focus:outline-none placeholder-zinc-700 text-white"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-125 text-white font-orbitron font-black text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <span>SEND RESET CODE</span>}
                </button>

                <div className="text-center font-rajdhani text-xs text-zinc-500 mt-4">
                  Remember password?{' '}
                  <button 
                    type="button" 
                    onClick={() => { setAuthMode('login'); resetMessages(); }}
                    className="text-cyan-400 hover:underline font-bold"
                  >
                    Log In
                  </button>
                </div>
              </form>
            )}

            {authMode === 'reset' && (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-orbitron text-[9px] text-zinc-500 tracking-wider block uppercase">Verification Code (OTP)</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                    <input 
                      type="text" 
                      required
                      maxLength={6}
                      placeholder="6-digit verification code" 
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-white/10 rounded-lg text-xs font-rajdhani font-bold focus:border-cyan-400 focus:outline-none placeholder-zinc-700 text-white text-center tracking-widest"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-orbitron text-[9px] text-zinc-500 tracking-wider block uppercase">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                    <input 
                      type="password" 
                      required
                      placeholder="Minimum 6 characters" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-white/10 rounded-lg text-xs font-rajdhani font-bold focus:border-cyan-400 focus:outline-none placeholder-zinc-700 text-white"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-125 text-white font-orbitron font-black text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <span>RESET PASSWORD</span>}
                </button>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
