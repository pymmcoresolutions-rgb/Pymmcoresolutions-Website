import { useState, useEffect } from 'react';
import { 
  collection, query, where, onSnapshot, 
  doc, setDoc, serverTimestamp, getDocs,
  limit, orderBy 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Share2, Music2, Instagram, Linkedin, 
  Video, Sparkles, Send, CheckCircle2, 
  Loader2, AlertCircle, Eye, ThumbsUp, 
  TrendingUp, Download, Shield, ExternalLink,
  Edit3, Play, BarChart3, RefreshCcw
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { generateSocialMarketingInfo, generateMarketingVideo } from '../../services/geminiService';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import axios from 'axios';

interface App {
  id: string;
  name: string;
  description: string;
  features: string[];
  link: string;
  screenshots?: string[];
}

interface SocialPost {
  id: string;
  appId: string;
  appName: string;
  caption: string;
  videoUrl: string;
  platforms: string[];
  status: 'pending' | 'dispatched' | 'failed';
  analytics?: {
    views: number;
    likes: number;
    shares: number;
  };
  createdAt: any;
}

export default function SocialShipper() {
  const { logActivity } = useAuth();
  const [apps, setApps] = useState<App[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  
  const [preview, setPreview] = useState<{
    caption: string;
    videoPrompt: string;
    videoUrl: string;
  } | null>(null);

  const [connectedPlatforms, setConnectedPlatforms] = useState({
    tiktok: false,
    instagram: false,
    linkedin: false
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'AUTH_SUCCESS') {
        setConnectedPlatforms(prev => ({ ...prev, [event.data.platform]: true }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogin = (platform: string) => {
    // Generate OAuth URL (In real app, fetch from server or use platform SDK)
    const baseUrl = `${window.location.origin}/api/auth/${platform}/callback?code=mock_auth_code`;
    
    // Construct the actual provider login URL
    let authUrl = '';
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/${platform}/callback`);
    
    if (platform === 'tiktok') authUrl = `https://www.tiktok.com/auth/authorize?client_key=MOCK_CLIENT&scope=video.upload&response_type=code&redirect_uri=${redirectUri}`;
    else if (platform === 'linkedin') authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=MOCK_CLIENT&redirect_uri=${redirectUri}&scope=w_member_social`;
    else if (platform === 'instagram') authUrl = `https://api.instagram.com/oauth/authorize?client_id=MOCK_CLIENT&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code`;

    // For demo/previe purposes, we just open the callback directly
    window.open(baseUrl, 'SocialLogin', 'width=600,height=700');
  };

  useEffect(() => {
    // Load approved apps
    const appsUnsub = onSnapshot(
      query(collection(db, 'apps'), where('approvalStatus', '==', 'approved')),
      (snap) => {
        setApps(snap.docs.map(d => ({ id: d.id, ...d.data() } as App)));
        setLoading(false);
      }
    );

    // Load recent social posts
    const postsUnsub = onSnapshot(
      query(collection(db, 'social_posts'), orderBy('createdAt', 'desc'), limit(10)),
      (snap) => {
        setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as SocialPost)));
      }
    );

    return () => {
      appsUnsub();
      postsUnsub();
    };
  }, []);

  const handleGenerate = async () => {
    const app = apps.find(a => a.id === selectedAppId);
    if (!app) return;

    setIsGenerating(true);
    try {
      const marketing = await generateSocialMarketingInfo({
        name: app.name,
        description: app.description,
        features: app.features || [],
        link: app.link
      });

      // Generate video (async)
      const videoUrl = await generateMarketingVideo(marketing.videoPrompt);

      setPreview({
        caption: marketing.caption,
        videoPrompt: marketing.videoPrompt,
        videoUrl: videoUrl
      });
    } catch (error) {
      console.error("Content generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDispatch = async () => {
    if (!preview || !selectedAppId) return;
    const app = apps.find(a => a.id === selectedAppId);
    if (!app) return;

    setIsDispatching(true);
    try {
      const response = await axios.post('/api/publish', {
        appId: selectedAppId,
        caption: preview.caption,
        videoUrl: preview.videoUrl,
        platforms: Object.entries(connectedPlatforms).filter(([_, v]) => v).map(([k]) => k)
      });

      if (response.data.success) {
        const postId = `post_${Date.now()}`;
        const postData: SocialPost = {
          id: postId,
          appId: selectedAppId,
          appName: app.name,
          caption: preview.caption,
          videoUrl: preview.videoUrl,
          platforms: Object.entries(connectedPlatforms).filter(([_, v]) => v).map(([k]) => k),
          status: 'dispatched',
          analytics: { views: 0, likes: 0, shares: 0 },
          createdAt: serverTimestamp()
        };

        await setDoc(doc(db, 'social_posts', postId), postData);
        await logActivity('SOCIAL_DISPATCH', { appId: selectedAppId, platforms: postData.platforms });
        
        alert(response.data.message);
        setPreview(null);
        setSelectedAppId('');
      }
    } catch (error) {
      console.error("Dispatch failed:", error);
      alert("Dispatch sequence failed. Internal mesh error.");
    } finally {
      setIsDispatching(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 italic text-white/20">
      Synchronizing with social mesh...
    </div>
  );

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
            <Share2 className="w-8 h-8 text-cyan-400" /> Social Shipper
          </h2>
          <p className="text-white/40 text-sm mt-1">Multi-platform automated marketing dispatch system.</p>
        </div>

        <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Post Creator</button>
          <button className="px-4 py-2 hover:bg-white/5 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Analytics</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Selector & Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-2">Target Node</label>
              <select 
                value={selectedAppId}
                onChange={e => setSelectedAppId(e.target.value)}
                className="w-full px-5 py-4 bg-black border border-white/10 rounded-2xl outline-none focus:border-cyan-500 transition-all font-bold text-sm"
              >
                <option value="">Select app for dispatch...</option>
                {apps.map(app => (
                  <option key={app.id} value={app.id}>{app.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-2">Distribution Mesh</label>
              <div className="grid grid-cols-1 gap-3">
                <PlatformToggle 
                  icon={<Music2 className="w-4 h-4" />} 
                  name="TikTok" 
                  connected={connectedPlatforms.tiktok} 
                  onToggle={() => connectedPlatforms.tiktok ? setConnectedPlatforms(p => ({ ...p, tiktok: false })) : handleLogin('tiktok')}
                />
                <PlatformToggle 
                  icon={<Instagram className="w-4 h-4" />} 
                  name="Instagram" 
                  connected={connectedPlatforms.instagram} 
                  onToggle={() => connectedPlatforms.instagram ? setConnectedPlatforms(p => ({ ...p, instagram: false })) : handleLogin('instagram')}
                />
                <PlatformToggle 
                  icon={<Linkedin className="w-4 h-4" />} 
                  name="LinkedIn" 
                  connected={connectedPlatforms.linkedin} 
                  onToggle={() => connectedPlatforms.linkedin ? setConnectedPlatforms(p => ({ ...p, linkedin: false })) : handleLogin('linkedin')}
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!selectedAppId || isGenerating}
              className="w-full py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? 'Synthesizing Content...' : 'Generate Social Content'}
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
            <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-white/40 leading-relaxed italic">
              AI-generated content will include a 5% opacity PymmCore watermark automatically.
            </p>
          </div>
        </div>

        {/* Right Column: Preview & Dispatch */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {preview ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-black/60 border border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-3xl shadow-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Visual Preview */}
                    <div className="aspect-[9/16] bg-gradient-to-br from-gray-900 to-black relative flex items-center justify-center overflow-hidden border-r border-white/5">
                      {preview.videoUrl ? (
                         <video 
                          src={preview.videoUrl} 
                          autoPlay 
                          loop 
                          muted 
                          className="w-full h-full object-cover"
                         />
                      ) : (
                        <div className="text-center space-y-4 px-8">
                          <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto border border-cyan-500/20">
                            <Video className="w-8 h-8 text-cyan-400 animate-pulse" />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-white/60">Generating Promo Reel</p>
                            <p className="text-[10px] text-white/20 mt-2 px-4 italic leading-relaxed">"{preview.videoPrompt}"</p>
                          </div>
                        </div>
                      )}

                      {/* Watermark */}
                      <div className="absolute bottom-6 right-6 opacity-5 pointer-events-none select-none">
                        <img src="/logo.png" alt="PymmCore" className="w-24 grayscale brightness-200" />
                      </div>

                      {/* Info Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                      <div className="absolute bottom-8 left-8 right-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                            <Download className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white uppercase tracking-widest">Approved Protocol</p>
                            <p className="text-[10px] text-white/40">PYMMCORE-MATRIX-PROMO-V1</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Editor & Actions */}
                    <div className="p-10 space-y-8 flex flex-col h-full">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                            <Edit3 className="w-5 h-5 text-cyan-400" /> Caption Editor
                          </h3>
                        </div>
                        <textarea 
                          value={preview.caption}
                          onChange={e => setPreview({ ...preview, caption: e.target.value })}
                          className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-6 outline-none focus:border-cyan-500 transition-all text-sm leading-relaxed font-medium resize-none"
                        />
                        <div className="flex flex-wrap gap-2">
                          <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[10px] font-bold text-cyan-400">#PymmCore</div>
                          <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[10px] font-bold text-cyan-400">#Approved</div>
                          <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[10px] font-bold text-cyan-400">#MatrixLive</div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-10 border-t border-white/5">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/20">
                          <span>Target Destinations</span>
                          <span className="text-cyan-400">{Object.values(connectedPlatforms).filter(Boolean).length} Active</span>
                        </div>
                        <button 
                          onClick={handleDispatch}
                          disabled={isDispatching}
                          className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl hover:bg-cyan-400 hover:text-black transition-all flex items-center justify-center gap-3"
                        >
                          {isDispatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          {isDispatching ? 'Dispatching Signals...' : 'One-Click Publish'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="aspect-video bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mb-6">
                  <Play className="w-10 h-10 text-white/10" />
                </div>
                <h3 className="text-xl font-bold text-white/40 uppercase tracking-widest">No Active Campaign</h3>
                <p className="text-xs text-white/20 mt-4 max-w-sm leading-relaxed italic">
                  Select an approved application and synthesize social content to begin the multi-platform marketing sequence.
                </p>
              </div>
            )}
          </AnimatePresence>

          {/* Social History/Analytics */}
          <div className="mt-12 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-white/20 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Real-time Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map(post => (
                <div key={post.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-sm">{post.appName}</h4>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Dispatched {post.createdAt?.toDate?.()?.toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-1">
                      {post.platforms.map(p => (
                        <div key={p} className="p-1.5 bg-white/5 rounded-lg border border-white/10">
                          {p === 'tiktok' && <Music2 className="w-3 h-3 text-white/40" />}
                          {p === 'instagram' && <Instagram className="w-3 h-3 text-white/40" />}
                          {p === 'linkedin' && <Linkedin className="w-3 h-3 text-white/40" />}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <AnalyticsChip icon={<Eye className="w-3 h-3" />} value={post.analytics?.views || 0} label="Views" />
                    <AnalyticsChip icon={<ThumbsUp className="w-3 h-3" />} value={post.analytics?.likes || 0} label="Likes" />
                    <AnalyticsChip icon={<TrendingUp className="w-3 h-3" />} value={post.analytics?.shares || 0} label="Shares" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlatformToggle({ icon, name, connected, onToggle }: { icon: any, name: string, connected: boolean, onToggle: () => void }) {
  return (
    <button 
      onClick={onToggle}
      className={`p-4 rounded-xl border transition-all flex items-center justify-between group ${
        connected ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/10 opacity-40 hover:opacity-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          connected ? 'bg-cyan-500 text-black' : 'bg-white/10 text-white'
        }`}>
          {icon}
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest ${connected ? 'text-white' : 'text-white/40'}`}>
          {name}
        </span>
      </div>
      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
        connected ? 'bg-cyan-500 border-cyan-500' : 'border-white/20'
      }`}>
        {connected && <CheckCircle2 className="w-3 h-3 text-black" />}
      </div>
    </button>
  );
}

function AnalyticsChip({ icon, value, label }: { icon: any, value: number, label: string }) {
  return (
    <div className="px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-center">
      <div className="flex items-center justify-center gap-1.5 text-white/20 mb-1">
        {icon}
        <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-xs font-black text-cyan-400">
        {value > 1000 ? `${(value/1000).toFixed(1)}k` : value}
      </div>
    </div>
  );
}
