import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { 
  Users, Shield, ShieldCheck, ShieldAlert, 
  Ban, CheckCircle2, MoreVertical, Search,
  Mail, Clock, UserMinus, UserPlus
} from 'lucide-react';

export default function UserManager() {
  const { logActivity } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('email', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const updateRole = async (userId: string, email: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      await logActivity('user_role_updated', { email, role: newRole });
    } catch (error) {
      console.error("Role update failed:", error);
    }
  };

  const toggleStatus = async (user: any) => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    try {
      await updateDoc(doc(db, 'users', user.id), { status: newStatus });
      await logActivity('user_status_changed', { email: user.email, status: newStatus });
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" /> User Management
        </h3>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-purple-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              <th className="px-6 py-2 text-left">User</th>
              <th className="px-6 py-2 text-left">Role</th>
              <th className="px-6 py-2 text-left">Status</th>
              <th className="px-6 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className="bg-white/5 border border-white/10 group">
                <td className="px-6 py-4 rounded-l-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{user.email}</div>
                      <div className="text-[10px] text-white/40">ID: {user.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={e => updateRole(user.id, user.email, e.target.value)}
                    className="bg-transparent text-xs font-bold uppercase tracking-widest text-white/60 focus:text-white outline-none cursor-pointer"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                    user.status === 'suspended' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                  }`}>
                    {user.status || 'active'}
                  </span>
                </td>
                <td className="px-6 py-4 rounded-r-2xl text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => toggleStatus(user)}
                      className={`p-2 rounded-lg transition-colors ${
                        user.status === 'suspended' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}
                      title={user.status === 'suspended' ? 'Activate' : 'Suspend'}
                    >
                      {user.status === 'suspended' ? <UserPlus className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
