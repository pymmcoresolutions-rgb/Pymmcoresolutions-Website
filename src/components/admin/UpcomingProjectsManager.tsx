import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { 
  Rocket, Plus, Pencil, Trash2, Globe, Smartphone, Monitor, Clock,
  PlusCircle, Check, AlertCircle, Sparkles, X, ChevronRight, ListPlus, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmDialog from './ConfirmDialog';

export default function UpcomingProjectsManager() {
  const { user, isAdmin, loading } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  // Dropdown menus control state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDevDropdown, setShowDevDropdown] = useState(false);

  // Form State
  const [form, setForm] = useState<any>({
    name: '',
    description: '',
    type: ['Web'], // Web, Mobile, Desktop multi-selection
    category: 'Utilities',
    status: 'In Development', // "In Development", "Preview Available", etc.
    expectedLaunchDate: '',
    developer: 'PymmCore Solutions',
    price: 'Free',
    featuresInput: '', // Comma separated highlights or line separated
    link: '#',
  });

  const CATEGORY_PRESETS = [
    'Utilities', 'Productivity', 'Finance', 'Education', 'Entertainment', 
    'Health & Fitness', 'Lifestyle', 'Social', 'Business', 'Developer Tools', 
    'Artificial Intelligence', 'Security & Privacy', 'Blockchain / Web3'
  ];

  const DEVELOPER_PRESETS = [
    'PymmCore Solutions', 'PymmCore Labs', 'PymmCore Developer Community', 
    'R&D Department', 'AIGen Labs', 'External Developer', 'Community Contributor'
  ];

  useEffect(() => {
    if (loading || !isAdmin) return;

    // Fetch apps where status != 'production' to identify upcoming projects
    const q = query(
      collection(db, 'apps'),
      where('status', '!=', 'production'),
      orderBy('status'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.error("UpcomingProjectsManager subscription error:", err);
    });

    return () => unsubscribe();
  }, [loading, isAdmin]);

  const handleEdit = (project: any) => {
    setForm({
      name: project.name || '',
      description: project.description || '',
      type: Array.isArray(project.type) ? project.type : (project.type ? [project.type] : ['Web']),
      category: project.category || 'Utilities',
      status: project.status || 'In Development',
      expectedLaunchDate: project.expectedLaunchDate || '',
      developer: project.developer || 'PymmCore Solutions',
      price: project.price || 'Free',
      featuresInput: Array.isArray(project.features) ? project.features.join('\n') : '',
      link: project.link || '#',
    });
    setEditingId(project.id);
    setIsAdding(true);
  };

  const handleReset = () => {
    setForm({
      name: '',
      description: '',
      type: ['Web'],
      category: 'Utilities',
      status: 'In Development',
      expectedLaunchDate: '',
      developer: 'PymmCore Solutions',
      price: 'Free',
      featuresInput: '',
      link: '#',
    });
    setEditingId(null);
    setIsAdding(false);
    setErrorLocal(null);
    setShowCategoryDropdown(false);
    setShowDevDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim() || !form.description.trim()) {
      setErrorLocal("Please fill out all required fields.");
      return;
    }

    if (!form.type || form.type.length === 0) {
      setErrorLocal("Please select at least one Platform/Type.");
      return;
    }

    setSubmitting(true);
    setErrorLocal(null);

    const featuresArray = form.featuresInput
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    const projectData = {
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type,
      category: form.category.trim() || 'Utilities',
      status: form.status.trim(),
      expectedLaunchDate: form.expectedLaunchDate.trim() || 'Coming Soon',
      developer: form.developer.trim() || 'PymmCore Solutions',
      price: form.price,
      features: featuresArray,
      link: form.link,
      approvalStatus: 'approved',
      paymentStatus: 'paid',
      isDraft: false,
      authorUid: user.uid,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'apps', editingId), projectData);
      } else {
        await addDoc(collection(db, 'apps'), {
          ...projectData,
          createdAt: serverTimestamp(),
        });
      }
      handleReset();
    } catch (err: any) {
      console.error("Failed to save project:", err);
      setErrorLocal(err.message || "Failed to save project.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, 'apps', deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  return (
    <div className="space-y-8 h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Rocket className="w-5 h-5 text-purple-400" /> Upcoming Projects
          </h3>
          <p className="text-xs text-white/40 mt-1">
            Manage projects that showcase on the “Coming Soon / Upcoming Projects” section of the landing page.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-400 hover:to-purple-400 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-purple-900/30"
          >
            <Plus className="w-4 h-4" /> Add Upcoming Project
          </button>
        )}
      </div>

      {errorLocal && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorLocal}</span>
        </div>
      )}

      {isAdding ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 md:p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/5 shadow-2xl relative overflow-visible"
        >
          <div className="absolute top-0 right-0 p-6 z-10">
            <button
              onClick={handleReset}
              className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            {editingId ? 'Edit Project Entry' : 'Create Project Entry'}
          </h4>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Project Name *</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. HealthSync AI"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-teal-500 outline-none transition-all text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Platform / Type (Select Multiple) *</label>
                <div className="flex flex-wrap gap-2 py-1">
                  {['Web', 'Mobile', 'Desktop'].map((t) => {
                    const isSelected = form.type.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          const updated = isSelected
                            ? form.type.filter((item: string) => item !== t)
                            : [...form.type, t];
                          // Ensure at least one type remains selected
                          setForm({ ...form, type: updated.length > 0 ? updated : [t] });
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold uppercase transition-all duration-300 ${
                          isSelected
                            ? 'bg-teal-500/10 border-teal-500/50 text-teal-400 shadow-lg shadow-teal-500/5'
                            : 'bg-black/30 border-white/5 text-white/40 hover:border-white/10 hover:text-white/70'
                        }`}
                      >
                        {t === 'Web' && <Globe className="w-4 h-4" />}
                        {t === 'Mobile' && <Smartphone className="w-4 h-4" />}
                        {t === 'Desktop' && <Monitor className="w-4 h-4" />}
                        <span>{t}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Development Status *</label>
                <input
                  required
                  type="text"
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  placeholder="e.g. In Development, Preview Available, Alpha Testing"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-teal-500 outline-none transition-all text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Expected Launch Date</label>
                <input
                  type="text"
                  value={form.expectedLaunchDate}
                  onChange={e => setForm({ ...form, expectedLaunchDate: e.target.value })}
                  placeholder="e.g. Q4 2026, Dec 2026, or TBD"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-teal-500 outline-none transition-all text-white"
                />
              </div>

              <div className="relative">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Developer Name</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={form.developer}
                    onChange={e => setForm({ ...form, developer: e.target.value })}
                    placeholder="e.g. PymmCore Solutions"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm focus:border-teal-500 outline-none transition-all text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDevDropdown(!showDevDropdown)}
                    onBlur={() => setTimeout(() => setShowDevDropdown(false), 200)}
                    className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                
                <AnimatePresence>
                  {showDevDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute z-50 left-0 right-0 mt-2 max-h-52 overflow-y-auto bg-neutral-900 border border-white/10 rounded-xl shadow-2xl p-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full"
                    >
                      {DEVELOPER_PRESETS.map((dev) => (
                        <button
                          key={dev}
                          type="button"
                          onMouseDown={() => {
                            setForm(prev => ({ ...prev, developer: dev }));
                            setShowDevDropdown(false);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-white/5 rounded-lg text-xs text-white/70 hover:text-white transition-all flex items-center justify-between"
                        >
                          <span>{dev}</span>
                          {form.developer === dev && <Check className="w-3.5 h-3.5 text-teal-400" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Category</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Utilities, Health, Productivity"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm focus:border-teal-500 outline-none transition-all text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                    className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                
                <AnimatePresence>
                  {showCategoryDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute z-50 left-0 right-0 mt-2 max-h-52 overflow-y-auto bg-neutral-900 border border-white/10 rounded-xl shadow-2xl p-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full"
                    >
                      {CATEGORY_PRESETS.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onMouseDown={() => {
                            setForm(prev => ({ ...prev, category: cat }));
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-white/5 rounded-lg text-xs text-white/70 hover:text-white transition-all flex items-center justify-between"
                        >
                          <span>{cat}</span>
                          {form.category === cat && <Check className="w-3.5 h-3.5 text-teal-400" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Key Features or Highlights (One per line) *</label>
              <textarea
                value={form.featuresInput}
                onChange={e => setForm({ ...form, featuresInput: e.target.value })}
                placeholder="e.g. Real-time data encryption&#10;Dynamic multi-device syncing&#10;Interactive smart visual widgets"
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-teal-500 outline-none transition-all text-white resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Project Brief Description *</label>
              <textarea
                required
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Brief summary of what this application does..."
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-teal-500 outline-none transition-all text-white resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 bg-white/5 rounded-xl text-white hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-teal-900/40"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingId ? 'Save Changes' : 'Create Entry'}
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-purple-500/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 p-1">
                    {(() => {
                      const types = Array.isArray(project.type) ? project.type : [project.type || 'Web'];
                      return (
                        <div className="flex gap-1.5 items-center justify-center">
                          {types.includes('Web') && <Globe className="w-4.5 h-4.5 text-cyan-400" />}
                          {types.includes('Mobile') && <Smartphone className="w-4.5 h-4.5 text-emerald-400" />}
                          {types.includes('Desktop') && <Monitor className="w-4.5 h-4.5 text-purple-400" />}
                        </div>
                      );
                    })()}
                  </div>

                  <span className="px-2.5 py-1 rounded bg-purple-500/10 text-[9px] font-bold uppercase tracking-widest text-purple-400">
                    {project.status || 'In Development'}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[8px] font-bold uppercase tracking-widest text-white/40 mr-1.5">
                    {project.category || 'Utilities'}
                  </span>
                  <span className="text-[9px] font-bold text-white/20">by {project.developer || 'PymmCore Solutions'}</span>
                </div>

                <h3 className="text-lg font-bold tracking-tight mb-2 group-hover:text-purple-400 transition-colors">{project.name}</h3>
                <p className="text-xs text-white/40 line-clamp-3 mb-4 leading-relaxed">{project.description}</p>

                {project.features && project.features.length > 0 && (
                  <div className="mb-4">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/20 block mb-1.5">Highlights:</span>
                    <ul className="space-y-1">
                      {project.features.slice(0, 3).map((feat: string, i: number) => (
                        <li key={i} className="text-[10px] text-white/60 flex items-center gap-1.5 leading-snug">
                          <span className="w-1 h-1 rounded-full bg-teal-400" />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-4">
                <div className="text-left">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-white/20 block">Target release</span>
                  <span className="text-[11px] font-bold text-teal-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {project.expectedLaunchDate || 'Coming Soon'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(project)}
                    className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    title="Edit project"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(project)}
                    className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01]">
              <Rocket className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <h4 className="text-base font-bold mb-1">No upcoming pipeline entries</h4>
              <p className="text-xs text-white/20 max-w-sm mx-auto">
                Add upcoming/staging projects to make them display on the landing page Coming Soon registry automatically.
              </p>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Project Entry"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? It will be removed from the Landing Page and Waitlist portal immediately.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
