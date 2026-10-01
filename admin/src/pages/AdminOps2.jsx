import React, { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';

export function AdminAIUsage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminApi.getAIUsage().then(res => setData(res));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">AI Usage & Tokens</h1>
        <p className="text-xs text-slate-400">API expenditure and token quotas across models</p>
      </div>
      <div className="p-5 bg-[#0F172A] border border-slate-800 rounded-2xl">
        <span className="text-xs text-slate-400 font-mono">Estimated API Cost This Month</span>
        <div className="text-3xl font-black text-white mt-1">${data?.totalCostMonthly?.toFixed(2)}</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data?.breakdownByModel?.map(m => (
          <div key={m.model} className="p-5 bg-[#0F172A] border border-slate-800 rounded-2xl text-xs space-y-1">
            <h3 className="font-bold text-white">{m.model}</h3>
            <p className="text-slate-400 font-mono">{m.tokens ? `${(m.tokens / 1000000).toFixed(1)}M tokens` : `${m.minutes} minutes`}</p>
            <p className="text-emerald-400 font-mono font-bold">${m.cost?.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminStorage() {
  const [storage, setStorage] = useState(null);

  useEffect(() => {
    adminApi.getStorage().then(res => setStorage(res));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Cloud Media Storage</h1>
        <p className="text-xs text-slate-400">Asset distribution, CDN caching, and capacity</p>
      </div>
      <div className="p-5 bg-[#0F172A] border border-slate-800 rounded-2xl">
        <span className="text-xs text-slate-400 font-mono">Total Allocation</span>
        <div className="text-2xl font-bold text-white mt-1">{storage?.totalStorageUsedGB} GB of {storage?.totalStorageLimitGB} GB</div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(storage?.totalStorageUsedGB / storage?.totalStorageLimitGB) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

export function AdminFeatureFlags() {
  const [flags, setFlags] = useState([]);

  useEffect(() => {
    adminApi.getFeatureFlags().then(res => setFlags(res.flags || []));
  }, []);

  const handleToggle = async (id) => {
    const res = await adminApi.toggleFeatureFlag(id);
    setFlags(prev => prev.map(f => f.id === id ? res.flag : f));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Feature Flags</h1>
        <p className="text-xs text-slate-400">Dynamically toggle platform modules and capabilities</p>
      </div>
      <div className="space-y-3">
        {flags.map(f => (
          <div key={f.id} className="p-5 bg-[#0F172A] border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">{f.name}</span>
              <span className="text-[10px] text-slate-500 font-mono">{f.key} • {f.description}</span>
            </div>
            <button
              onClick={() => handleToggle(f.id)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${f.isEnabled ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-400'}`}
            >
              {f.isEnabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    adminApi.getAuditLogs().then(res => setLogs(res.logs || []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Security Audit Log</h1>
        <p className="text-xs text-slate-400">Immutable trace of creator actions and platform events</p>
      </div>
      <div className="space-y-2">
        {logs.map((l, i) => (
          <div key={i} className="p-4 bg-[#0F172A] border border-slate-800 rounded-2xl flex justify-between text-xs font-mono">
            <div>
              <span className="text-blue-400 font-bold block">{l.action}</span>
              <span className="text-slate-400">{l.details}</span>
            </div>
            <div className="text-right text-slate-500 text-[11px]">
              <p>{l.ipAddress}</p>
              <p>{new Date(l.createdAt).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

