import { motion } from 'motion/react';
import { 
  Smartphone, Shield, Zap, Sparkles, 
  Download, Apple, Play, Star, 
  CheckCircle2, Globe, Cpu, ArrowRight, ShoppingCart,
  User, Menu, Power, Activity, AlertCircle, Clock
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import Logo from './Logo';
import Reviews from './Reviews';
import WaitlistPortal from './WaitlistPortal';

export default function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');

  const features = [
    {
      icon: ShoppingCart,
      title: "Curated Selection",
      description: "Every application is vetted for performance, security, and user experience.",
      color: "text-teal-400",
      bg: "bg-teal-400/10"
    },
    {
      icon: Globe,
      title: "Multi-Platform",
      description: "Discover premium solutions for Web, iOS, Android, and Desktop environments.",
      color: "text-amber-400",
      bg: "bg-amber-400/10"
    },
    {
      icon: Sparkles,
      title: "AI-Driven Discovery",
      description: "Our AI Advisor helps you find the perfect tool for your specific business needs.",
      color: "text-teal-500",
      bg: "bg-teal-500/10"
    },
    {
      icon: Shield,
      title: "Secure Transactions",
      description: "Enterprise-grade licensing and secure download protocols for all software.",
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center">
            <Logo size="sm" />
          </div>
          <button 
            onClick={onLaunch}
            className="hidden md:block text-sm font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
          >
            Protocol Access
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-widest mb-8">
              <Sparkles className="w-3 h-3" /> Version 5.0 Now Live
            </div>
            <h1 className="text-6xl lg:text-8xl font-bold tracking-tighter leading-[0.9] mb-8">
              The Premium <br />
              <span className="text-amber-500">App Storefront.</span>
            </h1>
            <p className="text-xl text-white/40 mb-12 max-w-lg leading-relaxed">
              A curated marketplace for high-performance mobile, web, and desktop applications. 
              Discover ready-to-use solutions from PymmCore and top developers.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={onLaunch}
                className="flex items-center gap-3 px-10 py-5 bg-teal-700 text-white font-bold rounded-2xl hover:bg-teal-600 transition-all group shadow-lg shadow-teal-900/20"
              >
                Explore Marketplace <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Quick Community Proof */}
            <div className="mt-12 pt-12 border-t border-white/5">
              <div className="text-[10px] font-bold text-teal-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Star className="w-3 h-3 fill-teal-400" /> Community Validation
              </div>
              <Reviews minimal />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 w-full max-w-[320px] mx-auto aspect-[9/19] bg-[#0a0a0a] rounded-[3rem] border-[8px] border-white/10 shadow-2xl overflow-hidden flex flex-col">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-white/10 rounded-b-2xl z-20" />
              
              {/* UI Content */}
              <div className="flex-1 p-6 pt-10 flex flex-col relative">
                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-white/60" />
                    </div>
                    <div>
                      <div className="text-xs font-bold tracking-tight">MAAY HUB</div>
                      <div className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Helios Phase</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold">12:32 <span className="text-white/40 ml-1">TUE</span></div>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                      <span className="text-[8px] font-bold text-teal-500 uppercase tracking-widest">Mesh: Nominal</span>
                    </div>
                    <button className="mt-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[8px] font-bold text-red-500 uppercase tracking-widest hover:bg-red-500/20 transition-colors">
                      SOS Trigger
                    </button>
                  </div>
                </div>

                {/* Center Section */}
                <div className="flex-1 flex flex-col items-center justify-center text-center -mt-10">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full border border-white/5 flex items-center justify-center relative">
                      <div className="absolute inset-0 rounded-full border-t-2 border-teal-500 animate-[spin_3s_linear_infinite]" />
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/5 to-transparent border border-white/10 flex items-center justify-center">
                        <span className="text-5xl font-light tracking-tighter">M</span>
                      </div>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight mb-1">INITIALIZE MAAY</h2>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Awaiting Directives</p>
                </div>

                {/* Lower Section - Panel */}
                <div className="mt-auto">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/60">Facility Infrastructure</h3>
                    </div>
                    <div className="text-right">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-teal-500">Command Hub</h3>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Control 1 */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/[0.08] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold">Primary Uplink Lights</div>
                          <div className="text-[8px] text-white/40 uppercase tracking-widest">Office</div>
                        </div>
                      </div>
                      <div className="w-12 h-6 rounded-full bg-white/5 border border-white/10 p-1 flex items-center justify-start">
                        <div className="w-4 h-4 rounded-full bg-white/20" />
                      </div>
                    </div>

                    {/* Control 2 */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/[0.08] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-teal-500" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold">Sanctuary Portal</div>
                          <div className="text-[8px] text-white/40 uppercase tracking-widest">Sanctuary</div>
                        </div>
                      </div>
                      <div className="w-12 h-6 rounded-full bg-teal-500 p-1 flex items-center justify-end">
                        <div className="w-4 h-4 rounded-full bg-white" />
                      </div>
                    </div>

                    {/* Control 3 - Partially Visible */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between opacity-40">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                          <Activity className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold">Climate Node Alpha</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glass Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-600/20 blur-[100px] rounded-full" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-600/20 blur-[100px] rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Value Prop Section */}
      <section className="py-24 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-6xl font-bold tracking-tighter mb-8">
            Why PymmCore Storefront?
          </h2>
          <p className="text-xl text-white/40 max-w-2xl mx-auto leading-relaxed">
            We curate the most innovative applications across all platforms. 
            From official PymmCore solutions to vetted third-party tools, 
            everything is ready for immediate deployment and use.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all group"
              >
                <div className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section className="py-24 px-6 border-t border-white/5 relative">
        <div className="absolute inset-0 bg-teal-500/5 blur-[120px] rounded-full -z-10" />
        <WaitlistPortal />
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto p-12 lg:p-20 rounded-[3rem] bg-gradient-to-br from-teal-700 to-teal-950 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="relative z-10">
            <h2 className="text-5xl lg:text-7xl font-bold tracking-tighter mb-8">
              Ready to scale?
            </h2>
            <p className="text-xl text-white/80 mb-12 max-w-xl mx-auto">
              Join thousands of engineers managing global infrastructure with PymmCore Mobile.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={onLaunch}
                className="px-10 py-5 bg-white text-black font-bold rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                Get Started Now <ArrowRight className="w-5 h-5" />
              </button>
              <a 
                href="#docs"
                className="px-10 py-5 bg-black/20 backdrop-blur-md text-white font-bold rounded-2xl border border-white/20 hover:bg-black/30 transition-all flex items-center justify-center"
              >
                View Documentation
              </a>
            </div>
          </div>
          
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-black/20 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center">
            <Logo size="sm" />
          </div>
          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">Legal & Security</div>
            <div className="flex flex-wrap justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-white/40">
              <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#terms" className="hover:text-white transition-colors">Terms of Use</a>
              <a href="#security" className="hover:text-white transition-colors">Security Protocol</a>
              <a href="#status" className="hover:text-white transition-colors">System Status</a>
            </div>
          </div>
          <p className="text-[10px] text-white/20 uppercase tracking-[0.3em]">
            © 2026 PymmCore Solutions
          </p>
        </div>
      </footer>
    </div>
  );
}
