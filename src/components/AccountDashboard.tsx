import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  LayoutDashboard, 
  TrendingUp, 
  History, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  BarChart3, 
  Calendar,
  Clock,
  Target,
  ArrowRight
} from 'lucide-react';
import { Challenge, Trade } from '../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface AccountDashboardProps {
  challenge: Challenge;
  onBack: () => void;
  onResumeTrading: () => void;
}

const AccountDashboard: React.FC<AccountDashboardProps> = ({ challenge, onBack, onResumeTrading }) => {
  const [activeTab, setActiveTab] = useState<'ACCOUNT' | 'TRADING'>('ACCOUNT');

  // Calculate Stats
  const stats = useMemo(() => {
    const closedTrades = challenge.history.filter(t => t.status === 'CLOSED');
    const totalTrades = closedTrades.length;
    const winningTrades = closedTrades.filter(t => t.pnl > 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const totalLots = closedTrades.reduce((sum, t) => sum + t.lotSize, 0);
    
    const avgWin = winningTrades > 0 
      ? closedTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / winningTrades 
      : 0;
    const avgLoss = (totalTrades - winningTrades) > 0 
      ? closedTrades.filter(t => t.pnl <= 0).reduce((sum, t) => sum + t.pnl, 0) / (totalTrades - winningTrades) 
      : 0;
    
    const profitFactor = Math.abs(avgWin * winningTrades) / Math.max(1, Math.abs(avgLoss * (totalTrades - winningTrades)));

    return {
      totalTrades,
      winRate,
      totalLots,
      avgWin,
      avgLoss,
      profitFactor,
      profit: challenge.currentBalance - challenge.initialBalance
    };
  }, [challenge]);

  // Chart Data
  const chartData = useMemo(() => {
    let current = challenge.initialBalance;
    const data = [{ time: 'Start', balance: challenge.initialBalance, equity: challenge.initialBalance }];
    
    challenge.history.forEach((t, i) => {
      if (t.status === 'CLOSED') {
        current += t.pnl;
        data.push({
          time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          balance: current,
          equity: current
        });
      }
    });
    
    // Add current state
    if (challenge.history.length > 0) {
      data.push({
        time: 'Now',
        balance: challenge.currentBalance,
        equity: challenge.equity
      });
    }

    return data;
  }, [challenge]);

  const dailyDrawdownLimit = challenge.initialBalance * (challenge.dailyDrawdown / 100);
  const currentDailyLoss = Math.max(0, challenge.maxEquityToday - challenge.equity);
  const dailyDrawdownLeft = Math.max(0, dailyDrawdownLimit - currentDailyLoss);
  const dailyDrawdownPercent = (currentDailyLoss / dailyDrawdownLimit) * 100;

  const maxDrawdownLimit = challenge.initialBalance * (challenge.maxDrawdown / 100);
  const currentTotalLoss = Math.max(0, challenge.initialBalance - challenge.equity);
  const maxDrawdownLeft = Math.max(0, maxDrawdownLimit - currentTotalLoss);
  const maxDrawdownPercent = (currentTotalLoss / maxDrawdownLimit) * 100;

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white font-sans selection:bg-accent-blue/30">
      {/* Header */}
      <header className="h-auto min-h-[5rem] border-b border-white/5 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 py-4 sm:py-0 bg-primary/50 backdrop-blur-md sticky top-0 z-50 gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-8">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-lg shadow-accent-blue/20">
              <LayoutDashboard className="text-primary w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-display font-bold tracking-tighter uppercase">{challenge.title}</h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${challenge.status === 'ACTIVE' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                  {challenge.status}
                </span>
              </div>
              <div className="text-[10px] text-white/30 font-mono tracking-widest uppercase">ID: {challenge.id}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-8">
          <div className="text-left sm:text-right">
            <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Account Size</div>
            <div className="text-lg sm:text-xl font-mono font-bold">${challenge.size.toLocaleString()}</div>
          </div>
          <button 
            onClick={onResumeTrading}
            className="btn-primary py-2.5 sm:py-3 px-6 sm:px-8 text-xs sm:text-sm flex items-center gap-2 group"
          >
            Resume <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-2xl w-fit mb-10 border border-white/5 overflow-x-auto max-w-full no-scrollbar">
          <button 
            onClick={() => setActiveTab('ACCOUNT')}
            className={`px-6 sm:px-8 py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'ACCOUNT' ? 'bg-accent-blue text-primary shadow-lg shadow-accent-blue/20' : 'text-white/40 hover:text-white'}`}
          >
            Account Overview
          </button>
          <button 
            onClick={() => setActiveTab('TRADING')}
            className={`px-6 sm:px-8 py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'TRADING' ? 'bg-accent-blue text-primary shadow-lg shadow-accent-blue/20' : 'text-white/40 hover:text-white'}`}
          >
            Trading Overview
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'ACCOUNT' ? (
            <motion.div 
              key="account"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Top Row - Main Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="glass p-6 sm:p-8 rounded-[2rem] border-white/5">
                  <div className="text-white/40 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">Current Balance</div>
                  <div className="text-2xl sm:text-4xl font-mono font-bold">${challenge.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="glass p-6 sm:p-8 rounded-[2rem] border-white/5">
                  <div className="text-white/40 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">Current Equity</div>
                  <div className="text-2xl sm:text-4xl font-mono font-bold text-accent-blue">${challenge.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="glass p-6 sm:p-8 rounded-[2rem] border-white/5 sm:col-span-2 lg:col-span-1">
                  <div className="text-white/40 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">Profit / Loss</div>
                  <div className={`text-2xl sm:text-4xl font-mono font-bold ${stats.profit >= 0 ? 'text-success' : 'text-error'}`}>
                    {stats.profit >= 0 ? '+' : ''}${stats.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Drawdown Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass p-8 rounded-[2rem] border-white/5">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Daily Drawdown Level ({challenge.dailyDrawdown}%)</div>
                      <div className="text-2xl font-mono font-bold text-error">${dailyDrawdownLeft.toLocaleString(undefined, { minimumFractionDigits: 2 })} left</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/20 text-[10px] font-bold uppercase">Limit: ${dailyDrawdownLimit.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${dailyDrawdownPercent}%` }}
                      className="h-full bg-error shadow-[0_0_15px_rgba(255,77,77,0.5)]"
                    />
                  </div>
                </div>

                <div className="glass p-8 rounded-[2rem] border-white/5">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Max Drawdown Level ({challenge.maxDrawdown}%)</div>
                      <div className="text-2xl font-mono font-bold text-error">${maxDrawdownLeft.toLocaleString(undefined, { minimumFractionDigits: 2 })} left</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/20 text-[10px] font-bold uppercase">Limit: ${maxDrawdownLimit.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${maxDrawdownPercent}%` }}
                      className="h-full bg-error/50 shadow-[0_0_15px_rgba(255,77,77,0.3)]"
                    />
                  </div>
                </div>
              </div>

              {/* Trading Stats Grid */}
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { label: "Total Trades", value: stats.totalTrades, icon: <Zap className="w-4 h-4" /> },
                  { label: "Total Lots", value: stats.totalLots.toFixed(2), icon: <BarChart3 className="w-4 h-4" /> },
                  { label: "Win Rate", value: `${stats.winRate.toFixed(1)}%`, icon: <Target className="w-4 h-4" /> },
                  { label: "Profit Factor", value: stats.profitFactor.toFixed(2), icon: <TrendingUp className="w-4 h-4" /> },
                  { label: "Avg Win", value: `$${stats.avgWin.toFixed(2)}`, icon: <ShieldCheck className="w-4 h-4" /> },
                  { label: "Avg Loss", value: `$${stats.avgLoss.toFixed(2)}`, icon: <AlertTriangle className="w-4 h-4" /> },
                  { label: "Start Date", value: new Date(challenge.startDate).toLocaleDateString(), icon: <Calendar className="w-4 h-4" /> },
                  { label: "Trading Days", value: "1 / 30", icon: <Clock className="w-4 h-4" /> },
                ].map((s, i) => (
                  <div key={i} className="glass p-6 rounded-3xl border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-accent-blue">
                      {s.icon}
                    </div>
                    <div>
                      <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest">{s.label}</div>
                      <div className="text-lg font-bold">{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart Section */}
              <div className="glass p-8 rounded-[2rem] border-white/5">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-display font-bold uppercase tracking-tighter">Equity Curve</h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-accent-blue" />
                      <span className="text-xs text-white/40">Equity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-white/20" />
                      <span className="text-xs text-white/40">Balance</span>
                    </div>
                  </div>
                </div>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00F5FF" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00F5FF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} />
                      <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0B0F1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                        itemStyle={{ color: '#00F5FF' }}
                      />
                      <Area type="monotone" dataKey="equity" stroke="#00F5FF" fillOpacity={1} fill="url(#colorEquity)" strokeWidth={3} />
                      <Area type="monotone" dataKey="balance" stroke="rgba(255,255,255,0.2)" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="trading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Trading Summary Cards */}
              <div className="grid md:grid-cols-4 gap-6">
                <div className="glass p-6 rounded-3xl border-white/5">
                  <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">Profit Factor</div>
                  <div className="text-2xl font-bold text-accent-blue">{stats.profitFactor.toFixed(2)}</div>
                </div>
                <div className="glass p-6 rounded-3xl border-white/5">
                  <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">Win Rate</div>
                  <div className="text-2xl font-bold text-success">{stats.winRate.toFixed(1)}%</div>
                </div>
                <div className="glass p-6 rounded-3xl border-white/5">
                  <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">Avg Win</div>
                  <div className="text-2xl font-bold text-success">${stats.avgWin.toFixed(2)}</div>
                </div>
                <div className="glass p-6 rounded-3xl border-white/5">
                  <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">Avg Loss</div>
                  <div className="text-2xl font-bold text-error">${stats.avgLoss.toFixed(2)}</div>
                </div>
              </div>

              {/* Trading History Table */}
              <div className="glass rounded-[2rem] border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-xl font-display font-bold uppercase tracking-tighter">Trading History</h3>
                  <div className="text-xs text-white/40 font-mono">{challenge.history.filter(t => t.status === 'CLOSED').length} Closed Trades</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-white/20 uppercase font-bold text-[10px] tracking-widest">
                      <tr>
                        <th className="px-8 py-4">Ticket</th>
                        <th className="px-8 py-4">Symbol</th>
                        <th className="px-8 py-4">Side</th>
                        <th className="px-8 py-4">Volume</th>
                        <th className="px-8 py-4">Open Time</th>
                        <th className="px-8 py-4">Open Price</th>
                        <th className="px-8 py-4">Close Price</th>
                        <th className="px-8 py-4">PnL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {challenge.history.filter(t => t.status === 'CLOSED').reverse().map((trade) => (
                        <tr key={trade.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-8 py-5 font-mono text-white/40">{trade.id}</td>
                          <td className="px-8 py-5 font-bold">{trade.symbol}</td>
                          <td className="px-8 py-5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${trade.type === 'BUY' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                              {trade.type}
                            </span>
                          </td>
                          <td className="px-8 py-5 font-mono">{trade.lotSize}</td>
                          <td className="px-8 py-5 text-white/40">{new Date(trade.timestamp).toLocaleString()}</td>
                          <td className="px-8 py-5 font-mono">${trade.entryPrice.toFixed(2)}</td>
                          <td className="px-8 py-5 font-mono">${(trade.closePrice || 0).toFixed(2)}</td>
                          <td className={`px-8 py-5 font-mono font-bold ${trade.pnl >= 0 ? 'text-success' : 'text-error'}`}>
                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {challenge.history.filter(t => t.status === 'CLOSED').length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-8 py-20 text-center text-white/20 italic">
                            No trading history available for this account.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AccountDashboard;
