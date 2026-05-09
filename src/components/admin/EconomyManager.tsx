import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { motion } from 'motion/react';
import { 
  DollarSign, TrendingUp, Save, Loader2, 
  CheckCircle2, AlertCircle, Info, RefreshCcw
} from 'lucide-react';
import { useAuth } from '../../lib/auth';

export default function EconomyManager() {
  const { logActivity } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState({
    listingFee: 25,
    exchangeRate: 1600, // USD to NGN
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'marketplace'), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data() as any);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'config/marketplace');
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'config', 'marketplace'), {
        ...config,
        updatedAt: serverTimestamp()
      });
      await logActivity('UPDATE_ECONOMY_CONFIG', { config });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Economy save error:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marketplace Economy</h2>
          <p className="text-white/40 text-sm">Manage global listing fees and exchange rate protocols.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Synchronizing...' : success ? 'System Updated' : 'Save Economy Config'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Listing Fee Setting */}
        <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="font-bold">Application Listing Fee</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-2">Base Fee (USD)</label>
              <div className="relative">
                <input 
                  type="number"
                  value={config.listingFee}
                  onChange={e => setConfig({ ...config, listingFee: Number(e.target.value) })}
                  className="w-full px-5 py-4 bg-black border border-white/10 rounded-2xl outline-none focus:border-green-500 transition-all font-bold text-xl"
                  placeholder="25"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 font-mono">USD</span>
              </div>
            </div>
            <p className="text-xs text-white/40 leading-relaxed px-2">
              This fee is charged to developers during the submission process. It covers technical auditing and hosting overhead.
            </p>
          </div>
        </div>

        {/* Exchange Rate Setting */}
        <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="font-bold">Paystack Exchange Protocol</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-2">USD to NGN Rate</label>
              <div className="relative">
                <input 
                  type="number"
                  value={config.exchangeRate}
                  onChange={e => setConfig({ ...config, exchangeRate: Number(e.target.value) })}
                  className="w-full px-5 py-4 bg-black border border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-xl"
                  placeholder="1600"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 font-mono">NGN / $1</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-3">
              <RefreshCcw className="w-4 h-4 text-blue-400" />
              <div className="text-[10px] text-white/60">
                Current Effective Fee: <span className="text-white font-bold">₦{(config.listingFee * config.exchangeRate).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-500">Economy Warning</h4>
          <p className="text-xs text-white/40 leading-relaxed">
            Changes to economy settings are global and immediate. New submissions will reflect these rates instantly. Paystack currency remains NGN based on the exchange rate provided.
          </p>
        </div>
      </div>

      <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-dashed border-white/10">
        <div className="flex items-center gap-4 text-white/20">
          <Info className="w-5 h-5" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Auditor Toolkit v1.0 • PymmCore Economics</p>
        </div>
      </div>
    </div>
  );
}
