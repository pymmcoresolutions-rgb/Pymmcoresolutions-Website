import { useState, useEffect } from 'react';
import { 
  collection, query, onSnapshot, 
  doc, updateDoc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, 
  Search, Loader2, ExternalLink, RefreshCw,
  FileSearch, Activity, Flag, ChevronRight
} from 'lucide-react';
import { auditApplication, AuditResult } from '../../services/geminiService';
import { useAuth } from '../../lib/auth';

interface AppRecord {
  id: string;
  name: string;
  description: string;
  link?: string;
  sourceCodeUrl?: string;
  developer: string;
  aiRiskScore?: 'Safe' | 'Suspicious' | 'Dangerous';
  aiReport?: string;
  aiFlags?: string[];
  lastAuditAt?: any;
}

export default function SecurityAudits() {
  const { logActivity } = useAuth();
  const [apps, setApps] = useState<AppRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuditing, setIsAuditing] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<AppRecord | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'apps'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppRecord)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAudit = async (app: AppRecord) => {
    setIsAuditing(app.id);
    try {
      const result: AuditResult = await auditApplication({
        name: app.name,
        description: app.description,
        link: app.link || '',
        sourceCodeUrl: app.sourceCodeUrl,
        developer: app.developer
      });

      await updateDoc(doc(db, 'apps', app.id), {
        aiRiskScore: result.riskScore,
        aiReport: result.report,
        aiFlags: result.flags,
        lastAuditAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await logActivity('app_security_audit_performed', { 
        appId: app.id, 
        appName: app.name,
        riskScore: result.riskScore 
      });

      // Update local state for immediate feedback if selected
      if (selectedApp?.id === app.id) {
        setSelectedApp({
          ...app,
          aiRiskScore: result.riskScore,
          aiReport: result.report,
          aiFlags: result.flags,
          lastAuditAt: new Date()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `apps/${app.id}`);
    } finally {
      setIsAuditing(null);
    }
  };

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.developer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/5 border border-white/10 p-6 rounded-[2rem]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
            <ShieldAlert className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Security Intelligence</h3>
            <p className="text-xs text-white/40 uppercase tracking-widest">AI-Powered Risk Assessment</p>
          </div>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input 
            type="text"
            placeholder="Search submissions by name or developer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-red-500/50 transition-all text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
        {/* App List */}
        <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Software Submissions</h4>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
              </div>
            ) : filteredApps.map(app => (
              <button
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className={`w-full text-left p-4 rounded-2xl transition-all border ${
                  selectedApp?.id === app.id 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : 'bg-white/5 border-transparent hover:bg-white/10'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-sm line-clamp-1">{app.name}</span>
                  {app.aiRiskScore && (
                    <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                      app.aiRiskScore === 'Safe' ? 'bg-green-500/20 text-green-400' :
                      app.aiRiskScore === 'Suspicious' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {app.aiRiskScore}
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-white/40 line-clamp-1">by {app.developer}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Audit Details */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden flex flex-col relative">
          <AnimatePresence mode="wait">
            {selectedApp ? (
              <motion.div
                key={selectedApp.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 overflow-y-auto p-8 space-y-8"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black">{selectedApp.name}</h2>
                    <p className="text-sm text-white/40">Submission Security Protocol</p>
                  </div>
                  <button
                    disabled={isAuditing === selectedApp.id}
                    onClick={() => handleAudit(selectedApp)}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-900/50 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-600/20"
                  >
                    {isAuditing === selectedApp.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {selectedApp.aiRiskScore ? 'Trigger Re-Audit' : 'Run Initial Audit'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-3xl bg-black/40 border border-white/5 space-y-2">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-white/20">Risk Assessment</h5>
                    <div className="flex items-center gap-3">
                      {selectedApp.aiRiskScore === 'Safe' && <ShieldCheck className="w-6 h-6 text-green-400" />}
                      {selectedApp.aiRiskScore === 'Suspicious' && <AlertTriangle className="w-6 h-6 text-yellow-400" />}
                      {selectedApp.aiRiskScore === 'Dangerous' && <ShieldAlert className="w-6 h-6 text-red-400" />}
                      {!selectedApp.aiRiskScore && <Activity className="w-6 h-6 text-white/20" />}
                      <span className={`text-xl font-black ${
                        selectedApp.aiRiskScore === 'Safe' ? 'text-green-400' :
                        selectedApp.aiRiskScore === 'Suspicious' ? 'text-yellow-400' :
                        selectedApp.aiRiskScore === 'Dangerous' ? 'text-red-400' :
                        'text-white/20'
                      }`}>
                        {selectedApp.aiRiskScore || 'PENDING'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl bg-black/40 border border-white/5 space-y-2">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-white/20">Last Scanned</h5>
                    <p className="text-sm font-bold text-white/60">
                      {selectedApp.lastAuditAt?.toDate?.() ? new Date(selectedApp.lastAuditAt.toDate()).toLocaleString() : 'Never Scanned'}
                    </p>
                  </div>
                  <div className="p-6 rounded-3xl bg-black/40 border border-white/5 space-y-2">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-white/20">Target Ecosystem</h5>
                    <p className="text-sm font-bold text-white/60 truncate">{selectedApp.developer}</p>
                  </div>
                </div>

                {selectedApp.aiReport ? (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <FileSearch className="w-4 h-4 text-red-400" />
                        <h4 className="font-bold">Technical AI Audit Report</h4>
                      </div>
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 leading-relaxed text-white/70 text-sm whitespace-pre-wrap italic">
                        {selectedApp.aiReport}
                      </div>
                    </div>

                    {selectedApp.aiFlags && selectedApp.aiFlags.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Flag className="w-4 h-4 text-yellow-400" />
                          <h4 className="font-bold">Security Flags & Indicators</h4>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {selectedApp.aiFlags.map((flag, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              <span className="text-[10px] font-black uppercase text-red-400 tracking-widest">{flag}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/20">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4">Submission Assets</h5>
                      <div className="flex gap-6">
                        {selectedApp.link && (
                          <a href={selectedApp.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold hover:text-blue-400 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" /> Launch Target
                          </a>
                        )}
                        {selectedApp.sourceCodeUrl && (
                          <a href={selectedApp.sourceCodeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold hover:text-purple-400 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" /> Source Repository
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                      <Loader2 className={`w-8 h-8 text-white/10 ${isAuditing === selectedApp.id ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="max-w-xs mx-auto">
                      <h4 className="font-bold mb-2">Scan Required</h4>
                      <p className="text-xs text-white/40 leading-relaxed uppercase tracking-widest italic">
                        This submission has not been processed through the AI Security Protocol.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <ShieldAlert className="w-16 h-16 text-white/5 mb-6" />
                <h3 className="text-xl font-bold mb-2">No Application Selected</h3>
                <p className="text-xs text-white/20 uppercase tracking-[0.2em] max-w-xs leading-relaxed">
                  Select a submission from the registry to initialize the Intelligence Protocol.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
