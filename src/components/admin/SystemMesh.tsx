import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AnalyticsDashboard from './AnalyticsDashboard';
import SecurityAudits from './SecurityAudits';
import SystemIntelligence from './SystemIntelligence';
import { TrendingUp, ShieldCheck, Zap, LayoutGrid, Activity, Shield } from 'lucide-react';

type MeshTab = 'insights' | 'performance' | 'security';

export default function SystemMesh() {
  const [activeTab, setActiveTab] = useState<MeshTab>('insights');

  const tabs = [
    { id: 'insights' as MeshTab, label: 'Insights', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { id: 'performance' as MeshTab, label: 'Performance', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { id: 'security' as MeshTab, label: 'Security Audits', icon: ShieldCheck, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2 uppercase italic">Intelligence Mesh</h2>
          <p className="text-white/40 text-sm font-medium uppercase tracking-widest">Global system orchestration and real-time heuristics.</p>
        </div>

        <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-6 py-3 rounded-xl transition-all flex items-center gap-2 group ${
                activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              <tab.icon className={`w-4 h-4 transition-colors ${activeTab === tab.id ? tab.color : 'text-white/20 group-hover:text-white/40'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="active-mesh-tab"
                  className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl -z-10 shadow-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="relative min-h-[600px] p-8 rounded-[3rem] bg-white/5 border border-white/10 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic">Market Intelligence</h3>
                  <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">Real-time trend analysis and node performance metrics</p>
                </div>
              </div>
              <div className="scale-[0.98] origin-top transform">
                <AnalyticsDashboard />
              </div>
            </motion.div>
          )}

          {activeTab === 'performance' && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic">System Performance</h3>
                  <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">Heuristic processing and infrastructure efficiency</p>
                </div>
              </div>
              <div className="scale-[0.98] origin-top transform">
                <SystemIntelligence />
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <ShieldCheck className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic">Security Protocol</h3>
                  <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">Kernel safety audits and penetration heuristics</p>
                </div>
              </div>
              <div className="scale-[0.98] origin-top transform">
                <SecurityAudits />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decorative background element */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />
      </div>
    </div>
  );
}

