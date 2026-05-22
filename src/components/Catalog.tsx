import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, writeBatch, doc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { useAuth } from '../lib/auth';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import DeveloperPortal from './DeveloperPortal';
import AppDetailModal from './AppDetailModal';
import ScreenshotModal from './ScreenshotModal';
import { analyticsService } from '../services/analyticsService';
import { 
  ExternalLink, Tag, Globe, Smartphone, Monitor, 
  Plus, Shield, Activity, ArrowUpRight, Lock,
  CheckCircle2, Clock, Search, ShoppingCart,
  Apple, Play, Download, Sparkles, Box, Star,
  Loader2, Heart, X, Info, Rocket
} from 'lucide-react';
import { AppCardSkeleton, Skeleton } from './ui/Skeleton';

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

const StarRating = ({ 
  appId, 
  currentRating, 
  ratingCount, 
  sumOfRatings,
  userRating: initialUserRating,
  onRate 
}: { 
  appId: string; 
  currentRating: number; 
  ratingCount: number;
  sumOfRatings: number;
  userRating: number | null;
  onRate: (newRating: number) => Promise<void>;
}) => {
  const [hover, setHover] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRate = async (rating: number) => {
    setLoading(true);
    try {
      await onRate(rating);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={loading}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(null)}
            onClick={() => handleRate(star)}
            className="transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Star 
              className={`w-4 h-4 ${
                (hover !== null ? star <= hover : (initialUserRating ? star <= initialUserRating : star <= currentRating))
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-white/10'
              }`} 
            />
          </button>
        ))}
        <span className="text-[10px] font-bold text-white/40 ml-2 uppercase tracking-widest">
          {currentRating.toFixed(1)} ({ratingCount})
        </span>
        {loading && <Loader2 className="w-3 h-3 animate-spin text-cyan-500 ml-2" />}
      </div>
      {initialUserRating && (
        <div className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest">
          Your rating: {initialUserRating} stars
        </div>
      )}
    </div>
  );
};

export default function Catalog() {
  const { user, profile, isEditor, isAdmin, login, loginLoading } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showStaging, setShowStaging] = useState(false);
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [showDeveloperPortal, setShowDeveloperPortal] = useState(false);
  const [viewingScreenshots, setViewingScreenshots] = useState<{ images: string[]; index: number; appName: string } | null>(null);

  const selectedApp = apps.find(a => a.id === selectedAppId);

  useEffect(() => {
    const path = 'apps';
    setLoading(true);
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserRatings({});
      return;
    }

    const q = query(collection(db, 'app_ratings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ratings: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId === user.uid) {
          ratings[data.appId] = data.rating;
        }
      });
      setUserRatings(ratings);
    }, (error) => {
      console.warn("Could not fetch user ratings:", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setWishlist(new Set());
      return;
    }

    const q = query(collection(db, 'wishlists'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = new Set<string>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId === user.uid) {
          items.add(data.appId);
        }
      });
      setWishlist(items);
    }, (error) => {
      console.warn("Could not fetch wishlist:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const handleRateApp = async (appId: string, newRating: number) => {
    if (!user) {
      if (!loginLoading) login();
      return;
    }

    const batch = writeBatch(db);
    const ratingId = `${user.uid}_${appId}`;
    const ratingRef = doc(db, 'app_ratings', ratingId);
    const appRef = doc(db, 'apps', appId);
    
    const appDoc = apps.find(a => a.id === appId);
    if (!appDoc) return;

    const oldRating = userRatings[appId];
    const currentRatingCount = appDoc.ratingCount || 0;
    const currentSumOfRatings = appDoc.sumOfRatings || 0;

    if (oldRating) {
      // Update existing rating
      batch.update(ratingRef, { 
        rating: newRating,
        createdAt: serverTimestamp()
      });
      batch.update(appRef, {
        sumOfRatings: currentSumOfRatings - oldRating + newRating
      });
    } else {
      // Create new rating
      batch.set(ratingRef, {
        userId: user.uid,
        appId,
        rating: newRating,
        createdAt: serverTimestamp()
      });
      batch.update(appRef, {
        ratingCount: currentRatingCount + 1,
        sumOfRatings: currentSumOfRatings + newRating
      });
    }

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `apps/${appId}/rating`);
    }
  };

  const handleToggleWishlist = async (appId: string) => {
    if (!user) {
      if (!loginLoading) login();
      return;
    }

    const wishId = `${user.uid}_${appId}`;
    const wishRef = doc(db, 'wishlists', wishId);

    try {
      if (wishlist.has(appId)) {
        const batch = writeBatch(db);
        batch.delete(wishRef);
        await batch.commit();
      } else {
        await setDoc(wishRef, {
          userId: user.uid,
          appId,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `wishlists/${wishId}`);
    }
  };

  const filteredApps = apps.filter(app => {
    const platformList = Array.isArray(app.type) ? app.type : [app.type || ''];
    const typeMatch = filter === 'All' || 
                      platformList.includes('All') || 
                      platformList.includes(filter);
    
    // Visible if:
    // 1. Approved AND Production
    // 2. OR User is the Author (transparency for developers)
    // 3. OR Admin/Editor and staging is toggled
    const isAuthor = user && app.authorUid === user.uid;
    const isPubliclyVisible = app.approvalStatus === 'approved' && app.status === 'production';
    const isPendingVisible = app.approvalStatus === 'pending';
    const isStagingVisible = (isAdmin || isEditor) && showStaging;
    
    // Core visibility rule: Only show non-drafts in catalog
    if (app.isDraft) return false;

    const statusMatch = isPubliclyVisible || isPendingVisible || isAuthor || isStagingVisible;

    const wishlistMatch = !showWishlistOnly || wishlist.has(app.id);
    const searchMatch = !search || 
      app.name.toLowerCase().includes(search.toLowerCase()) || 
      app.description.toLowerCase().includes(search.toLowerCase()) ||
      app.developer?.toLowerCase().includes(search.toLowerCase()) ||
      app.tags?.some((t: string) => t.toLowerCase().includes(search.toLowerCase()));
    
    return typeMatch && statusMatch && searchMatch && wishlistMatch;
  });

  if (showDeveloperPortal) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
          <button 
            onClick={() => setShowDeveloperPortal(false)}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs"
          >
            <X className="w-4 h-4" /> Exit Portal
          </button>
        </div>
        <DeveloperPortal />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest">
            <ShoppingCart className="w-3 h-3" /> Curated Marketplace
          </div>
          <h2 className="text-4xl font-bold tracking-tighter">App Storefront</h2>
          <p className="text-white/40 max-w-md">
            Discover premium applications developed by PymmCore Solutions and our global partner network.
          </p>
          
          {user && (
            <button
              onClick={() => setShowWishlistOnly(!showWishlistOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                showWishlistOnly 
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                  : 'bg-white/5 border border-white/10 text-white/40 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${showWishlistOnly ? 'fill-current' : ''}`} />
              {showWishlistOnly ? 'Showing Wishlist' : 'Show Wishlist'}
            </button>
          )}
        </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {(isAdmin || isEditor) && (
              <div className="flex items-center gap-3 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Internal Preview</span>
                <button
                  onClick={() => setShowStaging(!showStaging)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showStaging ? 'bg-purple-600' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      showStaging ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}
            
            <div className="relative flex-1 lg:flex-none lg:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search apps or developers..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-cyan-500 outline-none transition-all"
            />
          </div>

          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            {['All', 'Web', 'Mobile', 'Desktop'].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  filter === t ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {!isAdmin && (
            <button 
              onClick={() => {
                if (!user) {
                  login();
                } else {
                  setShowDeveloperPortal(true);
                }
              }}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-cyan-600/20"
            >
              <Plus className="w-4 h-4" /> List Application
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AppCardSkeleton />
              </motion.div>
            ))
          ) : filteredApps.map((app, idx) => (
            <motion.div
              key={app.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedAppId(app.id)}
              className="group relative p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col h-full overflow-hidden cursor-pointer"
            >
              {/* Featured Badge */}
              {app.isPymmcoreProduct && (
                <div className="absolute top-0 left-0 px-4 py-1.5 bg-cyan-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-br-2xl flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Official
                </div>
              )}

              {/* Status Badge for Non-Approved Apps */}
              {app.approvalStatus === 'pending' && (
                <div className="absolute top-0 left-0 px-4 py-1.5 bg-yellow-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-br-2xl flex items-center gap-1.5 z-20">
                  <Clock className="w-3 h-3" /> Under Review
                </div>
              )}

              <div className="absolute top-6 right-6 flex items-center gap-4 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleWishlist(app.id);
                  }}
                  className={`p-2 rounded-xl transition-all ${
                    wishlist.has(app.id) 
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-lg shadow-red-500/20' 
                      : 'bg-white/5 text-white/20 border border-white/10 hover:text-white/60'
                  }`}
                  title={wishlist.has(app.id) ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`w-4 h-4 ${wishlist.has(app.id) ? 'fill-current' : ''}`} />
                </button>
                <div className="text-xl font-bold text-cyan-400">
                  {app.price}
                </div>
              </div>

              <div className="mb-8 mt-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-cyan-600/20 group-hover:border-cyan-500/30 transition-all overflow-hidden">
                  {app.icon ? (
                    <DynamicIcon name={app.icon} className="w-10 h-10 text-cyan-400" />
                  ) : (
                    <div className="flex gap-1">
                      {(Array.isArray(app.type) ? app.type : [app.type || '']).map(t => (
                        <div key={t}>
                          {t === 'Web' && <Globe className="w-6 h-6 text-cyan-400" />}
                          {t === 'Mobile' && <Smartphone className="w-6 h-6 text-purple-400" />}
                          {t === 'Desktop' && <Monitor className="w-6 h-6 text-pink-400" />}
                          {t === 'All' && <Sparkles className="w-6 h-6 text-amber-400" />}
                        </div>
              ))}
            </div>
          )}
        </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">{app.developer}</div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-cyan-400 transition-colors tracking-tight">{app.name}</h3>
                
                <div className="mb-4" onClick={e => e.stopPropagation()}>
                  <StarRating 
                    appId={app.id}
                    currentRating={app.ratingCount ? (app.sumOfRatings || 0) / app.ratingCount : 0}
                    ratingCount={app.ratingCount || 0}
                    sumOfRatings={app.sumOfRatings || 0}
                    userRating={userRatings[app.id] || null}
                    onRate={(rating) => handleRateApp(app.id, rating)}
                  />
                </div>

                <p className="text-sm text-white/40 leading-relaxed mb-6 line-clamp-3">
                  {app.description}
                </p>

                {app.features && app.features.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/20">Key Highlights</div>
                    <ul className="space-y-2.5">
                      {app.features.slice(0, 3).map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-white/50 group-hover:text-white/70 transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" /> 
                          <span className="line-clamp-1">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {app.screenshots && app.screenshots.length > 0 && (
                  <div className="mb-6 space-y-3" onClick={e => e.stopPropagation()}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Screenshots</div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {app.screenshots.map((src: string, idx: number) => (
                        <div key={idx} className="relative h-32 w-48 shrink-0">
                          <div className="absolute inset-0 z-0">
                            <Skeleton className="w-full h-full rounded-lg" />
                          </div>
                          <img 
                            src={src} 
                            alt={`${app.name} screenshot ${idx + 1}`} 
                            className="relative z-[1] h-full w-full rounded-lg border border-white/10 object-cover hover:border-cyan-500/50 transition-colors cursor-zoom-in"
                            referrerPolicy="no-referrer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingScreenshots({ images: app.screenshots, index: idx, appName: app.name });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto space-y-6" onClick={e => e.stopPropagation()}>
                <div className="flex flex-wrap gap-2">
                  {app.tags?.map((tag: string) => (
                    <span key={tag} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/30">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/5 grid grid-cols-1 gap-3">
                  {app.type === 'Mobile' || (Array.isArray(app.type) && app.type.includes('Mobile')) || app.appStoreLink || app.playStoreLink ? (
                    <div className="flex flex-col gap-2">
                      {app.appStoreLink && (
                        <a 
                          href={app.appStoreLink} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={() => analyticsService.trackDownload(app.id, app.name)}
                          className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all text-white"
                        >
                          <Apple className="w-4 h-4" /> Download on the App Store
                        </a>
                      )}
                      {app.playStoreLink && (
                        <a 
                          href={app.playStoreLink} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={() => analyticsService.trackDownload(app.id, app.name)}
                          className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all text-white"
                        >
                          <Play className="w-4 h-4 text-green-400" /> Download on Google Play
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <a 
                        href={app.type === 'Desktop' && app.demoLink ? app.demoLink : app.link} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={() => analyticsService.trackDownload(app.id, app.name)}
                        className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-cyan-600/20"
                      >
                        <Globe className="w-4 h-4" /> Launch App
                      </a>
                      {app.type === 'Desktop' && (
                        <a 
                          href={app.link} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={() => analyticsService.trackDownload(app.id, app.name)}
                          className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                          <Download className="w-4 h-4" /> Download
                        </a>
                      )}
                      {app.demoLink && app.type !== 'Desktop' && (
                        <a 
                          href={app.demoLink} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={() => analyticsService.trackDownload(app.id, app.name)}
                          className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                          Demo
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredApps.length === 0 && (
          <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.02]">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-8 h-8 text-white/10" />
            </div>
            <h4 className="text-xl font-bold mb-2">No Applications Found</h4>
            <p className="text-sm text-white/20 max-w-xs mx-auto">
              We couldn't find any applications matching your criteria in the storefront.
            </p>
          </div>
        )}
      </div>
      {/* Detailed App View Modal */}
      <AppDetailModal
        app={selectedApp}
        isOpen={!!selectedAppId}
        onClose={() => setSelectedAppId(null)}
        onToggleWishlist={handleToggleWishlist}
        isInWishlist={selectedAppId ? wishlist.has(selectedAppId) : false}
        userRatings={userRatings}
        onRate={handleRateApp}
        onViewScreenshots={(images, index, appName) => setViewingScreenshots({ images, index, appName })}
      />

      {/* Screenshot Viewer Modal */}
      <AnimatePresence>
        {viewingScreenshots && (
          <ScreenshotModal
            screenshots={viewingScreenshots.images}
            initialIndex={viewingScreenshots.index}
            appName={viewingScreenshots.appName}
            onClose={() => setViewingScreenshots(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
