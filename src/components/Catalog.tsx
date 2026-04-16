import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, writeBatch, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { useAuth } from '../lib/auth';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { 
  ExternalLink, Tag, Globe, Smartphone, Monitor, 
  Plus, Shield, Activity, ArrowUpRight, Lock,
  CheckCircle2, Clock, Search, ShoppingCart,
  Apple, Play, Download, Sparkles, Box, Star,
  Loader2
} from 'lucide-react';

// Helper to render dynamic Lucide icons
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
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
  const { user, profile, isEditor, isAdmin, login } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showStaging, setShowStaging] = useState(false);

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

  const handleRateApp = async (appId: string, newRating: number) => {
    if (!user) {
      login();
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

  const filteredApps = apps.filter(app => {
    const typeMatch = filter === 'All' || app.type === filter;
    const statusMatch = isEditor ? (showStaging || app.status === 'production') : app.status === 'production';
    const searchMatch = !search || 
      app.name.toLowerCase().includes(search.toLowerCase()) || 
      app.description.toLowerCase().includes(search.toLowerCase()) ||
      app.developer?.toLowerCase().includes(search.toLowerCase()) ||
      app.tags?.some((t: string) => t.toLowerCase().includes(search.toLowerCase()));
    return typeMatch && statusMatch && searchMatch;
  });

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
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
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

          {isEditor && (
            <a 
              href="#admin"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" /> List Application
            </a>
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
              className="group relative p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col h-full overflow-hidden"
            >
              {/* Featured Badge */}
              {app.isPymmcoreProduct && (
                <div className="absolute top-0 left-0 px-4 py-1.5 bg-blue-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-br-2xl flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Official
                </div>
              )}

              <div className="absolute top-6 right-6 text-xl font-bold text-blue-400">
                {app.price}
              </div>

              <div className="mb-8 mt-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-blue-600/20 group-hover:border-blue-500/30 transition-all overflow-hidden">
                  {app.icon ? (
                    app.icon.startsWith('data:image') ? (
                      <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
                    ) : (
                      <DynamicIcon name={app.icon} className="w-8 h-8 text-blue-400" />
                    )
                  ) : (
                    <>
                      {app.type === 'Web' && <Globe className="w-8 h-8 text-blue-400" />}
                      {app.type === 'Mobile' && <Smartphone className="w-8 h-8 text-purple-400" />}
                      {app.type === 'Desktop' && <Monitor className="w-8 h-8 text-pink-400" />}
                    </>
                  )}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">{app.developer}</div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors tracking-tight">{app.name}</h3>
                
                <div className="mb-4">
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
                  <div className="mb-6 space-y-3">
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

              <div className="mt-auto space-y-6">
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
    </div>
  );
}
