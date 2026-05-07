import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, X, Check, Info } from 'lucide-react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[400px] z-[100]"
        >
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl shadow-black/50">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Privacy & Cookies</h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  We use cookies to enhance your experience, analyze site traffic, and ensure secure login. By continuing, you agree to our use of cookies.
                </p>
              </div>
              <button 
                onClick={() => setIsVisible(false)}
                className="text-white/20 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDecline}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all"
              >
                Essential Only
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-3 h-3" /> Accept All
              </button>
            </div>
            
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
              <button 
                onClick={() => { window.location.hash = '#privacy'; }}
                className="text-[10px] text-teal-400/60 hover:text-teal-400 flex items-center gap-1 transition-colors"
              >
                <Info className="w-3 h-3" /> Privacy
              </button>
              <button 
                onClick={() => { window.location.hash = '#terms'; }}
                className="text-[10px] text-teal-400/60 hover:text-teal-400 flex items-center gap-1 transition-colors"
              >
                <Shield className="w-3 h-3" /> Terms
              </button>
              <button 
                onClick={() => { window.location.hash = '#security'; }}
                className="text-[10px] text-teal-400/60 hover:text-teal-400 flex items-center gap-1 transition-colors"
              >
                <Check className="w-3 h-3" /> Security
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
