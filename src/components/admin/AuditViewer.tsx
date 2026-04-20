import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { 
  History, Search, Filter, Clock, 
  User, Activity, Shield, Terminal
} from 'lucide-react';

export default function AuditViewer() {
  const { isAdmin, loading } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !isAdmin) return;

    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(200));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setError(null);
    }, (err) => {
      console.error("AuditViewer subscription error:", err);
      setError("Audit log access restricted.");
    });
    return () => unsubscribe();
  }, [loading, isAdmin]);

  const filteredLogs = logs.filter(log => 
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <History className="w-5 h-5 text-pink-400" /> System Audit Logs
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

      <div className="space-y-2">
        {filteredLogs.map(log => (
          <div key={log.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4 group hover:bg-white/10 transition-all">
            <div className="p-2 bg-white/5 rounded-lg">
              <Terminal className="w-4 h-4 text-pink-400" />
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="col-span-1">
                <div className="text-xs font-bold uppercase tracking-widest text-pink-400 mb-1">{log.action}</div>
                <div className="text-[10px] text-white/40 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(log.timestamp?.toDate()).toLocaleString()}
                </div>
              </div>
              <div className="col-span-1 flex items-center gap-2">
                <User className="w-3 h-3 text-white/20" />
                <span className="text-xs font-medium truncate">{log.userEmail}</span>
              </div>
              <div className="col-span-2">
                <div className="text-[10px] text-white/40 font-mono bg-black/20 p-2 rounded border border-white/5 truncate">
                  {JSON.stringify(log.details)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
