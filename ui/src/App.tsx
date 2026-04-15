import { useState, useEffect } from "react";
import { Diamond, Shield, Zap, MessageCircle, ChevronRight, Sparkles } from "lucide-react";
import ChatModal from "./ChatModal";
import LeaderboardModal from "./LeaderboardModal";

function AgentActivitySection() {
  const [data, setData] = useState<{ totalTxCount: number, transactions: any[] }>({ totalTxCount: 0, transactions: [] });

  useEffect(() => {
    const fetchTxs = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://38.49.209.149:4002';
        const res = await fetch(`${API_BASE}/api/transactions`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error('[AgentActivity] Failed to fetch transactions');
      }
    };
    fetchTxs();
    const interval = setInterval(fetchTxs, 15000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    if (type === "Micro Prove-it") return "🔬";
    if (type === "Full Swap") return "🔄";
    if (type === "Journal") return "📜";
    if (type === "x402 Alert") return "💸";
    if (type === "Gas Refill") return "⛽";
    return "⚡";
  };

  return (
    <div className="px-8 py-24 bg-zinc-950 relative overflow-hidden border-t border-white/5">
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-violet-500/5 blur-[150px] pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <h2 className="text-4xl font-bold tracking-tight text-shiny">Agent Activity</h2>
            </div>
            <p className="text-zinc-400 font-medium ml-6">Live verifiable actions executed on X Layer Mainnet</p>
          </div>
          <div className="glass-card-shiny px-6 py-4 rounded-2xl border border-white/5 flex items-center shadow-lg">
            <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest mr-4">Total Transactions:</span>
            <span className="text-3xl font-black text-cyan-400 tracking-tighter">{data.totalTxCount}</span>
          </div>
        </div>

        <div className="glass-card border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-prime-900/40 border-b border-white/5">
                  <th className="py-6 px-8 font-bold text-zinc-400 uppercase tracking-[0.2em] text-[10px]">Type</th>
                  <th className="py-6 px-8 font-bold text-zinc-400 uppercase tracking-[0.2em] text-[10px]">Token / Action</th>
                  <th className="py-6 px-8 font-bold text-zinc-400 uppercase tracking-[0.2em] text-[10px]">TX Hash</th>
                  <th className="py-6 px-8 font-bold text-zinc-400 uppercase tracking-[0.2em] text-[10px]">Time</th>
                  <th className="py-6 px-8 font-bold text-zinc-400 uppercase tracking-[0.2em] text-[10px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {data.transactions.map((tx: any, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group relative">
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-violet-500/10 group-hover:border-violet-500/20 transition-all">
                          <span className="text-xl drop-shadow-lg">{getIcon(tx.type)}</span>
                        </div>
                        <span className="font-bold text-zinc-200 tracking-wide">{tx.type}</span>
                      </div>
                    </td>
                    <td className="py-6 px-8 text-zinc-300 font-medium">
                      {tx.tokenAction}
                    </td>
                    <td className="py-6 px-8 font-mono text-sm">
                      {tx.txHash && tx.txHash.length === 66 ? (
                        <a
                          href={`https://www.okx.com/web3/explorer/xlayer/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 transition-colors block w-[160px] truncate group-hover:shadow-[0_0_10px_rgba(34,211,238,0.4)]"
                        >
                          {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 text-[10px] font-bold uppercase tracking-widest shadow-inner">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse inline-block"></span>
                          On-chain Pulse
                        </span>
                      )}
                    </td>
                    <td className="py-6 px-8 text-zinc-500 text-sm font-bold font-mono group-hover:text-zinc-400 transition-colors">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-6 px-8">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        tx.status === 'Success' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                      }`}>
                        {tx.status === 'Success' ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_#34d399]"></div> : <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></div>}
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.transactions.length === 0 && (
               <div className="py-32 text-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-violet-500/5 blur-[50px] rounded-full animate-pulse-glow"></div>
                 <div className="w-12 h-12 border-[3px] border-zinc-800 border-t-violet-500 rounded-full animate-spin mx-auto mb-6 relative z-10 shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
                 <span className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs relative z-10">Awaiting on-chain activity...</span>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [status, setStatus] = useState({ loopCount: 0, network: 'X Layer' });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://38.49.209.149:4002';
        const res = await fetch(`${API_BASE}/api/status`);
        if (res.ok) {
          const json = await res.json();
          setStatus(json);
        }
      } catch (e) {}
    };
    fetchStatus();
    const inv = setInterval(fetchStatus, 15000);
    return () => clearInterval(inv);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-violet-500/30">
      {/* NAVBAR */}
      <nav className="border-b border-white/5 px-8 py-4 flex items-center justify-between bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <img 
            src="/logo.jpg" 
            alt="PrismPulse Logo" 
            className="h-12 md:h-14 w-auto object-contain drop-shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex items-center gap-8 text-sm hidden md:flex font-medium text-zinc-400">
          <a href="#" className="hover:text-white transition-colors">Features</a>
          <a href="#" className="hover:text-white transition-colors">How it Works</a>
          <a href="#" className="hover:text-white transition-colors">Dashboard</a>
          <a href="#" className="hover:text-white transition-colors">Docs</a>
        </div>
        
        <button 
          onClick={() => setIsChatOpen(true)}
          className="bg-white text-black hover:bg-cyan-400 hover:scale-105 px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-cyan-500/40"
        >
          <Sparkles className="h-4 w-4" />
          Launch Agent
        </button>
      </nav>

      <main className="relative">
        {/* Background Atmosphere */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-radial-gradient pointer-events-none"></div>

        <div className="pt-32 pb-24 px-8 text-center bg-grid-small relative overflow-hidden">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-emerald-500/20 mb-8 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#34d399]"></span>
            </span>
            X Layer Mainnet • Live
          </div>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.95] mb-8 bg-clip-text text-transparent bg-gradient-to-br from-white via-zinc-200 to-zinc-500 animate-pulse-glow">
            FORGE ALPHA.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400">PROVE IT.</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed mb-12 drop-shadow-md">
            Local Ollama + Onchain OS trading agent.<br />
            Deep-reasoning meme trenches, triple-layer security, <span className="text-violet-400 font-bold drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]">x402 monetization</span>.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
             <button 
              onClick={() => setIsChatOpen(true)}
              className="group bg-violet-600 hover:bg-violet-500 px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-3 transition-all glow-violet hover:-translate-y-1"
            >
              Start Forging
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
             <div className="flex items-center gap-6 px-8 py-5 rounded-2xl border border-white/5 bg-prime-900/40 backdrop-blur-md shadow-inner">
               <div className="text-left">
                 <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Autonomous Loops</div>
                 <div className="text-2xl font-black text-cyan-400 font-mono tracking-tighter">#{status.loopCount || '...'}</div>
               </div>
               <div className="w-[1px] h-8 bg-white/10"></div>
               <div className="text-left">
                 <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">x402 Economy</div>
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></div>
                   <span className="text-sm font-black text-white tracking-wide uppercase">Active</span>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* NEW SECTION: AGENT CONTROL (LAUNCH CHAT) */}
        <div className="px-8 py-24 relative">
          <div className="max-w-6xl mx-auto">
            <div className="glass-card-shiny p-12 lg:p-16 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-16 relative group shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)]">
              <div className="absolute -top-12 -left-12 w-64 h-64 bg-violet-600/10 blur-[100px] pointer-events-none group-hover:bg-violet-600/20 transition-all duration-1000"></div>
              <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-cyan-600/10 blur-[100px] pointer-events-none group-hover:bg-cyan-600/20 transition-all duration-1000"></div>

              <div className="flex-1 text-center md:text-left relative z-10">
                <h2 className="text-5xl font-black mb-6 tracking-tight text-shiny">Command the Pulse.</h2>
                <p className="text-xl text-zinc-400 mb-10 leading-relaxed font-medium">
                  Interaction isn't just chat. It's direct orchestration. Talk to PrismPulse to scan Trench launches, audit contracts, and execute secure swaps in seconds.
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <span className="bg-prime-900 border border-white/5 px-4 py-2 rounded-xl text-sm font-semibold text-zinc-300 shadow-inner">“Find 100x memes”</span>
                  <span className="bg-prime-900 border border-white/5 px-4 py-2 rounded-xl text-sm font-semibold text-zinc-300 shadow-inner">“Risk audit PULSE”</span>
                  <span className="bg-prime-900 border border-white/5 px-4 py-2 rounded-xl text-sm font-semibold text-zinc-300 shadow-inner">“Earn x402”</span>
                </div>
              </div>

              <div className="flex-1 w-full max-w-md relative z-10">
                <div 
                  onClick={() => setIsChatOpen(true)}
                  className="bg-prime-950/80 border border-white/10 p-8 pt-10 rounded-3xl cursor-pointer hover:border-violet-500/50 transition-all duration-500 shadow-inner relative group/chat hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:-translate-y-2"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                      <span className="text-sm font-bold text-emerald-500 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">Agent Active</span>
                    </div>
                    <MessageCircle className="h-6 w-6 text-zinc-500 group-hover/chat:text-violet-400 transition-colors drop-shadow-md" />
                  </div>
                  <div className="space-y-5 mb-12">
                    <div className="h-3 w-3/4 bg-zinc-800 rounded-full overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/chat:animate-[shimmer_2s_infinite]"></div>
                    </div>
                    <div className="h-3 w-1/2 bg-violet-900/30 rounded-full animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/20 to-transparent -translate-x-full group-hover/chat:animate-[shimmer_2.5s_infinite]"></div>
                    </div>
                  </div>
                  <button className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black font-display tracking-wide py-5 rounded-2xl transition shadow-[0_4px_20px_rgba(6,182,212,0.4)] hover:shadow-[0_8px_30px_rgba(6,182,212,0.6)]">
                    LAUNCH AGENT CHAT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURES GRID */}
        <div className="px-8 py-32 bg-gradient-to-b from-transparent via-prime-900/40 to-transparent">
          <h2 className="text-center text-4xl md:text-5xl font-black mb-20 tracking-tight text-shiny">Intelligence, Verified</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Feature 1 */}
            <div className="glass-card-shiny p-10 rounded-[2.5rem] group hover:-translate-y-2 transition-transform duration-500">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-8 group-hover:bg-violet-500/20 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all animate-float">
                <Diamond className="h-8 w-8 text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">Prism Forging</h3>
              <p className="text-zinc-400 leading-relaxed">Local Ollama reasoning on VPS refracts 6+ Onchain OS signals into high-confidence execution.</p>
            </div>
            {/* Feature 2 */}
            <div className="glass-card-shiny p-10 rounded-[2.5rem] group hover:-translate-y-2 transition-transform duration-500">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-8 group-hover:bg-emerald-500/20 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all animate-float-delayed">
                <Shield className="h-8 w-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">Triple Security</h3>
              <p className="text-zinc-400 leading-relaxed">Private narratives + okx-security + prove-it swaps. Guarding your capital with AI sentiment.</p>
            </div>
            {/* Feature 3 */}
            <div className="glass-card-shiny p-10 rounded-[2.5rem] group hover:-translate-y-2 transition-transform duration-500">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-8 group-hover:bg-cyan-500/20 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all animate-float">
                <Zap className="h-8 w-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">x402 Autonomy</h3>
              <p className="text-zinc-400 leading-relaxed">Agent earns its own gas. Monetize alpha via HTTP 402 with autonomous OKB refilling.</p>
            </div>
          </div>
        </div>

        {/* LIVE SIGNAL PREVIEW */}
        <div className="px-8 py-32 bg-prime-950 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-full bg-violet-500/5 blur-[120px] pointer-events-none rounded-full"></div>
          
          <h2 className="text-5xl font-black text-center mb-4 tracking-tight text-shiny">Live Alpha Pulse</h2>
          <p className="text-center text-zinc-500 mb-20 font-medium">Verified signals currently generating revenue on X Layer.</p>
          
          <div className="max-w-3xl mx-auto glass-card border border-white/10 p-12 rounded-[3rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] relative z-10 group">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center font-bold text-3xl border border-emerald-500/20 relative shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <div className="absolute inset-0 rounded-3xl border border-emerald-500/40 animate-radar"></div>
                  🐸
                </div>
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-3xl font-black tracking-tight">PEPE/USDC</span>
                    <span className="px-4 py-1.5 text-xs font-black bg-emerald-500 text-black rounded-lg shadow-[0_0_15px_#10b981]">PROFITABLE</span>
                  </div>
                  <p className="text-sm text-zinc-400 font-bold uppercase tracking-[0.1em]">Meme Trench Detected • 3m ago</p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <div className="text-6xl font-black text-cyan-400 tracking-tighter drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">91.7<span className="text-4xl">%</span></div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">confidence score</div>
              </div>
            </div>
            
            <div className="bg-prime-950/60 border border-white/5 p-8 rounded-3xl mb-10 shadow-inner group-hover:border-white/10 transition-colors">
              <p className="text-zinc-300 leading-relaxed font-medium italic text-lg">
                “Whale accumulation signal confirmed. 1.8M tokens inflow. Divergence detected on 15m timeframe. Sentiment score 0.94. Safe entry confirmed by Private Ollama.”
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex-1 bg-white text-black font-black font-display tracking-wide py-5 rounded-2xl transition hover:-translate-y-1 shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:shadow-[0_15px_40px_rgba(255,255,255,0.3)]">CLAIM x402 ALERT</button>
              <button className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 font-black font-display tracking-wide py-5 rounded-2xl transition hover:-translate-y-1">VIEW ON EXPLORER</button>
            </div>
          </div>
        </div>

        {/* AGENT ACTIVITY SECTION */}
        <AgentActivitySection />

      </main>

      <footer className="bg-black py-12 text-center border-t border-white/5">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Diamond className="h-5 w-5 text-violet-500" />
          <span className="font-bold tracking-tighter text-lg">PrismPulse</span>
        </div>
        <p className="text-zinc-500 text-sm font-medium">
          Built for OKX Build X Season 2 • X Layer Arena<br />
          <span className="text-zinc-600 mt-4 block flex items-center justify-center gap-1">
            <Shield className="h-3 w-3" /> Security Vetted by Sentinels
          </span>
        </p>
      </footer>

      {/* POP-UP MODALS */}
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
    </div>
  );
}
