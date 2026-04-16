import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { motion } from 'motion/react';
import { 
  Layout, Save, Loader2, CheckCircle2, 
  Info, Target, Eye, User, Image as ImageIcon,
  MessageSquare, FileText
} from 'lucide-react';

export default function SiteContentManager() {
  const { logActivity } = useAuth();
  const [form, setForm] = useState({
    aboutMission: '',
    aboutVision: '',
    aboutBackground: '',
    founderName: '',
    founderTitle: '',
    founderBio: '',
    founderPhotoUrl: '',
    contactTitle: '',
    contactDescription: ''
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setForm(prev => ({
          ...prev,
          aboutMission: data.aboutMission || '',
          aboutVision: data.aboutVision || '',
          aboutBackground: data.aboutBackground || '',
          founderName: data.founderName || '',
          founderTitle: data.founderTitle || '',
          founderBio: data.founderBio || '',
          founderPhotoUrl: data.founderPhotoUrl || '',
          contactTitle: data.contactTitle || '',
          contactDescription: data.contactDescription || ''
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        ...form,
        updatedAt: serverTimestamp()
      }, { merge: true });
      await logActivity('site_content_updated', { sections: ['About', 'Contact', 'Founder'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Content update failed:", error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Layout className="w-5 h-5 text-blue-400" /> Site Content Manager
        </h3>
        {saved && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase tracking-widest"
          >
            <CheckCircle2 className="w-4 h-4" /> Content Saved
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* About Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Info className="w-5 h-5 text-blue-400" />
            <h4 className="text-lg font-bold">About Section</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <Target className="w-3 h-3" /> Our Mission
              </label>
              <textarea
                value={form.aboutMission}
                onChange={e => setForm({ ...form, aboutMission: e.target.value })}
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm resize-none"
                placeholder="Enter mission statement..."
              />
            </div>
            <div className="space-y-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <Eye className="w-3 h-3" /> Our Vision
              </label>
              <textarea
                value={form.aboutVision}
                onChange={e => setForm({ ...form, aboutVision: e.target.value })}
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm resize-none"
                placeholder="Enter vision statement..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <FileText className="w-3 h-3" /> Our Background
            </label>
            <textarea
              value={form.aboutBackground}
              onChange={e => setForm({ ...form, aboutBackground: e.target.value })}
              className="w-full h-48 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all text-sm resize-none"
              placeholder="Enter background story..."
            />
          </div>
        </section>

        {/* Founder Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <User className="w-5 h-5 text-purple-400" />
            <h4 className="text-lg font-bold">Founder Profile</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Founder Name</label>
                  <input
                    value={form.founderName}
                    onChange={e => setForm({ ...form, founderName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Title</label>
                  <input
                    value={form.founderTitle}
                    onChange={e => setForm({ ...form, founderTitle: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Photo URL</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    value={form.founderPhotoUrl}
                    onChange={e => setForm({ ...form, founderPhotoUrl: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:border-purple-500 outline-none transition-all text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40">Founder Bio</label>
              <textarea
                value={form.founderBio}
                onChange={e => setForm({ ...form, founderBio: e.target.value })}
                className="w-full h-full min-h-[160px] bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all text-sm resize-none"
                placeholder="Enter founder's biography..."
              />
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <MessageSquare className="w-5 h-5 text-pink-400" />
            <h4 className="text-lg font-bold">Contact Page Content</h4>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Page Title</label>
              <input
                value={form.contactTitle}
                onChange={e => setForm({ ...form, contactTitle: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-pink-500 outline-none transition-all text-sm"
                placeholder="e.g. Contact Us"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Description</label>
              <textarea
                value={form.contactDescription}
                onChange={e => setForm({ ...form, contactDescription: e.target.value })}
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-pink-500 outline-none transition-all text-sm resize-none"
                placeholder="Enter contact page description..."
              />
            </div>
          </div>
        </section>

        <div className="pt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Update Site Content
          </button>
        </div>
      </form>
    </div>
  );
}
