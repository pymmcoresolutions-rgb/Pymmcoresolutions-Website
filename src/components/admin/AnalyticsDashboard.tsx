import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { Download, Users, TrendingUp, Calendar, Box, Smartphone, Monitor, Globe } from 'lucide-react';
import { motion } from 'motion/react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  color: string;
}

function MetricCard({ title, value, icon: Icon, trend, color }: MetricCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl bg-${color}-500/10 border border-${color}-500/20 text-${color}-400 group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full uppercase tracking-widest">
            {trend}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{title}</h4>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
      </div>
    </motion.div>
  );
}

export default function AnalyticsDashboard() {
  const [apps, setApps] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to apps for download counts
    const appsUnsubscribe = onSnapshot(collection(db, 'apps'), (snapshot) => {
      setApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch last 1000 downloads for trends
    const downloadsQuery = query(
      collection(db, 'downloads'),
      orderBy('timestamp', 'desc'),
      limit(1000)
    );
    const downloadsUnsubscribe = onSnapshot(downloadsQuery, (snapshot) => {
      setDownloads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      appsUnsubscribe();
      downloadsUnsubscribe();
    };
  }, []);

  const totalDownloads = useMemo(() => apps.reduce((sum, app) => sum + (app.downloadCount || 0), 0), [apps]);
  
  const activeUsers = useMemo(() => {
    const sessions = new Set(downloads.map(d => d.sessionId));
    return sessions.size;
  }, [downloads]);

  const trendData = useMemo(() => {
    const daily: Record<string, number> = {};
    const days = 7;
    const now = new Date();
    
    // Initialize last 7 days
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      daily[dateStr] = 0;
    }

    downloads.forEach(d => {
      if (!d.timestamp) return;
      const date = d.timestamp instanceof Timestamp ? d.timestamp.toDate() : new Date(d.timestamp);
      const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (daily[dateStr] !== undefined) {
        daily[dateStr]++;
      }
    });

    return Object.entries(daily).map(([name, count]) => ({ name, count }));
  }, [downloads]);

  const platformData = useMemo(() => {
    const counts: Record<string, number> = {
      'Web': 0,
      'Mobile': 0,
      'Desktop': 0
    };
    downloads.forEach(d => {
      // Very naive mapping for demo purposes
      if (d.platform?.includes('Win') || d.platform?.includes('Mac')) counts['Desktop']++;
      else if (d.platform?.includes('iPhone') || d.platform?.includes('Android')) counts['Mobile']++;
      else counts['Web']++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [downloads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Technical Insights</h2>
          <p className="text-white/40 text-sm">Real-time performance and adoption metrics across the ecosystem.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/40">
          <Calendar className="w-3 h-3" /> Last 7 Days
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Downloads" 
          value={totalDownloads.toLocaleString()} 
          icon={Download} 
          color="cyan"
          trend="+12%"
        />
        <MetricCard 
          title="Active Sessions" 
          value={activeUsers.toLocaleString()} 
          icon={Users} 
          color="purple"
          trend="+5%"
        />
        <MetricCard 
          title="Conversion Rate" 
          value="24.8%" 
          icon={TrendingUp} 
          color="emerald"
        />
        <MetricCard 
          title="Avg. Rating" 
          value="4.9" 
          icon={Box} 
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Chart */}
        <div className="lg:col-span-2 p-8 rounded-[2.5rem] bg-white/5 border border-white/10">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold tracking-tight">Growth Trajectory</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Downloads</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#ffffff20" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#ffffff20" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a0a0a', 
                    border: '1px solid #ffffff10', 
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#00ffff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#00ffff" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#00ffff', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#00ffff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10">
          <h3 className="text-lg font-bold tracking-tight mb-8">Platform Split</h3>
          <div className="space-y-6">
            {platformData.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    {item.name === 'Web' && <Globe className="w-3 h-3 text-cyan-400" />}
                    {item.name === 'Mobile' && <Smartphone className="w-3 h-3 text-purple-400" />}
                    {item.name === 'Desktop' && <Monitor className="w-3 h-3 text-pink-400" />}
                    <span className="text-white/60">{item.name}</span>
                  </div>
                  <span>{Math.round((item.value / (totalDownloads || 1)) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.value / (totalDownloads || 1)) * 100}%` }}
                    className={`h-full ${
                      item.name === 'Web' ? 'bg-cyan-500' : 
                      item.name === 'Mobile' ? 'bg-purple-500' : 'bg-pink-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-4">Top Performing Apps</div>
            <div className="space-y-4">
              {apps.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0)).slice(0, 3).map((app, i) => (
                <div key={app.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/40">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{app.name}</div>
                    <div className="text-[9px] text-white/20 uppercase tracking-widest">{app.developer}</div>
                  </div>
                  <div className="text-xs font-mono text-cyan-400">{(app.downloadCount || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
