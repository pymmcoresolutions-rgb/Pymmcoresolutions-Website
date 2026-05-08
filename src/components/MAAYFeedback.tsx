import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';

interface MAAYMessage {
  id: string;
  text: string;
}

let maayNotify: (text: string) => void = () => {};

export function triggerMAAY(text: string) {
  maayNotify(text);
}

export default function MAAYFeedback() {
  const [messages, setMessages] = useState<MAAYMessage[]>([]);

  const notify = useCallback((text: string) => {
    const id = crypto.randomUUID();
    setMessages((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 6000);
  }, []);

  useEffect(() => {
    maayNotify = notify;
  }, [notify]);

  return (
    <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-4 pointer-events-none">
      <AnimatePresence>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="pointer-events-auto bg-black/40 backdrop-blur-xl border border-teal-500/30 rounded-2xl p-4 shadow-2xl shadow-teal-500/10 flex items-start gap-4 max-w-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400">MAAY_ASSISTANT</span>
                <button 
                  onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                  className="text-white/20 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm text-white/80 leading-relaxed font-medium">
                {msg.text}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
