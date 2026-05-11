import { motion, AnimatePresence } from 'motion/react';
import { Home, Rocket, Shield, Cpu, Globe, LayoutDashboard, LogOut, Menu, X, Sparkles, Bell, Award, Mail, Star, Loader2, DollarSign, Twitter, Facebook, Linkedin } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Notifications from './Notifications';
import Logo from './Logo';
import GlobalBackground from './GlobalBackground';
import MAAYFeedback from './MAAYFeedback';

export default function Layout({ children, currentPath, onNavigate }: { children: React.ReactNode, currentPath?: string, onNavigate?: (path: string) => void }) {
  const { user, profile, isAdmin, isEditor, login, logout, loginLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data());
      }
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { id: '#home', label: 'Home', icon: Home },
    { id: '#', label: 'Storefront', icon: Globe },
    { id: '#about', label: 'About', icon: Award },
    { id: '#reviews', label: 'Reviews', icon: Star },
    { id: '#pricing', label: 'Pricing', icon: DollarSign },
    { id: '#contact', label: 'Contact', icon: Mail },
    { id: '#advisor', label: 'Advisor', icon: Sparkles },
  ];

  const handleNavigate = (path: string) => {
    window.location.hash = path;
    onNavigate?.(path);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
      <GlobalBackground />
      <MAAYFeedback />
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-emerald-600/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[30%] bg-cyan-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div 
              onClick={() => handleNavigate('#home')}
              className="flex items-center group cursor-pointer"
            >
              <Logo size="sm" />
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`text-sm font-medium transition-all flex items-center gap-2 ${
                    currentPath === item.id ? 'text-cyan-400' : 'text-white/50 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
              {isEditor && (
                <button 
                  onClick={() => handleNavigate('#admin')}
                  className={`text-sm font-medium transition-all flex items-center gap-1 ${
                    currentPath === '#admin' ? 'text-cyan-400' : 'text-cyan-400/70 hover:text-cyan-400'
                  }`}
                >
                  <Shield className="w-4 h-4" /> Management
                </button>
              )}
              {user ? (
                <div className="flex items-center gap-4 pl-4 border-l border-white/5">
                  <Notifications />
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-white/90">{user.displayName || user.email?.split('@')[0]}</span>
                    <span className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-black">{profile?.role || 'User'}</span>
                  </div>
                  <button 
                    onClick={() => logout()}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => login()}
                  disabled={loginLoading}
                  className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-cyan-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {loginLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  {loginLoading ? 'Loading...' : 'Initialize'}
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-2xl md:hidden p-8 flex flex-col"
          >
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center">
                <Logo size="sm" />
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-white/5 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`flex items-center gap-4 p-5 rounded-2xl text-xl font-bold transition-all ${
                    currentPath === item.id ? 'bg-cyan-700 text-white shadow-lg shadow-cyan-900/20' : 'bg-white/5 text-white/40'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  {item.label}
                </button>
              ))}
              
              {isEditor && (
                <button
                  onClick={() => handleNavigate('#admin')}
                  className={`flex items-center gap-4 p-5 rounded-2xl text-xl font-bold transition-all ${
                    currentPath === '#admin' ? 'bg-cyan-700 text-white' : 'bg-cyan-700/10 text-cyan-400'
                  }`}
                >
                  <Shield className="w-6 h-6" /> Management
                </button>
              )}
            </div>

            <div className="mt-auto pt-8 border-t border-white/10">
              <div className="grid grid-cols-2 gap-3 mb-8">
                <button onClick={() => handleNavigate('#privacy')} className="p-4 rounded-xl bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-widest">Privacy</button>
                <button onClick={() => handleNavigate('#terms')} className="p-4 rounded-xl bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-widest">Terms</button>
                <button onClick={() => handleNavigate('#security')} className="p-4 rounded-xl bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-widest">Security</button>
                <button onClick={() => handleNavigate('#status')} className="p-4 rounded-xl bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-widest">Status</button>
              </div>

              {user ? (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-700 flex items-center justify-center font-bold">
                      {user.displayName?.[0] || user.email?.[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{user.displayName || user.email?.split('@')[0]}</div>
                      <div className="text-[10px] text-cyan-400/60 uppercase tracking-widest">{profile?.role}</div>
                    </div>
                  </div>
                  <button onClick={() => logout()} className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => login()}
                  disabled={loginLoading}
                  className="w-full py-4 bg-white text-black font-bold rounded-2xl text-lg shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-cyan-50 transition-colors"
                >
                  {loginLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {loginLoading ? 'Loading...' : 'Initialize Session'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="relative pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-24 bg-black/40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <Logo size="md" />
              </div>
              <p className="text-sm text-white/40 max-w-sm leading-relaxed">
                The world's most trusted marketplace for innovative applications. 
                Delivering ready-to-use, premium software across all platforms.
              </p>
            </div>
            
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/60 mb-6">Platform</h4>
              <ul className="space-y-4">
                <li><button onClick={() => handleNavigate('#home')} className="text-sm text-white/40 hover:text-cyan-400 transition-colors cursor-pointer">Home</button></li>
                <li><button onClick={() => handleNavigate('#')} className="text-sm text-white/40 hover:text-cyan-400 transition-colors cursor-pointer">Storefront</button></li>
                <li><button onClick={() => handleNavigate('#pricing')} className="text-sm text-white/40 hover:text-cyan-400 transition-colors cursor-pointer">Pricing</button></li>
                <li><button onClick={() => handleNavigate('#advisor')} className="text-sm text-white/40 hover:text-cyan-400 transition-colors cursor-pointer">AI Advisor</button></li>
                <li><button onClick={() => handleNavigate('#reviews')} className="text-sm text-white/40 hover:text-cyan-400 transition-colors cursor-pointer">Reviews</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/60 mb-6">Legal & Security</h4>
              <ul className="space-y-4">
                <li><button onClick={() => handleNavigate('#privacy')} className="text-sm text-white/40 hover:text-cyan-400 transition-colors cursor-pointer">Privacy Policy</button></li>
                <li><button onClick={() => handleNavigate('#terms')} className="text-sm text-white/40 hover:text-cyan-400 transition-colors cursor-pointer">Terms of Use</button></li>
                <li><button onClick={() => handleNavigate('#security')} className="text-sm text-white/40 hover:text-cyan-400 transition-colors cursor-pointer">Security Protocol</button></li>
                <li><button onClick={() => handleNavigate('#status')} className="text-sm text-white/40 hover:text-cyan-400 transition-colors cursor-pointer">System Status</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">
              © 2026 PymmCore Solutions • Infrastructure Protocol v5.0.4
            </p>
            <div className="flex gap-6">
              {settings?.twitter && (
                <a href={settings.twitter} target="_blank" rel="noopener noreferrer">
                  <Twitter className="w-4 h-4 text-white/20 hover:text-white cursor-pointer transition-colors" />
                </a>
              )}
              {settings?.linkedin && (
                <a href={settings.linkedin} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-4 h-4 text-white/20 hover:text-white cursor-pointer transition-colors" />
                </a>
              )}
              {settings?.facebook && (
                <a href={settings.facebook} target="_blank" rel="noopener noreferrer">
                  <Facebook className="w-4 h-4 text-white/20 hover:text-white cursor-pointer transition-colors" />
                </a>
              )}
              <Globe className="w-4 h-4 text-white/20 hover:text-white cursor-pointer transition-colors" onClick={() => window.location.hash = '#catalog'} />
              <Shield className="w-4 h-4 text-white/20 hover:text-white cursor-pointer transition-colors" onClick={() => window.location.hash = '#security'} />
              <Cpu className="w-4 h-4 text-white/20 hover:text-white cursor-pointer transition-colors" onClick={() => window.location.hash = '#home'} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
