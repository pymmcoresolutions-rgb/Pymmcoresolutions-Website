import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Send, CheckCircle2, AlertCircle, Sparkles, User, Clock, ChevronRight, Info, Rocket, Globe, Smartphone, Monitor } from 'lucide-react';

export default function WaitlistPortal() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [subscribed, setSubscribed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [pendingApps, setPendingApps] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'apps'), 
      where('status', '!=', 'production'),
      orderBy('status'), // Necessary when using inequality on a field
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching pending apps:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatus('idle');
    
    try {
      // Check if already registered - this might fail for non-admins due to permission rules
      // so we handle it gracefully or skip if permission denied
      try {
        const q = query(collection(db, 'waitlist'), where('email', '==', email.toLowerCase()));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          setStatus('error');
          setMessage('This email is already in our protocol. We will notify you once access is granted.');
          setLoading(false);
          return;
        }
      } catch (err: any) {
        // If we get a permission error here, it's expected for public users
        // We proceed to write; if it's a duplicate, we handle it on the server/later
        console.warn("Duplicate check skipped due to permission restrictions (Expected for non-admins)");
      }

      await addDoc(collection(db, 'waitlist'), {
        email: email.toLowerCase(),
        name: name || 'Anonymous Node',
        subscribed: subscribed,
        targetAppId: selectedApp?.id || 'general',
        createdAt: serverTimestamp()
      });

      setStatus('success');
      setMessage('Access Confirmed! You have been added to the priority waitlist.');
      setEmail('');
      setName('');
    } catch (error: any) {
      console.error("Waitlist registration failed:", error);
      setStatus('error');
      
      if (error.code === 'permission-denied') {
        setMessage('Security Protocol: Registration rejected. Please ensure all fields are valid.');
      } else {
        setMessage('Network failure. Please try again in a few moments.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-20 space-y-20">
      {/* Featured Pending Apps */}
      <section className="space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
            <Clock className="w-3 h-3" /> Coming Soon
          </div>
          <h2 className="text-4xl font-bold tracking-tight">Upcoming Projects</h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Preview the next generation of mobile and web applications currently in development.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {pendingApps.map((app) => (
              <motion.div
                key={app.id}
                layoutId={app.id}
                onClick={() => setSelectedApp(app)}
                className={`group relative p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-teal-500/50 transition-all cursor-pointer overflow-hidden ${
                  selectedApp?.id === app.id ? 'ring-2 ring-teal-500 border-teal-500' : ''
                }`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-teal-400" />
                  </div>
                </div>

                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-400">
                    {app.type === 'Web' && <Globe className="w-6 h-6" />}
                    {app.type === 'Mobile' && <Smartphone className="w-6 h-6" />}
                    {app.type === 'Desktop' && <Monitor className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">{app.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-[8px] font-bold uppercase tracking-[0.2em] text-white/40">
                        {app.type}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-white/40 line-clamp-3 mb-6 leading-relaxed">
                  {app.description}
                </p>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">Launch Date</div>
                    <div className="text-xs text-teal-400 font-bold">{app.expectedLaunchDate || 'Coming Soon'}</div>
                  </div>
                  <div className="px-3 py-1 rounded bg-teal-500/10 text-[9px] font-bold uppercase tracking-widest text-teal-400">
                    {app.status}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {pendingApps.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.02]">
            <Rocket className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Active Pipeline</h3>
            <p className="text-sm text-white/20">All current projects have been successfully deployed to production.</p>
          </div>
        )}
      </section>

      {/* Registration Details Display (if an app is selected) */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl mx-auto p-1 bg-gradient-to-br from-teal-500/20 via-transparent to-purple-500/20 rounded-[3rem]"
          >
            <div className="bg-black/40 rounded-[2.9rem] p-12 relative overflow-hidden">
              <button 
                onClick={() => setSelectedApp(null)}
                className="absolute top-8 right-8 p-2 hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white"
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 text-teal-400">
                      <Info className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Project Details</span>
                    </div>
                    <h3 className="text-5xl font-bold tracking-tighter">{selectedApp.name}</h3>
                    <p className="text-white/60 leading-relaxed italic">"{selectedApp.description}"</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">Category</div>
                      <div className="text-sm font-bold text-white/80">{selectedApp.type} Solution</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">Development Phase</div>
                      <div className="text-sm font-bold text-teal-400 uppercase">{selectedApp.status}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">Target Launch</div>
                      <div className="text-sm font-bold text-blue-400">{selectedApp.expectedLaunchDate || 'TBD'}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">Lead Developer</div>
                      <div className="text-sm font-bold text-white/80">{selectedApp.developer}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8 p-8 rounded-[2rem] bg-white/5 border border-white/10">
                   <div className="text-center space-y-2">
                      <h4 className="text-xl font-bold">Priority Early Access</h4>
                      <p className="text-xs text-white/40">Register for early access to {selectedApp.name}</p>
                   </div>
                   {/* Inline form or just scroll to main form below */}
                   <button 
                    onClick={() => {
                        const form = document.getElementById('waitlist-form');
                        form?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl transition-all"
                   >
                     Start Registration
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Waitlist Portal */}
      <div id="waitlist-form" className="w-full max-w-xl mx-auto p-8 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        <div className="relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> Priority Early Access
          </div>
          
          <h2 className="text-3xl font-bold tracking-tight">
            {selectedApp ? `Register for ${selectedApp.name}` : `Access the Future of Mobile Applications`}
          </h2>
          <p className="text-sm text-white/40 leading-relaxed max-w-md mx-auto">
            Register to receive early access and important updates regarding our upcoming releases.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full Name (Optional)"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:border-teal-500 outline-none transition-all text-sm text-white"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:border-teal-500 outline-none transition-all text-sm text-white"
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
              <span className="text-xs text-white/40 select-none">Subscribe to important product updates</span>
            </div>

            <button
              disabled={loading}
              className="w-full py-4 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-teal-900/40 disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
              Join Waitlist
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

          <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold text-center">
            GDPR Compliant • Instant Unsubscribe Available
          </p>
        </div>
      </div>
    </div>
  );
}
