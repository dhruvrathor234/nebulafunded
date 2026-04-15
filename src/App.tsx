/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Globe, 
  ChevronRight, 
  ArrowRight, 
  BarChart3, 
  Wallet, 
  Cpu,
  Menu,
  X,
  AlertTriangle,
  RefreshCcw,
  User
} from "lucide-react";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { auth } from "./firebase";
import { Challenge } from "./types";
import Terminal from "./components/Terminal";
import AccountDashboard from "./components/AccountDashboard";
import AuthModal from "./components/AuthModal";
import Profile from "./components/Profile";

const HoverScaleText = ({ text, className, characterClassName }: { text: string; className?: string; characterClassName?: string }) => {
  return (
    <span className={`inline-flex flex-wrap justify-center ${className}`}>
      {text.split(" ").map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block whitespace-nowrap mr-[0.25em] last:mr-0">
          {word.split("").map((char, charIndex) => (
            <motion.span
              key={charIndex}
              whileHover={{ 
                scale: 1.3, 
                color: "#00F5FF",
                textShadow: "0 0 8px rgba(0, 245, 255, 0.5)"
              }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
              className={`inline-block cursor-default ${characterClassName}`}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </span>
  );
};

const CandleAnimation = () => {
  const candles = [
    { height: 120, x: 0, color: "bg-accent-blue", delay: 0 },
    { height: 180, x: 60, color: "bg-white/10", delay: 0.2 },
    { height: 100, x: 120, color: "bg-accent-blue", delay: 0.4 },
    { height: 150, x: 180, color: "bg-accent-blue", delay: 0.1 },
    { height: 200, x: 240, color: "bg-white/10", delay: 0.3 },
    { height: 130, x: 300, color: "bg-accent-blue", delay: 0.5 },
  ];

  return (
    <div className="relative w-full max-w-2xl h-[400px] mx-auto flex items-center justify-center">
      <div className="relative flex items-end gap-4 md:gap-8">
        {candles.map((candle, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 50 }}
            animate={{ 
              opacity: 1, 
              y: [0, -20, 0],
            }}
            transition={{
              opacity: { duration: 0.5, delay: candle.delay },
              y: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: candle.delay
              }
            }}
            className="relative flex flex-col items-center"
          >
            {/* Upper Wick */}
            <div className="w-0.5 h-12 bg-white/20 mb-[-4px]" />
            {/* Candle Body */}
            <div 
              className={`w-8 md:w-12 rounded-sm shadow-lg ${candle.color} ${candle.color === 'bg-accent-blue' ? 'shadow-accent-blue/20' : ''}`}
              style={{ height: `${candle.height}px` }}
            />
            {/* Lower Wick */}
            <div className="w-0.5 h-12 bg-white/20 mt-[-4px]" />
          </motion.div>
        ))}
      </div>
      
      {/* Decorative Glow */}
      <div className="absolute inset-0 bg-accent-blue/5 blur-[100px] -z-10 rounded-full" />
    </div>
  );
};

export default function App() {
  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [view, setView] = useState<'LANDING' | 'TERMINAL' | 'BREACHED' | 'DASHBOARD' | 'PROFILE'>('LANDING');
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [userChallenges, setUserChallenges] = useState<Challenge[]>([]);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Load user challenges and transactions from localStorage on mount
  useEffect(() => {
    const savedChallenges = localStorage.getItem('nebula_challenges');
    if (savedChallenges) {
      setUserChallenges(JSON.parse(savedChallenges));
    }
    const savedTransactions = localStorage.getItem('nebula_transactions');
    if (savedTransactions) {
      setUserTransactions(JSON.parse(savedTransactions));
    }
  }, []);

  // Save user challenges and transactions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('nebula_challenges', JSON.stringify(userChallenges));
  }, [userChallenges]);

  useEffect(() => {
    localStorage.setItem('nebula_transactions', JSON.stringify(userTransactions));
  }, [userTransactions]);

  const stats = [
    { label: "Traders Funded", value: "15k+" },
    { label: "Total Payouts", value: "$5M+" },
    { label: "Average Payout Time", value: "24h" },
    { label: "Success Rate", value: "88%" },
  ];

  const challenges = [
    {
      id: "starter-5k",
      title: "Nebula 5K",
      size: 5000,
      price: "$1",
      features: ["10% Profit Target", "5% Daily Drawdown", "10% Max Drawdown", "1:10 Leverage"],
      accent: "from-blue-500/20 to-cyan-500/20",
      profitTarget: 10,
      dailyDrawdown: 5,
      maxDrawdown: 10,
      leverage: 10
    },
    {
      id: "starter-10k",
      title: "Nebula 10K",
      size: 10000,
      price: "$1",
      features: ["10% Profit Target", "5% Daily Drawdown", "10% Max Drawdown", "1:10 Leverage"],
      accent: "from-blue-500/20 to-cyan-500/20",
      profitTarget: 10,
      dailyDrawdown: 5,
      maxDrawdown: 10,
      leverage: 10
    },
    {
      id: "starter-20k",
      title: "Nebula 20K",
      size: 20000,
      price: "$1",
      features: ["10% Profit Target", "5% Daily Drawdown", "10% Max Drawdown", "1:10 Leverage"],
      accent: "from-blue-500/20 to-cyan-500/20",
      profitTarget: 10,
      dailyDrawdown: 5,
      maxDrawdown: 10,
      leverage: 10
    },
    {
      id: "pro-50k",
      title: "Nebula 50K",
      size: 50000,
      price: "$1",
      features: ["8% Profit Target", "5% Daily Drawdown", "12% Max Drawdown", "1:10 Leverage"],
      accent: "from-purple-500/20 to-blue-500/20",
      popular: true,
      profitTarget: 8,
      dailyDrawdown: 5,
      maxDrawdown: 12,
      leverage: 10
    },
    {
      id: "pro-100k",
      title: "Nebula 100K",
      size: 100000,
      price: "$1",
      features: ["8% Profit Target", "5% Daily Drawdown", "12% Max Drawdown", "1:10 Leverage"],
      accent: "from-purple-500/20 to-blue-500/20",
      profitTarget: 8,
      dailyDrawdown: 5,
      maxDrawdown: 12,
      leverage: 10
    },
    {
      id: "elite-150k",
      title: "Nebula 150K",
      size: 150000,
      price: "$1",
      features: ["8% Profit Target", "5% Daily Drawdown", "12% Max Drawdown", "1:10 Leverage"],
      accent: "from-indigo-500/20 to-purple-500/20",
      profitTarget: 8,
      dailyDrawdown: 5,
      maxDrawdown: 12,
      leverage: 10
    },
    {
      id: "elite-200k",
      title: "Nebula 200K",
      size: 200000,
      price: "$1",
      features: ["8% Profit Target", "5% Daily Drawdown", "12% Max Drawdown", "1:10 Leverage"],
      accent: "from-indigo-500/20 to-purple-500/20",
      profitTarget: 8,
      dailyDrawdown: 5,
      maxDrawdown: 12,
      leverage: 10
    }
  ];

  const startChallenge = async (challengeData: any) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!razorpayKeyId) {
      alert("Payment is not configured. Please contact support.");
      return;
    }

    try {
      const postWithFallback = async (
        primaryUrl: string,
        fallbackUrl: string,
        payload: Record<string, unknown>
      ) => {
        const requestConfig: RequestInit = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        };

        const tryRequest = async (url: string) => {
          try {
            const response = await fetch(url, requestConfig);
            const data = await response.json().catch(() => ({}));
            return { response, data };
          } catch {
            return null;
          }
        };

        const primaryResult = await tryRequest(primaryUrl);
        if (primaryResult?.response.ok) {
          return primaryResult.data;
        }

        const fallbackResult = await tryRequest(fallbackUrl);
        if (fallbackResult?.response.ok) {
          return fallbackResult.data;
        }

        const message =
          (fallbackResult?.data as any)?.error ||
          (fallbackResult?.data as any)?.message ||
          (primaryResult?.data as any)?.error ||
          (primaryResult?.data as any)?.message ||
          "Request failed";
        throw new Error(message);
      };

      // 1. Create Order on Server
      const order = await postWithFallback(
        "/api/payment/order",
        "/.netlify/functions/payment-order",
        {
          amount: 1, // All accounts are 1 INR for now
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
        }
      );

      if (!order.id) {
        alert("Failed to create payment order. Please try again.");
        return;
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "Nebula Funded",
        description: `Purchase ${challengeData.title}`,
        order_id: order.id,
        handler: async (response: any) => {
          // 3. Verify Payment on Server
          const verification = await postWithFallback(
            "/api/payment/verify",
            "/.netlify/functions/payment-verify",
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }
          );

          if (verification.success) {
            // 4. Payment Successful - Add Challenge and Transaction
            const newChallenge: Challenge = {
              id: Math.random().toString(36).substr(2, 9),
              title: challengeData.title,
              size: challengeData.size,
              price: challengeData.price,
              profitTarget: challengeData.profitTarget,
              dailyDrawdown: challengeData.dailyDrawdown,
              maxDrawdown: challengeData.maxDrawdown,
              leverage: challengeData.leverage,
              status: 'ACTIVE',
              initialBalance: challengeData.size,
              currentBalance: challengeData.size,
              equity: challengeData.size,
              maxEquityToday: challengeData.size,
              startDate: Date.now(),
              history: []
            };

            const newTransaction = {
              id: Math.random().toString(36).substr(2, 9),
              challengeId: newChallenge.id,
              challengeTitle: newChallenge.title,
              amount: 1,
              currency: "INR",
              status: 'SUCCESS',
              timestamp: Date.now(),
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
            };

            setUserChallenges(prev => [newChallenge, ...prev]);
            setUserTransactions(prev => [newTransaction, ...prev]);
            setActiveChallenge(newChallenge);
            setView('DASHBOARD');
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user.displayName || "",
          email: user.email || "",
        },
        theme: {
          color: "#00F5FF",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert(
        error instanceof Error
          ? `Payment error: ${error.message}`
          : "An error occurred during the payment process."
      );
    }
  };

  const openDashboard = (c: Challenge) => {
    setActiveChallenge(c);
    setView('DASHBOARD');
  };

  const handleBreach = () => {
    if (activeChallenge) {
      setUserChallenges(prev => prev.map(c => 
        c.id === activeChallenge.id ? { ...c, status: 'BREACHED' } : c
      ));
    }
    setView('BREACHED');
  };

  if (view === 'PROFILE' && user) {
    return (
      <Profile 
        user={{ displayName: user.displayName, email: user.email }}
        challenges={userChallenges}
        transactions={userTransactions}
        onBack={() => setView('LANDING')}
        onViewChallenge={(c) => {
          setActiveChallenge(c);
          setView('DASHBOARD');
        }}
      />
    );
  }

  if (view === 'DASHBOARD' && activeChallenge) {
    return (
      <AccountDashboard 
        challenge={activeChallenge}
        onBack={() => setView('LANDING')}
        onResumeTrading={() => setView('TERMINAL')}
      />
    );
  }

  if (view === 'TERMINAL' && activeChallenge) {
    return (
      <Terminal 
        challenge={activeChallenge} 
        onBack={() => setView('DASHBOARD')} 
        onBreach={handleBreach}
        onUpdateChallenge={(updated) => {
          setActiveChallenge(updated);
          setUserChallenges(prev => prev.map(c => c.id === updated.id ? updated : c));
        }}
      />
    );
  }

  if (view === 'BREACHED') {
    return (
      <div className="min-h-screen bg-nebula flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass rounded-[2rem] p-12 text-center border-error/20"
        >
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-8 border border-error/20">
            <AlertTriangle className="w-10 h-10 text-error" />
          </div>
          <h1 className="text-4xl font-display font-bold mb-4 text-error uppercase tracking-tighter">Account Breached</h1>
          <p className="text-white/60 mb-10 leading-relaxed">
            Your account has violated the risk management rules. Daily drawdown or maximum drawdown limit was exceeded.
          </p>
          <button 
            onClick={() => setView('LANDING')}
            className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white/20 font-bold transition-all flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-5 h-5" /> Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nebula selection:bg-accent-blue/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-primary/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-lg shadow-accent-blue/20">
              <TrendingUp className="text-primary w-6 h-6" />
            </div>
            <span className="text-2xl font-display font-bold tracking-tighter">
              NEBULA<span className="text-accent-blue">FUNDED</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <button onClick={() => setView('LANDING')} className="hover:text-accent-blue transition-colors">Home</button>
            <button onClick={() => document.getElementById('challenges')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-accent-blue transition-colors">Challenges</button>
            <button onClick={() => document.getElementById('rules')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-accent-blue transition-colors">Rules</button>
            <button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-accent-blue transition-colors">FAQ</button>
            {user ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setView('PROFILE')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                >
                  <div className="w-6 h-6 rounded-lg bg-accent-blue/20 flex items-center justify-center text-accent-blue group-hover:scale-110 transition-transform">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-white/60 font-mono text-xs">{user.displayName || user.email?.split('@')[0]}</span>
                </button>
                <button onClick={() => signOut(auth)} className="btn-outline py-2 px-6 text-sm">Logout</button>
              </div>
            ) : (
              <button onClick={() => setIsAuthModalOpen(true)} className="btn-outline py-2 px-6 text-sm">Login</button>
            )}
            <button onClick={() => document.getElementById('challenges')?.scrollIntoView({ behavior: 'smooth' })} className="btn-primary py-2 px-6 text-sm">Get Funded</button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-primary pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6 text-xl font-display">
              <button onClick={() => { setView('LANDING'); setIsMenuOpen(false); }} className="text-left">Home</button>
              <button onClick={() => { setIsMenuOpen(false); document.getElementById('challenges')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-left">Challenges</button>
              <button onClick={() => { setIsMenuOpen(false); document.getElementById('rules')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-left">Rules</button>
              <button onClick={() => { setIsMenuOpen(false); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-left">FAQ</button>
              {user && (
                <button onClick={() => { setView('PROFILE'); setIsMenuOpen(false); }} className="text-left text-accent-blue">My Profile</button>
              )}
              <div className="flex flex-col gap-4 mt-8">
                {user ? (
                  <button onClick={() => { setIsMenuOpen(false); signOut(auth); }} className="btn-outline w-full">Logout</button>
                ) : (
                  <button onClick={() => { setIsMenuOpen(false); setIsAuthModalOpen(true); }} className="btn-outline w-full">Login</button>
                )}
                <button onClick={() => { setIsMenuOpen(false); document.getElementById('challenges')?.scrollIntoView({ behavior: 'smooth' }); }} className="btn-primary w-full">Get Funded</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-accent-purple/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-accent-blue/10 rounded-full blur-[120px] animate-pulse-slow" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-accent-blue text-xs font-bold tracking-widest uppercase mb-8 border-accent-blue/20">
              <Cpu className="w-4 h-4" /> AI-DRIVEN PROP FIRM
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-8xl font-display font-bold tracking-tight mb-8 leading-[1.1] cursor-default">
              <HoverScaleText text="Trade with " />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-purple">
                <HoverScaleText text="Nebula" />
              </span>
              <br className="hidden sm:block" />
              <HoverScaleText text="Scale your Future." />
            </h1>
            <p className="text-white/60 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed px-4">
              <HoverScaleText 
                text="Unlock institutional capital with our AI-powered evaluation process. Get funded up to $400,000 and keep up to 90% of your profits." 
              />
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('challenges')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-primary text-lg px-10 py-4 group"
              >
                <HoverScaleText text="Start Challenge" />
                <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="btn-outline text-lg px-10 py-4"
              >
                <HoverScaleText text="View Rules" />
              </motion.button>
            </div>
          </motion.div>

          {/* Animated Candles (Replaced Dashboard Image) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="mt-20 relative"
          >
            <CandleAnimation />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-20 px-6 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-accent-blue mb-2">{stat.value}</div>
              <div className="text-white/40 text-[10px] sm:text-xs uppercase tracking-widest font-bold">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Challenges Section */}
      <section id="challenges" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          {/* Your Challenges */}
          {userChallenges.length > 0 && (
            <div className="mb-32">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-display font-bold mb-2">Your Challenges</h2>
                  <p className="text-white/40 text-sm">Resume your active evaluations or view your history.</p>
                </div>
                <div className="px-4 py-2 rounded-full glass border-white/5 text-xs font-bold text-white/60">
                  {userChallenges.length} Total
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userChallenges.map((c) => (
                  <motion.div
                    key={c.id}
                    whileHover={{ y: -5 }}
                    className={`glass p-6 rounded-3xl border-white/5 relative overflow-hidden group ${c.status === 'BREACHED' ? 'opacity-60 grayscale' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="font-bold text-lg mb-1">{c.title}</h4>
                        <div className="text-[10px] uppercase tracking-widest font-black text-white/30">ID: {c.id}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${c.status === 'ACTIVE' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                        {c.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div>
                        <div className="text-[10px] text-white/40 uppercase font-bold mb-1">Balance</div>
                        <div className="text-lg font-mono font-bold">${c.currentBalance.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-white/40 uppercase font-bold mb-1">Equity</div>
                        <div className="text-lg font-mono font-bold text-accent-blue">${c.equity.toLocaleString()}</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => openDashboard(c)}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${c.status === 'ACTIVE' ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 cursor-not-allowed'}`}
                    >
                      {c.status === 'ACTIVE' ? 'View Dashboard' : 'Account Closed'}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">Choose Your Path</h2>
            <p className="text-white/50 max-w-xl mx-auto">Select the evaluation size that fits your trading style and start your journey to becoming a funded trader.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {challenges.map((challenge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`relative glass p-6 sm:p-8 rounded-[2rem] border-white/10 flex flex-col group hover:border-accent-blue/50 transition-colors ${challenge.popular ? 'ring-2 ring-accent-blue shadow-2xl shadow-accent-blue/10' : ''}`}
              >
                {challenge.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent-blue text-primary text-xs font-black px-4 py-1 rounded-full uppercase tracking-tighter">
                    Most Popular
                  </div>
                )}
                <div className={`absolute inset-0 bg-gradient-to-br ${challenge.accent} opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] -z-10`} />
                
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white/60 mb-2 uppercase tracking-widest">{challenge.title}</h3>
                  <div className="text-5xl font-display font-bold mb-1">${challenge.size.toLocaleString()}</div>
                  <div className="text-accent-blue font-medium">Starting at {challenge.price}</div>
                </div>

                <div className="space-y-4 mb-10 flex-grow">
                  {challenge.features.map((feature, j) => (
                    <div key={j} className="flex items-center gap-3 text-white/70">
                      <ShieldCheck className="w-5 h-5 text-accent-blue flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => startChallenge(challenge)}
                  className={`w-full py-4 rounded-2xl font-bold transition-all ${challenge.popular ? 'bg-accent-blue text-primary' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  Select Challenge
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-6xl font-display font-bold mb-8 leading-tight">
                Built for the <br />
                <span className="text-accent-purple">Modern Trader</span>
              </h2>
              <div className="space-y-8">
                {[
                  { icon: <Zap />, title: "Instant Funding", desc: "Pass the evaluation and get your funded account credentials immediately." },
                  { icon: <BarChart3 />, title: "Advanced Analytics", desc: "Our AI dashboard provides deep insights into your trading performance." },
                  { icon: <Wallet />, title: "Bi-Weekly Payouts", desc: "Get paid every 14 days with no minimum payout requirements." },
                  { icon: <Globe />, title: "Global Access", desc: "Trade from anywhere in the world on institutional-grade platforms." }
                ].map((feature, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-accent-blue group-hover:scale-110 transition-transform flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{feature.title}</h4>
                      <p className="text-white/40 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-accent-blue/20 blur-[100px] rounded-full" />
              <div className="glass rounded-[3rem] p-8 relative overflow-hidden">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent-purple/20 flex items-center justify-center">
                      <TrendingUp className="text-accent-purple" />
                    </div>
                    <div>
                      <div className="text-sm text-white/40">Current Balance</div>
                      <div className="text-2xl font-bold">$105,432.00</div>
                    </div>
                  </div>
                  <div className="text-success font-bold flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> +12.4%
                  </div>
                </div>
                
                <div className="h-64 flex items-end gap-2">
                  {[40, 70, 45, 90, 65, 80, 55, 75, 95, 60].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      transition={{ delay: i * 0.05, duration: 1 }}
                      className="flex-grow bg-gradient-to-t from-accent-blue/20 to-accent-blue rounded-t-lg"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Rules Section */}
      <section id="rules" className="py-32 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 uppercase tracking-tighter">Trading Rules</h2>
            <p className="text-white/40 max-w-2xl mx-auto">Our rules are designed to protect both the firm and the trader, ensuring a sustainable and professional trading environment.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <ShieldCheck className="text-accent-blue" />, title: "Daily Drawdown", desc: "Do not lose more than 5% of your starting balance in a single day." },
              { icon: <ShieldCheck className="text-accent-blue" />, title: "Max Drawdown", desc: "Total account loss cannot exceed 10-12% of the initial balance." },
              { icon: <Zap className="text-accent-blue" />, title: "Profit Target", desc: "Reach the 8-10% profit target to move to the next stage or get funded." },
              { icon: <BarChart3 className="text-accent-blue" />, title: "No Gambling", desc: "Consistent lot sizing and risk management are required." },
              { icon: <Globe className="text-accent-blue" />, title: "News Trading", desc: "Trading during high-impact news is allowed on most plans." },
              { icon: <Cpu className="text-accent-blue" />, title: "AI Monitoring", desc: "Our AI systems monitor for abusive strategies or high-risk behavior." }
            ].map((rule, i) => (
              <div key={i} className="glass p-8 rounded-[2rem] border-white/5">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6">
                  {rule.icon}
                </div>
                <h4 className="text-xl font-bold mb-3">{rule.title}</h4>
                <p className="text-white/40 text-sm leading-relaxed">{rule.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 uppercase tracking-tighter">Frequently Asked</h2>
            <p className="text-white/40">Everything you need to know about Nebula Funded evaluations.</p>
          </div>
          <div className="space-y-4">
            {[
              { q: "How long does the evaluation take?", a: "There are no minimum trading days. You can get funded as soon as you hit the profit target." },
              { q: "What is the profit split?", a: "Traders keep 80% of their profits by default, scalable up to 90%." },
              { q: "Can I trade on weekends?", a: "Crypto trading is available 24/7. Forex and Gold follow standard market hours." },
              { q: "What platforms do you support?", a: "We provide a custom institutional-grade terminal with TradingView integration." },
              { q: "Is there a monthly fee?", a: "No, only a one-time evaluation fee which is refundable upon your first payout." }
            ].map((faq, i) => (
              <details key={i} className="glass rounded-2xl border-white/5 group">
                <summary className="p-6 cursor-pointer font-bold flex justify-between items-center list-none">
                  {faq.q}
                  <ChevronRight className="w-5 h-5 text-accent-blue group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-white/40 text-sm leading-relaxed border-t border-white/5 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto glass rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 -z-10" />
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-8">Ready to Scale?</h2>
          <p className="text-white/60 text-lg mb-12 max-w-2xl mx-auto">
            Join thousands of traders who have already unlocked their potential with Nebula Funded. 
            Your institutional career starts here.
          </p>
          <button className="btn-primary text-xl px-12 py-5 shadow-2xl shadow-accent-blue/20">
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 md:py-20 px-6 border-t border-white/5 bg-primary">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12 md:mb-20">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                <TrendingUp className="text-primary w-6 h-6" />
              </div>
              <span className="text-2xl font-display font-bold tracking-tighter">
                NEBULA<span className="text-accent-blue">FUNDED</span>
              </span>
            </div>
            <p className="text-white/40 max-w-sm leading-relaxed text-sm">
              Nebula Funded is an AI-driven prop firm providing traders with the capital and tools they need to succeed in the global markets.
            </p>
          </div>
          <div>
            <h5 className="font-bold mb-6 text-white/80">Platform</h5>
            <ul className="space-y-4 text-white/40 text-sm">
              <li><button onClick={() => document.getElementById('challenges')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-accent-blue transition-colors">Challenges</button></li>
              <li><button onClick={() => document.getElementById('rules')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-accent-blue transition-colors">Rules</button></li>
              <li><button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-accent-blue transition-colors">FAQ</button></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-6 text-white/80">Support</h5>
            <ul className="space-y-4 text-white/40 text-sm">
              <li><a href="#" className="hover:text-accent-blue transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-accent-blue transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-accent-blue transition-colors">Discord Community</a></li>
              <li><a href="#" className="hover:text-accent-blue transition-colors">Status</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-white/20 text-[10px] uppercase tracking-widest font-bold text-center md:text-left">
          <div>© 2026 Nebula Funded. All rights reserved.</div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Risk Disclosure</a>
          </div>
        </div>
      </footer>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
