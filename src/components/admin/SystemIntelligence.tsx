import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Shield, Zap, AlertCircle, CheckCircle2,
  BarChart3, Cpu, Database, HardDrive, 
  RefreshCcw, Server, TrendingUp, TrendingDown,
  Clock, Globe, Signal, ArrowUpRight, ArrowDownRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

// Simulated data generation for the dashboard
const generateTimeData = (points: number, base: number, volatility: number) => {
  return Array.from({ length: points }).map((_, i) => ({
    time: `${i}:00`,
    value: Math.max(0, base + (Math.random() - 0.5) * volatility)
  }));
};

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: any;
  color: string;
}

function MetricCard({ title, value, trend, trendValue, icon: Icon, color }: MetricCardProps) {
  const colors: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-400/10 border-blue-500/20',
    green: 'text-green-400 bg-green-400/10 border-green-500/20',
    red: 'text-red-400 bg-red-400/10 border-red-500/20',
    yellow: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20',
    purple: 'text-purple-400 bg-purple-400/10 border-purple-500/20',
    teal: 'text-teal-400 bg-teal-400/10 border-teal-500/20',
  };

  return (
    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colors[color]} border`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-green-500/10 text-green-500' : 
            trend === 'down' ? 'bg-red-500/10 text-red-500' : 
            'bg-white/5 text-white/40'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold mb-1 font-mono tracking-tight">{value}</div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{title}</div>
      </div>
    </div>
  );
}

export default function SystemIntelligence() {
  const { logActivity } = useAuth();
  const [timestamp, setTimestamp] = useState(new Date());
  const [trafficData, setTrafficData] = useState(generateTimeData(12, 450, 100));
  const [latencyData, setLatencyData] = useState(generateTimeData(12, 120, 40));
  const [dbHealth, setDbHealth] = useState(98.4);
  const [isSyncing, setIsSyncing] = useState(false);
  const [commandStatus, setCommandStatus] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date());
      // Update charts with minor fluctuations
      setTrafficData(prev => [...prev.slice(1), { 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
        value: Math.max(0, prev[prev.length-1].value + (Math.random() - 0.5) * 50) 
      }]);
      setLatencyData(prev => [...prev.slice(1), { 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
        value: Math.max(0, prev[prev.length-1].value + (Math.random() - 0.5) * 20) 
      }]);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  const executeCommand = async (cmd: any) => {
    setIsSyncing(true);
    setCommandStatus(`Initiating ${cmd.label}...`);
    try {
      await logActivity('admin_system_command', { command: cmd.id, label: cmd.label });
      setTimeout(() => {
        setCommandStatus(`Command ${cmd.label} executed and logged.`);
        setIsSyncing(false);
        setTimeout(() => setCommandStatus(null), 3000);
      }, 2000);
    } catch (err) {
      setCommandStatus(`Command failure.`);
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center bg-white/5 border border-white/10 p-6 rounded-[2.5rem]">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" /> Platform Intelligence Node
          </h3>
          <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-medium">Real-time infrastructure observability v5.0.4</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isSyncing}
          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
        >
          <RefreshCcw className={`w-5 h-5 text-white/40 group-hover:text-white ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 1. Uptime & Health Checks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          title="API User Uplink" 
          value="99.98%" 
          trend="up" 
          trendValue="0.02%" 
          icon={Users} 
          color="blue" 
          key="metric-users"
        />
        <MetricCard 
          title="Order Protocol" 
          value="Operational" 
          icon={CheckCircle2} 
          color="green" 
          key="metric-orders"
        />
        <MetricCard 
          title="Payment Gateway" 
          value="Nominal" 
          icon={Zap} 
          color="teal" 
          key="metric-payments"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 4. Traffic & Throughput */}
        <div className="lg:col-span-8 p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-1">Traffic & Throughput</h4>
              <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                <Globe className="w-3 h-3" /> Global Request Density (24h)
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span>Peak Traffic</span>
              </div>
              <div className="text-blue-400">8.2k req/min</div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#white' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Error Rate */}
        <div className="lg:col-span-4 p-8 rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col justify-between">
          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-white/60">System Error Matrix</h4>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
                  <span>Server-side (5xx)</span>
                  <span className="text-green-500">0.02%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: '2%' }} 
                    className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
                  <span>Client-side (4xx)</span>
                  <span className="text-yellow-500">1.45%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: '45%' }} 
                    className="h-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]" 
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                <div className="flex items-center gap-3 mb-2">
                  <Signal className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-black tracking-widest uppercase">Health Pulse</span>
                </div>
                <p className="text-[10px] text-white/30 leading-relaxed italic">
                  Critical infrastructure components are responding within nominal parameters. No protocol violations detected.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase text-white/20">Uptime Instance</div>
            <div className="font-mono text-xs font-bold text-white/60">14d 08h 22m 11s</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 3. Latency Metrics */}
        <div className="lg:col-span-4 p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-8">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold uppercase tracking-widest text-white/60">Latency Analyzer</h4>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-mono text-lg font-bold text-green-400">
                84
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-green-500 italic">P50 Latency</div>
                <div className="text-xs text-white/40">Baseline Response (ms)</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-mono text-lg font-bold text-yellow-400">
                192
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-500 italic">P95 Latency</div>
                <div className="text-xs text-white/40">Sluggish Distribution (ms)</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-mono text-lg font-bold text-red-500">
                1.4
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-red-500 italic">Unusual Jitter</div>
                <div className="text-xs text-white/40">Max Spike Deviance (s)</div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Database Health */}
        <div className="lg:col-span-8 p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 border border-pink-500/20 rounded-xl">
                <Database className="w-4 h-4 text-pink-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-white/60">Database Integrity</h4>
                <p className="text-[10px] text-white/20">Multi-region Synchronicity Active</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase text-pink-400 tracking-[0.2em] mb-1">Live Sharding</div>
              <div className="flex gap-1 justify-end">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-3 h-1 rounded-full bg-pink-500/40 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-black/20 border border-white/5 space-y-4">
              <div className="text-[10px] font-bold uppercase text-white/20 flex items-center gap-2">
                <Activity className="w-3 h-3" /> Query Latency
              </div>
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold font-mono">1.2ms</div>
                <div className="text-[8px] text-green-500 font-bold mb-1 uppercase">Optimal</div>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[12%]" />
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-black/20 border border-white/5 space-y-4">
              <div className="text-[10px] font-bold uppercase text-white/20 flex items-center gap-2">
                <Signal className="w-3 h-3" /> Active Links
              </div>
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold font-mono">142</div>
                <div className="text-[8px] text-blue-500 font-bold mb-1 uppercase">Normal Load</div>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[45%]" />
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-black/20 border border-white/5 space-y-4">
              <div className="text-[10px] font-bold uppercase text-white/20 flex items-center gap-2">
                <Cpu className="w-3 h-3" /> DB Workload
              </div>
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold font-mono">24.5%</div>
                <div className="text-[8px] text-white/40 font-bold mb-1 uppercase">Stable</div>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500 w-[24.5%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Resource Usage */}
      <div className="p-8 rounded-[3rem] bg-white/5 border border-white/10">
        <div className="flex items-center gap-3 mb-10">
          <HardDrive className="w-5 h-5 text-amber-400" />
          <h4 className="text-sm font-bold uppercase tracking-widest text-white/60">Infrastructure Resource Mapping</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* CPU Usage */}
          <div className="space-y-6">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-white/40">
              <span className="flex items-center gap-2 font-black tracking-widest"><Cpu className="w-3 h-3" /> CPU Engine</span>
              <span>32.8%</span>
            </div>
            <div className="relative h-2 w-full bg-white/5 rounded-full">
              <div className="absolute top-0 left-0 h-full w-[32.8%] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
              <div className="absolute top-0 left-[32.8%] -translate-x-1/2 -mt-1 w-1 h-4 bg-white shadow-[0_0_10px_white]" />
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 48 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 h-3 rounded-sm transition-all duration-500 ${
                    i < 24 ? 'bg-indigo-500/40' : Math.random() > 0.3 ? 'bg-white/5' : 'bg-indigo-500/20'
                  }`} 
                />
              ))}
            </div>
          </div>

          {/* Memory Usage */}
          <div className="space-y-6">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-white/40">
              <span className="flex items-center gap-2 font-black tracking-widest"><RefreshCcw className="w-3 h-3" /> Mem Synchronizer</span>
              <span>4.2 GB</span>
            </div>
            <div className="relative h-2 w-full bg-white/5 rounded-full">
              <div className="absolute top-0 left-0 h-full w-[65%] bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" />
              <div className="absolute top-0 left-[65%] -translate-x-1/2 -mt-1 w-1 h-4 bg-white shadow-[0_0_10px_white]" />
            </div>
            <div className="grid grid-cols-8 gap-1">
              {Array.from({ length: 16 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`h-4 rounded-md ${i < 10 ? 'bg-teal-500/30' : 'bg-white/5'}`} 
                />
              ))}
            </div>
          </div>

          {/* Disk Usage */}
          <div className="space-y-6">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-white/40">
              <span className="flex items-center gap-2 font-black tracking-widest"><HardDrive className="w-3 h-3" /> Storage Node</span>
              <span>18 / 64 GB</span>
            </div>
            <div className="relative h-2 w-full bg-white/5 rounded-full">
              <div className="absolute top-0 left-0 h-full w-[28.1%] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
              <div className="absolute top-0 left-[28.1%] -translate-x-1/2 -mt-1 w-1 h-4 bg-white shadow-[0_0_10px_white]" />
            </div>
            <div className="flex justify-between">
              {[1,2,3,4].map(i => (
                <div key={i} className={`p-3 rounded-xl border ${i <= 1 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/10'}`}>
                  <div className={`w-1 h-1 rounded-full mb-1 ${i <= 1 ? 'bg-amber-500' : 'bg-white/20'}`} />
                  <div className="text-[8px] font-bold uppercase text-white/40 tracking-[0.2em]">S_UNIT_{i}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 7. System Command Toolkit */}
      <div className="p-8 rounded-[3rem] bg-gradient-to-br from-indigo-500/10 via-white/5 to-purple-500/10 border border-white/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
          <Cpu className="w-64 h-64" />
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-xl font-bold tracking-tight">System Command Toolkit</h4>
                <p className="text-xs text-white/40 uppercase tracking-widest font-medium">Core operational orchestration v1.2</p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
              Level 4 Access Required
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { id: 'purge', label: 'Purge Global Cache', icon: RefreshCcw, desc: 'Invalidate all edge-cached assets.', color: 'blue' },
              { id: 'reindex', label: 'Re-index Matrix', icon: Database, desc: 'Optimize database structural indices.', color: 'purple' },
              { id: 'cycle', label: 'Cycle Server Nodes', icon: Server, desc: 'Graceful restart of all active clusters.', color: 'green' },
              { id: 'lockdown', label: 'Emergency Lockdown', icon: Shield, desc: 'Truncate all non-admin app connections.', color: 'red' }
            ].map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => executeCommand(cmd)}
                disabled={isSyncing}
                className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-left flex flex-col gap-4 group disabled:opacity-50"
              >
                <div className={`w-10 h-10 rounded-xl bg-${cmd.color}-500/10 border border-${cmd.color}-500/20 flex items-center justify-center text-${cmd.color}-400 group-hover:scale-110 transition-transform`}>
                  <cmd.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold mb-1">{cmd.label}</div>
                  <div className="text-[10px] text-white/30 leading-tight">{cmd.desc}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/40 border border-white/5">
            {commandStatus ? (
              <div className="flex items-center gap-3 text-blue-400 font-bold text-[10px] uppercase tracking-widest w-full">
                <Loader2 className="w-4 h-4 animate-spin" /> {commandStatus}
              </div>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-white/20" />
                <p className="text-[10px] text-white/20 uppercase tracking-widest">Caution: Commands executed here impact global infrastructure state. All actions are logged to the Matrix Audit Protocol.</p>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

function Users(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
