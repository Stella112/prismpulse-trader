import { X, Diamond, Sparkles, Activity } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function ChatModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "agent", content: "💠 PRISM PULSE ONLINE. \nAutonomous reasoning engine active on X Layer Mainnet. \nHow shall we forge alpha today, Commander?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendCommand = async () => {
    if (!input.trim() || isTyping) return;
    const currentInput = input;
    setMessages(prev => [...prev, { role: "user", content: currentInput }]);
    setInput("");
    setIsTyping(true);
    
    try {
      console.log(`[Chat] Sending command to backend: "${currentInput}"...`);
      const response = await fetch(`http://${window.location.hostname}:4002/api/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: currentInput })
      });
      console.log(`[Chat] Received response with status:`, response.status);
      
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { 
          role: "agent", 
          content: data.reply || `REASONING SYNCED. \n\nPulse detected. Confidence: 87.4%. \nExecution path optimized for X Layer.` 
        }]);
      } else {
        throw new Error('Backend link severed');
      }
    } catch (e) {
      setMessages(prev => [...prev, { 
        role: "agent", 
        content: "⚠️ SYSTEM CRITICAL: Backend connectivity failure. \nPlease ensure the PrismPulse brain is running on the VPS." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[100] flex flex-col">
      <div className="flex-1 flex flex-col relative overflow-hidden h-screen">
        {/* Modal Header */}
        <div className="px-10 py-7 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-violet-600/20 rounded-2xl shadow-inner border border-violet-500/20">
              <Diamond className="h-7 w-7 text-violet-400" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-shiny block leading-none mb-1">BRAIN PERIPHERAL</span>
              <div className="flex items-center gap-2">
                <Activity className="h-3 w-3 text-emerald-500" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-500">Mainnet • High-Fi</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all border border-transparent hover:border-white/5"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Chat Messages */}
        <div ref={scrollRef} className="flex-1 p-10 md:p-20 overflow-y-auto space-y-12 bg-black/20 scrollbar-hide">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`relative max-w-[85%] rounded-[2.2rem] px-8 py-6 shadow-2xl ${
                msg.role === "user" 
                  ? "bg-violet-600 text-white font-extrabold text-xl shadow-violet-500/20" 
                  : "glass-card border-white/10 text-zinc-100 text-xl leading-relaxed font-bold tracking-tight shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
              }`}>
                {msg.role === "agent" && (
                  <div className="absolute -top-3 -left-3 bg-zinc-900 border border-white/10 p-1.5 rounded-lg">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                  </div>
                )}
                <span className="whitespace-pre-wrap block leading-snug">{msg.content}</span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start animate-pulse">
               <div className="glass-card border-white/10 rounded-[2rem] px-8 py-4 text-cyan-400 font-black text-xl italic tracking-tighter">
                  REFRACTING PRISMS...
               </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-10 border-t border-white/10 bg-white/5 flex gap-5">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === "Enter" && sendCommand()}
            placeholder="Command your agent (e.g., 'Trade top memes')..."
            className="max-w-4xl mx-auto flex-1 bg-black/60 border border-white/20 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 rounded-2xl px-10 py-7 outline-none text-white transition-all shadow-inner text-2xl font-bold placeholder:text-zinc-600"
          />
          <button 
            onClick={sendCommand}
            disabled={isTyping}
            className="bg-white text-black hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-600 px-12 rounded-[1.8rem] font-black text-xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 hover:scale-[1.05]"
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
}
