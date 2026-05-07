import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Edit2, Save, X, 
  ArrowUp, ArrowDown, Eye, EyeOff,
  Image as ImageIcon, Type, Link as LinkIcon,
  Layers, CheckCircle2, Loader2, AlertCircle,
  Zap, Sparkles, Send, Play, Layout,
  ArrowRight, ArrowLeft
} from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

import ImageUploader from '../ui/ImageUploader';

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  icon: string;
  order: number;
  buttonText: string;
  buttonLink: string;
  active: boolean;
  createdAt: any;
}

// Minimalist Preview Component
function FeatureSlideshowPreview({ slides }: { slides: OnboardingSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) return (
    <div className="w-full h-[400px] flex items-center justify-center bg-[#050505] rounded-[2.5rem] border border-dashed border-white/10">
      <p className="text-[10px] font-black uppercase tracking-widest text-white/20">No active features for preview</p>
    </div>
  );

  const current = slides[index];

  return (
    <div className="relative w-full h-[400px] flex items-center justify-center bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden border border-white/10 group shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,184,166,0.15),transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] opacity-30" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-sm"
        >
          {/* Glassmorphic Feature Box */}
          <div className="p-10 rounded-[2.5rem] bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl flex flex-col items-center text-center space-y-6 relative group/box">
            {/* Animated Gradient Border Accent */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-teal-500/20 via-blue-500/20 to-teal-500/20 rounded-[2.5rem] -z-10 opacity-30 group-hover/box:opacity-60 transition-opacity" />

            <div className="w-20 h-20 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(20,184,166,0.1)]">
              <Sparkles className="w-10 h-10 text-teal-400" />
            </div>

            <div className="space-y-4">
              <h4 className="text-2xl font-black tracking-tight uppercase text-white leading-none">{current.title}</h4>
              <p className="text-sm text-white/50 leading-relaxed font-medium px-4">{current.subtitle}</p>
            </div>

            <div className="flex gap-3 pt-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-700 ${i === index ? 'w-12 bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'w-3 bg-white/10 hover:bg-white/20'}`} 
                />
              ))}
            </div>

            {/* Matrix Decorative Labels */}
            <div className="absolute top-6 left-6 text-[8px] font-black tracking-widest text-white/20 uppercase">Node_{index + 1}</div>
            <div className="absolute bottom-6 right-6 text-[8px] font-black tracking-widest text-teal-500/40 uppercase">Safe_Active</div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute top-6 right-8 text-[10px] font-black uppercase tracking-[0.5em] text-white/20 flex items-center gap-2">
        <Play className="w-3 h-3 text-teal-500 animate-pulse" /> Live_Preview_Feed
      </div>

      {/* Navigation Arrows */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setIndex(prev => (prev - 1 + slides.length) % slides.length)}
          className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center pointer-events-auto hover:bg-teal-500 hover:text-black transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setIndex(prev => (prev + 1) % slides.length)}
          className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center pointer-events-auto hover:bg-teal-500 hover:text-black transition-all"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export default function KeyFeaturesManager() {
  const { logActivity } = useAuth();
  const [slides, setSlides] = useState<OnboardingSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'bulk' | 'live'>('bulk');
  const [bulkInput, setBulkInput] = useState('');

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    icon: '',
    buttonText: '',
    buttonLink: '',
    active: true
  });

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
      },
      operationType,
      path
    };
    const errString = JSON.stringify(errInfo);
    console.error('Firestore Error Status:', errString);
    throw new Error(errString);
  };

  useEffect(() => {
    const q = query(collection(db, 'key_features'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSlides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OnboardingSlide)));
      setLoading(false);
    }, (err) => {
      console.error("Features subscription error:", err);
      setError("Failed to sync with Key Features Protocol.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (editingId) {
        try {
          await updateDoc(doc(db, 'key_features', editingId), {
            ...form,
            updatedAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `key_features/${editingId}`);
        }
        await logActivity('key_feature_updated', { featureId: editingId, title: form.title });
        setEditingId(null);
      } else {
        const nextOrder = slides.length > 0 ? Math.max(...slides.map(s => s.order)) + 1 : 0;
        let newDoc;
        try {
          newDoc = await addDoc(collection(db, 'key_features'), {
            ...form,
            order: nextOrder,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'key_features');
        }
        if (newDoc) {
          await logActivity('key_feature_created', { featureId: newDoc.id, title: form.title });
        }
      }
      setForm({ title: '', subtitle: '', imageUrl: '', icon: '', buttonText: '', buttonLink: '', active: true });
    } catch (err: any) {
      console.error("Feature operation failed:", err);
      try {
        const parsed = JSON.parse(err.message);
        setError(`Access Denied: ${parsed.error} (User: ${parsed.authInfo.email || 'None'})`);
      } catch {
        setError(err.message || "Critical failure in Feature deployment.");
      }
    }
    setIsProcessing(false);
  };

  const handleBulkDeploy = async () => {
    if (!bulkInput.trim() || isProcessing) return;
    setIsProcessing(true);
    setError(null);

    const lines = bulkInput.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      setIsProcessing(false);
      return;
    }

    try {
      const batch = writeBatch(db);
      const nextOrderBase = slides.length > 0 ? Math.max(...slides.map(s => s.order)) + 1 : 0;

      lines.forEach((line, idx) => {
        const docRef = doc(collection(db, 'key_features'));
        batch.set(docRef, {
          title: line.trim(),
          subtitle: "Newly deployed feature module.",
          order: nextOrderBase + idx,
          active: true,
          createdAt: serverTimestamp(),
          icon: 'Zap',
          imageUrl: '',
          buttonText: '',
          buttonLink: ''
        });
      });

      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'key_features (bulk)');
      }
      await logActivity('bulk_features_deployed', { count: lines.length });
      setBulkInput('');
    } catch (err: any) {
      console.error("Bulk deployment failed:", err);
      try {
        const parsed = JSON.parse(err.message);
        setError(`Bulk Denied: ${parsed.error} (${parsed.path})`);
      } catch {
        setError("Bulk creation failed. Ensure you have administrative clearance.");
      }
    }
    setIsProcessing(false);
  };

  const handleDelete = async (id: string) => {
    try {
      try {
        await deleteDoc(doc(db, 'key_features', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `key_features/${id}`);
      }
      await logActivity('key_feature_deleted', { featureId: id });
      setConfirmDelete(null);
    } catch (err: any) {
      console.error("Delete failed:", err);
      try {
        const parsed = JSON.parse(err.message);
        setError(`Delete Denied: ${parsed.error}`);
      } catch {
        setError("Failed to terminate feature instance.");
      }
    }
  };

  const toggleStatus = async (slide: OnboardingSlide) => {
    try {
      await updateDoc(doc(db, 'key_features', slide.id), {
        active: !slide.active,
        updatedAt: serverTimestamp()
      });
      await logActivity('key_feature_status_toggled', { featureId: slide.id, active: !slide.active });
    } catch (err) {
      console.error("Status toggle failed:", err);
    }
  };

  const moveSlide = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;

    const batch = writeBatch(db);
    const slideA = slides[index];
    const slideB = slides[newIndex];

    batch.update(doc(db, 'key_features', slideA.id), { order: slideB.order });
    batch.update(doc(db, 'key_features', slideB.id), { order: slideA.order });

    try {
      await batch.commit();
      await logActivity('key_features_reordered');
    } catch (err) {
      console.error("Reorder failed:", err);
    }
  };

  const handleEdit = (slide: OnboardingSlide) => {
    setEditingId(slide.id);
    setForm({
      title: slide.title,
      subtitle: slide.subtitle,
      imageUrl: slide.imageUrl || '',
      icon: slide.icon || '',
      buttonText: slide.buttonText || '',
      buttonLink: slide.buttonLink || '',
      active: slide.active
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black tracking-tighter uppercase flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-400" /> Platform Showcase Matrix
          </h3>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Status: Active Deployment System</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {[
            { id: 'bulk', icon: Send, label: 'Bulk Stream' },
            { id: 'live', icon: Play, label: 'Live Preview' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                activeTab === tab.id ? 'bg-teal-600 text-white shadow-lg' : 'text-white/40 hover:text-white'
              }`}
            >
              <tab.icon className="w-2.5 h-2.5" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Inventory List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30">Node Inventory ({slides.length})</h4>
          </div>
          
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {slides.map((slide, idx) => (
                <motion.div
                  key={slide.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleEdit(slide)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer group relative ${
                    editingId === slide.id 
                      ? 'bg-teal-500/10 border-teal-500/30' 
                      : slide.active ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-black/40 border-white/5 opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-white/40">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[11px] uppercase tracking-tight text-white truncate">{slide.title}</h4>
                      <p className="text-[9px] text-white/30 truncate">{slide.subtitle}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveSlide(idx, 'up'); }}
                        disabled={idx === 0}
                        className="p-1 hover:bg-white/10 rounded disabled:opacity-0"
                      >
                        <ArrowUp className="w-3 h-3 text-white/40" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveSlide(idx, 'down'); }}
                        disabled={idx === slides.length - 1}
                        className="p-1 hover:bg-white/10 rounded disabled:opacity-0"
                      >
                        <ArrowDown className="w-3 h-3 text-white/40" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(slide.id); }}
                        className="p-1 hover:bg-red-500/20 text-red-400 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {slides.length === 0 && (
              <div className="p-10 text-center rounded-2xl border border-dashed border-white/5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Matrix Empty</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Controller Area */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {editingId ? (
              <motion.form
                key="edit-form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                onSubmit={handleSubmit} 
                className="p-6 rounded-[2rem] bg-white/5 border border-teal-500/20 space-y-6 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-teal-400" />
                    <h4 className="text-xs font-black tracking-tight uppercase">Edit Feature Node</h4>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-[9px] font-black uppercase text-white/40 hover:text-white"
                  >
                    Close Editor
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-white/40">Title</label>
                      <input
                        required
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-teal-500 outline-none transition-all text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-white/40">Description</label>
                      <textarea
                        required
                        value={form.subtitle}
                        onChange={e => setForm({ ...form, subtitle: e.target.value })}
                        className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-teal-500 outline-none transition-all text-xs resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-white/40">Icon</label>
                        <input
                          value={form.icon}
                          onChange={e => setForm({ ...form, icon: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-teal-500 outline-none transition-all text-xs"
                          placeholder="Zap, Shield..."
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id="edit-active"
                          checked={form.active}
                          onChange={e => setForm({ ...form, active: e.target.checked })}
                          className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-teal-600"
                        />
                        <label htmlFor="edit-active" className="text-[9px] font-bold uppercase text-white/60">Active</label>
                      </div>
                    </div>
                    <ImageUploader 
                      label="Asset Upload"
                      aspectRatio="video"
                      currentImage={form.imageUrl}
                      onUpload={(base64) => setForm({ ...form, imageUrl: base64 })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Update Node Configuration
                  </button>
                </div>
              </motion.form>
            ) : activeTab === 'bulk' ? (
              <motion.div
                key="bulk-area"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <Send className="w-4 h-4 text-teal-400" />
                  <h4 className="text-xs font-black tracking-tight uppercase">Bulk Deployment Stream</h4>
                </div>
                <textarea
                  value={bulkInput}
                  onChange={e => setBulkInput(e.target.value)}
                  className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 focus:border-teal-500 outline-none transition-all text-[11px] font-mono leading-relaxed resize-none text-teal-500"
                  placeholder="Paste features... One per line."
                />
                <button
                  onClick={handleBulkDeploy}
                  disabled={isProcessing || !bulkInput.trim()}
                  className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Initiate Multi-Node Sync
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="live-area"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <FeatureSlideshowPreview slides={slides.filter(s => s.active)} />
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-bold uppercase flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Terminate Node"
        message="Permanently remove this feature from the showcase matrix?"
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
