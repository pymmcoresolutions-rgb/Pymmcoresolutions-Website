import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronLeft, ChevronRight, 
  ZoomIn, ZoomOut, Maximize, RotateCcw 
} from 'lucide-react';

interface ScreenshotModalProps {
  screenshots: string[];
  initialIndex: number;
  onClose: () => void;
  appName: string;
}

export default function ScreenshotModal({ screenshots, initialIndex, onClose, appName }: ScreenshotModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % screenshots.length);
    setScale(1);
  }, [screenshots.length]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
    setScale(1);
  }, [screenshots.length]);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.max(prev - 0.5, 0.5));
  };

  const resetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl select-none"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-1 italic">
            // VISUAL_DATA_FEED
          </span>
          <h3 className="text-white font-bold tracking-tight">
            {appName} <span className="text-white/20 ml-2 font-mono text-xs">VIEW_{currentIndex + 1}.PNG</span>
          </h3>
        </div>

        <div className="flex items-center gap-4">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 backdrop-blur-md">
            <button
              onClick={handleZoomOut}
              className="p-2 text-white/40 hover:text-white transition-colors hover:bg-white/5 rounded-xl"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <div className="px-3 text-[10px] font-mono text-cyan-500 min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </div>
            <button
              onClick={handleZoomIn}
              className="p-2 text-white/40 hover:text-white transition-colors hover:bg-white/5 rounded-xl"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <div className="w-[1px] h-4 bg-white/10 mx-1" />
            <button
              onClick={resetZoom}
              className="p-2 text-white/40 hover:text-white transition-colors hover:bg-white/5 rounded-xl"
              title="Reset Zoom"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 1.1, x: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative flex items-center justify-center p-12"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              style={{ scale }}
              className="cursor-grab active:cursor-grabbing"
              drag={scale > 1}
              dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
            >
              <img
                src={screenshots[currentIndex]}
                alt={`${appName} screenshot ${currentIndex + 1}`}
                className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl border border-white/10 object-contain pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {screenshots.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-8 top-1/2 -translate-y-1/2 p-4 rounded-3xl bg-white/5 border border-white/10 text-white/20 hover:text-cyan-500 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all z-20 group"
            >
              <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-8 top-1/2 -translate-y-1/2 p-4 rounded-3xl bg-white/5 border border-white/10 text-white/20 hover:text-cyan-500 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all z-20 group"
            >
              <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails / Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 p-3 bg-black/40 border border-white/10 rounded-full backdrop-blur-md">
        {screenshots.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
              setScale(1);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex 
                ? 'bg-cyan-500 w-8 shadow-[0_0_10px_rgba(6,182,212,0.5)]' 
                : 'bg-white/10 hover:bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Info Label */}
      <div className="absolute bottom-8 left-8 flex items-center gap-3 text-white/20">
        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono whitespace-nowrap">
          SECURED_GRID_UPLINK.PYMMCORE
        </span>
      </div>
    </motion.div>
  );
}
