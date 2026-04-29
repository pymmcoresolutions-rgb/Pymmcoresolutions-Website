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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'onboarding_slides'), 
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
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

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
    <section className="relative w-full max-w-7xl mx-auto px-6 mb-24 mt-8">
      <div className="relative h-[500px] lg:h-[600px] rounded-[3rem] overflow-hidden group">
        {/* Background Visual Layer */}
        <div className="absolute inset-0 bg-[#0a0a0a] border border-white/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex + '-bg'}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              {currentSlide.imageUrl ? (
                <>
                  <img 
                    src={currentSlide.imageUrl} 
                    alt="" 
                    className="w-full h-full object-cover opacity-40 blur-[2px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
                </>
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent" />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Content Layer */}
        <div className="relative h-full z-10 flex flex-col justify-end p-8 lg:p-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "circOut" }}
              className="max-w-3xl"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-teal-600/10 border border-teal-500/20 flex items-center justify-center backdrop-blur-md">
                  <Icon className="w-8 h-8 text-teal-400" />
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-teal-500/20 to-transparent" />
              </div>

              <h2 className="text-4xl lg:text-7xl font-bold tracking-tighter leading-[0.9] mb-8 lg:mb-10">
                {currentSlide.title}
              </h2>
              
              <p className="text-xl lg:text-2xl text-white/40 leading-relaxed mb-12 max-w-xl">
                {currentSlide.subtitle}
              </p>

              {currentSlide.buttonText && (
                <div className="flex items-center gap-6">
                  <motion.a
                    href={currentSlide.buttonLink || '#'}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black font-bold rounded-2xl transition-all shadow-xl shadow-white/5"
                  >
                    {currentSlide.buttonText} <ExternalLink className="w-5 h-5" />
                  </motion.a>
                  
                  <div className="flex gap-2">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${
                          currentIndex === i ? 'w-8 bg-teal-500' : 'w-2 bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Arrows */}
        <div className="absolute top-1/2 -translate-y-1/2 left-8 right-8 flex justify-between z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-110 pointer-events-auto transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-110 pointer-events-auto transition-all"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      </div>

      {/* Slide Indicators Mobile */}
      <div className="flex lg:hidden justify-center gap-3 mt-8">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              currentIndex === i ? 'w-12 bg-teal-500' : 'w-3 bg-white/10'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
