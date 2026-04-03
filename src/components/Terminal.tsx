import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Activity, 
  ShieldAlert, 
  History, 
  ArrowLeft,
  LayoutDashboard,
  Zap,
  BarChart3,
  AlertTriangle,
  X,
  Menu
} from 'lucide-react';
import { Symbol, Trade, Challenge, Candle } from '../types';
import { ASSETS, fetchCandles, priceWS, PriceCallback } from '../services/priceService';
import TradingViewWidget from './TradingViewWidget';

interface TerminalProps {
  challenge: Challenge;
  onBack: () => void;
  onBreach: () => void;
  onUpdateChallenge: (challenge: Challenge) => void;
}

const Terminal: React.FC<TerminalProps> = ({ challenge: initialChallenge, onBack, onBreach, onUpdateChallenge }) => {
  const [challenge, setChallenge] = useState<Challenge>(initialChallenge);
  const [trades, setTrades] = useState<Trade[]>(initialChallenge.history || []);
  const [selectedSymbol, setSelectedSymbol] = useState<Symbol>('BTCUSDT');
  const [timeframe, setTimeframe] = useState<string>('1m');
  const [prices, setPrices] = useState<Record<Symbol, number>>({
    'BTCUSDT': 0,
    'ETHUSDT': 0,
    'SOLUSDT': 0,
    'EURUSD': 0,
    'GBPUSD': 0,
    'AUDUSD': 0,
    'USDJPY': 0,
    'USDCAD': 0,
    'USDCHF': 0,
    'NZDUSD': 0,
    'EURGBP': 0,
    'EURJPY': 0,
    'GBPJPY': 0,
    'EURCHF': 0,
    'XAUUSD': 0
  });
  const [candles, setCandles] = useState<Candle[]>([]);
  const [lotSize, setLotSize] = useState(0.1);
  const [stopLossInput, setStopLossInput] = useState<string>('');
  const [takeProfitInput, setTakeProfitInput] = useState<string>('');
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [editSL, setEditSL] = useState<string>('');
  const [editTP, setEditTP] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'TRADING' | 'HISTORY'>('TRADING');
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'CRYPTO' | 'FOREX'>('ALL');

  // Helper to get contract multiplier
  const getMultiplier = (symbol: string) => {
    if (symbol.includes('USDT')) return 1; // Crypto
    if (symbol === 'XAUUSD') return 100; // Gold
    return 100000; // Forex
  };

  // Calculate Margin for a trade
  const calculateMargin = (symbol: Symbol, lot: number, price: number) => {
    return (price * lot * getMultiplier(symbol)) / challenge.leverage;
  };

  // Calculate Total Used Margin
  const usedMargin = trades
    .filter(t => t.status === 'OPEN')
    .reduce((sum, t) => sum + calculateMargin(t.symbol, t.lotSize, t.entryPrice), 0);

  const freeMargin = challenge.currentBalance - usedMargin;
  const marginLevel = usedMargin > 0 ? (challenge.equity / usedMargin) * 100 : 0;

  // Initialize prices and WebSocket
  useEffect(() => {
    const init = async () => {
      const newPrices = { ...prices };
      for (const symbol of ASSETS) {
        const c = await fetchCandles(symbol, timeframe, 1);
        if (c.length > 0) {
          newPrices[symbol] = c[c.length - 1].close;
        }
      }
      setPrices(newPrices);

      // Fetch initial candles for selected symbol
      const initialCandles = await fetchCandles(selectedSymbol, timeframe, 100);
      setCandles(initialCandles);
      
      // Connect WebSocket
      const callback: PriceCallback = (symbol, price, candle) => {
        setPrices(prev => ({ ...prev, [symbol]: price }));
        
        if (symbol === selectedSymbol && candle) {
          setCandles(prev => {
            const last = prev[prev.length - 1];
            if (last && last.time === candle.time) {
              return [...prev.slice(0, -1), candle];
            }
            return [...prev.slice(-99), candle];
          });
        }
      };
      priceWS.connect(ASSETS, callback, timeframe);
      
      return () => priceWS.disconnect(callback);
    };
    init();
  }, [selectedSymbol, timeframe]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isOrderSidebarOpen, setIsOrderSidebarOpen] = useState(false);

  // Update Trades PnL & Check Rules
  useEffect(() => {
    if (!prices || Object.keys(prices).length === 0) return;

    let totalUnrealizedPnl = 0;
    let hasInvalidPrice = false;

    const updatedTrades = trades.map(trade => {
      if (trade.status !== 'OPEN') return trade;
      
      const currentPrice = prices[trade.symbol];
      if (currentPrice === undefined || currentPrice === null || currentPrice === 0) {
        hasInvalidPrice = true;
        return trade;
      }

      let pnl = 0;
      const multiplier = getMultiplier(trade.symbol);
      if (trade.type === 'BUY') {
        pnl = (currentPrice - trade.entryPrice) * trade.lotSize * multiplier;
      } else {
        pnl = (trade.entryPrice - currentPrice) * trade.lotSize * multiplier;
      }
      
      totalUnrealizedPnl += pnl;

      // Check SL/TP
      if (trade.stopLoss && ((trade.type === 'BUY' && currentPrice <= trade.stopLoss) || (trade.type === 'SELL' && currentPrice >= trade.stopLoss))) {
        return { ...trade, status: 'CLOSED' as const, pnl, closePrice: currentPrice };
      }
      if (trade.takeProfit && ((trade.type === 'BUY' && currentPrice >= trade.takeProfit) || (trade.type === 'SELL' && currentPrice <= trade.takeProfit))) {
        return { ...trade, status: 'CLOSED' as const, pnl, closePrice: currentPrice };
      }

      return { ...trade, pnl };
    });

    if (hasInvalidPrice) return;

    // Update Equity
    const newEquity = challenge.currentBalance + totalUnrealizedPnl;
    
    // Check Rules
    const dailyLoss = challenge.maxEquityToday - newEquity;
    const totalLoss = challenge.initialBalance - newEquity;
    const profit = newEquity - challenge.initialBalance;
    
    const dailyThreshold = challenge.initialBalance * (challenge.dailyDrawdown / 100);
    const maxThreshold = challenge.initialBalance * (challenge.maxDrawdown / 100);
    const targetThreshold = challenge.initialBalance * (challenge.profitTarget / 100);

    // Only check breach if we have a valid equity value and it's not the initial state
    if (newEquity > 0) {
      if (dailyLoss > dailyThreshold || totalLoss > maxThreshold) {
        onBreach();
        return;
      }

      if (profit >= targetThreshold) {
        const successChallenge = {
          ...challenge,
          status: 'SUCCESS' as const,
          equity: newEquity,
          currentBalance: newEquity,
          history: updatedTrades.map(t => t.status === 'OPEN' ? { ...t, status: 'CLOSED' as const, closePrice: prices[t.symbol], pnl: t.pnl } : t)
        };
        setChallenge(successChallenge);
        onUpdateChallenge(successChallenge);
        onBack();
        return;
      }
    }

    // Check if any trades were closed by SL/TP
    const closedTrades = updatedTrades.filter((t, i) => t.status === 'CLOSED' && trades[i].status === 'OPEN');
    const balanceGain = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    const newChallenge = {
      ...challenge,
      currentBalance: challenge.currentBalance + balanceGain,
      equity: newEquity,
      maxEquityToday: Math.max(challenge.maxEquityToday, newEquity),
      history: updatedTrades
    };
    
    if (JSON.stringify(newChallenge) !== JSON.stringify(challenge)) {
      setTrades(updatedTrades);
      setChallenge(newChallenge);
      onUpdateChallenge(newChallenge);
    }

  }, [prices, trades, challenge]);

  const [error, setError] = useState<string | null>(null);

  const openTrade = (type: 'BUY' | 'SELL') => {
    const currentPrice = prices[selectedSymbol];
    const newTradeMargin = calculateMargin(selectedSymbol, lotSize, currentPrice);
    
    if (newTradeMargin > freeMargin) {
      setError(`Margin limit reached! Max lots available: ${(freeMargin * challenge.leverage / (currentPrice * getMultiplier(selectedSymbol))).toFixed(2)}`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newTrade: Trade = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: selectedSymbol,
      type,
      lotSize,
      entryPrice: currentPrice,
      stopLoss: stopLossInput ? parseFloat(stopLossInput) : undefined,
      takeProfit: takeProfitInput ? parseFloat(takeProfitInput) : undefined,
      status: 'OPEN',
      pnl: 0,
      timestamp: Date.now()
    };
    const updatedTrades = [newTrade, ...trades];
    setTrades(updatedTrades);
    onUpdateChallenge({ ...challenge, history: updatedTrades });
    
    // Reset inputs
    setStopLossInput('');
    setTakeProfitInput('');
  };

  const modifyTrade = (id: string, sl?: number, tp?: number) => {
    const updatedTrades = trades.map(t => 
      t.id === id ? { ...t, stopLoss: sl, takeProfit: tp } : t
    );
    setTrades(updatedTrades);
    onUpdateChallenge({ ...challenge, history: updatedTrades });
    setEditingTrade(null);
  };

  const closeTrade = (id: string) => {
    const tradeToClose = trades.find(t => t.id === id);
    if (!tradeToClose || tradeToClose.status !== 'OPEN') return;

    const tradePrice = prices[tradeToClose.symbol];
    const updatedTrades = trades.map(t => 
      t.id === id ? { ...t, status: 'CLOSED', closePrice: tradePrice } : t
    );

    const updatedChallenge = { 
      ...challenge, 
      currentBalance: challenge.currentBalance + tradeToClose.pnl,
      history: updatedTrades
    };

    setTrades(updatedTrades);
    setChallenge(updatedChallenge);
    onUpdateChallenge(updatedChallenge);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0b0f1a] text-white flex flex-col font-sans">
      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-xl bg-error text-white font-bold shadow-2xl flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="h-auto min-h-[4rem] border-b border-white/5 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 sm:py-0 bg-primary/50 backdrop-blur-md gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-6">
            <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                <TrendingUp className="text-primary w-5 h-5" />
              </div>
              <span className="text-lg sm:text-xl font-display font-bold tracking-tighter">
                NEBULA<span className="text-accent-blue">TERMINAL</span>
              </span>
            </div>
          </div>
          
          <div className="sm:hidden flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <Activity className="w-3 h-3 text-success" />
            <span className="text-[10px] font-bold text-success uppercase">Active</span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-8 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          <div className="flex flex-col items-start sm:items-end flex-shrink-0">
            <span className="text-[9px] sm:text-[10px] text-white/40 uppercase font-bold tracking-widest">Free Margin</span>
            <span className="text-sm sm:text-lg font-mono font-bold text-accent-blue">${freeMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex flex-col items-start sm:items-end flex-shrink-0">
            <span className="text-[9px] sm:text-[10px] text-white/40 uppercase font-bold tracking-widest">Used Margin</span>
            <span className="text-sm sm:text-lg font-mono font-bold text-white">${usedMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex flex-col items-start sm:items-end flex-shrink-0">
            <span className="text-[9px] sm:text-[10px] text-white/40 uppercase font-bold tracking-widest">Equity</span>
            <span className="text-sm sm:text-lg font-mono font-bold text-white">${challenge.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="hidden sm:block h-8 w-px bg-white/10" />
          <button 
            onClick={() => setIsOrderSidebarOpen(true)}
            className="sm:hidden flex items-center gap-2 px-4 py-2 rounded-full bg-accent-blue/10 border border-accent-blue/20 flex-shrink-0"
          >
            <Zap className="w-4 h-4 text-accent-blue" />
            <span className="text-[10px] font-bold text-accent-blue uppercase">Order</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 flex-shrink-0">
            <Activity className="w-4 h-4 text-success" />
            <span className="text-xs font-bold text-success uppercase">Active Challenge</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex overflow-hidden relative">
        {/* Sidebar - Assets */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 border-r border-white/5 flex flex-col bg-primary transition-transform duration-300 ease-in-out
          sm:relative sm:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest block">Market Watch</span>
              <button onClick={() => setIsSidebarOpen(false)} className="sm:hidden p-1 hover:bg-white/5 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
              {(['ALL', 'CRYPTO', 'FOREX'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setMarketFilter(f)}
                  className={`flex-grow py-1.5 text-[9px] font-black uppercase rounded-md transition-all ${marketFilter === f ? 'bg-accent-blue text-primary' : 'text-white/40 hover:text-white'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-grow overflow-y-auto custom-scrollbar">
            {ASSETS.filter(s => {
              if (marketFilter === 'ALL') return true;
              const isCrypto = s.includes('USDT');
              return marketFilter === 'CRYPTO' ? isCrypto : !isCrypto;
            }).map(symbol => (
              <button
                key={symbol}
                onClick={() => setSelectedSymbol(symbol)}
                className={`w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-l-2 ${selectedSymbol === symbol ? 'border-accent-blue bg-accent-blue/5' : 'border-transparent'}`}
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-sm">{symbol}</span>
                  <span className="text-[10px] text-white/40">{symbol.includes('USDT') ? 'Crypto' : symbol === 'XAUUSD' ? 'Commodity' : 'Forex'}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold">
                    {prices[symbol] > 0 ? prices[symbol].toLocaleString(undefined, { 
                      minimumFractionDigits: symbol.includes('USD') && !symbol.includes('USDT') ? 4 : 2 
                    }) : '---'}
                  </div>
                  <div className={`text-[10px] font-bold ${prices[symbol] > 0 ? 'text-success' : 'text-white/10'}`}>
                    {prices[symbol] > 0 ? '+0.24%' : '---'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Center - Chart & Trading */}
        <div className="flex-grow flex flex-col overflow-hidden relative">
          {/* Mobile Sidebar Toggle */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="sm:hidden absolute top-4 left-4 z-30 p-2 bg-accent-blue/20 backdrop-blur-md border border-accent-blue/30 rounded-lg text-accent-blue"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Chart Header */}
          <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-primary/50 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent-blue" />
                <span className="font-bold tracking-tight">{selectedSymbol}</span>
              </div>
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 overflow-x-auto no-scrollbar max-w-[300px] sm:max-w-none">
                {['1m', '5m', '15m', '30m', '45m', '1h', '2h', '4h', '1d', '1w'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all whitespace-nowrap ${
                      timeframe === tf 
                        ? 'bg-accent-blue text-primary shadow-lg shadow-accent-blue/20' 
                        : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Price</p>
                <p className="font-mono text-sm font-bold text-accent-blue">
                  ${prices[selectedSymbol].toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="flex-grow relative bg-[#0b0f1a]">
            <TradingViewWidget 
              symbol={selectedSymbol} 
              interval={
                timeframe === '1m' ? '1' :
                timeframe === '5m' ? '5' :
                timeframe === '15m' ? '15' :
                timeframe === '30m' ? '30' :
                timeframe === '45m' ? '45' :
                timeframe === '1h' ? '60' :
                timeframe === '2h' ? '120' :
                timeframe === '4h' ? '240' :
                timeframe === '1d' ? 'D' :
                timeframe === '1w' ? 'W' : '1'
              }
            />
          </div>

          {/* Bottom Panel - Trades */}
          <div className="h-64 border-t border-white/5 flex flex-col bg-white/[0.01]">
            <div className="flex items-center border-b border-white/5">
              <button 
                onClick={() => setActiveTab('TRADING')}
                className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'TRADING' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-white/40 hover:text-white'}`}
              >
                Open Positions ({trades.filter(t => t.status === 'OPEN').length})
              </button>
              <button 
                onClick={() => setActiveTab('HISTORY')}
                className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'HISTORY' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-white/40 hover:text-white'}`}
              >
                Trade History
              </button>
            </div>

            <div className="flex-grow overflow-auto no-scrollbar">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="text-white/20 uppercase font-bold sticky top-0 bg-[#0b0f1a] z-10">
                  <tr>
                    <th className="px-6 py-3">Symbol</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Lots</th>
                    <th className="px-6 py-3">Entry</th>
                    <th className="px-6 py-3">TP / SL</th>
                    <th className="px-6 py-3">Current</th>
                    <th className="px-6 py-3">Profit/Loss</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {trades.filter(t => activeTab === 'TRADING' ? t.status === 'OPEN' : t.status === 'CLOSED').map(trade => (
                    <tr key={trade.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold">{trade.symbol}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${trade.type === 'BUY' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono">{trade.lotSize}</td>
                      <td className="px-6 py-4 font-mono">${trade.entryPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 font-mono">
                        <div className="flex flex-col gap-1">
                          <span className="text-success">TP: {trade.takeProfit ? `$${trade.takeProfit.toFixed(2)}` : '---'}</span>
                          <span className="text-error">SL: {trade.stopLoss ? `$${trade.stopLoss.toFixed(2)}` : '---'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono">${prices[trade.symbol].toFixed(2)}</td>
                      <td className={`px-6 py-4 font-mono font-bold ${trade.pnl >= 0 ? 'text-success' : 'text-error'}`}>
                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {trade.status === 'OPEN' && (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingTrade(trade);
                                  setEditSL(trade.stopLoss?.toString() || '');
                                  setEditTP(trade.takeProfit?.toString() || '');
                                }}
                                className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold uppercase transition-colors"
                              >
                                Modify
                              </button>
                              <button 
                                onClick={() => closeTrade(trade.id)}
                                className="px-3 py-1 rounded bg-error/10 hover:bg-error/20 text-error text-[10px] font-bold uppercase transition-colors"
                              >
                                Close
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {trades.filter(t => activeTab === 'TRADING' ? t.status === 'OPEN' : t.status === 'CLOSED').length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-white/20 italic">
                        No {activeTab === 'TRADING' ? 'open positions' : 'trade history'} found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Order Entry & Rules */}
        <aside className={`
          fixed inset-y-0 right-0 z-40 w-80 border-l border-white/5 flex flex-col bg-primary transition-transform duration-300 ease-in-out
          sm:relative sm:translate-x-0
          ${isOrderSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between sm:hidden">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest block">Order Entry</span>
            <button onClick={() => setIsOrderSidebarOpen(false)} className="p-1 hover:bg-white/5 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Order Entry */}
          <div className="p-6 border-b border-white/5">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-6 block">New Order</span>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                  <span className="text-white/40">Lot Size</span>
                  <span className="text-accent-blue">Leverage 1:{challenge.leverage}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setLotSize(Math.max(0.01, lotSize - 0.1))} className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">-</button>
                  <input 
                    type="number" 
                    value={lotSize} 
                    onChange={(e) => setLotSize(parseFloat(e.target.value))}
                    className="flex-grow h-10 bg-white/5 rounded-lg text-center font-mono font-bold focus:outline-none focus:ring-1 focus:ring-accent-blue"
                  />
                  <button onClick={() => setLotSize(lotSize + 0.1)} className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">+</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold uppercase text-white/40 block">Stop Loss</label>
                    <span className="text-[9px] font-mono text-error/60">${prices[selectedSymbol].toFixed(2)}</span>
                  </div>
                  <input 
                    type="number" 
                    placeholder="None"
                    value={stopLossInput}
                    onChange={(e) => setStopLossInput(e.target.value)}
                    className="w-full h-10 bg-white/5 rounded-lg px-4 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-error/50"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold uppercase text-white/40 block">Take Profit</label>
                    <span className="text-[9px] font-mono text-success/60">${prices[selectedSymbol].toFixed(2)}</span>
                  </div>
                  <input 
                    type="number" 
                    placeholder="None"
                    value={takeProfitInput}
                    onChange={(e) => setTakeProfitInput(e.target.value)}
                    className="w-full h-10 bg-white/5 rounded-lg px-4 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-success/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => openTrade('BUY')}
                  className="flex flex-col items-center gap-1 p-4 rounded-xl bg-success/10 border border-success/20 hover:bg-success/20 transition-all group"
                >
                  <TrendingUp className="w-6 h-6 text-success group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase">Buy</span>
                  <span className="text-[10px] font-mono text-success/60">${prices[selectedSymbol].toFixed(2)}</span>
                </button>
                <button 
                  onClick={() => openTrade('SELL')}
                  className="flex flex-col items-center gap-1 p-4 rounded-xl bg-error/10 border border-error/20 hover:bg-error/20 transition-all group"
                >
                  <TrendingDown className="w-6 h-6 text-error group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase">Sell</span>
                  <span className="text-[10px] font-mono text-error/60">${prices[selectedSymbol].toFixed(2)}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Rules & Limits */}
          <div className="p-6 flex-grow overflow-y-auto">
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-6 block">Challenge Rules</span>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold uppercase text-white/60">Profit Target</span>
                  <span className="text-xs font-bold text-accent-blue">10%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent-blue transition-all duration-500" 
                    style={{ width: `${Math.min(100, ((challenge.currentBalance - challenge.initialBalance) / (challenge.initialBalance * 0.1)) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-mono text-white/40">
                  <span>$0</span>
                  <span>${(challenge.initialBalance * 0.1).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold uppercase text-white/60">Daily Drawdown</span>
                  <span className="text-xs font-bold text-error">5%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-error transition-all duration-500" 
                    style={{ width: `${Math.min(100, ((challenge.maxEquityToday - challenge.equity) / (challenge.initialBalance * 0.05)) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-mono text-white/40">
                  <span>Current Loss:</span>
                  <span className="text-error">${Math.max(0, challenge.maxEquityToday - challenge.equity).toFixed(2)}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold uppercase text-white/60">Max Drawdown</span>
                  <span className="text-xs font-bold text-error">10%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-error/50 transition-all duration-500" 
                    style={{ width: `${Math.min(100, ((challenge.initialBalance - challenge.equity) / (challenge.initialBalance * 0.1)) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-mono text-white/40">
                  <span>Limit:</span>
                  <span>${(challenge.initialBalance * 0.9).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-accent-blue/5 border border-accent-blue/10">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-accent-blue flex-shrink-0" />
                <p className="text-[10px] text-white/60 leading-relaxed">
                  Trading rules are monitored in real-time. Any violation will result in an immediate account breach.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </main>
      {/* Modify Trade Modal */}
      <AnimatePresence>
        {editingTrade && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingTrade(null)}
              className="absolute inset-0 bg-primary/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm glass p-8 rounded-3xl border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-tight">Modify Trade</h3>
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{editingTrade.symbol} {editingTrade.type} {editingTrade.lotSize} Lots</p>
                </div>
                <button onClick={() => setEditingTrade(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase text-white/40 mb-2 block">Stop Loss</label>
                  <input 
                    type="number" 
                    value={editSL}
                    onChange={(e) => setEditSL(e.target.value)}
                    className="w-full h-12 bg-white/5 rounded-xl px-4 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-error/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-white/40 mb-2 block">Take Profit</label>
                  <input 
                    type="number" 
                    value={editTP}
                    onChange={(e) => setEditTP(e.target.value)}
                    className="w-full h-12 bg-white/5 rounded-xl px-4 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-success/50"
                  />
                </div>

                <button 
                  onClick={() => {
                    modifyTrade(
                      editingTrade.id, 
                      editSL ? parseFloat(editSL) : undefined, 
                      editTP ? parseFloat(editTP) : undefined
                    );
                  }}
                  className="w-full py-4 rounded-xl bg-accent-blue text-primary font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                >
                  Update Trade
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Terminal;
