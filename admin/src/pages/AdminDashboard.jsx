import React, { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';
import { Users, DollarSign, HardDrive, Cpu, Activity, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await adminApi.getDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-slate-500 font-mono">Loading System Status...</div>;

  const { metrics, systemAlerts } = data || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">System Status & Architecture</h1>
        <p className="text-xs text-slate-400">Real-time health, multi-tenant resources, and AI token billing</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Registered Creators</span>
          <div className="text-2xl font-black text-white mt-1">{metrics?.totalCreators}</div>
          <span className="text-[11px] text-emerald-400 font-bold font-mono">388 active today</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Monthly Platform MRR</span>
          <div className="text-2xl font-black text-white mt-1">${metrics?.mrr?.toLocaleString()}</div>
          <span className="text-[11px] text-emerald-400 font-bold font-mono">+14.2% MoM</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Cloud Media Storage</span>
          <div className="text-2xl font-black text-white mt-1">{metrics?.totalStorageGB} GB</div>
          <span className="text-[11px] text-blue-400 font-bold font-mono">of 5,000 GB</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Token Inferences (Mo)</span>
          <div className="text-2xl font-black text-white mt-1">{(metrics?.aiTokensMonthly / 1000000).toFixed(1)}M</div>
          <span className="text-[11px] text-purple-400 font-bold font-mono">GPT-4o & Sonnet</span>
        </div>
      </div>

      <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 font-mono">System Diagnostic Events</h3>
        <div className="space-y-3">
          {systemAlerts?.map((a) => (
            <div key={a.id} className="p-4 rounded-xl bg-[#090D16] border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-white font-medium">{a.title}</span>
              <span className="text-slate-500 font-mono text-[11px]">{a.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

