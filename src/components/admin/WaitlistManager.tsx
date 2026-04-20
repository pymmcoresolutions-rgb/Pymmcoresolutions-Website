import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { 
  Users, Mail, Clock, Trash2, Search, Filter, 
  Download, Send, CheckCircle2, UserCheck, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function WaitlistManager() {
  const { isAdmin, loading } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !isAdmin) return;

    const q = query(collection(db, 'waitlist'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setError(null);
    }, (err) => {
      console.error("WaitlistManager subscription error:", err);
      setError("Leads sync failure: Access denied.");
    });
    return () => unsubscribe();
  }, [loading, isAdmin]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredEntries.map(e => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Permanent deletion requested. Proceed?')) return;
    try {
      await deleteDoc(doc(db, 'waitlist', id));
      setSelectedIds(prev => prev.filter(i => i !== id));
    } catch (err) {
      console.error("Deletion failed:", err);
    }
  };

  const filteredEntries = entries.filter(e => 
    e.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-teal-400" /> Waitlist Management
        </h3>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search leads..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-teal-500 outline-none transition-all"
            />
          </div>
          
          <button 
            disabled={selectedIds.length === 0}
            onClick={() => setShowMessageModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:grayscale"
          >
            <Send className="w-4 h-4" /> Broadcast ({selectedIds.length})
          </button>
          
          <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white transition-all">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              <th className="px-6 py-2 text-left w-10">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={selectedIds.length > 0 && selectedIds.length === filteredEntries.length}
                  className="rounded border-white/10 bg-black/40 text-teal-600 focus:ring-teal-500"
                />
              </th>
              <th className="px-6 py-2 text-left">Identity</th>
              <th className="px-6 py-2 text-left">Subscription</th>
              <th className="px-6 py-2 text-left">Registration Date</th>
              <th className="px-6 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map(entry => (
              <tr key={entry.id} className="bg-white/5 border border-white/10 group hover:bg-white/[0.08] transition-colors">
                <td className="px-6 py-4 rounded-l-2xl">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(entry.id)}
                    onChange={() => handleSelectOne(entry.id)}
                    className="rounded border-white/10 bg-black/40 text-teal-600 focus:ring-teal-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-600/20 flex items-center justify-center text-teal-400 font-bold text-xs uppercase">
                      {entry.name?.[0] || entry.email?.[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{entry.name || 'Anonymous'}</div>
                      <div className="text-[10px] text-white/40">{entry.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                    entry.subscribed ? 'bg-teal-500/10 text-teal-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {entry.subscribed ? 'Subscribed' : 'Direct Only'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Clock className="w-3 h-3" />
                    {entry.createdAt?.toDate ? new Date(entry.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 rounded-r-2xl text-right">
                  <button 
                    onClick={() => deleteEntry(entry.id)}
                    className="p-2 text-white/20 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showMessageModal && (
        <BroadcastModal 
          selectedUsers={entries.filter(e => selectedIds.includes(e.id))}
          onClose={() => setShowMessageModal(false)}
        />
      )}
    </div>
  );
}

function BroadcastModal({ selectedUsers, onClose }: any) {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleBroadcast = async () => {
    setSending(true);
    try {
      const emails = selectedUsers.map((u: any) => u.email);
      const response = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails, subject, content })
      });
      
      const data = await response.json();
      if (response.ok) {
        setResult({ type: 'success', message: `${emails.length} missions dispatched successfully.` });
        setTimeout(onClose, 2000);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setResult({ type: 'error', message: err.message || 'Dispatch sync failure.' });
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-xl font-bold flex items-center gap-2">
            <Send className="w-5 h-5 text-teal-400" /> Administrative Broadcast
          </h4>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/20">
            <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mb-1">Target Segment</p>
            <p className="text-sm font-medium">{selectedUsers.length} identified recipients</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Internal Subject</label>
              <input 
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Product Launch: PymmCore Infrastructure v6"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-teal-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Broadcast Intelligence (HTML Supported)</label>
              <textarea 
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Compose mission briefing..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-teal-500 outline-none transition-all h-40 resize-none"
              />
            </div>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold uppercase tracking-widest ${
                  result.type === 'success' ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}
              >
                {result.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                {result.message}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={onClose}
              className="py-4 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-xs uppercase tracking-widest"
            >
              Cancel
            </button>
            <button 
              onClick={handleBroadcast}
              disabled={sending || !subject || !content}
              className="py-4 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-500 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-teal-900/40 disabled:opacity-50"
            >
              {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              Initiate Broadcast
            </button>
          </div>
          
          <p className="text-[9px] text-white/20 text-center leading-relaxed">
            CRITICAL: By initiating this broadcast, you confirm compliance with global anti-spam regulations (GDPR/CAN-SPAM). 
            Unsubscribe links will be automatically appended to the footer of all dispatched briefs.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
