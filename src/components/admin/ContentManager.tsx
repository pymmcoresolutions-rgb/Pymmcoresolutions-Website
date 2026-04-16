import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { 
  FileText, Plus, Edit3, Trash2, 
  Eye, Save, X, Loader2, Globe,
  Layout, Type, AlignLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ConfirmDialog from './ConfirmDialog';

export default function ContentManager() {
  const { logActivity } = useAuth();
  const [pages, setPages] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', content: '' });

  useEffect(() => {
    const q = query(collection(db, 'pages'), orderBy('title', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (activePage) {
        await updateDoc(doc(db, 'pages', activePage.id), {
          ...form,
          lastUpdated: serverTimestamp()
        });
        await logActivity('page_updated', { title: form.title });
      } else {
        await addDoc(collection(db, 'pages'), {
          ...form,
          lastUpdated: serverTimestamp()
        });
        await logActivity('page_created', { title: form.title });
      }
      setIsEditing(false);
      setActivePage(null);
      setForm({ title: '', slug: '', content: '' });
    } catch (error) {
      console.error("Save failed:", error);
    }
    setLoading(false);
  };

  const editPage = (page: any) => {
    setActivePage(page);
    setForm({ title: page.title, slug: page.slug, content: page.content });
    setIsEditing(true);
  };

  const deletePage = async (id: string, title: string) => {
    try {
      await deleteDoc(doc(db, 'pages', id));
      await logActivity('page_deleted', { title });
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-400" /> CMS Content
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Page
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <form onSubmit={handleSave} className="space-y-6 p-8 rounded-3xl bg-white/5 border border-white/10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Page Title</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-green-500 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Slug</label>
                <input
                  required
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-green-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Content (Markdown)</label>
              <textarea
                required
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                className="w-full h-96 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-green-500 outline-none transition-all resize-none text-sm font-mono"
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Page
              </button>
              <button
                type="button"
                onClick={() => { setIsEditing(false); setActivePage(null); }}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 overflow-auto max-h-[600px]">
            <div className="flex items-center gap-2 mb-6 text-white/40">
              <Eye className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Live Preview</span>
            </div>
            <div className="prose prose-invert max-w-none">
              <h1 className="text-3xl font-bold mb-4">{form.title || 'Page Title'}</h1>
              <ReactMarkdown>{form.content || '*No content yet...*'}</ReactMarkdown>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map(page => (
            <div key={page.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-green-500/50 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <Layout className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => editPage(page)} className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setConfirmDelete({ id: page.id, title: page.title })}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h4 className="font-bold mb-1">{page.title}</h4>
              <p className="text-xs text-white/40 mb-4">/{page.slug}</p>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/20">
                <span>{page.content.length} characters</span>
                <span>{new Date(page.lastUpdated?.toDate()).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete CMS Page"
        message={`Are you sure you want to permanently delete the page "${confirmDelete?.title}"? This action cannot be undone.`}
        onConfirm={() => confirmDelete && deletePage(confirmDelete.id, confirmDelete.title)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
