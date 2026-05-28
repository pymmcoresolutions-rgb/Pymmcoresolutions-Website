import { useState, useEffect } from 'react';
import { 
  collection, query, where, onSnapshot, 
  doc, updateDoc, deleteDoc, serverTimestamp, getDocs
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, XCircle, Clock, Search, 
  Filter, Edit3, Trash2, ExternalLink, 
  MessageSquare, Save, AlertCircle, Loader2,
  Layout, Smartphone, Monitor, ShieldCheck,
  ImageIcon, Sparkles, Box, Globe, Plus, Send
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import ImageUploader from '../ui/ImageUploader';
import { suggestAppIcon } from '../../services/geminiService';
import { ListItemSkeleton } from '../ui/Skeleton';
import * as LucideIcons from 'lucide-react';

const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  if (!name) return <LucideIcons.Box className={className} />;
  
  if (name.startsWith('data:image') || name.startsWith('http')) {
    return <img src={name} alt="Icon" className={`${className} object-cover rounded-lg`} />;
  }

  const Icon = (LucideIcons as any)[name] || LucideIcons.Box;
  return <Icon className={className} />;
};

interface AppSubmission {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string | string[];
  developer: string;
  price: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  paymentStatus: 'paid' | 'unpaid';
  authorUid: string;
  adminNotes?: string;
  aiRiskScore?: 'Safe' | 'Suspicious' | 'Dangerous';
  aiReport?: string;
  createdAt: any;
  link?: string;
  sourceCodeUrl?: string;
  icon?: string;
  screenshots?: string[];
  features?: string[];
}

export default function SubmissionManager() {
  const { logActivity } = useAuth();
  const [submissions, setSubmissions] = useState<AppSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AppSubmission>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuggestingIcon, setIsSuggestingIcon] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSendingNotification, setIsSendingNotification] = useState<string | null>(null);

  useEffect(() => {
    let q = query(collection(db, 'apps'), where('isDraft', '==', false));
    if (filter !== 'all') {
      q = query(collection(db, 'apps'), where('isDraft', '==', false), where('approvalStatus', '==', filter));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppSubmission)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filter]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkAction = async (status: 'approved' | 'rejected') => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    try {
      const promises = Array.from(selectedIds).map(id => 
        updateDoc(doc(db, 'apps', id), {
          approvalStatus: status,
          status: status === 'approved' ? 'production' : 'staging',
          adminNotes: status === 'approved' ? 'Bulk approved and synchronized with production.' : 'Bulk rejected. Review guidelines.',
          updatedAt: serverTimestamp()
        })
      );
      await Promise.all(promises);
      await logActivity('bulk_moderation_action', { count: selectedIds.size, status });
      setSelectedIds(new Set());
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `apps/bulk`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'apps', id), {
        approvalStatus: status,
        status: status === 'approved' ? 'production' : 'staging',
        adminNotes: notes || '',
        updatedAt: serverTimestamp()
      });
      await logActivity('app_submission_reviewed', { appId: id, status, notes });
      setEditingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `apps/${id}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecommission = async (id: string) => {
    if (!confirm("Are you sure you want to take this app offline?")) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'apps', id), {
        status: 'staging',
        approvalStatus: 'rejected',
        adminNotes: 'Manually taken offline by administration due to terms of service violation.',
        updatedAt: serverTimestamp()
      });
      await logActivity('app_decommissioned', { appId: id });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `apps/${id}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotifyWaitlist = async (app: AppSubmission) => {
    setIsSendingNotification(app.id);
    try {
      // 1. Fetch waitlist collection
      const q = query(collection(db, 'waitlist'));
      const snap = await getDocs(q);
      
      const emails = snap.docs
        .map(d => d.data())
        .filter(item => {
          const appIds = item.targetAppIds || (item.targetAppId ? [item.targetAppId] : []);
          return appIds.includes(app.id) || (app.id === 'general' && appIds.includes('general'));
        })
        .map(item => item.email)
        .filter(Boolean);

      // Remove potential duplicates
      const uniqueEmails = Array.from(new Set(emails));

      if (uniqueEmails.length === 0) {
        alert(`No waitlist subscribers found registered for "${app.name}".`);
        return;
      }

      // 2. Compose notification details
      const subject = `🚀 "${app.name}" is officially launched!`;
      const content = `We are proud to notify you that "${app.name}" has officially passed all security audits and is now live on the PymmCore Production Mesh!\n\nAs a priority waitlist member, you are authorized to gain instant access now.\n\nDescription:\n${app.description}\n\nLaunch Link:\n${app.link || 'https://pymmcore.com'}\n\nThank you for choosing PymmCore Solutions. Secure synchronization complete.`;

      // 3. Dispatch broadcast endpoint
      const response = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: uniqueEmails, subject, content })
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Success! Broadcast notification dispatched to ${uniqueEmails.length} subscriber(s) for "${app.name}" in one click.`);
        await logActivity('waitlist_notification_sent', { appId: app.id, count: uniqueEmails.length });
      } else {
        throw new Error(data.error || 'Server rejected broadcast request');
      }
    } catch (err: any) {
      console.error("Broadcast notification failed:", err);
      alert(`Broadcast notification failed: ${err.message || err}`);
    } finally {
      setIsSendingNotification(null);
    }
  };

  const handleSaveEdits = async (id: string) => {
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'apps', id), {
        ...editForm,
        updatedAt: serverTimestamp()
      });
      await logActivity('app_submission_refined', { appId: id });
      setEditingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `apps/${id}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestIcon = async () => {
    if (!editForm.name || !editForm.description) return;
    setIsSuggestingIcon(true);
    try {
      const suggestion = await suggestAppIcon(editForm.name, editForm.description);
      setEditForm(prev => ({ ...prev, icon: suggestion.iconName }));
    } catch (err) {
      console.error("Icon suggestion failed:", err);
    } finally {
      setIsSuggestingIcon(false);
    }
  };

  const startEdit = (sub: AppSubmission) => {
    setEditingId(sub.id);
    setEditForm(sub);
    setTimeout(() => {
      const element = document.getElementById(`submission-${sub.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  // if (loading) return (
  //   <div className="flex items-center justify-center h-64">
  //     <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
  //   </div>
  // );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/5 border border-white/10 p-6 rounded-[2rem]">
        <div className="flex items-center gap-4">
          <ShieldCheck className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-xl font-bold">Application Review Dashboard</h3>
            <p className="text-xs text-white/40 uppercase tracking-widest">Manual Review Pending</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {selectedIds.size > 0 && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl"
            >
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{selectedIds.size} Selected</span>
              <button 
                onClick={() => handleBulkAction('approved')}
                className="text-[10px] font-black uppercase text-green-500 hover:text-green-400 px-2"
              >
                Approve All
              </button>
              <button 
                onClick={() => handleBulkAction('rejected')}
                className="text-[10px] font-black uppercase text-red-500 hover:text-red-400 px-2"
              >
                Reject All
              </button>
            </motion.div>
          )}

          <div className="flex gap-2 bg-black/40 border border-white/5 p-1 rounded-xl">
            {['all', 'pending', 'approved', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/40 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <ListItemSkeleton key={i} />)
          ) : submissions.map((sub) => (
            <motion.div
              key={sub.id}
              id={`submission-${sub.id}`}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-8 rounded-[2.5rem] bg-white/5 border transition-all group overflow-hidden ${
                selectedIds.has(sub.id) ? 'border-blue-500/50 bg-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : 'border-white/10 hover:border-white/20'
              }`}
            >
              {editingId === sub.id ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1">
                      <ImageUploader 
                        label="Icon Refinement"
                        currentImage={editForm.icon}
                        onUpload={(base64) => setEditForm({ ...editForm, icon: base64 })}
                        maxSizeMB={0.5}
                      />
                    </div>
                    <div className="md:col-span-3 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Icon Selection</label>
                        <button
                          onClick={handleSuggestIcon}
                          disabled={isSuggestingIcon}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black uppercase text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-50"
                        >
                          {isSuggestingIcon ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          AI Icon Suggestion
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Platform Coverage</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {['Web', 'Mobile', 'Desktop', 'All'].map((p) => {
                            const platformList = Array.isArray(editForm.type) ? editForm.type : [editForm.type || ''];
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
                                  setEditForm({ ...editForm, type: next });
                                }}
                                className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[8px] font-bold uppercase tracking-widest text-white/10">Application Icon</label>
                          <div className="relative">
                            <input 
                              value={editForm.icon}
                              onChange={e => setEditForm({...editForm, icon: e.target.value})}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500 transition-all font-medium text-sm"
                              placeholder="e.g. Shield, Cpu, Rocket"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              {editForm.icon && !editForm.icon.startsWith('data:image') && (
                                <DynamicIcon name={editForm.icon} className="w-5 h-5 text-blue-400" />
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Primary Category</label>
                          <select 
                            value={editForm.category}
                            onChange={e => setEditForm({...editForm, category: e.target.value})}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500 transition-all font-medium text-sm appearance-none"
                          >
                            {['Productivity', 'Finance', 'Education', 'Entertainment', 'Health & Fitness', 'Lifestyle', 'Utilities', 'Social', 'Business', 'Developer Tools', 'Other'].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Display Name</label>
                          <input 
                            value={editForm.name}
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500 transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Key Features</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(Array.isArray(editForm.features) ? editForm.features : []).map((f, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl group/feat">
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span className="text-xs text-white/70 line-clamp-1">{f}</span>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => setEditForm(prev => ({ ...prev, features: (prev.features || []).filter((_, i) => i !== idx) }))}
                                className="text-white/20 hover:text-red-500 transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input 
                            id="review-feature-input"
                            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
                            placeholder="Add core capability..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = (e.target as HTMLInputElement).value.trim();
                                if (val) {
                                  const current = Array.isArray(editForm.features) ? editForm.features : [];
                                  if (!current.includes(val)) {
                                    setEditForm({ ...editForm, features: [...current, val] });
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('review-feature-input') as HTMLInputElement;
                              const val = input.value.trim();
                              if (val) {
                                const current = Array.isArray(editForm.features) ? editForm.features : [];
                                if (!current.includes(val)) {
                                  setEditForm({ ...editForm, features: [...current, val] });
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

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Description Refinement</label>
                        <textarea 
                          value={editForm.description}
                          onChange={e => setEditForm({...editForm, description: e.target.value})}
                          rows={3}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium resize-none text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Visual Proof Refinement</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[0, 1, 2, 3].map(idx => (
                        <ImageUploader 
                          key={idx}
                          aspectRatio="video"
                          currentImage={editForm.screenshots?.[idx]}
                          onUpload={(base64) => {
                            const next = [...(editForm.screenshots || [])];
                            if (base64) next[idx] = base64;
                            else if (next[idx]) next.splice(idx, 1);
                            setEditForm({ ...editForm, screenshots: next });
                          }}
                          maxSizeMB={0.5}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/20">Admin Review Notes / Feedback</label>
                      <textarea 
                        value={editForm.adminNotes}
                        onChange={e => setEditForm({...editForm, adminNotes: e.target.value})}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500 transition-all font-medium resize-none text-sm h-32"
                        placeholder="Internal notes or feedback for developer (shown if rejected)..."
                      />
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleSaveEdits(sub.id)}
                        disabled={isProcessing}
                        className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Refinements
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative">
                  <div 
                    onClick={() => toggleSelect(sub.id)}
                    className="flex-1 space-y-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        selectedIds.has(sub.id) ? 'bg-blue-600 border-blue-600' : 'border-white/20 bg-white/5'
                      }`}>
                        {selectedIds.has(sub.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                        {(Array.isArray(sub.type) ? sub.type : [sub.type]).map(t => (
                          <div key={t} title={t}>
                            {t === 'Web' && <Globe className="w-5 h-5 text-blue-400" />}
                            {t === 'Mobile' && <Smartphone className="w-5 h-5 text-purple-400" />}
                            {t === 'Desktop' && <Monitor className="w-5 h-5 text-teal-400" />}
                            {t === 'All' && <Sparkles className="w-5 h-5 text-amber-400" />}
                          </div>
                        ))}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold">{sub.name}</h4>
                        <p className="text-xs text-white/40">{sub.category} • Developed by {sub.developer}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        sub.approvalStatus === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        sub.approvalStatus === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {sub.approvalStatus}
                      </div>
                    </div>
                    
                    <p className="text-sm text-white/60 leading-relaxed line-clamp-3 italic">"{sub.description}"</p>
                    
                    {sub.aiRiskScore && (
                      <div className={`p-6 rounded-[2rem] border transition-all ${
                        sub.aiRiskScore === 'Safe' ? 'bg-green-500/5 border-green-500/20' :
                        sub.aiRiskScore === 'Suspicious' ? 'bg-yellow-500/5 border-yellow-500/20' :
                        'bg-red-500/5 border-red-500/20'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              sub.aiRiskScore === 'Safe' ? 'bg-green-500/20 text-green-400' :
                              sub.aiRiskScore === 'Suspicious' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em]">AI Safety Assessment</h5>
                          </div>
                          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            sub.aiRiskScore === 'Safe' ? 'bg-green-600 text-white' :
                            sub.aiRiskScore === 'Suspicious' ? 'bg-yellow-600 text-black' :
                            'bg-red-600 text-white'
                          }`}>
                            {sub.aiRiskScore}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/60 leading-relaxed mb-4">{sub.aiReport}</p>
                        <div className="flex gap-4">
                          {sub.link && (
                            <a href={sub.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-bold text-blue-400 hover:underline">
                              <ExternalLink className="w-3 h-3" /> Target Node
                            </a>
                          )}
                          {sub.sourceCodeUrl && (
                            <a href={sub.sourceCodeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-bold text-purple-400 hover:underline">
                              <ExternalLink className="w-3 h-3" /> Source Repository
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {sub.adminNotes && (
                      <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-[10px] text-red-500/80 leading-relaxed">
                        <span className="font-black uppercase mr-2 tracking-widest">Admin Feedback:</span>
                        {sub.adminNotes}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 pt-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-white/30">
                        <CheckCircle2 className={`w-3 h-3 ${sub.paymentStatus === 'paid' ? 'text-green-500' : 'text-red-500'}`} />
                        {sub.paymentStatus === 'paid' ? 'Fee Verified' : 'Unpaid Entry'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-white/30">
                        <Clock className="w-3 h-3" />
                        {sub.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(sub.id, 'approved', 'Submission verified and synchronized with production mesh.')}
                        disabled={isProcessing || sub.approvalStatus === 'approved'}
                        className="flex-1 md:w-32 py-3 bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white border border-green-500/20 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                      <button 
                        onClick={() => {
                          const feedback = prompt("Enter rejection feedback for the developer:");
                          if (feedback) handleUpdateStatus(sub.id, 'rejected', feedback);
                        }}
                        disabled={isProcessing || sub.approvalStatus === 'rejected'}
                        className="flex-1 md:w-32 py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startEdit(sub)}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/5 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                      >
                        <Edit3 className="w-4 h-4" />
                        Refine
                      </button>
                      {sub.approvalStatus === 'approved' && (
                        <>
                          <button 
                            onClick={() => handleNotifyWaitlist(sub)}
                            disabled={isSendingNotification === sub.id}
                            className="flex-1 py-3 bg-teal-600/10 hover:bg-teal-600 text-teal-400 hover:text-white border border-teal-500/20 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                          >
                            {isSendingNotification === sub.id ? (
                              <span className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin shrink-0" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            Notify Waitlist
                          </button>
                          <button 
                            onClick={() => handleDecommission(sub.id)}
                            className="flex-1 py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                          >
                            <Trash2 className="w-4 h-4" />
                            Offline
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && submissions.length === 0 && (
          <div className="p-20 text-center rounded-[3rem] border border-dashed border-white/10 bg-white/5">
            <Layout className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/20">No matching submissions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
