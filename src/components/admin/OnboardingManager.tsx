import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Edit2, Save, X, 
  ArrowUp, ArrowDown, Eye, EyeOff,
  Image as ImageIcon, Type, Link as LinkIcon,
  Layers, CheckCircle2, Loader2, AlertCircle
} from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

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

export default function OnboardingManager() {
  const { logActivity } = useAuth();
  const [slides, setSlides] = useState<OnboardingSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    icon: '',
    buttonText: '',
    buttonLink: '',
    active: true
  });

  useEffect(() => {
    const q = query(collection(db, 'onboarding_slides'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSlides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OnboardingSlide)));
      setLoading(false);
    }, (err) => {
      console.error("Slides subscription error:", err);
      setError("Failed to sync with Onboarding Protocol.");
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
        await updateDoc(doc(db, 'onboarding_slides', editingId), {
          ...form,
          updatedAt: serverTimestamp()
        });
        await logActivity('onboarding_slide_updated', { slideId: editingId, title: form.title });
        setEditingId(null);
      } else {
        const nextOrder = slides.length > 0 ? Math.max(...slides.map(s => s.order)) + 1 : 0;
        const newDoc = await addDoc(collection(db, 'onboarding_slides'), {
          ...form,
          order: nextOrder,
          createdAt: serverTimestamp()
        });
        await logActivity('onboarding_slide_created', { slideId: newDoc.id, title: form.title });
      }
      setForm({ title: '', subtitle: '', imageUrl: '', icon: '', buttonText: '', buttonLink: '', active: true });
    } catch (err) {
      console.error("Slide operation failed:", err);
      setError("Critical failure in Slide deployment.");
    }
    setIsProcessing(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'onboarding_slides', id));
      await logActivity('onboarding_slide_deleted', { slideId: id });
      setConfirmDelete(null);
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to terminate slide instance.");
    }
  };

  const toggleStatus = async (slide: OnboardingSlide) => {
    try {
      await updateDoc(doc(db, 'onboarding_slides', slide.id), {
        active: !slide.active,
        updatedAt: serverTimestamp()
      });
      await logActivity('onboarding_slide_status_toggled', { slideId: slide.id, active: !slide.active });
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

    batch.update(doc(db, 'onboarding_slides', slideA.id), { order: slideB.order });
    batch.update(doc(db, 'onboarding_slides', slideB.id), { order: slideA.order });

    try {
      await batch.commit();
      await logActivity('onboarding_slides_reordered');
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Layers className="w-5 h-5 text-teal-400" /> Onboarding Showcase Manager
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="p-8 rounded-[2rem] bg-white/5 border border-white/10 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Layers className="w-24 h-24 text-teal-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <Type className="w-3 h-3" /> Slide Title
              </label>
              <input
                required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-500 outline-none transition-all text-sm"
                placeholder="e.g. Welcome to PymmCore Solutions"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <ImageIcon className="w-3 h-3" /> Subtitle / Description
              </label>
              <textarea
                required
                value={form.subtitle}
                onChange={e => setForm({ ...form, subtitle: e.target.value })}
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-500 outline-none transition-all text-sm resize-none"
                placeholder="Enter a compelling description for this slide..."
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <Plus className="w-3 h-3" /> Icon Name (Lucide)
                </label>
                <input
                  value={form.icon}
                  onChange={e => setForm({ ...form, icon: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-500 outline-none transition-all text-sm"
                  placeholder="Zap, Shield, Globe..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <ImageIcon className="w-3 h-3" /> Image URL
                </label>
                <input
                  value={form.imageUrl}
                  onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-500 outline-none transition-all text-sm"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <LinkIcon className="w-3 h-3" /> Button Text
                </label>
                <input
                  value={form.buttonText}
                  onChange={e => setForm({ ...form, buttonText: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-500 outline-none transition-all text-sm"
                  placeholder="e.g. Learn More"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <LinkIcon className="w-3 h-3" /> Button Link
                </label>
                <input
                  value={form.buttonLink}
                  onChange={e => setForm({ ...form, buttonLink: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-500 outline-none transition-all text-sm"
                  placeholder="e.g. #about"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="active"
                checked={form.active}
                onChange={e => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="active" className="text-xs font-bold uppercase tracking-widest text-white/60">
                Visible to baseline users
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-white/5">
          <button
            type="submit"
            disabled={isProcessing}
            className="flex-1 py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-teal-900/20"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingId ? 'Update Matrix Node' : 'Deploy New Slide'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ title: '', subtitle: '', imageUrl: '', icon: '', buttonText: '', buttonLink: '', active: true });
              }}
              className="px-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
            >
              Abort
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
      </form>

      {/* Slides List */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {slides.map((slide, idx) => (
            <motion.div
              key={slide.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-6 rounded-3xl border transition-all flex flex-col md:flex-row items-center gap-6 ${
                slide.active ? 'bg-white/5 border-white/10' : 'bg-black/40 border-white/5 opacity-50 blur-[0.5px]'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-600/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                <span className="text-xl font-black text-teal-400">{idx + 1}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-bold truncate">{slide.title}</h4>
                  {!slide.active && <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest">Inactive</span>}
                </div>
                <p className="text-xs text-white/40 line-clamp-1">{slide.subtitle}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1 mr-4">
                  <button
                    onClick={() => moveSlide(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 hover:bg-white/10 rounded disabled:opacity-20"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveSlide(idx, 'down')}
                    disabled={idx === slides.length - 1}
                    className="p-1 hover:bg-white/10 rounded disabled:opacity-20"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => toggleStatus(slide)}
                  className={`p-3 rounded-xl transition-all ${slide.active ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-white/20'}`}
                >
                  {slide.active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => handleEdit(slide)}
                  className="p-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-all"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setConfirmDelete(slide.id)}
                  className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {slides.length === 0 && (
          <div className="p-20 text-center rounded-[3rem] border border-dashed border-white/10 bg-white/5">
            <Layers className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">No active slides in sequence</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Terminate Slide Instance"
        message="Are you sure you want to delete this slide? This action will permanently remove it from the onboarding sequence."
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
