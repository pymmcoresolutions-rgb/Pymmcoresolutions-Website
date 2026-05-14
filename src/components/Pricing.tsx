import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, Zap, Globe, Rocket, CheckCircle2, 
  ArrowRight, CreditCard, Lock, Sparkles, BarChart3
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface PricingProps {
  onStartListing: () => void;
}

export default function Pricing({ onStartListing }: PricingProps) {
  const [fee, setFee] = useState(25);

  useEffect(() => {
    return onSnapshot(doc(db, 'config', 'marketplace'), (snap) => {
      if (snap.exists()) {
        setFee(snap.data().listingFee || 25);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'config/marketplace');
    });
  }, []);

  const benefits = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-cyan-400" />,
      title: "Automated Security Audit",
      description: "Every submission undergoas a rigorous automated security scan to ensure code integrity and user safety."
    },
    {
      icon: <Zap className="w-6 h-6 text-purple-400" />,
      title: "Instant Global Deployment",
      description: "Once approved, your application is pushed to our global CDN edge, accessible by thousands of users instantly."
    },
    {
      icon: <CreditCard className="w-6 h-6 text-blue-400" />,
      title: "Secure Paystack Integration",
      description: "Hassle-free listing fee processing with Paystack's world-class secure payment infrastructure."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-amber-400" />,
      title: "Analytics Dashboard",
      description: "Gain deep insights into your app's performance, downloads, and user engagement metrics."
    },
    {
      icon: <Globe className="w-6 h-6 text-green-400" />,
      title: "SEO Optimization",
      description: "Marketplace listings are optimized for search engines to drive organic traffic to your product."
    },
    {
      icon: <Lock className="w-6 h-6 text-red-400" />,
      title: "Fraud Protection",
      description: "Advanced heuristics to prevent duplicate listings and protect developer intellectual property."
    }
  ];

  return (
    <div className="min-h-screen bg-[#020202] text-white pt-32 pb-20 px-6 sm:px-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center space-y-6 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-[0.2em]"
          >
            <Sparkles className="w-3 h-3" /> Marketplace Economics
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter leading-none"
          >
            Transparent Pricing.<br />
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Powerful Growth.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/40 text-xl max-w-2xl mx-auto font-light"
          >
            Join a curated ecosystem designed for high-performance applications. 
            We handle the infrastructure, you focus on the code.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Main Pricing Card */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-5 relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-[#050505] border border-white/10 rounded-[3rem] p-10 md:p-14 shadow-2xl backdrop-blur-3xl">
              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className="text-white/40 text-xs font-black uppercase tracking-[0.3em]">Per Application Submission</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-black tracking-tighter">${fee}</span>
                    <span className="text-white/20 font-mono">/LIFETIME</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    "One-time fee per application",
                    "Unlimited future updates",
                    "Global marketplace visibility",
                    "Secure payment processing",
                    "Dev Portal access"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-white/60">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                      <span className="font-medium tracking-tight">{item}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={onStartListing}
                  className="w-full py-6 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                >
                  <Rocket className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  List Your App Now
                </button>

                <p className="text-[10px] text-white/20 text-center font-mono leading-relaxed">
                  SECURE TRANSACTION POWERED BY PAYSTACK.<br />
                  CURRENCY EQUIVALENT APPLIED AT CHECKOUT.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Benefits Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h4 className="text-lg font-bold mb-3 tracking-tight">{benefit.title}</h4>
                <p className="text-sm text-white/40 leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-32 pt-20 border-t border-white/5"
        >
          <div className="flex flex-col md:flex-row justify-between gap-12">
            <div className="max-w-md space-y-4">
              <h2 className="text-3xl font-black tracking-tight italic">Why a listing fee?</h2>
              <p className="text-white/40 leading-relaxed font-light">
                The listing fee helps us maintain a high-quality ecosystem, fund manual security reviews when necessary, and provide world-class hosting for your application assets. 
                We don't take a commission on your sales—just a simple one-time fee per application to cover vetting and infrastructure.
              </p>
              <div className="pt-4">
                <button 
                  onClick={() => window.location.hash = '#guidelines'}
                  className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-widest text-xs hover:gap-4 transition-all"
                >
                  Read our full quality guidelines <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:w-1/2">
              <div className="space-y-2">
                <h5 className="font-bold text-white/80">Can I update my app?</h5>
                <p className="text-xs text-white/40 leading-relaxed">Yes. Updates are always free. We encourage developers to keep their products current.</p>
              </div>
              <div className="space-y-2">
                <h5 className="font-bold text-white/80">Is it refundable?</h5>
                <p className="text-xs text-white/40 leading-relaxed">Fees are non-refundable once the security audit process has begun.</p>
              </div>
              <div className="space-y-2">
                <h5 className="font-bold text-white/80">Support for regions?</h5>
                <p className="text-xs text-white/40 leading-relaxed">We use Paystack to ensure seamless payments across global markets including Africa.</p>
              </div>
              <div className="space-y-2">
                <h5 className="font-bold text-white/80">Bulk listings?</h5>
                <p className="text-xs text-white/40 leading-relaxed">Contact dev-support@pymmcore.com for studio-level partnership rates.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
