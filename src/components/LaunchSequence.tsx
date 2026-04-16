import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Sparkles, ArrowRight, ShieldCheck, Zap, Shield } from 'lucide-react';
import AuthInterface from './AuthInterface';

export default function LaunchSequence({ onComplete }: { onComplete: () => void }) {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center py-20">
      <AnimatePresence mode="wait">
        {!showAuth ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="max-w-3xl"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8"
            >
              <Sparkles className="w-3 h-3" /> System Ready
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent"
            >
              Deploy Your Future <br /> 
              <span className="text-blue-500">At Scale.</span>
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-white/60 mb-12 max-w-xl mx-auto leading-relaxed"
            >
              PymmCore is the premium infrastructure hub for global application deployment. 
              Manage, optimize, and scale your nodes with AI-driven precision.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => setShowAuth(true)}
                className="group px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                Launch Protocol <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={onComplete}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all"
              >
                Guest Access
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left"
            >
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <Zap className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="font-bold mb-2">Instant Nodes</h3>
                <p className="text-sm text-white/40">Deploy applications globally in seconds with our optimized container registry.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <ShieldCheck className="w-8 h-8 text-purple-400 mb-4" />
                <h3 className="font-bold mb-2">Secure Protocol</h3>
                <p className="text-sm text-white/40">Enterprise-grade RBAC and data integrity powered by Firebase Security.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <Sparkles className="w-8 h-8 text-pink-400 mb-4" />
                <h3 className="font-bold mb-2">AI Optimization</h3>
                <p className="text-sm text-white/40">Gemini-powered metadata polishing and infrastructure advice.</p>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="auth"
            initial={{ opacity: 0, scale: 1.05, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full"
          >
            <div className="mb-8">
              <button 
                onClick={() => setShowAuth(false)}
                className="text-xs text-white/40 hover:text-white flex items-center gap-2 mx-auto"
              >
                <ArrowRight className="w-3 h-3 rotate-180" /> Back to Overview
              </button>
            </div>
            <AuthInterface onComplete={onComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
