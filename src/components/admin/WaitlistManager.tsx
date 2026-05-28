import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { 
  Users, Mail, Clock, Trash2, Search, Filter, 
  Download, Send, CheckCircle2, UserCheck, Shield,
  Award, TrendingUp, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmDialog from './ConfirmDialog';

export default function WaitlistManager() {
  const { isAdmin, loading } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [apps, setApps] = useState<Record<string, any>>({});
  const [expandedEmails, setExpandedEmails] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !isAdmin) return;

    // Load waitlist entries
    const q = query(collection(db, 'waitlist'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setError(null);
    }, (err) => {
      console.error("WaitlistManager subscription error:", err);
      setError("Waitlist update failed.");
    });

    // Load approved apps to map IDs to titles
    const appsQuery = query(collection(db, 'apps'));
    const unsubscribeApps = onSnapshot(appsQuery, (snap) => {
      const appMap: Record<string, any> = {};
      snap.docs.forEach(d => {
        appMap[d.id] = d.data();
      });
      setApps(appMap);
    }, (err) => {
      console.error("Apps load in WaitlistManager failed:", err);
    });

    return () => {
      unsubscribe();
      unsubscribeApps();
    };
  }, [loading, isAdmin]);

  // Consolidated entries by email, supporting array-based targetAppIds & single targetAppId
  const consolidated = (() => {
    const map = new Map<string, any>();
    entries.forEach(entry => {
      const email = entry.email?.toLowerCase() || '';
      if (!email) return;

      const appIds = new Set<string>();
      if (entry.targetAppIds && Array.isArray(entry.targetAppIds)) {
        entry.targetAppIds.forEach((id: string) => appIds.add(id));
      }
      if (entry.targetAppId) {
        appIds.add(entry.targetAppId);
      }

      if (map.has(email)) {
        const existing = map.get(email);
        if ((!existing.name || existing.name === 'Anonymous Node' || existing.name === 'Anonymous') && entry.name && entry.name !== 'Anonymous Node' && entry.name !== 'Anonymous') {
          existing.name = entry.name;
        }
        if (entry.createdAt && (!existing.createdAt || entry.createdAt > existing.createdAt)) {
          existing.createdAt = entry.createdAt;
        }
        existing.docIds.push(entry.id);
        appIds.forEach(id => existing.appIds.add(id));
        if (!existing.userId && entry.userId) {
          existing.userId = entry.userId;
        }
        existing.subscribed = existing.subscribed || entry.subscribed;
      } else {
        map.set(email, {
          ...entry,
          docIds: [entry.id],
          appIds: appIds
        });
      }
    });

    return Array.from(map.values()).map(item => ({
      ...item,
      appIds: Array.from(item.appIds)
    }));
  })();

  const appStats = (() => {
    const stats: Record<string, { id: string; name: string; count: number; emails: string[] }> = {};
    
    // Initialize apps with 0 count
    Object.entries(apps).forEach(([id, appData]) => {
      stats[id] = {
        id,
        name: appData.name || id,
        count: 0,
        emails: []
      };
    });
    
    // Ensure 'general' is initialized
    if (!stats['general']) {
      stats['general'] = {
        id: 'general',
        name: 'General Interest Protocol',
        count: 0,
        emails: []
      };
    }
    
    // Count unique subscribers from consolidated list
    consolidated.forEach(entry => {
      const email = entry.email || '';
      if (entry.appIds && Array.isArray(entry.appIds)) {
        entry.appIds.forEach((appId: string) => {
          if (!stats[appId]) {
            stats[appId] = {
              id: appId,
              name: apps[appId]?.name || appId,
              count: 0,
              emails: []
            };
          }
          if (!stats[appId].emails.includes(email)) {
            stats[appId].emails.push(email);
            stats[appId].count += 1;
          }
        });
      }
    });
    
    // Sort descending by count
    return Object.values(stats).sort((a, b) => b.count - a.count);
  })();

  const maxCount = Math.max(...appStats.map(s => s.count), 1);

  const filteredEntries = consolidated.filter(e => 
    e.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleDeleteSingle = async (entry: any) => {
    try {
      const docIdsToDelete = entry.docIds || [entry.id];
      await Promise.all(docIdsToDelete.map((id: string) => deleteDoc(doc(db, 'waitlist', id))));
      setSelectedIds(prev => prev.filter(i => i !== entry.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Deletion failed:", err);
    }
  };

  const handleDeleteBulk = async () => {
    if (selectedIds.length === 0) return;
    try {
      const docIdsToDelete: string[] = [];
      filteredEntries.forEach(entry => {
        if (selectedIds.includes(entry.id)) {
          docIdsToDelete.push(...(entry.docIds || [entry.id]));
        }
      });
      await Promise.all(docIdsToDelete.map(id => deleteDoc(doc(db, 'waitlist', id))));
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
    } catch (err) {
      console.error("Bulk deletion failed:", err);
    }
  };

  const toggleExpandUser = (email: string, id: string) => {
    const isOpening = !expandedEmails[email];
    setExpandedEmails(prev => ({
      ...prev,
      [email]: !prev[email]
    }));

    if (isOpening) {
      setTimeout(() => {
        const element = document.getElementById(`waitlist-row-${id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  };

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
              placeholder="Search waitlist..."
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

          {selectedIds.length > 0 && (
            <button 
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-all"
            >
              <Trash2 className="w-4 h-4" /> Delete ({selectedIds.length})
            </button>
          )}
          
          <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white transition-all">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* App Demand Metrics Leaderboard */}
      <div className="p-6 rounded-[2rem] bg-gradient-to-br from-slate-900/60 to-black/40 border border-white/5 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-400" /> App Subscription Demand Leaderboard
            </h4>
            <p className="text-[11px] text-white/40 mt-0.5">
              Live waitlist interest, ranking applications by total verified subscriber nods.
            </p>
          </div>
          <div className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-3 h-3 animate-pulse" /> Ranked by Subscribers
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appStats.map((item, index) => {
            const isTopApp = index === 0 && item.count > 0;
            const progressPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            
            return (
              <div 
                key={item.id}
                className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                  isTopApp 
                    ? 'bg-gradient-to-br from-teal-950/20 to-slate-900/40 border-teal-500/30 shadow-lg shadow-teal-500/5' 
                    : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                }`}
              >
                {/* Ranking Icon/Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1">
                  {isTopApp ? (
                    <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center shadow-sm" title="Highest Subscribed App">
                      <Award className="w-4 h-4 text-amber-400 animate-bounce" />
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-white/30 group-hover:text-white/60 transition-colors">
                      #{index + 1}
                    </span>
                  )}
                </div>

                {/* App details details */}
                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-semibold text-white/90 truncate pr-8" title={item.name}>
                      {item.name}
                    </h5>
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mt-0.5">
                      {item.id}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end text-xs">
                      <span className="text-white/40">Verified Nods</span>
                      <span className="font-bold text-sm text-teal-400 group-hover:text-teal-300 transition-colors">
                        {item.count} {item.count === 1 ? 'person' : 'people'}
                      </span>
                    </div>

                    {/* Visual Progress Meter */}
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          isTopApp 
                            ? 'bg-gradient-to-r from-teal-500 to-emerald-400' 
                            : 'bg-gradient-to-r from-teal-600/60 to-teal-500/50'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {appStats.length === 0 && (
            <div className="col-span-full py-8 text-center border border-dashed border-white/10 rounded-2xl text-white/30 text-xs italic">
              No waitlist metrics available yet. Register a waitlist entry to initialize tracking.
            </div>
          )}
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
              <th className="px-6 py-2 text-left">User</th>
              <th className="px-6 py-2 text-left">Marketing Emails</th>
              <th className="px-6 py-2 text-left">Registration Date</th>
              <th className="px-6 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map(entry => (
              <tr 
                key={entry.id} 
                id={`waitlist-row-${entry.id}`}
                className="bg-white/5 border border-white/10 group hover:bg-white/[0.08] transition-colors"
              >
                <td className="px-6 py-4 rounded-l-2xl">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(entry.id)}
                    onChange={() => handleSelectOne(entry.id)}
                    className="rounded border-white/10 bg-black/40 text-teal-600 focus:ring-teal-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-teal-600/20 flex items-center justify-center text-teal-400 font-bold text-xs uppercase shrink-0 mt-0.5">
                      {entry.name?.[0] || entry.email?.[0]}
                    </div>
                    <div>
                      <div 
                        onClick={() => toggleExpandUser(entry.email, entry.id)}
                        className="text-sm font-medium hover:text-teal-400 cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        {entry.name || 'Anonymous Node'}
                        <span className="text-[10.5px] text-teal-500/60 hover:underline">({entry.appIds.length} app{entry.appIds.length !== 1 ? 's' : ''})</span>
                      </div>
                      <div className="text-[10px] text-white/40">{entry.email}</div>
                      
                      {expandedEmails[entry.email] && (
                        <div className="mt-2.5 p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 max-w-sm">
                          <p className="text-[9px] text-teal-400 font-bold uppercase tracking-widest border-b border-white/5 pb-1">Subscribed Apps</p>
                          <div className="space-y-1">
                            {entry.appIds.map((appId: string) => {
                              const appName = apps[appId]?.name || (appId === 'general' ? 'General Interest Protocol' : appId);
                              return (
                                <div key={appId} className="text-[11px] text-white/80 flex items-center gap-1.5 leading-relaxed">
                                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 animate-pulse" />
                                  <span>{appName}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
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
                    onClick={() => setDeleteTarget(entry)}
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
          selectedUsers={consolidated.filter(e => selectedIds.includes(e.id))}
          onClose={() => setShowMessageModal(false)}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Waitlist Entry"
        message="Are you sure you want to permanently delete this waitlist entry and all of their related registrations? This action cannot be undone."
        onConfirm={() => deleteTarget && handleDeleteSingle(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        title="Delete Selected Entries"
        message={`Are you sure you want to permanently delete the ${selectedIds.length} selected consolidated entries? This action cannot be undone.`}
        onConfirm={handleDeleteBulk}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />
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
        setResult({ type: 'success', message: `${emails.length} messages sent successfully.` });
        setTimeout(onClose, 2000);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setResult({ type: 'error', message: err.message || 'Message sending failed.' });
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
            <Send className="w-5 h-5 text-teal-400" /> System Announcement
          </h4>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/20">
            <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mb-1">Recipient Group</p>
            <p className="text-sm font-medium">{selectedUsers.length} selected recipients</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Email Subject</label>
              <input 
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="PymmCore Updates"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-teal-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Message Content</label>
              <textarea 
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Type your message..."
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
              Send Announcement
            </button>
          </div>
          
          <p className="text-[9px] text-white/20 text-center leading-relaxed">
            CRITICAL: By initiating this broadcast, you confirm compliance with global anti-spam regulations (GDPR/CAN-SPAM). 
            Unsubscribe links will be automatically appended to the footer of all sent messages.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
