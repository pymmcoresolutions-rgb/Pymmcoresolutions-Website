import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Trash2, 
  User, 
  Calendar, 
  Globe, 
  Smartphone, 
  Monitor, 
  ChevronRight, 
  Info, 
  Sparkles, 
  ListFilter,
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2,
  Box
} from 'lucide-react';
import ConfirmDialog from './admin/ConfirmDialog';

interface WaitlistDoc {
  id: string;
  email: string;
  name: string;
  subscribed: boolean;
  targetAppId: string;
  userId: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Invited';
  createdAt: any;
}

interface AppDoc {
  id: string;
  name: string;
  description: string;
  developer: string;
  expectedLaunchDate?: string;
  type: string | string[];
  status: string;
  icon?: string;
  authorUid: string;
}

export default function MyWaitlist() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'developer'>('subscriptions');
  const [mySubscriptions, setMySubscriptions] = useState<WaitlistDoc[]>([]);
  const [developerApps, setDeveloperApps] = useState<AppDoc[]>([]);
  const [selectedDevApp, setSelectedDevApp] = useState<AppDoc | null>(null);
  const [devWaitlist, setDevWaitlist] = useState<WaitlistDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [allApps, setAllApps] = useState<Record<string, AppDoc>>({});
  
  // Modals / Confirmations
  const [unsubscribeTarget, setUnsubscribeTarget] = useState<WaitlistDoc | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // 1. Fetch all apps to map names/icons
    const appsUnsubscribe = onSnapshot(collection(db, 'apps'), (snap) => {
      const appsMap: Record<string, AppDoc> = {};
      const devAppsList: AppDoc[] = [];
      
      snap.docs.forEach(docSnap => {
        const data = docSnap.data() as Omit<AppDoc, 'id'>;
        const app = { id: docSnap.id, ...data } as AppDoc;
        appsMap[docSnap.id] = app;
        
        if (app.authorUid === user.uid) {
          devAppsList.push(app);
        }
      });
      
      setAllApps(appsMap);
      setDeveloperApps(devAppsList);
      if (devAppsList.length > 0 && !selectedDevApp) {
        setSelectedDevApp(devAppsList[0]);
      }
    });

    // 2. Fetch user's joined waitlists
    const myWaitlistQuery = query(
      collection(db, 'waitlist'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const waitlistUnsubscribe = onSnapshot(myWaitlistQuery, (snap) => {
      const list = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as WaitlistDoc));
      setMySubscriptions(list);
      setLoading(false);
    }, (err) => {
      console.error("Error loading personal waitlists:", err);
      // Fallback: Query by email to ensure resilience
      const fallbackQuery = query(
        collection(db, 'waitlist'),
        where('email', '==', user.email?.toLowerCase()),
        orderBy('createdAt', 'desc')
      );
      onSnapshot(fallbackQuery, (fallbackSnap) => {
        const list = fallbackSnap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as WaitlistDoc));
        setMySubscriptions(list);
        setLoading(false);
      }, (err2) => {
        handleFirestoreError(err2, OperationType.LIST, 'waitlist');
        setLoading(false);
      });
    });

    return () => {
      appsUnsubscribe();
      waitlistUnsubscribe();
    };
  }, [user]);

  // Listen to waitlist entries for a selected App in Developer View
  useEffect(() => {
    if (!user || !selectedDevApp) {
      setDevWaitlist([]);
      return;
    }

    const devWaitlistQuery = query(
      collection(db, 'waitlist'),
      where('targetAppId', '==', selectedDevApp.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(devWaitlistQuery, (snap) => {
      const list = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as WaitlistDoc));
      setDevWaitlist(list);
    }, (err) => {
      console.warn("Error reading waitlist for developer app:", err);
    });

    return () => unsubscribe();
  }, [user, selectedDevApp]);

  // Actions
  const handleUnsubscribe = async () => {
    if (!unsubscribeTarget) return;
    setActionLoading(unsubscribeTarget.id);
    try {
      await deleteDoc(doc(db, 'waitlist', unsubscribeTarget.id));
      showFeedback('Unsubscribed successfully.', 'success');
    } catch (err) {
      console.error("Unsubscribe action failed:", err);
      showFeedback('Could not cancel subscription. Please try again.', 'error');
    } finally {
      setActionLoading(null);
      setUnsubscribeTarget(null);
    }
  };

  const handleUpdateStatus = async (entry: WaitlistDoc, newStatus: 'Accepted' | 'Rejected' | 'Invited') => {
    setActionLoading(entry.id);
    try {
      // 1. Update status
      await updateDoc(doc(db, 'waitlist', entry.id), {
        status: newStatus
      });

      // 2. Dispatch notification to the waitlist user if we have their userId
      if (entry.userId) {
        let appName = 'general';
        if (selectedDevApp) appName = selectedDevApp.name;
        else if (allApps[entry.targetAppId]) appName = allApps[entry.targetAppId].name;

        await addDoc(collection(db, 'notifications'), {
          userId: entry.userId,
          title: `Waitlist Approved - ${appName}`,
          message: `Your registration for "${appName}" has been updated to: ${newStatus}.`,
          type: newStatus === 'Accepted' || newStatus === 'Invited' ? 'info' : 'alert',
          read: false,
          createdAt: serverTimestamp()
        });
      }

      showFeedback(`Updated status of ${entry.name} to ${newStatus}.`, 'success');
    } catch (err) {
      console.error("Failed to update status:", err);
      showFeedback('Could not update waitlist status.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const showFeedback = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  // Icon Matcher
  const renderAppTypeIcon = (typeInput?: string | string[]) => {
    const mainType = Array.isArray(typeInput) ? typeInput[0] : (typeInput || 'Web');
    if (mainType === 'Mobile') return <Smartphone className="w-5 h-5 text-blue-400" />;
    if (mainType === 'Desktop') return <Monitor className="w-5 h-5 text-pink-400" />;
    return <Globe className="w-5 h-5 text-teal-400" />;
  };

  // Status Badge Creator
  const renderStatusBadge = (status: WaitlistDoc['status']) => {
    const styleMap = {
      Pending: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/20',
      Accepted: 'bg-green-500/15 text-green-500 border-green-500/20',
      Rejected: 'bg-red-500/15 text-red-500 border-red-500/20',
      Invited: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/20',
    };
    const style = styleMap[status] || styleMap.Pending;
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${style}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-teal-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-white/30">Syncing Waitlist Modules...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-widest mb-3">
            <Clock className="w-3 h-3 animate-pulse" /> Access Hub
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Access Management Protocol</h1>
          <p className="text-sm text-white/40 mt-1">Track upcoming solution waitlists, view early invitations, or manage your application pipelines.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'subscriptions' 
                ? 'bg-white text-black shadow-lg shadow-white/5' 
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" /> My Waitlists
          </button>
          
          {developerApps.length > 0 && (
            <button
              onClick={() => setActiveTab('developer')}
              className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'developer' 
                  ? 'bg-white text-black shadow-lg shadow-white/5' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Developer View
            </button>
          )}
        </div>
      </div>

      {/* Floating feedback alert */}
      <AnimatePresence>
        {(successMsg || errorMsg) && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 right-8 z-[120] p-4 rounded-2xl border shadow-xl flex items-center gap-3 text-sm font-bold uppercase tracking-wider ${
              successMsg ? 'bg-teal-950/90 border-teal-500/50 text-teal-400' : 'bg-red-950/90 border-red-500/50 text-red-400'
            }`}
          >
            <Info className="w-4 h-4 shrink-0" />
            {successMsg || errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeTab === 'subscriptions' ? (
          <motion.div
            key="personal-subscriptions"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {mySubscriptions.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.01] max-w-2xl mx-auto">
                <Clock className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No Subscribed Pipelines</h3>
                <p className="text-sm text-white/45 max-w-sm mx-auto mb-6">You have not registered for any upcoming applications. Browse the portal and request early priority access!</p>
                <button
                  onClick={() => window.location.hash = '#'}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg"
                >
                  Explore Showcase
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mySubscriptions.map((sub) => {
                  const targetApp = allApps[sub.targetAppId];
                  return (
                    <motion.div
                      key={sub.id}
                      className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-teal-500/30 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-6">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                              {renderAppTypeIcon(targetApp?.type)}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-white line-clamp-1">{targetApp?.name || 'Acme Node Instance'}</h3>
                              <p className="text-[10px] text-white/30 uppercase tracking-wider">{targetApp?.developer || 'Priority Channel'}</p>
                            </div>
                          </div>
                          {renderStatusBadge(sub.status)}
                        </div>

                        <p className="text-xs text-white/45 leading-relaxed line-clamp-3">
                          {targetApp?.description || 'Exclusive priority allocation queue. Access invitations will dispatch immediately upon staging verification approvals.'}
                        </p>
                      </div>

                      <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest block">Subscription Date</span>
                          <span className="text-xs text-white/60 flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {sub.createdAt?.toDate ? new Date(sub.createdAt.toDate()).toLocaleDateString() : 'Active Session'}
                          </span>
                        </div>

                        <button
                          onClick={() => setUnsubscribeTarget(sub)}
                          className="px-4 py-2 bg-red-600/10 hover:bg-red-600 hover:text-white text-red-400 border border-red-500/20 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                        >
                          Unsubscribe
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="developer-hub"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Developer controls */}
            <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Select Managed Infrastructure Node</span>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedDevApp?.id || ''}
                    onChange={(e) => {
                      const found = developerApps.find(app => app.id === e.target.value);
                      if (found) setSelectedDevApp(found);
                    }}
                    className="bg-black/60 text-white font-bold border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-teal-500 outline-none cursor-pointer"
                  >
                    {developerApps.map(app => (
                      <option key={app.id} value={app.id}>{app.name}</option>
                    ))}
                  </select>
                  <span className="text-xs text-white/30">({devWaitlist.length} subscribers registered)</span>
                </div>
              </div>

              {selectedDevApp && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[9px] text-white/30 uppercase tracking-widest font-black block">App Phase Status</span>
                    <span className="text-xs text-teal-400 font-bold uppercase">{selectedDevApp.status}</span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div>
                    <span className="text-[9px] text-white/30 uppercase tracking-widest font-black block">Estimated Launch</span>
                    <span className="text-xs text-blue-400 font-bold">{selectedDevApp.expectedLaunchDate || 'Staging Queue'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* List of waitlisted users */}
            {devWaitlist.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.01] max-w-2xl mx-auto">
                <User className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Queue Vacant</h3>
                <p className="text-sm text-white/45 max-w-sm mx-auto">There are currently no subscribers or registrants for this application's waitlist protocol.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-white/10 rounded-3xl bg-black/30">
                <table className="w-full border-separate border-spacing-y-0 text-left">
                  <thead>
                    <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/5">
                      <th className="px-6 py-4 rounded-tl-3xl">Subscriber Node</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Updates Opt-in</th>
                      <th className="px-6 py-4">Subscription Date</th>
                      <th className="px-6 py-4 text-right rounded-tr-3xl">Management Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devWaitlist.map((entry) => (
                      <tr key={entry.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs uppercase">
                              {entry.name?.[0] || entry.email?.[0]}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-white">{entry.name || 'Anonymous Node'}</div>
                              <div className="text-xs text-white/30 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-white/20" />
                                {entry.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {renderStatusBadge(entry.status)}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
                            entry.subscribed 
                              ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-white/5 text-white/25 border border-white/10'
                          }`}>
                            {entry.subscribed ? 'Marketing OK' : 'Direct Transactional'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-xs text-white/40">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {entry.createdAt?.toDate ? new Date(entry.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {actionLoading === entry.id ? (
                              <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
                            ) : (
                              <>
                                <button
                                  disabled={entry.status === 'Accepted'}
                                  onClick={() => handleUpdateStatus(entry, 'Accepted')}
                                  className="px-3 py-1.5 rounded-lg bg-green-600/10 hover:bg-green-600 hover:text-white text-green-400 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-green-400"
                                >
                                  Approve
                                </button>
                                <button
                                  disabled={entry.status === 'Invited'}
                                  onClick={() => handleUpdateStatus(entry, 'Invited')}
                                  className="px-3 py-1.5 rounded-lg bg-cyan-600/10 hover:bg-cyan-600 hover:text-white text-cyan-400 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-cyan-400"
                                >
                                  Invite
                                </button>
                                <button
                                  disabled={entry.status === 'Rejected'}
                                  onClick={() => handleUpdateStatus(entry, 'Rejected')}
                                  className="px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600 hover:text-white text-red-400 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-red-400"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!unsubscribeTarget}
        title="Unsubscribe Confirmation"
        message={`Are you sure you want to cancel your early access subscription for "${unsubscribeTarget ? (allApps[unsubscribeTarget.targetAppId]?.name || 'this app') : 'this app'}"? Your allocation queue rank may be lost.`}
        onConfirm={handleUnsubscribe}
        onCancel={() => setUnsubscribeTarget(null)}
      />
    </div>
  );
}
