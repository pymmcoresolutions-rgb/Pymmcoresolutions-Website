import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, ShieldCheck, Zap } from 'lucide-react';

export default function SystemHealthIndicator() {
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-6 px-6 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Activity className="w-3 h-3 text-teal-500" />
          <motion.div 
            animate={{ 
              scale: pulse ? [1, 1.5, 1] : 1,
              opacity: pulse ? [0.5, 0, 0.5] : 0.5
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-teal-500 rounded-full blur-[4px]"
          />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Network Nominal</span>
      </div>

      <div className="w-px h-3 bg-white/10" />

      <div className="flex items-center gap-2">
        <ShieldCheck className="w-3 h-3 text-blue-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Shield Integrity 100%</span>
      </div>

      <div className="w-px h-3 bg-white/10" />

      <div className="flex items-center gap-2">
        <Zap className="w-3 h-3 text-amber-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Grid Active</span>
      </div>
    </div>
  );
}
