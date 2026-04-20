import { useState } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Send, CheckCircle2, AlertCircle, Sparkles, User } from 'lucide-react';

export default function WaitlistPortal() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [subscribed, setSubscribed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatus('idle');
    
    try {
      // Check if already registered
      const q = query(collection(db, 'waitlist'), where('email', '==', email.toLowerCase()));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        setStatus('error');
        setMessage('Your identity is already registered in the protocol.');
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'waitlist'), {
        email: email.toLowerCase(),
        name: name,
        subscribed: subscribed,
        createdAt: serverTimestamp()
      });

      setStatus('success');
      setMessage('Identity authenticated. You are now on the official waitlist.');
      setEmail('');
      setName('');
    } catch (error) {
      console.error("Waitlist registration failed:", error);
      setStatus('error');
      setMessage('Sync failure. Please check your credentials and try again.');
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-8 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      <div className="relative z-10 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-widest">
          <Sparkles className="w-3 h-3" /> Priority Access Protocol
        </div>
        
        <h2 className="text-3xl font-bold tracking-tight">Access the Future of Mobile Infrastructure</h2>
        <p className="text-sm text-white/40 leading-relaxed max-w-md mx-auto">
          Register your administrative identity to receive early priority access and mission-critical updates regarding our upcoming releases.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full Name (Opt)"
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:border-teal-500 outline-none transition-all text-sm"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Operational Email"
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:border-teal-500 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 py-2">
            <button
              type="button"
              onClick={() => setSubscribed(!subscribed)}
              className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${
                subscribed ? 'bg-teal-600 border-teal-600 text-white' : 'border-white/20'
              }`}
            >
              {subscribed && <CheckCircle2 className="w-3 h-3" />}
            </button>
            <span className="text-xs text-white/40 select-none">Subscribe to mission-critical product updates</span>
          </div>

          <button
            disabled={loading}
            className="w-full py-4 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-teal-900/40 disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
            Authenticate Identity
          </button>
        </form>

        <AnimatePresence>
          {status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-2xl border flex items-center gap-3 text-sm ${
                status === 'success' ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              {status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
          GDPR Compliant • Instant Unsubscribe Available
        </p>
      </div>
    </div>
  );
}
