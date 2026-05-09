import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Heart, Apple, Play, ExternalLink, Globe, 
  Info, Sparkles, CheckCircle2, Monitor, Box,
  Star, Download, Shield, Clock, Tag
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';

// Helper to render dynamic Lucide icons
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  if (!name) return <Box className={className} />;
  
  if (typeof name === 'string' && (name.startsWith('data:image') || name.startsWith('http'))) {
    return <img src={name} alt="Icon" className={`${className} object-cover rounded-lg`} referrerPolicy="no-referrer" />;
  }

  const Icon = (LucideIcons as any)[name];
  if (typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null)) {
    return <Icon className={className} />;
  }
  
  return <Box className={className} />;
};

interface AppDetailModalProps {
  app: any;
  isOpen: boolean;
  onClose: () => void;
  onToggleWishlist: (appId: string) => void;
  isInWishlist: boolean;
  userRatings: Record<string, number>;
  onRate: (appId: string, rating: number) => Promise<void>;
  onViewScreenshots: (screenshots: string[], index: number, appName: string) => void;
}

const StarRating = ({ 
  currentRating, 
  ratingCount, 
  userRating,
  onRate 
}: { 
  currentRating: number; 
  ratingCount: number;
  userRating: number | null;
  onRate: (newRating: number) => Promise<void>;
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRate(star)}
            className="transition-transform hover:scale-110"
          >
            <Star 
              className={`w-4 h-4 ${
                (userRating ? star <= userRating : star <= currentRating)
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-white/10'
              }`} 
            />
          </button>
        ))}
        <span className="text-[10px] font-bold text-white/40 ml-2 uppercase tracking-widest">
          {currentRating.toFixed(1)} ({ratingCount})
        </span>
      </div>
      {userRating && (
        <div className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest">
          Your rating: {userRating} stars
        </div>
      )}
    </div>
  );
};

export default function AppDetailModal({ 
  app, 
  isOpen, 
  onClose, 
  onToggleWishlist, 
  isInWishlist,
  userRatings,
  onRate,
  onViewScreenshots
}: AppDetailModalProps) {
  if (!app) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto bg-black/90 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="bg-[#050505] border border-white/10 rounded-[3rem] w-full max-w-6xl overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.1)] relative flex flex-col md:flex-row"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 p-3 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all z-20"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Left Side: Visuals & Core Info */}
            <div className="w-full md:w-[40%] bg-white/[0.01] border-r border-white/5 p-8 md:p-12 space-y-10 overflow-y-auto hidden-scrollbar">
              <div className="flex justify-between items-start">
                <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl relative group">
                   <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                   {app.icon ? (
                     <img src={app.icon} alt={app.name} className="w-20 h-20 object-cover rounded-2xl" referrerPolicy="no-referrer" />
                   ) : (
                     <Box className="w-16 h-16 text-cyan-400" />
                   )}
                </div>

                <button
                  onClick={() => onToggleWishlist(app.id)}
                  className={`p-4 rounded-2xl transition-all ${
                    isInWishlist 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                      : 'bg-white/5 text-white/40 border border-white/10 hover:text-white'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest">
                    {Array.isArray(app.type) ? app.type.join(' & ') : app.type}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-bold uppercase tracking-widest font-mono">
                    VER_{app.version || '1.0.0'}
                  </span>
                  {app.isPymmcoreProduct && (
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <Shield className="w-3 h-3" /> Pymmcore Verified
                    </span>
                  )}
                </div>
                <h2 className="text-5xl font-black tracking-tighter leading-none bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                  {app.name}
                </h2>
                <div className="flex items-center gap-3">
                  <p className="text-2xl text-cyan-400 font-black">{app.price}</p>
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{app.developer}</p>
                </div>
              </div>

              <div className="pt-10 border-t border-white/5 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {app.appStoreLink && (
                    <a 
                      href={app.appStoreLink} 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={() => analyticsService.trackDownload(app.id, app.name)}
                      className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
                    >
                      <Apple className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="text-[7px] font-bold text-white/20 uppercase tracking-widest">App Store</div>
                        <div className="text-[10px] font-bold">Download</div>
                      </div>
                    </a>
                  )}
                  {app.playStoreLink && (
                    <a 
                      href={app.playStoreLink} 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={() => analyticsService.trackDownload(app.id, app.name)}
                      className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
                    >
                      <Play className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="text-[7px] font-bold text-white/20 uppercase tracking-widest">Play Store</div>
                        <div className="text-[10px] font-bold">Get it now</div>
                      </div>
                    </a>
                  )}
                </div>
                
                <a 
                  href={app.link} 
                  target="_blank" 
                  rel="noreferrer"
                  onClick={() => analyticsService.trackDownload(app.id, app.name)}
                  className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-cyan-600/20 group"
                >
                  <ExternalLink className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  {app.type === 'Desktop' ? 'Download Installer' : 'Launch Application'}
                </a>

                {app.demoLink && (
                  <a 
                    href={app.demoLink} 
                    target="_blank" 
                    rel="noreferrer"
                    onClick={() => analyticsService.trackDownload(app.id, app.name)}
                    className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3"
                  >
                    <Globe className="w-5 h-5 text-purple-400" />
                    Enter Sandbox Demo
                  </a>
                )}
              </div>

              <div className="space-y-6 pt-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  </div>
                  <div>
                    <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Global Echo</div>
                    <StarRating 
                      currentRating={app.ratingCount ? (app.sumOfRatings || 0) / app.ratingCount : 0}
                      ratingCount={app.ratingCount || 0}
                      userRating={userRatings[app.id] || null}
                      onRate={(rating) => onRate(app.id, rating)}
                    />
                  </div>
                </div>
                {app.downloadCount !== undefined && (
                   <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Download className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Total Installs</div>
                      <div className="text-xl font-mono font-bold text-white/80">{app.downloadCount.toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Detailed Narrative & Features */}
            <div className="flex-1 p-8 md:p-12 overflow-y-auto">
              <div className="max-w-3xl space-y-12">
                <section className="space-y-6">
                  <div className="flex items-center gap-3 text-cyan-400">
                    <Info className="w-5 h-5" />
                    <h3 className="text-xs font-black uppercase tracking-[0.3em]">Operational_Summary</h3>
                  </div>
                  <div className="prose prose-invert prose-cyan max-w-none">
                    <p className="text-xl text-white/70 leading-relaxed font-light first-letter:text-5xl first-letter:font-black first-letter:text-cyan-500 first-letter:mr-3 first-letter:float-left">
                      {app.description}
                    </p>
                  </div>
                </section>

                {app.features && app.features.length > 0 && (
                  <section className="space-y-8">
                    <div className="flex items-center gap-3 text-purple-400">
                      <Sparkles className="w-5 h-5" />
                      <h3 className="text-xs font-black uppercase tracking-[0.3em]">Technical_Core_Systems</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {app.features.map((f: string, i: number) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-4 p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all group"
                        >
                          <div className="p-2 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                            <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                          </div>
                          <span className="text-sm text-white/60 group-hover:text-white/90 transition-colors leading-snug font-medium uppercase tracking-tight">
                            {f}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {app.screenshots && app.screenshots.length > 0 && (
                  <section className="space-y-8">
                    <div className="flex items-center gap-3 text-cyan-400">
                      <Monitor className="w-5 h-5" />
                      <h3 className="text-xs font-black uppercase tracking-[0.3em]">Visual_Interface_Previews</h3>
                    </div>
                    <div className="space-y-6">
                      {app.screenshots.map((src: string, idx: number) => (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.02 }}
                          className="relative group cursor-zoom-in"
                          onClick={() => onViewScreenshots(app.screenshots, idx, app.name)}
                        >
                          <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-all rounded-[2rem] z-10 flex items-center justify-center">
                             <div className="px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-full flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                               <Monitor className="w-4 h-4" /> Expand View
                             </div>
                          </div>
                          <img 
                            src={src} 
                            alt={`${app.name} interface protocol ${idx + 1}`} 
                            className="w-full rounded-[2.5rem] border border-white/10 shadow-2xl grayscale-[20%] group-hover:grayscale-0 transition-all"
                            referrerPolicy="no-referrer"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                <section className="pt-12 border-t border-white/5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    <div>
                      <div className="flex items-center gap-2 text-white/20 mb-3">
                        <Tag className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Taxonomy</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {app.tags?.map((tag: string) => (
                          <span key={tag} className="text-xs text-white/40 font-mono hover:text-cyan-400 transition-colors">
                            #{tag.replace(/\s+/g, '_').toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-white/20 mb-3">
                        <Shield className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Protocol</span>
                      </div>
                      <div className="text-xs text-white/60 font-medium">SSL_ENCRYPTED_UPLINK</div>
                      <div className="text-[8px] text-white/20 font-mono">STATUS: OPERATIONAL</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-white/20 mb-3">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Last_Update</span>
                      </div>
                      <div className="text-xs text-white/60 font-medium italic">
                        {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
