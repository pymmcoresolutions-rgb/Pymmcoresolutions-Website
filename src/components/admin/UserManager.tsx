import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { 
  Users, Shield, ShieldCheck, ShieldAlert, 
  Ban, CheckCircle2, MoreVertical, Search,
  Mail, Clock, UserMinus, UserPlus, Send, Filter, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Reuse BroadcastModal logic (could be exported to a separate file later)
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
            <Send className="w-5 h-5 text-purple-400" /> Infrastructure Broadcast
          </h4>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-1">Target Segment</p>
            <p className="text-sm font-medium">{selectedUsers.length} identified recipients</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Internal Subject</label>
              <input 
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Product Launch: PymmCore Infrastructure v6"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Broadcast Intelligence (HTML Supported)</label>
              <textarea 
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Compose mission briefing..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none transition-all h-40 resize-none"
              />
            </div>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold uppercase tracking-widest ${
                  result.type === 'success' ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
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
              className="py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 disabled:opacity-50"
            >
              {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              Initiate Broadcast
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function UserManager() {
  const { user, isAdmin, loading, logActivity } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [segment, setSegment] = useState<'all' | 'guest' | 'staff'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    if (loading || !isAdmin) return;

    const q = query(collection(db, 'users'), orderBy('email', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setError(null);
    }, (err) => {
      console.error("UserManager subscription error:", err);
      setError("Sync failure: Access restricted.");
    });
    return () => unsubscribe();
  }, [loading, isAdmin]);

  const updateRole = async (userId: string, email: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      await logActivity('user_role_updated', { email, role: newRole });
    } catch (error) {
      console.error("Role update failed:", error);
    }
  };

  const toggleStatus = async (user: any) => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    try {
      await updateDoc(doc(db, 'users', user.id), { status: newStatus });
      await logActivity('user_status_changed', { email: user.email, status: newStatus });
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const isStaff = u.role === 'admin' || u.role === 'editor';
    if (segment === 'guest') return matchesSearch && !isStaff;
    if (segment === 'staff') return matchesSearch && isStaff;
    return matchesSearch;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredUsers.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" /> User Management
        </h3>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            <button 
              onClick={() => { setSegment('all'); setSelectedIds([]); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                segment === 'all' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-white/40 hover:text-white'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => { setSegment('guest'); setSelectedIds([]); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                segment === 'guest' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-white/40 hover:text-white'
              }`}
            >
              Guests
            </button>
            <button 
              onClick={() => { setSegment('staff'); setSelectedIds([]); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                segment === 'staff' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-white/40 hover:text-white'
              }`}
            >
              Staff
            </button>
          </div>

          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search identites..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-purple-500 outline-none transition-all"
            />
          </div>
          
          <button 
            disabled={selectedIds.length === 0}
            onClick={() => setShowMessageModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:grayscale"
          >
            <Send className="w-4 h-4" /> Message ({selectedIds.length})
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
                  checked={selectedIds.length > 0 && selectedIds.length === filteredUsers.length}
                  className="rounded border-white/10 bg-black/40 text-purple-600 focus:ring-purple-500"
                />
              </th>
              <th className="px-6 py-2 text-left">Identity</th>
              <th className="px-6 py-2 text-left">Classification</th>
              <th className="px-6 py-2 text-left">Status</th>
              <th className="px-6 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className="bg-white/5 border border-white/10 group hover:bg-white/[0.08] transition-colors">
                <td className="px-6 py-4 rounded-l-2xl">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(user.id)}
                    onChange={() => handleSelectOne(user.id)}
                    className="rounded border-white/10 bg-black/40 text-purple-600 focus:ring-purple-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400 font-bold text-xs uppercase">
                      {user.email?.[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{user.email}</div>
                      <div className="text-[10px] text-white/40 leading-none">ID: {user.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={e => updateRole(user.id, user.email, e.target.value)}
                    className="bg-transparent text-xs font-bold uppercase tracking-widest text-white/60 focus:text-white outline-none cursor-pointer"
                  >
                    <option value="viewer">Viewer (Guest)</option>
                    <option value="editor">Editor (Staff)</option>
                    <option value="admin">Admin (Executive)</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                    user.status === 'suspended' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                  }`}>
                    {user.status || 'active'}
                  </span>
                </td>
                <td className="px-6 py-4 rounded-r-2xl text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => toggleStatus(user)}
                      className={`p-2 rounded-lg transition-colors ${
                        user.status === 'suspended' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}
                      title={user.status === 'suspended' ? 'Activate' : 'Suspend'}
                    >
                      {user.status === 'suspended' ? <UserPlus className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showMessageModal && (
        <BroadcastModal 
          selectedUsers={users.filter(u => selectedIds.includes(u.id))}
          onClose={() => setShowMessageModal(false)}
        />
      )}
    </div>
  );
}
