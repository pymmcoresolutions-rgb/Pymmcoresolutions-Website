import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Zap, Sparkles, 
  Globe, ArrowRight, ShoppingCart,
  User, Star, X, Info, CheckCircle2, ChevronRight, Activity, Cpu, ShieldCheck,
  Mail, MessageSquare, Info as InfoIcon, Twitter, Facebook, Music2, Instagram, Linkedin
} from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../lib/auth';
import { collection, query, orderBy, onSnapshot, limit, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Logo from './Logo';
import Reviews from './Reviews';
import SystemHealthIndicator from './SystemHealthIndicator';
import ThreeMarketplace from './ThreeMarketplace';
import OnboardingShowcase from './OnboardingShowcase';
import WaitlistPortal from './WaitlistPortal';
import { Skeleton } from './ui/Skeleton';

export default function LandingPage({ 
  onLaunch,
  selectedApp,
  setSelectedApp
}: { 
  onLaunch: () => void;
  selectedApp: any | null;
  setSelectedApp: (app: any | null) => void;
}) {
  const { login, isAdmin } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data());
      }
    });
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    const q = query(
      collection(db, 'apps'), 
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApps(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen text-white selection:bg-cyan-500/30 relative">
      <div className="fixed inset-0 z-0 pointer-events-none" />

      {/* MATRIX HUD OVERLAY */}
      <div className="relative z-10 pointer-events-none min-h-screen flex flex-col font-sans">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 pointer-events-auto">
          <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between border-b border-cyan-500/10 backdrop-blur-md bg-black/20">
            <div className="flex items-center gap-8">
              <Logo size="sm" />
              {isAdmin && (
                <div className="hidden lg:flex items-center gap-6 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                  <SystemHealthIndicator />
                  <div className="w-[1px] h-4 bg-white/10" />
                  <div className="flex items-center gap-2 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                    <Activity className="w-3 h-3" /> System Status: Online
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-6">
              <button 
                onClick={onLaunch}
                className="px-6 py-3 bg-cyan-600/10 border border-cyan-500/50 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-cyan-600 hover:text-white transition-all rounded-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* HERO HUD (Only visible when no app is selected) */}
        <AnimatePresence>
          {!selectedApp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col"
            >
              {/* Hero Section */}
              <motion.main 
                className="min-h-screen flex flex-col justify-center px-6 lg:px-24 w-full max-w-full relative pointer-events-none pt-32"
              >
                <div className="space-y-2 lg:space-y-4 max-w-7xl mx-auto w-full">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-3 px-4 py-1.5 bg-cyan-500/5 border border-cyan-500/20 rounded-full w-fit pointer-events-auto"
                  >
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,1)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400 italic">SECURE_CONNECTION_ACTIVE</span>
                  </motion.div>
                  
                  <h1 className="text-[clamp(2rem,8vw,5rem)] font-black tracking-tighter leading-[0.9] uppercase flex flex-col pointer-events-none mb-4">
                    <motion.span 
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 120, delay: 0.3 }}
                      className="relative"
                    >
                      Pymm
                    </motion.span>
                    <motion.span 
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 120, delay: 0.4 }}
                      className="text-cyan-500 drop-shadow-[0_0_80px_rgba(6,182,212,0.5)] relative z-10"
                    >
                      Core.
                    </motion.span>
                  </h1>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-16 mt-8"
                  >
                    <div className="max-w-md pointer-events-auto">
                      <p className="text-lg lg:text-3xl text-white/40 leading-tight font-light mb-8">
                         <span className="text-white">Modern Software Solutions</span> for premium software delivery. 
                        Deploy your project within the application dashboard.
                      </p>
                      
                      <button 
                        className="w-full sm:w-auto flex items-center justify-center gap-6 px-14 py-8 bg-white text-black font-black uppercase tracking-[0.3em] hover:bg-cyan-400 transition-all group scale-100 active:scale-95 text-xs"
                        onClick={onLaunch}
                      >
                        Explore Applications <ArrowRight className="w-6 h-6 group-hover:translate-x-4 transition-transform duration-500" />
                      </button>
                    </div>

                    <div className="flex flex-row items-center gap-12 border-l border-white/10 pl-12 h-20">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500/50 italic mb-2">Active Applications</span>
                        {loading ? (
                          <Skeleton className="h-10 w-20 rounded-lg" />
                        ) : (
                          <span className="text-4xl font-mono tracking-tighter">{apps.length.toString().padStart(3, '0')}</span>
                        )}
                      </div>
                      <div className="w-[1px] h-full bg-white/10" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20 italic mb-2">Network Status</span>
                        <span className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,1)]" /> Optimized
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.main>

              {/* Onboarding / "Slides" Section */}
              <div className="pointer-events-auto relative z-10 backdrop-blur-3xl border-y border-white/5">
                <div className="max-w-7xl mx-auto py-24 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                    <Sparkles className="w-3 h-3" /> Key Features
                  </div>
                  <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter mb-12">
                    Built for <span className="text-cyan-500 italic">Excellence.</span>
                  </h2>
                </div>
                <OnboardingShowcase />
              </div>

              {/* Quality Guarantee Call to Action */}
              <div className="pointer-events-auto relative z-10 py-12 border-b border-white/5 bg-cyan-500/5">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold uppercase tracking-tighter text-white">Our Quality Commitment</h3>
                    <p className="text-[10px] text-cyan-400 uppercase tracking-[0.3em] font-black italic">Uncompromising standards for every line of code.</p>
                  </div>
                  <button 
                    onClick={() => window.location.hash = '#guidelines'}
                    className="flex items-center gap-4 px-8 py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] hover:bg-cyan-400 transition-all group"
                  >
                    READ OUR FULL QUALITY GUIDELINES <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Reviews Preview Section */}
              <div className="pointer-events-auto relative z-10 py-24 bg-black/20 border-b border-white/5 backdrop-blur-3xl">
                <div className="max-w-7xl mx-auto px-6">
                  <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
                    <div className="space-y-4 text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-[0.3em]">
                        <Star className="w-3 h-3 fill-amber-400" /> User Testimonials
                      </div>
                      <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter">
                        Vetted by the <span className="text-cyan-500 italic">Community.</span>
                      </h2>
                    </div>
                    <button 
                      onClick={() => {
                        onLaunch();
                        setTimeout(() => window.location.hash = '#reviews', 0);
                      }}
                      className="group flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-cyan-400 transition-all border-b border-transparent hover:border-cyan-400 pb-2"
                    >
                      View All Reviews <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  <div onClick={() => {
                    onLaunch();
                    setTimeout(() => window.location.hash = '#reviews', 0);
                  }} className="cursor-pointer text-left">
                    <Reviews minimal={true} />
                  </div>
                </div>
              </div>

              {/* Waitlist Portal Section */}
              <div className="pointer-events-auto relative z-10 py-24 bg-gradient-to-b from-transparent to-black/60">
                <WaitlistPortal />
              </div>

              {/* HUD FOOTER */}
              <footer className="pointer-events-auto mt-auto p-12 lg:px-24 flex flex-col gap-12 border-t border-white/5 backdrop-blur-sm bg-black/60">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 italic">Platform</div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => window.location.hash = '#home'} className="text-xs text-white/40 hover:text-white transition-colors text-left font-bold uppercase tracking-widest">Home</button>
                      <button onClick={onLaunch} className="text-xs text-white/40 hover:text-white transition-colors text-left font-bold uppercase tracking-widest">Catalog</button>
                      <button onClick={() => {
                        onLaunch();
                        setTimeout(() => window.location.hash = '#reviews', 0);
                      }} className="text-xs text-white/40 hover:text-white transition-colors text-left font-bold uppercase tracking-widest">Reviews</button>
                      <button onClick={() => window.location.hash = '#about'} className="text-xs text-white/40 hover:text-white transition-colors text-left font-bold uppercase tracking-widest">About</button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 italic">Legal</div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => window.location.hash = '#terms'} className="text-xs text-white/40 hover:text-white transition-colors text-left font-bold uppercase tracking-widest">Terms</button>
                      <button onClick={() => window.location.hash = '#privacy'} className="text-xs text-white/40 hover:text-white transition-colors text-left font-bold uppercase tracking-widest">Privacy</button>
                      <button onClick={() => window.location.hash = '#security'} className="text-xs text-white/40 hover:text-white transition-colors text-left font-bold uppercase tracking-widest">Security</button>
                      <button onClick={() => window.location.hash = '#guidelines'} className="text-xs text-white/40 hover:text-white transition-colors text-left font-bold uppercase tracking-widest">Guidelines</button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 italic">Resources</div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => window.location.hash = '#docs'} className="text-xs text-white/40 hover:text-white transition-colors text-left font-bold uppercase tracking-widest">Docs</button>
                      <button onClick={() => window.location.hash = '#guidelines'} className="flex items-center gap-2 group text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mt-2">
                        READ OUR FULL QUALITY GUIDELINES <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <Logo size="sm" />
                    <div className="flex gap-4">
                      {settings?.tiktok && (
                        <a href={settings.tiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-cyan-500 transition-all cursor-pointer group">
                          <Music2 className="w-5 h-5 text-white/40 group-hover:text-black" />
                        </a>
                      )}
                      {settings?.instagram && (
                        <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-cyan-500 transition-all cursor-pointer group">
                          <Instagram className="w-5 h-5 text-white/40 group-hover:text-black" />
                        </a>
                      )}
                      {settings?.linkedin && (
                        <a href={settings.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-cyan-500 transition-all cursor-pointer group">
                          <Linkedin className="w-5 h-5 text-white/40 group-hover:text-black" />
                        </a>
                      )}
                      {settings?.twitter && (
                        <a href={settings.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-cyan-500 transition-all cursor-pointer group">
                          <Twitter className="w-5 h-5 text-white/40 group-hover:text-black" />
                        </a>
                      )}
                      {settings?.facebook && (
                        <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-cyan-500 transition-all cursor-pointer group">
                          <Facebook className="w-5 h-5 text-white/40 group-hover:text-black" />
                        </a>
                      )}
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-cyan-500 transition-all cursor-pointer group" onClick={() => window.location.hash = '#contact'}>
                        <Mail className="w-5 h-5 text-white/40 group-hover:text-black" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 pt-12 border-t border-white/5">
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Global Presence</div>
                    <div className="flex gap-4 text-xs font-mono text-cyan-500/40">
                      <span>SEC: 40.7128</span>
                      <span>LOC: -74.0060</span>
                      <span>LVL: 204.5m</span>
                    </div>
                  </div>
                  
                  <div className="max-w-sm lg:text-right">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-loose">
                      System restricted to authorized personnel only. Version 5.0.0 (Latest Release). 
                      All data interactions are securely logged. &copy; 2026 PYMMCORE.
                    </p>
                  </div>
                </div>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DETAIL MODAL OVERLAY (Glassmorphic) */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-end p-6 lg:p-12"
          >
            {/* Backdrop click to close */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedApp(null)} />
            
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-black/60 border-l border-white/10 backdrop-blur-3xl h-full shadow-2xl flex flex-col p-8 lg:p-16 overflow-y-auto overflow-x-hidden scrollbar-hide"
            >
              <button 
                onClick={() => setSelectedApp(null)}
                className="absolute top-12 right-12 p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/40 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="space-y-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                      <Cpu className="w-10 h-10 text-cyan-400" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500">{selectedApp.developer}</div>
                      <h2 className="text-5xl font-black tracking-tighter uppercase">{selectedApp.name}</h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                      ID: {selectedApp.id.slice(0, 8)}
                    </div>
                    <div className="px-3 py-1 bg-white/5 border border-white/10 text-white/40 text-[10px] font-bold uppercase tracking-widest rounded-full">
                      Version: {selectedApp.version || '1.0.0'}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-cyan-500/50">
                    <Info className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Platform Information</span>
                  </div>
                  <p className="text-xl text-white/60 leading-relaxed font-light italic">
                    "{selectedApp.description}"
                  </p>
                </div>

                {selectedApp.features && selectedApp.features.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-cyan-500/50">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Key Benefits</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {selectedApp.features.map((f: string, i: number) => (
                        <div key={i} className="group flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-cyan-500/5 hover:border-cyan-500/20 transition-all">
                          <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0" />
                          <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors uppercase tracking-wide">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Risk Score Mockup */}
                <div className="p-8 rounded-[2rem] bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <ShieldCheck className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Verified Security Scan</span>
                    </div>
                    <div className="text-2xl font-mono text-cyan-400">98%</div>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '98%' }}
                      className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(0,255,255,0.8)]"
                    />
                  </div>
                </div>

                <div className="pt-12 border-t border-white/10">
                  <button 
                    onClick={onLaunch}
                    className="w-full py-6 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-2xl shadow-cyan-500/20 flex items-center justify-center gap-4 group"
                  >
                    Open Application <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
