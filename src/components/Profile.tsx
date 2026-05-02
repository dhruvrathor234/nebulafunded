import React from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  ShieldCheck, 
  Lock, 
  ChevronRight, 
  Trophy, 
  AlertCircle,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { Challenge } from '../types';

interface ProfileProps {
  user: {
    displayName: string | null;
    email: string | null;
  };
  challenges: Challenge[];
  onBack: () => void;
  onViewChallenge: (challenge: Challenge) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, challenges, onBack, onViewChallenge }) => {
  const hasPassedChallenge = challenges.some(c => c.status === 'SUCCESS');
  const activeChallenges = challenges.filter(c => c.status === 'ACTIVE');
  const completedChallenges = challenges.filter(c => c.status !== 'ACTIVE');

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white font-sans selection:bg-accent-blue/30 pb-20">
      {/* Header */}
      <header className="h-auto min-h-[5rem] border-b border-white/5 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 py-4 sm:py-0 bg-primary/50 backdrop-blur-md sticky top-0 z-50 gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-8">
          <div className="flex items-center gap-4 sm:gap-8">
            <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-lg shadow-accent-blue/20">
                <User className="text-primary w-6 h-6" />
              </div>
              <h1 className="text-lg sm:text-xl font-display font-bold tracking-tighter uppercase">User Profile</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: User Info & KYC */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-8">
            <div className="glass p-6 sm:p-8 rounded-[2.5rem] border-white/5 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center mx-auto mb-6 border border-white/10">
                <User className="w-12 h-12 text-accent-blue" />
              </div>
              <h2 className="text-2xl font-bold mb-1">{user.displayName || 'Nebula Trader'}</h2>
              <p className="text-white/40 text-sm font-mono mb-6">{user.email}</p>
              <div className="flex justify-center gap-4">
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-white/20 uppercase font-bold tracking-widest mb-1">Status</div>
                  <div className="text-xs font-bold text-accent-blue">PRO TRADER</div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-white/20 uppercase font-bold tracking-widest mb-1">Joined</div>
                  <div className="text-xs font-bold text-white/60">APR 2026</div>
                </div>
              </div>
            </div>

            {/* KYC Section */}
            <div className="glass p-8 rounded-[2.5rem] border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold uppercase tracking-tighter">KYC Verification</h3>
                {hasPassedChallenge ? (
                  <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-black uppercase">Eligible</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/20 text-[10px] font-black uppercase">Locked</span>
                )}
              </div>

              <div className={`relative p-6 rounded-2xl border transition-all ${hasPassedChallenge ? 'bg-success/5 border-success/20' : 'bg-white/5 border-white/5 opacity-60'}`}>
                {!hasPassedChallenge && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/40 backdrop-blur-[2px] rounded-2xl z-10">
                    <div className="text-center">
                      <Lock className="w-8 h-8 text-white/40 mx-auto mb-2" />
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Pass a challenge to unlock</div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${hasPassedChallenge ? 'bg-success/20 text-success' : 'bg-white/10 text-white/20'}`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Identity Verification</h4>
                    <p className="text-xs text-white/40 leading-relaxed mb-4">Complete your KYC to enable withdrawals and receive your funded account credentials.</p>
                    <button 
                      disabled={!hasPassedChallenge}
                      className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${hasPassedChallenge ? 'bg-success text-primary hover:shadow-lg hover:shadow-success/20' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                    >
                      Start Verification
                    </button>
                  </div>
                </div>
              </div>

              {!hasPassedChallenge && (
                <div className="mt-6 p-4 bg-accent-blue/5 border border-accent-blue/10 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-accent-blue flex-shrink-0" />
                  <p className="text-[10px] text-white/40 leading-relaxed uppercase font-bold">
                    KYC is only required after passing your first evaluation stage. Focus on your trading!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Challenges List */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Challenges */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-bold uppercase tracking-tighter">Active Evaluations</h3>
                <span className="text-xs text-white/40 font-mono">{activeChallenges.length} Active</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeChallenges.map((c) => (
                  <motion.div
                    key={c.id}
                    whileHover={{ y: -5 }}
                    onClick={() => onViewChallenge(c)}
                    className="glass p-6 rounded-3xl border-white/5 cursor-pointer group hover:border-accent-blue/30 transition-all"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="font-bold text-lg mb-1">{c.title}</h4>
                        <div className="text-[10px] uppercase tracking-widest font-black text-white/30">ID: {c.id}</div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue group-hover:scale-110 transition-transform">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="text-[10px] text-white/40 uppercase font-bold mb-1">Balance</div>
                        <div className="text-lg font-mono font-bold">${c.currentBalance.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-white/40 uppercase font-bold mb-1">Equity</div>
                        <div className="text-lg font-mono font-bold text-accent-blue">${c.equity.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent-blue shadow-[0_0_10px_rgba(0,245,255,0.5)]" 
                        style={{ width: `${Math.min(100, (c.currentBalance / c.size) * 100)}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
                {activeChallenges.length === 0 && (
                  <div className="col-span-2 glass p-12 rounded-3xl border-white/5 text-center">
                    <div className="text-white/20 italic mb-4">No active evaluations found.</div>
                    <button className="text-accent-blue text-xs font-bold uppercase tracking-widest hover:underline">Start a new challenge</button>
                  </div>
                )}
              </div>
            </div>

            {/* Completed / History */}
            <div>
              <h3 className="text-xl font-display font-bold uppercase tracking-tighter mb-6">Evaluation History</h3>
              <div className="glass rounded-[2rem] border-white/5 overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-sm min-w-[600px]">
                    <thead className="bg-white/5 text-white/20 uppercase font-bold text-[10px] tracking-widest">
                      <tr>
                        <th className="px-8 py-4">Challenge</th>
                        <th className="px-8 py-4">Account Size</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4">Final Balance</th>
                        <th className="px-8 py-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {completedChallenges.map((c) => (
                        <tr key={c.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-8 py-5">
                            <div className="font-bold">{c.title}</div>
                            <div className="text-[10px] text-white/30 font-mono">{c.id}</div>
                          </td>
                          <td className="px-8 py-5 font-mono text-white/60">${c.size.toLocaleString()}</td>
                          <td className="px-8 py-5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${c.status === 'SUCCESS' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 font-mono">${c.currentBalance.toLocaleString()}</td>
                          <td className="px-8 py-5">
                            <button 
                              onClick={() => onViewChallenge(c)}
                              className="text-accent-blue hover:text-white transition-colors"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {completedChallenges.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-8 py-10 text-center text-white/20 italic">
                            No completed challenges yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
