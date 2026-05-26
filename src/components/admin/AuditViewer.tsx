import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { 
  History, Search, Clock, 
  User, Terminal, ChevronDown
} from 'lucide-react';

export default function AuditViewer() {
  const { isAdmin, loading } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [limitCount, setLimitCount] = useState(100);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !isAdmin) return;

    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(limitCount));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setError(null);
    }, (err) => {
      console.error("AuditViewer subscription error:", err);
      setError("Audit log access restricted.");
    });
    return () => unsubscribe();
  }, [loading, isAdmin, limitCount]);

  const filteredLogs = logs.filter(log => 
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actorId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasMore = logs.length === limitCount;

  const handleLoadMore = () => {
    setLimitCount(prev => prev + 100);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <History className="w-5 h-5 text-pink-400" /> Platform Activity Logs
        </h3>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Filter logs..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-pink-500 outline-none transition-all"
          />
        </div>
      </div>

      {error ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {filteredLogs.map(log => (
              <div key={log.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col md:flex-row md:items-center gap-4 group hover:bg-white/10 transition-all">
                <div className="p-2 bg-white/5 rounded-lg w-fit">
                  <Terminal className="w-4 h-4 text-pink-400" />
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="col-span-1">
                    <div className="text-xs font-bold uppercase tracking-widest text-pink-400 mb-1">
                      {log.action ? log.action.replace(/_/g, ' ') : 'N/A'}
                    </div>
                    <div className="text-[10px] text-white/40 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleString() : 'Just now'}
                    </div>
                  </div>
                  
                  <div className="col-span-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-white/20" />
                      <span className="text-xs font-medium truncate">{log.userEmail || 'unknown'}</span>
                    </div>
                    {log.actorId && (
                      <span className="text-[9px] font-mono text-white/30 truncate block mt-0.5">ID: {log.actorId}</span>
                    )}
                  </div>

                  <div className="col-span-2 space-y-2">
                    {log.deviceContext && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/40 font-mono bg-white/5 px-2 py-1 rounded border border-white/5">
                        <span className="text-teal-400">Device Context:</span>
                        {log.deviceContext.platform && <span>Platform: {log.deviceContext.platform}</span>}
                        {log.deviceContext.screenResolution && <span>Screen: {log.deviceContext.screenResolution}</span>}
                        {log.deviceContext.language && <span>Lang: {log.deviceContext.language}</span>}
                        {log.deviceContext.userAgent && <span className="truncate max-w-xs block" title={log.deviceContext.userAgent}>UA: {log.deviceContext.userAgent}</span>}
                      </div>
                    )}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="text-[10px] text-white/40 font-mono bg-black/20 p-2 rounded border border-white/5 truncate">
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <p className="text-xs text-white/20 text-center py-8 italic">No matching activity logs found.</p>
            )}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/10 hover:border-pink-500/50 bg-white/5 hover:bg-pink-500/10 text-white/70 hover:text-white text-xs font-medium cursor-pointer transition-all active:scale-[0.98]"
              >
                <ChevronDown className="w-4 h-4 text-pink-400 animate-pulse" /> Load More logs (showing up to {limitCount})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
