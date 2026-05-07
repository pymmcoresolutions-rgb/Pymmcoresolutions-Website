import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, ArrowLeft, ChevronRight, 
  Shield, Zap, Globe, Sparkles, Cpu, 
  Smartphone, Monitor, Rocket, CheckCircle2,
  Package, Layout, ExternalLink,
  Users, Star, Play, AppWindow, Layers, MessageSquare, Download
} from 'lucide-react';

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  icon: string;
  buttonText?: string;
  buttonLink?: string;
}

const IconMap: { [key: string]: any } = {
  Zap, Shield, Globe, Sparkles, Cpu, 
  Smartphone, Monitor, Rocket, CheckCircle2,
  Package, Layout, Users, Star, Play, 
  AppWindow, Layers, MessageSquare, Download
};

export default function OnboardingShowcase() {
  const [slides, setSlides] = useState<OnboardingSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'key_features'), 
      where('active', '==', true),
      orderBy('order', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSlides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OnboardingSlide)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length, isHovered]);

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
  };

  if (loading || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];
  const Icon = IconMap[currentSlide.icon] || Sparkles;

  return (
    <section 
      className="relative w-full max-w-7xl mx-auto px-6 mb-24 mt-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative min-h-[400px] lg:h-[480px] rounded-[3rem] overflow-hidden group bg-[#0a0a0a] border border-white/5">
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(20,184,166,0.05),transparent_50%)]" />

        <div className="relative h-full z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0">
          {/* Left: Content Layer */}
          <div className="flex flex-col justify-center p-8 lg:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-xl"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-teal-600/10 border border-teal-500/20 flex items-center justify-center backdrop-blur-md">
                    <Icon className="w-3 h-3 text-teal-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[6px] font-black uppercase tracking-[0.4em] text-teal-500/60 mb-0.5">M_0{currentIndex + 1}</span>
                    <div className="h-px w-6 bg-gradient-to-r from-teal-500/50 to-transparent" />
                  </div>
                </div>

                <h2 className="text-base lg:text-lg font-black tracking-tighter leading-tight uppercase mb-2 text-white drop-shadow-sm">
                  {currentSlide.title}
                </h2>
                
                <p className="text-[10px] text-white/50 leading-relaxed mb-4 font-medium max-w-md">
                  {currentSlide.subtitle}
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  {currentSlide.buttonText && (
                    <motion.a
                      href={currentSlide.buttonLink || '#'}
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 text-black font-black uppercase tracking-tighter rounded-md transition-all shadow-xl shadow-teal-500/20 text-[7px]"
                    >
                      {currentSlide.buttonText} <ArrowRight className="w-2.5 h-2.5" />
                    </motion.a>
                  )}
                  
                  {/* Desktop Indicators */}
                  <div className="hidden lg:flex items-center gap-2">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className="group relative h-8 w-1.5 flex items-center justify-center cursor-pointer"
                        aria-label={`Go to slide ${i + 1}`}
                      >
                        <div className={`w-0.5 rounded-full transition-all duration-500 ${
                          currentIndex === i ? 'h-6 bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'h-3 bg-white/10 group-hover:bg-white/30'
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Visual Preview Layer */}
          <div className="relative min-h-[300px] lg:h-full bg-white/[0.02] border-l border-white/5 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex + '-visual'}
                initial={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex items-center justify-center p-8 lg:p-16"
              >
                {currentSlide.imageUrl ? (
                  <div className="relative w-full h-full rounded-[2rem] overflow-hidden border border-white/10 group/img shadow-2xl">
                    <img 
                      src={currentSlide.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                ) : (
                  <div className="w-full h-fit py-16 px-10 rounded-[2.5rem] bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col items-center text-center space-y-6 relative group/box">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-teal-500/20 to-blue-500/20 rounded-[2.5rem] -z-10 opacity-30 group-hover/box:opacity-60 transition-opacity" />
                    <div className="w-20 h-20 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(20,184,166,0.1)]">
                      <Icon className="w-10 h-10 text-teal-400" />
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-2xl font-black tracking-tight uppercase text-white leading-none">{currentSlide.title}</h4>
                      <p className="text-sm text-white/40 leading-relaxed font-medium px-4">System Visualization Matrix Active</p>
                    </div>
                    <div className="absolute bottom-6 right-6 text-[8px] font-black tracking-widest text-teal-500/40 uppercase">LIVE_PREVIEW</div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 overflow-hidden z-30">
          {slides.length > 1 && (
            <motion.div
              key={currentIndex + '-progress'}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: isHovered ? (isHovered ? 0 : 0) : 1 }}
              transition={{ duration: isHovered ? 0 : 6, ease: "linear" }}
              className="absolute inset-0 bg-teal-500 origin-left"
            />
          )}
        </div>

        {/* Navigation Arrows */}
        <div className="absolute bottom-8 right-8 flex gap-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-teal-500 hover:border-teal-400 group/btn transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white group-hover/btn:text-black transition-colors" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-teal-500 hover:border-teal-400 group/btn transition-all"
          >
            <ArrowRight className="w-5 h-5 text-white group-hover/btn:text-black transition-colors" />
          </button>
        </div>
      </div>

      {/* Mobile Indicators */}
      <div className="flex lg:hidden justify-center gap-3 mt-6">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              currentIndex === i ? 'w-10 bg-teal-500' : 'w-2 bg-white/10'
            }`}
          />
        ))}
      </div>
    </section>

  );
}
