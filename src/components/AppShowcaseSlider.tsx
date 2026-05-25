import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, ShieldAlert, Cpu, ToggleLeft, ToggleRight, MessageSquare, BookOpen, Layers, Settings, AppWindow, Globe, Smartphone, Monitor } from 'lucide-react';

export default function AppShowcaseSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-swipe logic: switches between App 0 and App 1 every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === 0 ? 1 : 0));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // To drop in your actual assets: 
  // 1. Place your images in the /public folder (e.g. /public/harmonic_morse.png and /public/maay_hub.png)
  // 2. Change the string values below to point to your files.
  // 3. The render logic is pre-configured to detect these files and prefer them over the premium fallback UI.
  const HARMONIC_MORSE_IMAGE_SRC = ""; // E.g., "/images/harmonic_morse_messenger.png"
  const MAAY_HUB_IMAGE_SRC = "";       // E.g., "/images/maay_hub_dashboard.png"

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
      
      {/* Dynamic Slide Container with hardware acceleration */}
      <div className="relative flex-1 w-full overflow-hidden rounded-[1.75rem]">
        <AnimatePresence mode="wait">
          {currentIndex === 0 ? (
            <motion.div
              key="harmonic_morse"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full flex flex-col justify-between bg-neutral-950 font-sans"
            >
              {/* SLIDE 1: HARMONIC MORSE MESSENGER */}
              {HARMONIC_MORSE_IMAGE_SRC ? (
                /* ========================================================== */
                /* CRITICAL: Harmonic Morse Messenger User Image Asset Area   */
                /* ========================================================== */
                <img 
                  src={HARMONIC_MORSE_IMAGE_SRC} 
                  alt="Harmonic Morse Messenger Preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                /* High-Fidelity Futuristic Interactive Fallback Design */
                <div className="w-full h-full flex flex-col justify-between relative bg-[#0C0E12] text-xs">
                  
                  {/* Premium Dark Header */}
                  <div className="p-3 bg-neutral-900/90 border-b border-white/5 flex items-center justify-between backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                        <Radio className="w-3 h-3 animate-pulse" />
                      </div>
                      <span className="font-bold text-[9px] tracking-wider text-white">HARMONIC SIGNAL</span>
                    </div>
                    <span className="text-[7px] font-mono text-cyan-400/80 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/10 uppercase tracking-widest">
                      ONLINE
                    </span>
                  </div>

                  {/* Clean White Central Chat Canvas */}
                  <div className="flex-1 bg-white p-3.5 flex flex-col justify-between overflow-hidden relative">
                    {/* Signal Wave Subtle Grid Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                    
                    {/* Glowing transmission tower core */}
                    <div className="flex flex-col items-center justify-center py-2 absolute top-1.5 left-0 right-0 pointer-events-none">
                      <div className="relative">
                        <Radio className="w-6 h-6 text-cyan-500 animate-bounce" />
                        <span className="absolute -inset-2 bg-cyan-400/20 rounded-full blur-md animate-ping" />
                      </div>
                      <span className="text-[6px] font-mono text-neutral-400 mt-1 uppercase tracking-widest">TRANSMISSION ACTIVE</span>
                    </div>

                    {/* Chat Messages Space */}
                    <div className="space-y-2 mt-10 overflow-hidden flex-1 flex flex-col justify-end">
                      
                      {/* Incoming Msg */}
                      <div className="flex items-start gap-1.5 max-w-[85%]">
                        <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center text-[7px] text-white font-bold font-mono">
                          H
                        </div>
                        <div className="bg-neutral-100 text-neutral-800 p-2 rounded-2xl rounded-tl-sm text-[8px] leading-snug">
                          <span className="font-bold text-cyan-600 block text-[6.5px] mb-0.5">Harmonic Engine</span>
                          Calibration secure. Ready for Morse transmission testing.
                        </div>
                      </div>

                      {/* Morse Guide Chat Item */}
                      <div className="border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors p-2 rounded-2xl flex items-center gap-2 shadow-[0_2px_10px_rgba(6,182,212,0.05)] cursor-pointer">
                        <div className="w-6 h-6 rounded-xl bg-cyan-500 flex items-center justify-center text-white shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-[8px] text-neutral-800 tracking-tight">Morse Guide</span>
                            <span className="text-[6px] font-extrabold text-cyan-500 tracking-wider">TAP HERE</span>
                          </div>
                          <p className="text-[7.5px] text-neutral-500 truncate font-mono mt-0.5">
                            ..- . -..- -... / --. ..- .. -.. .
                          </p>
                        </div>
                      </div>

                      {/* Outgoing Msg */}
                      <div className="flex items-start gap-1.5 max-w-[85%] self-end flex-row-reverse">
                        <div className="w-4 h-4 rounded-full bg-neutral-900 flex items-center justify-center text-[7px] text-white font-bold font-mono">
                          M
                        </div>
                        <div className="bg-neutral-900 text-white p-2 rounded-2xl rounded-tr-sm text-[8px] leading-snug">
                          Copy that. Initiating uplink sequence now.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Premium Dark Footer framing the white canvas */}
                  <div className="p-3 bg-neutral-900/95 border-t border-white/5 flex flex-col items-center gap-2">
                    
                    {/* Modern Pill-Shaped Navigation Dock */}
                    <div className="w-full max-w-[130px] bg-white/[0.04] border border-white/10 rounded-full py-1 px-2.5 flex items-center justify-between shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
                      <button className="p-1 text-cyan-400 hover:text-white transition-colors relative">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="absolute top-0.5 right-0.5 w-1 h-1 bg-rose-500 rounded-full" />
                      </button>
                      <button className="p-1 text-white/40 hover:text-white transition-colors">
                        <Layers className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 text-white/40 hover:text-white transition-colors">
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Touch Swipe Bar */}
                    <div className="w-12 h-0.5 bg-white/20 rounded-full" />
                  </div>

                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="maay_hub"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full flex flex-col justify-between bg-neutral-950 font-sans"
            >
              {/* SLIDE 2: MAAY HUB */}
              {MAAY_HUB_IMAGE_SRC ? (
                /* ========================================================== */
                /* CRITICAL: MAAY HUB User Image Asset Area                   */
                /* ========================================================== */
                <img 
                  src={MAAY_HUB_IMAGE_SRC} 
                  alt="MAAY HUB Preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                /* High-Fidelity Futuristic Interactive Fallback Design */
                <div className="w-full h-full flex flex-col justify-between p-3.5 bg-[#0A0B0E] text-white">
                  
                  {/* Top Header Panel */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />
                      <span className="text-[8px] font-black tracking-[0.15em] text-white/80">MAAY_SYS v4.9</span>
                    </div>
                    <span className="text-[7px] font-mono text-emerald-400">NODE_01_OK</span>
                  </div>

                  {/* Centered Glowing Coordinate Ring Logo */}
                  <div className="flex-1 flex flex-col justify-center items-center py-2 relative overflow-hidden">
                    
                    {/* Floating space dust lights */}
                    <div className="absolute w-24 h-24 bg-teal-500/5 rounded-full blur-xl animate-pulse" />

                    {/* Outer Coordinate Ring (Slow spin) */}
                    <div className="relative w-24 h-24 flex items-center justify-center border border-white/5 rounded-full p-2.5 animate-[spin_12s_linear_infinite]">
                      <div className="absolute inset-0 border-t border-teal-500/25 border-dashed rounded-full" />
                      <div className="absolute inset-2 border border-white/5 rounded-full" />
                      
                      {/* Geometric "M" Center Logo */}
                      <div className="w-10 h-10 rounded-xl bg-black border border-teal-500/20 flex items-center justify-center p-2 shadow-[0_0_15px_rgba(20,184,166,0.15)] relative">
                        {/* High-tech custom styled geometric 'M' lines */}
                        <svg className="w-full h-full text-teal-400 drop-shadow-[0_0_6px_rgba(45,212,191,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="4 20 4 4 12 12 20 4 20 20" />
                        </svg>
                      </div>
                    </div>

                    <div className="text-center mt-2.5">
                      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white">MAAY HUB</div>
                      <div className="text-[6px] font-mono text-teal-400 uppercase tracking-widest mt-0.5">COMMAND INTERACTION</div>
                    </div>
                  </div>

                  {/* Sci-Fi Control Toggles */}
                  <div className="space-y-2 pb-2">
                    
                    {/* Toggle Item 1: Main Entrance Lock */}
                    <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-xl p-2 hover:bg-white/[0.04] transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[7.5px] font-bold text-white/80">Main Entrance Lock</span>
                        <span className="text-[5.5px] font-mono text-rose-400 uppercase">SYS SECURE / ACTIVE</span>
                      </div>
                      <ToggleRight className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)] cursor-pointer" />
                    </div>

                    {/* Toggle Item 2: Atmosphere Regulator */}
                    <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-xl p-2 hover:bg-white/[0.04] transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[7.5px] font-bold text-white/80">Atmosphere Regulator</span>
                        <span className="text-[5.5px] font-mono text-teal-400 uppercase">STATUS 100% / NOMINAL</span>
                      </div>
                      <ToggleRight className="w-4 h-4 text-teal-400 drop-shadow-[0_0_5px_rgba(45,212,191,0.5)] cursor-pointer" />
                    </div>

                    {/* Toggle Item 3: Quantum Uplink Lumens */}
                    <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-xl p-2 hover:bg-white/[0.04] transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[7.5px] font-bold text-white/50">Quantum Uplink Lumens</span>
                        <span className="text-[5.5px] font-mono text-white/20 uppercase">STBY / STANDBY</span>
                      </div>
                      <ToggleLeft className="w-4 h-4 text-white/20 cursor-pointer" />
                    </div>

                  </div>

                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle Visual indicator at bottom: 2 small glowing neon dots */}
      <div className="absolute bottom-11 left-0 right-0 flex justify-center items-center gap-2.5 z-30 pointer-events-auto">
        <button
          onClick={() => setCurrentIndex(0)}
          className={`h-1.5 transition-all duration-300 rounded-full ${
            currentIndex === 0 
              ? 'w-5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]' 
              : 'w-1.5 bg-white/20 hover:bg-white/45'
          }`}
          aria-label="Showcase App 1"
        />
        <button
          onClick={() => setCurrentIndex(1)}
          className={`h-1.5 transition-all duration-300 rounded-full ${
            currentIndex === 1 
              ? 'w-5 bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,1)]' 
              : 'w-1.5 bg-white/20 hover:bg-white/45'
          }`}
          aria-label="Showcase App 2"
        />
      </div>

    </div>
  );
}
