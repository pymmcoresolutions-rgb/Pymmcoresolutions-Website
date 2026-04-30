import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, writeBatch, doc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { useAuth } from '../lib/auth';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import DeveloperPortal from './DeveloperPortal';
import { 
  ExternalLink, Tag, Globe, Smartphone, Monitor, 
  Plus, Shield, Activity, ArrowUpRight, Lock,
  CheckCircle2, Clock, Search, ShoppingCart,
  Apple, Play, Download, Sparkles, Box, Star,
  Loader2, Heart, X, Info, Rocket
} from 'lucide-react';

// Helper to render dynamic Lucide icons
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  if (!name) return <Box className={className} />;
  
  if (name.startsWith('data:image') || name.startsWith('http')) {
    return <img src={name} alt="Icon" className={`${className} object-cover rounded-lg`} />;
  }

  const Icon = (LucideIcons as any)[name] || Box;
  return <Icon className={className} />;
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
        {loading && <Loader2 className="w-3 h-3 animate-spin text-blue-500 ml-2" />}
      </div>
      {initialUserRating && (
        <div className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">
          Your rating: {initialUserRating} stars
        </div>
      )}
    </div>
  );
};

export default function Catalog() {
  const { user, profile, isEditor, isAdmin, login, loginLoading } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showStaging, setShowStaging] = useState(false);
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [showDeveloperPortal, setShowDeveloperPortal] = useState(false);

  const selectedApp = apps.find(a => a.id === selectedAppId);

  useEffect(() => {
    const path = 'apps';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
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
    
    // Safety check for regular users vs admins
    // Visible if approved AND active OR if admin/editor and staging is toggled
    const statusMatch = isAdmin || isEditor 
      ? (showStaging || (app.approvalStatus === 'approved' && app.status === 'active'))
      : (app.approvalStatus === 'approved' && app.status === 'active');

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
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
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Staging Mesh</span>
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
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 outline-none transition-all"
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
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" /> List Application
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredApps.map((app, idx) => (
            <motion.div
              key={app.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedAppId(app.id)}
              className="group relative p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col h-full overflow-hidden cursor-pointer"
            >
              {/* Featured Badge */}
              {app.isPymmcoreProduct && (
                <div className="absolute top-0 left-0 px-4 py-1.5 bg-blue-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-br-2xl flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Official
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
                <div className="text-xl font-bold text-blue-400">
                  {app.price}
                </div>
              </div>

              <div className="mb-8 mt-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-blue-600/20 group-hover:border-blue-500/30 transition-all overflow-hidden">
                  {app.icon ? (
                    <DynamicIcon name={app.icon} className="w-10 h-10 text-blue-400" />
                  ) : (
                    <div className="flex gap-1">
                      {(Array.isArray(app.type) ? app.type : [app.type || '']).map(t => (
                        <div key={t}>
                          {t === 'Web' && <Globe className="w-6 h-6 text-blue-400" />}
                          {t === 'Mobile' && <Smartphone className="w-6 h-6 text-purple-400" />}
                          {t === 'Desktop' && <Monitor className="w-6 h-6 text-pink-400" />}
                          {t === 'All' && <Sparkles className="w-6 h-6 text-amber-400" />}
                        </div>
              ))}
            </div>
          )}
        </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">{app.developer}</div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors tracking-tight">{app.name}</h3>
                
                <div className="mb-4" onClick={e => e.stopPropagation()}>
                  <StarRating 
                    appId={app.id}
                    currentRating={app.ratingCount ? app.sumOfRatings / app.ratingCount : 0}
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
                  <ul className="space-y-2 mb-6">
                    {app.features.slice(0, 3).map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-white/60">
                        <CheckCircle2 className="w-3 h-3 text-blue-500" /> {f}
                      </li>
                    ))}
                  </ul>
                )}

                {app.screenshots && app.screenshots.length > 0 && (
                  <div className="mb-6 space-y-3" onClick={e => e.stopPropagation()}>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Screenshots</div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {app.screenshots.map((src: string, idx: number) => (
                        <img 
                          key={idx} 
                          src={src} 
                          alt={`${app.name} screenshot ${idx + 1}`} 
                          className="h-32 rounded-lg border border-white/10 object-cover shrink-0 hover:border-blue-500/50 transition-colors cursor-zoom-in"
                          referrerPolicy="no-referrer"
                          onClick={() => window.open(src, '_blank')}
                        />
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
                  {app.type === 'Mobile' ? (
                    <div className="flex gap-2">
                      {app.appStoreLink && (
                        <a 
                          href={app.appStoreLink} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                          <Apple className="w-4 h-4" /> App Store
                        </a>
                      )}
                      {app.playStoreLink && (
                        <a 
                          href={app.playStoreLink} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                          <Play className="w-4 h-4" /> Play Store
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <a 
                        href={app.type === 'Desktop' && app.demoLink ? app.demoLink : app.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
                      >
                        <Globe className="w-4 h-4" /> Launch App
                      </a>
                      {app.type === 'Desktop' && (
                        <a 
                          href={app.link} 
                          target="_blank" 
                          rel="noreferrer"
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
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedAppId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-[3rem] w-full max-w-5xl overflow-hidden shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedAppId(null)}
                className="absolute top-8 right-8 p-3 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all z-20"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left Side: Visuals & Links */}
                <div className="p-8 lg:p-12 space-y-8 bg-white/[0.02]">
                  <div className="flex flex-wrap gap-4 items-start justify-between">
                    <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-xl">
                      <DynamicIcon name={selectedApp.icon} className="w-16 h-16 text-blue-400" />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleToggleWishlist(selectedApp.id)}
                        className={`p-4 rounded-2xl transition-all ${
                          wishlist.has(selectedApp.id) 
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                            : 'bg-white/5 text-white/40 border border-white/10 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-6 h-6 ${wishlist.has(selectedApp.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      {(Array.isArray(selectedApp.type) ? selectedApp.type : [selectedApp.type || '']).map(t => (
                        <span key={t} className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                          {t}
                        </span>
                      ))}
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                        v{selectedApp.version || '1.0.0'}
                      </span>
                    </div>
                    <h2 className="text-5xl font-bold tracking-tighter">{selectedApp.name}</h2>
                    <p className="text-xl text-blue-400 font-bold">{selectedApp.price}</p>
                  </div>

                  <div className="pt-8 border-t border-white/5 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {selectedApp.appStoreLink && (
                        <a 
                          href={selectedApp.appStoreLink} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
                        >
                          <Apple className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                          <div className="text-left">
                            <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Download on</div>
                            <div className="text-xs font-bold">App Store</div>
                          </div>
                        </a>
                      )}
                      {selectedApp.playStoreLink && (
                        <a 
                          href={selectedApp.playStoreLink} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
                        >
                          <Play className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform" />
                          <div className="text-left">
                            <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Get it on</div>
                            <div className="text-xs font-bold">Google Play</div>
                          </div>
                        </a>
                      )}
                    </div>
                    
                    <a 
                      href={(Array.isArray(selectedApp.type) ? selectedApp.type.includes('Desktop') : selectedApp.type === 'Desktop') && selectedApp.demoLink ? selectedApp.demoLink : selectedApp.link} 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20"
                    >
                      <ExternalLink className="w-5 h-5" />
                      {(Array.isArray(selectedApp.type) ? selectedApp.type.includes('Desktop') : selectedApp.type === 'Desktop') ? 'Download for Desktop' : 'Launch Application'}
                    </a>

                    {selectedApp.demoLink && (
                      <a 
                        href={selectedApp.demoLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3"
                      >
                        <Globe className="w-5 h-5" />
                        Explore Interactive Demo
                      </a>
                    )}
                  </div>
                </div>

                {/* Right Side: Details */}
                <div className="p-8 lg:p-12 space-y-10 max-h-[80vh] overflow-y-auto">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-400">
                      <Info className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Overview</span>
                    </div>
                    <p className="text-white/60 leading-relaxed text-lg">
                      {selectedApp.description}
                    </p>
                  </section>

                  {selectedApp.features && selectedApp.features.length > 0 && (
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 text-blue-400">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Core Capabilities</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedApp.features.map((f: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                            <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                            <span className="text-sm text-white/80">{f}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {selectedApp.screenshots && selectedApp.screenshots.length > 0 && (
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 text-blue-400">
                        <Monitor className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Visual Deployment</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {selectedApp.screenshots.map((src: string, idx: number) => (
                          <img 
                            key={idx} 
                            src={src} 
                            alt={`${selectedApp.name} view ${idx + 1}`} 
                            className="w-full rounded-2xl border border-white/10 hover:border-blue-500/50 transition-colors"
                            referrerPolicy="no-referrer"
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="pt-8 border-t border-white/5 grid grid-cols-2 gap-8">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2">Developed By</div>
                      <div className="text-sm font-bold text-white/80">{selectedApp.developer}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2">Review Status</div>
                      <div className="scale-75 origin-left">
                        <StarRating 
                          appId={selectedApp.id}
                          currentRating={selectedApp.ratingCount ? selectedApp.sumOfRatings / selectedApp.ratingCount : 0}
                          ratingCount={selectedApp.ratingCount || 0}
                          sumOfRatings={selectedApp.sumOfRatings || 0}
                          userRating={userRatings[selectedApp.id] || null}
                          onRate={(rating) => handleRateApp(selectedApp.id, rating)}
                        />
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
