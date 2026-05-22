import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import ImageUploader from '../ui/ImageUploader';
import StoreLinksForm from '../ui/StoreLinksForm';
import { optimizeMetadata, generateIconSuggestion } from '../../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { 
  Plus, Sparkles, Loader2, Check, Trash2, Edit3, 
  ExternalLink, Globe, Smartphone, Monitor, ChevronRight,
  Layers, History, Shield, Upload, Image as ImageIcon, Info, X, CheckCircle2, AlertCircle
} from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import { ListItemSkeleton } from '../ui/Skeleton';

// Helper to render dynamic Lucide icons
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  if (!name) return <ImageIcon className={className} />;
  
  if (name.startsWith('data:image') || name.startsWith('http')) {
    return <img src={name} alt="Icon" className={`${className} object-cover rounded-lg`} />;
  }

  const Icon = (LucideIcons as any)[name] || LucideIcons.Box;
  return <Icon className={className} />;
};

export default function NodeManager() {
  const { user, logActivity } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [generatingIcon, setGeneratingIcon] = useState(false);
  const [iconSuggestions, setIconSuggestions] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [form, setForm] = useState<any>({
    name: '',
    description: '',
    type: ['Web'],
    category: 'Utilities',
    link: '',
    tags: '',
    status: 'production',
    version: '1.0.0',
    developer: 'PymmCore Solutions',
    price: 'Free',
    isPymmcoreProduct: true,
    expectedLaunchDate: '',
    appStoreLink: '',
    playStoreLink: '',
    demoLink: '',
    features: [],
    icon: '',
    screenshots: ''
  });
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [playStoreLinkValid, setPlayStoreLinkValid] = useState(true);
  const [appStoreLinkValid, setAppStoreLinkValid] = useState(true);

  useEffect(() => {
    setInitialLoading(true);
    const q = query(collection(db, 'apps'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setInitialLoading(false);
    }, (err) => {
      console.error("Failed to fetch apps:", err);
      setErrorLocal(err.message);
      setInitialLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const CATEGORIES = [
    'Productivity', 'Finance', 'Education', 'Entertainment', 
    'Health & Fitness', 'Lifestyle', 'Utilities', 'Social',
    'Business', 'Developer Tools', 'Other'
  ];

  const handleOptimize = async () => {
    if (!form.name || !form.description) return;
    setOptimizing(true);
    try {
      const optimized = await optimizeMetadata(form.name, form.description);
      setForm(prev => ({ 
        ...prev, 
        description: optimized.description,
        tags: Array.isArray(optimized.tags) ? optimized.tags.join(', ') : prev.tags
      }));
    } catch (error) {
      console.error("Optimization failed:", error);
    }
    setOptimizing(false);
  };

  const handleGenerateIcon = async () => {
    if (!form.name || !form.description) return;
    setGeneratingIcon(true);
    try {
      const suggestions = await generateIconSuggestion(form.name, form.description);
      setIconSuggestions(suggestions);
      if (suggestions.length > 0) {
        setForm(prev => ({ ...prev, icon: suggestions[0] }));
      }
    } catch (error) {
      console.error("Icon generation failed:", error);
    }
    setGeneratingIcon(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.type || (Array.isArray(form.type) && form.type.length === 0)) {
      alert("Please select at least one platform node.");
      return;
    }

    // Validate store links
    if (!playStoreLinkValid || (form.playStoreLink?.trim() && !form.playStoreLink.trim().includes('play.google.com/store/apps/details?id='))) {
      setErrorLocal("Please enter a valid Google Play Store URL (containing play.google.com/store/apps/details?id=)");
      return;
    }
    if (!appStoreLinkValid || (form.appStoreLink?.trim() && !form.appStoreLink.trim().includes('apps.apple.com/'))) {
      setErrorLocal("Please enter a valid Apple App Store URL (containing apps.apple.com/)");
      return;
    }

    setLoading(true);
    try {
      const nodeData = {
        ...form,
        playStoreLink: form.playStoreLink ? form.playStoreLink.trim() : '',
        appStoreLink: form.appStoreLink ? form.appStoreLink.trim() : '',
        type: Array.isArray(form.type) ? form.type : [form.type],
        tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        features: Array.isArray(form.features) ? form.features : [],
        screenshots: form.screenshots.split('\n').map((s: string) => s.trim()).filter(Boolean),
        authorUid: user.uid,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        try {
          await updateDoc(doc(db, 'apps', editingId), {
            ...nodeData,
            approvalStatus: 'approved', // Keep editors' changes live if they were already approved
            paymentStatus: 'paid'
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `apps/${editingId}`);
        }
        await logActivity('app_updated', { name: form.name, id: editingId });
      } else {
        let docRef;
        try {
          docRef = await addDoc(collection(db, 'apps'), {
            ...nodeData,
            createdAt: serverTimestamp(),
            approvalStatus: 'pending', // Admin-registered apps now go to pending for review
            paymentStatus: 'paid',
            status: 'staging' // Set to staging until approved
          });
          // No alert here to avoid iframe issues
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'apps');
          return; // Stop if addDoc fails
        }
        
        await logActivity('app_submitted_for_review', { name: form.name, id: docRef.id });
      }

      // Success feedback
      // The user specifically requested a page refresh/redirect behavior
      // We will reset the view and provide a slight delay for the Firestore snapshot to catch up
        setTimeout(() => {
          setForm({ 
            name: '', description: '', type: ['Web'], category: 'Utilities', link: '', tags: '', status: 'production', version: '1.0.0',
            developer: 'PymmCore Solutions', price: 'Free', isPymmcoreProduct: true, expectedLaunchDate: '',
            appStoreLink: '', playStoreLink: '', demoLink: '', features: [], icon: '', screenshots: ''
          });
          setIconSuggestions([]);
          setLoading(false);
          setIsAdding(false);
          setEditingId(null);
        }, 1000);
    } catch (error) {
      console.error("Submission failed:", error);
      setLoading(false);
    }
  };

  const handleEdit = (app: any) => {
    setForm({
      name: app.name,
      description: app.description,
      type: Array.isArray(app.type) ? app.type : [app.type || 'Web'],
      category: app.category || 'Utilities',
      link: app.link,
      tags: Array.isArray(app.tags) ? app.tags.join(', ') : '',
      status: app.status,
      version: app.version || '1.0.0',
      developer: app.developer || 'PymmCore Solutions',
      price: app.price || 'Free',
      isPymmcoreProduct: app.isPymmcoreProduct ?? true,
      expectedLaunchDate: app.expectedLaunchDate || '',
      appStoreLink: app.appStoreLink || '',
      playStoreLink: app.playStoreLink || '',
      demoLink: app.demoLink || '',
      features: Array.isArray(app.features) ? app.features : [],
      icon: app.icon || '',
      screenshots: Array.isArray(app.screenshots) ? app.screenshots.join('\n') : ''
    });
    setEditingId(app.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteDoc(doc(db, 'apps', id));
      await logActivity('node_deleted', { name, id });
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const toggleStatus = async (app: any) => {
    const newStatus = app.status === 'production' ? 'staging' : 'production';
    try {
      await updateDoc(doc(db, 'apps', app.id), { status: newStatus });
      await logActivity('node_status_changed', { name: app.name, status: newStatus });
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" /> Application Directory
        </h3>
        <button
          onClick={() => {
            if (isAdding) {
              setEditingId(null);
              setIconSuggestions([]);
              setForm({ 
                name: '', 
                description: '', 
                type: 'Web', 
                link: '', 
                tags: '', 
                status: 'production', 
                version: '1.0.0',
                developer: 'PymmCore Solutions',
                price: 'Free',
                isPymmcoreProduct: true,
                expectedLaunchDate: '',
                appStoreLink: '',
                playStoreLink: '',
                demoLink: '',
                features: [],
                icon: '',
                screenshots: ''
              });
            }
            setIsAdding(!isAdding);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
        >
          {isAdding ? <Plus className="w-4 h-4 rotate-45" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Cancel' : 'New Application'}
        </button>
      </div>

      {errorLocal && (
        <div className="p-6 rounded-[2rem] bg-red-500/5 border border-red-500/10 flex items-center gap-4 text-red-500">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">System Signal Error</h4>
            <p className="text-xs opacity-70 font-mono uppercase">{errorLocal}</p>
          </div>
          <button onClick={() => setErrorLocal(null)} className="p-2 hover:bg-red-500/10 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-3xl bg-white/5 border border-white/10"
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2">Primary Category</label>
                <select 
                  required
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-blue-500 transition-all text-sm appearance-none"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 px-2">Application Icon</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUploader 
                    label="Custom Image Upload"
                    currentImage={form.icon?.startsWith('data:image') ? form.icon : ''}
                    onUpload={(base64) => setForm({ ...form, icon: base64 })}
                    maxSizeMB={0.5}
                  />
                  <div className="space-y-4">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center mb-4 transition-all group-hover:scale-105">
                        <DynamicIcon name={form.icon} className="w-8 h-8 text-blue-400" />
                      </div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
                        Recommended: 512x512px<br/>PNG, JPG or SVG
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateIcon}
                        disabled={generatingIcon || !form.name || !form.description}
                        className="flex-1 py-3 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-blue-400 hover:text-white"
                      >
                        {generatingIcon ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        Smart Icon Suggestion
                      </button>
                    </div>

                    {iconSuggestions.length > 0 && (
                      <div className="pt-4 border-t border-white/5">
                        <label className="block text-[8px] font-black uppercase tracking-widest text-white/20 mb-3">AI Recommendations</label>
                        <div className="flex flex-wrap gap-2">
                          {iconSuggestions.map((icon) => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() => setForm({ ...form, icon })}
                              className={`p-2 rounded-lg border transition-all ${
                                form.icon === icon 
                                  ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                                  : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                              }`}
                              title={icon}
                            >
                              <DynamicIcon name={icon} className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Icon Name (Lucide)</label>
                  <input
                    value={form.icon?.startsWith('data:image') ? '' : form.icon}
                    onChange={e => setForm({ ...form, icon: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm font-mono"
                    placeholder="e.g. Shield, Cpu, Zap"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">App Title</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="e.g. Quantum Analytics"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Available Platforms</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Web', 'Mobile', 'Desktop', 'All'].map((p) => {
                    const platformList = Array.isArray(form.type) ? form.type : [form.type || ''];
                    const isActive = platformList.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          let next = [...platformList];
                          if (p === 'All') {
                            next = isActive ? [] : ['All'];
                          } else {
                            next = next.filter(t => t !== 'All');
                            if (isActive) next = next.filter(t => t !== p);
                            else next.push(p);
                          }
                          setForm({ ...form, type: next });
                        }}
                        className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                          isActive 
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                        }`}
                      >
                        {p === 'Web' && <Globe className="w-3 h-3" />}
                        {p === 'Mobile' && <Smartphone className="w-3 h-3" />}
                        {p === 'Desktop' && <Monitor className="w-3 h-3" />}
                        {p === 'All' && <Sparkles className="w-3 h-3" />}
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Price</label>
                  <input
                    required
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="Free or $9.99"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Developer</label>
                  <input
                    required
                    value={form.developer}
                    onChange={e => setForm({ ...form, developer: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <input 
                  type="checkbox"
                  checked={form.isPymmcoreProduct}
                  onChange={e => setForm({ ...form, isPymmcoreProduct: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 bg-black/40 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-xs font-bold uppercase tracking-widest text-white/60">Official PymmCore Product</label>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Expected Launch Date</label>
                <input
                  value={form.expectedLaunchDate}
                  onChange={e => setForm({ ...form, expectedLaunchDate: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="e.g. Q4 2026 or Coming Soon"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Primary Link (Download/Web)</label>
                <input
                  required
                  type="url"
                  value={form.link}
                  onChange={e => setForm({ ...form, link: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="https://..."
                />
              </div>
              <StoreLinksForm
                playStoreLink={form.playStoreLink || ''}
                appStoreLink={form.appStoreLink || ''}
                onChange={(field, value, isValid) => {
                  setForm((prev: any) => ({ ...prev, [field]: value }));
                  if (field === 'playStoreLink') setPlayStoreLinkValid(isValid);
                  else setAppStoreLinkValid(isValid);
                }}
              />
              {(form.type?.includes('Web') || form.type?.includes('Desktop') || form.type?.includes('All')) && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Interactive Demo URL</label>
                  <input
                    type="url"
                    value={form.demoLink}
                    onChange={e => setForm({ ...form, demoLink: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="https://demo.example.com"
                  />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Key Features ({form.features?.length || 0})</label>
                <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto scrollbar-hide">
                  {(Array.isArray(form.features) ? form.features : []).map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-black/40 border border-white/10 rounded-xl group/feat">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="text-xs text-white/70">{feature}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setForm({ ...form, features: form.features.filter((_: any, i: number) => i !== idx) })}
                        className="text-white/20 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {(!form.features || form.features.length === 0) && (
                    <div className="text-[10px] text-white/20 italic p-4 border border-dashed border-white/10 rounded-xl text-center">
                      No features added yet
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input 
                    id="admin-feature-input"
                    className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
                    placeholder="Add a core capability..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          const currentFeatures = Array.isArray(form.features) ? form.features : [];
                          if (!currentFeatures.includes(val)) {
                            setForm({ ...form, features: [...currentFeatures, val] });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('admin-feature-input') as HTMLInputElement;
                      const val = input.value.trim();
                      if (val) {
                        const currentFeatures = Array.isArray(form.features) ? form.features : [];
                        if (!currentFeatures.includes(val)) {
                          setForm({ ...form, features: [...currentFeatures, val] });
                          input.value = '';
                         }
                      }
                    }}
                    className="p-3 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 rounded-xl transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Screenshots (one URL per line)</label>
                <textarea
                  value={form.screenshots}
                  onChange={e => setForm({ ...form, screenshots: e.target.value })}
                  className="w-full h-[80px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all resize-none text-sm"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 flex justify-between">
                  App Description
                  <button
                    type="button"
                    onClick={handleOptimize}
                    disabled={optimizing || !form.name || !form.description}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
                  >
                    {optimizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Smart Optimization
                  </button>
                </label>
                <textarea
                  required
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full h-[156px] bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all resize-none text-sm"
                  placeholder="Describe your application..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Search Tags (comma separated)</label>
                <input
                  value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="e.g. AI, Productivity, Utility"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {editingId ? 'Update Listing' : 'Submit Application for Review'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="space-y-4">
        {initialLoading ? (
          Array.from({ length: 5 }).map((_, i) => <ListItemSkeleton key={i} />)
        ) : (
          apps.map(app => (
            <div key={app.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-xl group-hover:bg-blue-600/20 transition-colors flex items-center justify-center overflow-hidden">
                <DynamicIcon name={app.icon} className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold">{app.name}</h4>
                  <div className="relative group/status">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest cursor-help flex items-center gap-1 ${
                      app.status === 'production' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {app.status}
                      <Info className="w-2.5 h-2.5 opacity-50" />
                    </span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-black border border-white/10 rounded-xl text-[10px] text-white/60 invisible group-hover/status:visible opacity-0 group-hover/status:opacity-100 transition-all z-50 pointer-events-none shadow-2xl backdrop-blur-xl">
                      <div className="font-bold text-white mb-1 uppercase tracking-wider">
                        {app.status === 'production' ? 'Production Mode' : 'Staging Mode'}
                      </div>
                      {app.status === 'production' 
                        ? "Live environment. This application is visible to all public visitors in the storefront." 
                        : "Testing environment. This application is hidden from the public and only visible to authorized editors."}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-white/40 flex items-center gap-2">
                  v{app.version || '1.0.0'} • {app.link}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleEdit(app)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-blue-400"
                title="Edit Application"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => toggleStatus(app)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                title="Toggle Environment"
              >
                <Shield className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white">
                <History className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setConfirmDelete({ id: app.id, name: app.name })}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-white/40 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-white/10 mx-2" />
              <a href={app.link} target="_blank" rel="noreferrer" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )))}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Remove Application"
        message={`Are you sure you want to permanently remove application "${confirmDelete?.name}"? This action will remove it from the public marketplace.`}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete.id, confirmDelete.name)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
