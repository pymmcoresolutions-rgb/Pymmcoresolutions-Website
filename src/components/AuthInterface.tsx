import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Mail, Lock, User, ArrowRight, 
  Loader2, AlertCircle, CheckCircle2,
  Github, Chrome, Key
} from 'lucide-react';
import Logo from './Logo';

export default function AuthInterface({ onComplete }: { onComplete?: () => void }) {
  const { login, loginWithEmail, registerWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await loginWithEmail(form.email, form.password);
      } else {
        await registerWithEmail(form.email, form.password, {
          name: form.name,
          phone: form.phone,
          address: form.address
        });
      }
      onComplete?.();
    } catch (err: any) {
      console.error("Auth Error:", err);
      let message = 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password. Access denied.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered in the protocol.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters.';
      } else if (err.message?.includes('Missing or insufficient permissions')) {
        message = 'Permission denied. Your account may be restricted or pending initialization.';
      }
      setError(message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login();
      onComplete?.();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setLoading(false);
        return;
      }
      setError('Google authentication failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex justify-center mb-8">
          <Logo size="lg" showText={false} />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            {mode === 'login' ? 'Access Protocol' : 'Initialize Identity'}
          </h2>
          <p className="text-sm text-white/40">
            {mode === 'login' 
              ? 'Enter your credentials to access the PymmCore network.' 
              : 'Create a new administrative identity for the infrastructure hub.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    required
                    type="text"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-teal-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    required
                    type="tel"
                    placeholder="Phone Number"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-teal-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-3">
                    <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <textarea
                    required
                    placeholder="Full Address"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-teal-500 outline-none transition-all text-sm h-24 resize-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              required
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-teal-500 outline-none transition-all text-sm"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              required
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:border-teal-500 outline-none transition-all text-sm"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            {mode === 'login' ? 'Authenticate' : 'Register Identity'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold text-white/20">
            <span className="bg-[#0a0a0a] px-4">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex items-center justify-center gap-3 py-4 bg-white text-black hover:bg-white/90 rounded-xl transition-all text-sm font-bold disabled:opacity-50 shadow-lg shadow-white/10"
          >
            <Chrome className="w-5 h-5" /> Secure Google Authentication
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-xs text-white/40 hover:text-white transition-colors"
          >
            {mode === 'login' 
              ? "Don't have an identity? Initialize one here." 
              : "Already have an identity? Authenticate here."}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
