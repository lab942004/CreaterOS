import React, { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await adminApi.getUsers();
      setUsers(res.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    await adminApi.updateUserStatus(id, status);
    alert(`User status updated to ${status}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Creator Management</h1>
        <p className="text-xs text-slate-400">View registered accounts, verify onboarding, and control access permissions</p>
      </div>

      <div className="bg-[#0F172A] border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#090D16] border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
            <tr>
              <th className="p-4">Creator</th>
              <th className="p-4">Role</th>
              <th className="p-4">Onboarding</th>
              <th className="p-4">Joined</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/30">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="font-bold text-white">{u.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono text-slate-300">{u.role}</td>
                <td className="p-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.isOnboarded ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {u.isOnboarded ? 'COMPLETED' : `STEP ${u.onboardingStep}`}
                  </span>
                </td>
                <td className="p-4 text-slate-500 font-mono text-[11px]">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => handleStatusChange(u.id, 'ACTIVE')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleStatusChange(u.id, 'SUSPENDED')}
                    className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/50 text-red-400 text-[11px] font-semibold rounded-lg"
                  >
                    Suspend
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

