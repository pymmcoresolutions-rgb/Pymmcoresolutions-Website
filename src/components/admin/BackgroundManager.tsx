import { useState, useRef, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Image as ImageIcon, Upload, Trash2, Edit3, Save, X, Plus, 
  Settings2, Eye, EyeOff, Layers, Sliders, Palette, AlertCircle,
  Moon, Sun, Monitor
} from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

interface BackgroundAsset {
  id: string;
  url: string;
  name: string;
  opacity: number;
  blur: number;
  grayscale: number;
  blendMode: string;
  active: boolean;
  createdAt: any;
}

const BLEND_MODES = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 
  'lighten', 'color-dodge', 'color-burn', 'hard-light', 
  'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 
  'color', 'luminosity'
];

export default function BackgroundManager() {
  const [assets, setAssets] = useState<BackgroundAsset[]>([]);
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'system'>('dark');
  const [loading, setLoading] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  
  // Form State
  const [form, setForm] = useState<Partial<BackgroundAsset>>({
    name: '',
    url: '',
    opacity: 100,
    blur: 0,
    grayscale: 0,
    blendMode: 'normal',
    active: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'background_assets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BackgroundAsset)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.themeMode) setThemeMode(data.themeMode);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateTheme = async (mode: 'dark' | 'light' | 'system') => {
    setSavingTheme(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), { 
        themeMode: mode,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      setThemeMode(mode);
    } catch (err: any) {
      console.error("Theme update failed:", err);
      setError("Theme protocol synchronization failure.");
    }
    setSavingTheme(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("Image too large (Max 1MB)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.url) return;

    setLoading(true);
    setError(null);
    try {
      const { id, ...data } = form as any;
      
      if (editingId) {
        await updateDoc(doc(db, 'background_assets', editingId), {
          ...data,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'background_assets'), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
      resetForm();
    } catch (err: any) {
      console.error("Save failed:", err);
      setError(err.message || "Execution failure. Check protocol compliance.");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'background_assets', id));
      if (editingId === id) resetForm();
      setConfirmDelete(null);
    } catch (err: any) {
      setError("Deletion protocol rejected. Integrity breach or permission failure.");
    }
  };

  const handleResetToDefault = async () => {
    setLoading(true);
    setError(null);
    try {
      const deletions = assets.map(asset => deleteDoc(doc(db, 'background_assets', asset.id)));
      await Promise.all(deletions);
      resetForm();
      setConfirmReset(false);
    } catch (err: any) {
      console.error("Reset failed:", err);
      setError("Bulk reset failed. Database synchronization error.");
    }
    setLoading(false);
  };

  const toggleActive = async (asset: BackgroundAsset) => {
    await updateDoc(doc(db, 'background_assets', asset.id), {
      active: !asset.active
    });
  };

  const resetForm = () => {
    setForm({
      name: '',
      url: '',
      opacity: 100,
      blur: 0,
      grayscale: 0,
      blendMode: 'normal',
      active: true
    });
    setEditingId(null);
  };

  const startEdit = (asset: BackgroundAsset) => {
    setEditingId(asset.id);
    setForm(asset);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Layers className="w-5 h-5 text-teal-400" /> Background Environment
        </h3>
        <div className="flex gap-2">
          {editingId && (
            <button 
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" /> Discard Changes
            </button>
          )}
          {assets.length > 0 && !editingId && (
            <button 
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-red-500/20"
            >
              <Trash2 className="w-4 h-4" /> Reset Environment
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Form */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSave} className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <Settings2 className="w-3 h-3" /> {editingId ? 'Modify Invariant' : 'New Environmental Asset'}
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Asset Name</label>
                <input 
                  required
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Hero Background Blur"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-500 outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Image Source</label>
                <div className="flex gap-2">
                  <input 
                    required
                    value={form.url}
                    onChange={e => setForm({...form, url: e.target.value})}
                    placeholder="https://..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-500 outline-none transition-all text-sm"
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <input 
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-4">
                  <RangeSlider label="Opacity" value={form.opacity || 100} onChange={v => setForm({...form, opacity: v})} />
                  <RangeSlider label="Blur" value={form.blur || 0} max={20} unit="px" onChange={v => setForm({...form, blur: v})} />
                </div>
                <div className="space-y-4">
                  <RangeSlider label="Grayscale" value={form.grayscale || 0} onChange={v => setForm({...form, grayscale: v})} />
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Blend Mode</label>
                    <select 
                      value={form.blendMode}
                      onChange={e => setForm({...form, blendMode: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-500 outline-none transition-all text-sm"
                    >
                      {BLEND_MODES.map(mode => (
                        <option key={mode} value={mode} className="bg-neutral-900">{mode}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || !form.url || !form.name}
              className="w-full py-4 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20"
            >
              {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingId ? 'Commit Changes' : 'Deploy Background'}
            </button>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                >
                  <Settings2 className="w-4 h-4" /> {error}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Real-time Result Preview */}
          <div className="p-8 rounded-3xl bg-neutral-950 border border-white/5 relative h-64 overflow-hidden group">
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-teal-900/20 to-transparent" />
            {form.url && (
              <img 
                src={form.url} 
                className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
                style={{ 
                  opacity: (form.opacity || 100) / 100,
                  filter: `blur(${form.blur}px) grayscale(${form.grayscale}%)`,
                  mixBlendMode: form.blendMode as any
                }}
              />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="p-4 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                <Palette className="w-8 h-8 text-teal-400" />
              </div>
              <h5 className="font-bold text-xl tracking-tighter">Readability Testing</h5>
              <p className="text-sm text-white/60 leading-relaxed max-w-[200px]">
                The text should remain crisp and legible against this backdrop.
              </p>
            </div>
          </div>
        </div>

        {/* Assets List */}
        <div className="lg:col-span-2 space-y-8">
          {/* Theme Selection */}
          <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-6">
            <div>
              <h4 className="text-sm font-bold tracking-tight mb-2">Global Environment Theme</h4>
              <p className="text-xs text-white/40">Select the master visual protocol for the entire platform interface (White, Black, or System Default).</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'dark', name: 'Black (Dark)', icon: Moon, color: 'bg-indigo-500' },
                { id: 'light', name: 'White (Light)', icon: Sun, color: 'bg-amber-500' },
                { id: 'system', name: 'System Default', icon: Monitor, color: 'bg-emerald-500' }
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleUpdateTheme(theme.id as any)}
                  disabled={savingTheme}
                  className={`relative p-6 rounded-3xl border transition-all flex flex-col items-center gap-4 group ${
                    themeMode === theme.id 
                      ? 'bg-white/10 border-teal-500/50 ring-1 ring-teal-500/50' 
                      : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  {themeMode === theme.id && (
                    <motion.div 
                      layoutId="theme-active"
                      className="absolute top-3 right-3 w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                    />
                  )}
                  <div className={`p-4 rounded-2xl ${theme.color}/10 border border-${theme.color.split('-')[1]}-500/20 text-${theme.color.split('-')[1]}-400 group-hover:scale-110 transition-transform`}>
                    <theme.icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${themeMode === theme.id ? 'text-white' : 'text-white/40'}`}>
                    {theme.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.map((asset) => (
              <motion.div 
                layout
                key={asset.id}
                className={`group p-4 rounded-3xl border transition-all ${
                  asset.active ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 opacity-60'
                }`}
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-black relative border border-white/5">
                    <img 
                      src={asset.url} 
                      className="w-full h-full object-cover"
                      style={{ 
                        opacity: asset.opacity / 100,
                        filter: `blur(${asset.blur}px) grayscale(${asset.grayscale}%)`,
                        mixBlendMode: asset.blendMode as any
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-bold truncate text-sm">{asset.name}</h5>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => toggleActive(asset)}
                            className={`p-1.5 rounded-lg transition-all ${asset.active ? 'text-teal-400 hover:bg-teal-400/10' : 'text-white/20 hover:bg-white/5'}`}
                          >
                            {asset.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button 
                            onClick={() => startEdit(asset)}
                            className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-400/10 transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setConfirmDelete(asset.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge label="Op" value={`${asset.opacity}%`} />
                        <Badge label="Bl" value={`${asset.blur}px`} />
                        <Badge label="Gr" value={`${asset.grayscale}%`} />
                        <Badge label="Mode" value={asset.blendMode} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {assets.length === 0 && (
              <div className="col-span-full py-12 text-center rounded-3xl border border-dashed border-white/10 bg-white/5">
                <ImageIcon className="w-12 h-12 text-white/5 mx-auto mb-4" />
                <p className="text-white/20 text-sm italic">No custom environmental assets deployed.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Asset"
        message="Are you sure you want to permanently delete this environmental background asset? This cannot be undone."
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmDialog
        isOpen={confirmReset}
        title="Reset Environment"
        message="This action will permanently delete all custom background assets and revert to the default theme layers. Proceed with extreme caution."
        onConfirm={handleResetToDefault}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

function RangeSlider({ label, value, onChange, max = 100, unit = '%' }: any) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{label}</label>
        <span className="text-[9px] font-mono text-teal-400">{value}{unit}</span>
      </div>
      <input 
        type="range"
        min="0"
        max={max}
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-500"
      />
    </div>
  );
}

function Badge({ label, value }: { label: string, value: string }) {
  return (
    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-bold uppercase tracking-tighter flex items-center gap-1">
      <span className="text-white/30">{label}:</span>
      <span className="text-teal-400">{value}</span>
    </span>
  );
}
