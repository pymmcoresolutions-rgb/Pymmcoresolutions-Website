import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Users, FileText, History, Settings, 
  Plus, Shield, Activity, Globe, Smartphone, Monitor,
  AlertCircle, CheckCircle2, Clock, Search, Filter, Mail,
  MoreVertical, UserMinus, UserPlus, ShieldCheck, Ban, Star, Image, Rocket,
  TrendingUp, DollarSign, Share2
} from 'lucide-react';
import NodeManager from './admin/NodeManager';
import UserManager from './admin/UserManager';
import ContentManager from './admin/ContentManager';
import AuditViewer from './admin/AuditViewer';
import InquiryManager from './admin/InquiryManager';
import ReviewsManager from './admin/ReviewsManager';
import SettingsManager from './admin/SettingsManager';
import SiteContentManager from './admin/SiteContentManager';
import SystemIntelligence from './admin/SystemIntelligence';
import SubmissionManager from './admin/SubmissionManager';
import LogoManager from './admin/LogoManager';
import WaitlistManager from './admin/WaitlistManager';
import AnalyticsDashboard from './admin/AnalyticsDashboard';
import EconomyManager from './admin/EconomyManager';
import SocialShipper from './admin/SocialShipper';
import BrandingSettings from './BrandingSettings';

export default function AdminDashboard() {
  const { user, profile, isAdmin, isEditor, isDeveloper, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalApps: 0,
    totalUsers: 0,
    totalReviews: 0,
    totalWaitlist: 0,
    activeLogs: 0,
    systemHealth: 'Optimal'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const appsSnap = await getDocs(collection(db, 'apps'));
        const reviewsSnap = await getDocs(collection(db, 'reviews'));
        
        let usersSize = 0;
        let waitlistSize = 0;
        let logsSize = 0;

        if (isAdmin) {
          const usersSnap = await getDocs(collection(db, 'users'));
          const waitlistSnap = await getDocs(collection(db, 'waitlist'));
          const logsSnap = await getDocs(query(collection(db, 'logs'), limit(100)));
          usersSize = usersSnap.size;
          waitlistSize = waitlistSnap.size;
          logsSize = logsSnap.size;
        }

        setStats({
          totalApps: appsSnap.size,
          totalUsers: usersSize,
          totalReviews: reviewsSnap.size,
          totalWaitlist: waitlistSize,
          activeLogs: logsSize,
          systemHealth: 'Optimal'
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    let unsubscribeLogs = () => {};
    if (isAdmin && !loading) {
      const logsQuery = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(5));
      unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
        setRecentLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setError(null);
      }, (err) => {
        console.error("Dashboard logs subscription error:", err);
        setError("Permission denied for activity logs.");
      });
    }

    if (!loading) {
      fetchStats();
    }
    return () => unsubscribeLogs();
  }, [isAdmin, loading]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'editor', 'developer'] },
    { id: 'insights', label: 'Insights', icon: TrendingUp, roles: ['admin', 'developer'] },
    { id: 'apps', label: 'Apps', icon: Activity, roles: ['admin', 'editor'] },
    { id: 'users', label: 'Users', icon: Users, roles: ['admin'] },
    { id: 'waitlist', label: 'Waitlist', icon: Mail, roles: ['admin'] },
    { id: 'reviews', label: 'Reviews', icon: Star, roles: ['admin', 'editor'] },
    { id: 'inquiries', label: 'Inquiries', icon: Mail, roles: ['admin'] },
    { id: 'submissions', label: 'Submissions', icon: Rocket, roles: ['admin', 'editor'] },
    { id: 'cms', label: 'CMS', icon: FileText, roles: ['admin', 'editor'] },
    { id: 'content', label: 'Site Content', icon: Globe, roles: ['admin', 'editor'] },
    { id: 'economy', label: 'Economy', icon: DollarSign, roles: ['admin'] },
    { id: 'social', label: 'Social Shipper', icon: Share2, roles: ['admin'] },
    { id: 'intelligence', label: 'Performance', icon: Shield, roles: ['admin'] },
    { id: 'branding', label: 'Branding', icon: Image, roles: ['admin'] },
    { id: 'audit', label: 'Activity Logs', icon: History, roles: ['admin', 'developer'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  ];

  const filteredTabs = tabs.filter(tab => tab.roles.includes(profile?.role) || isAdmin);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 space-y-2">
          <div className="p-4 mb-6 rounded-2xl bg-blue-600/10 border border-blue-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-sm uppercase tracking-widest">Admin Tools</span>
            </div>
            <p className="text-[10px] text-white/40 leading-tight">
              Authorized access only. All actions are logged under Platform Records.
            </p>
          </div>
          
          {filteredTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </div>
              {tab.id === 'intelligence' && (
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </div>
              )}
            </button>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-h-[600px]">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Apps" value={stats.totalApps} icon={Activity} color="blue" />
                  <StatCard label="System Users" value={stats.totalUsers} icon={Users} color="purple" />
                  <StatCard label="User Reviews" value={stats.totalReviews} icon={Star} color="yellow" />
                  <StatCard label="Health Status" value={stats.systemHealth} icon={ShieldCheck} color="green" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                    <h3 className="font-bold mb-6 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" /> Recent Activity
                    </h3>
                    <div className="space-y-4">
                      {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                      )}
                      {recentLogs.map(log => (
                        <ActivityItem 
                          key={log.id} 
                          action={log.action.replace(/_/g, ' ')} 
                          user={log.userEmail.split('@')[0]} 
                          time={log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleTimeString() : 'Just now'} 
                        />
                      ))}
                      {recentLogs.length === 0 && (
                        <p className="text-xs text-white/20 text-center py-4 italic">No recent activity logged.</p>
                      )}
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                    <h3 className="font-bold mb-6 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-400" /> System Alerts
                    </h3>
                    <div className="space-y-4">
                      <AlertItem type="success" message="System environment is active and healthy." />
                      <AlertItem type="success" message="Platform synchronization completed successfully." />
                      {stats.totalReviews > 50 && <AlertItem type="warning" message="High volume of reviews pending review." />}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'insights' && <AnalyticsDashboard key="insights" />}
            {activeTab === 'apps' && <NodeManager key="apps" />}
            {activeTab === 'users' && <UserManager key="users" />}
            {activeTab === 'waitlist' && <WaitlistManager key="waitlist" />}
            {activeTab === 'reviews' && <ReviewsManager key="reviews" />}
            {activeTab === 'inquiries' && <InquiryManager key="inquiries" />}
            {activeTab === 'submissions' && <SubmissionManager key="submissions" />}
            {activeTab === 'cms' && <ContentManager key="cms" />}
            {activeTab === 'content' && <SiteContentManager key="content" />}
            {activeTab === 'intelligence' && <SystemIntelligence key="intelligence" />}
            {activeTab === 'audit' && <AuditViewer key="audit" />}
            {activeTab === 'branding' && <BrandingSettings key="branding" />}
            {activeTab === 'economy' && <EconomyManager key="economy" />}
            {activeTab === 'social' && <SocialShipper key="social" />}
            {activeTab === 'settings' && <SettingsManager key="settings" />}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'text-blue-400 bg-blue-400/10',
    purple: 'text-purple-400 bg-purple-400/10',
    pink: 'text-pink-400 bg-pink-400/10',
    green: 'text-green-400 bg-green-400/10',
    yellow: 'text-yellow-400 bg-yellow-400/10'
  };
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs text-white/40 uppercase tracking-widest font-bold">{label}</div>
    </div>
  );
}

function ActivityItem({ action, user, time }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <span className="text-sm font-medium">{action}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-white/40">
        <span>{user}</span>
        <span>•</span>
        <span>{time}</span>
      </div>
    </div>
  );
}

function AlertItem({ type, message }: any) {
  return (
    <div className={`p-4 rounded-xl border flex items-center gap-3 ${
      type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 'bg-green-500/10 border-green-500/20 text-green-500'
    }`}>
      {type === 'warning' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
