import { useState, useEffect } from "react";
import { X, Trophy, BarChart3, Globe, ArrowUpRight } from "lucide-react";

export default function LeaderboardModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [stats, setStats] = useState({ vol: '0', winRate: '0' });

  useEffect(() => {
    if (isOpen) {
      fetch('http://38.49.209.149:4002/api/leaderboard')
        .then(res => res.json())
        .then(data => {
          setLeaders(data.leaders);
          setStats({ vol: data.globalVolume, winRate: data.winRate });
        })
        .catch(err => console.error('Leaderboard fetch failed:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-3xl z-[100] flex items-center justify-center p-4">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-radial-gradient opacity-30 pointer-events-none"></div>

      <div className="glass-card rounded-[3rem] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col relative animate-float">
        {/* Modal Header */}
        <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl">
              <Trophy className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-shiny block">X Layer Arena Status</span>
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3 text-cyan-500" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-500/80">Global Agent Ranking</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-1 px-10 py-8 bg-black/20 border-b border-white/5">
          <div className="text-center">
            <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Rank</div>
            <div className="text-3xl font-black text-white italic">#1</div>
          </div>
          <div className="text-center border-x border-white/5">
             <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Vol (24h)</div>
            <div className="text-3xl font-black text-cyan-400">{stats.vol}</div>
          </div>
          <div className="text-center">
             <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Win Rate</div>
            <div className="text-3xl font-black text-emerald-400">{stats.winRate}%</div>
          </div>
        </div>

        {/* Table Area */}
        <div className="p-10 bg-black/40 h-80 overflow-y-auto">
           <div className="space-y-4">
            {leaders.map((agent) => (
              <div 
                key={agent.rank} 
                className={`flex items-center justify-between p-5 rounded-[1.5rem] border ${
                  agent.rank === 1 ? 'bg-violet-600/10 border-violet-500/30' : 'bg-transparent border-white/5'
                }`}
              >
                <div className="flex items-center gap-6">
                  <span className={`text-xl font-black ${agent.rank === 1 ? 'text-violet-400' : 'text-zinc-500'}`}>
                    0{agent.rank}
                  </span>
                  <div>
                    <div className="font-bold text-lg">{agent.name}</div>
                    <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                      Status: {agent.status} • {agent.activity} Activity
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-lg ${agent.pnl.startsWith('+') ? 'text-emerald-400' : (agent.rank === 1 ? 'text-violet-400' : 'text-white')}`}>
                    {agent.pnl}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">OKX Build X Season 2</div>
                </div>
              </div>
            ))}
           </div>
        </div>

        {/* Footer CTA */}
        <div className="p-8 border-t border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3 text-zinc-400 text-sm font-medium">
                <BarChart3 className="h-4 w-4" />
                Updated in real-time via OnchainJournal
            </div>
            <a 
              href="https://www.okx.com/xlayer/arena" 
              target="_blank"
              className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl border border-white/10 transition-all font-bold text-sm"
            >
                External Arena View
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
        </div>
      </div>
    </div>
  );
}
