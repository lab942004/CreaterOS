import React, { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';

export function AdminWorkspaces() {
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    adminApi.getWorkspaces().then(res => setWorkspaces(res.workspaces || []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Workspaces</h1>
        <p className="text-xs text-slate-400">Multi-tenant production spaces</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workspaces.map(w => (
          <div key={w.id} className="p-5 bg-[#0F172A] border border-slate-800 rounded-2xl">
            <h3 className="font-bold text-white text-sm">{w.name}</h3>
            <p className="text-xs text-slate-500 font-mono mt-1">Slug: {w.slug} • Owner: {w.ownerId}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminHealth() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    adminApi.getPlatformHealth().then(res => setHealth(res));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Platform Health</h1>
        <p className="text-xs text-slate-400">Service uptime, database roundtrip, and queue latency</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-[#0F172A] border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 font-mono">Database Latency</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{health?.database?.latencyMs} ms</div>
          <span className="text-[10px] text-slate-500 font-mono">PostgreSQL connection</span>
        </div>
        <div className="p-5 bg-[#0F172A] border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 font-mono">AI Gateway Avg</span>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{health?.aiGateway?.avgResponseMs} ms</div>
          <span className="text-[10px] text-slate-500 font-mono">Streaming pipeline</span>
        </div>
        <div className="p-5 bg-[#0F172A] border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 font-mono">Jobs Completed Today</span>
          <div className="text-2xl font-bold text-white mt-1">{health?.queues?.completedToday}</div>
          <span className="text-[10px] text-emerald-400 font-mono">1 failed</span>
        </div>
      </div>
    </div>
  );
}

export function AdminJobs() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    adminApi.getJobs().then(res => setJobs(res.jobs || []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Job Monitor</h1>
        <p className="text-xs text-slate-400">Background workers processing video, clipping, and transcription</p>
      </div>
      <div className="space-y-3">
        {jobs.map(j => (
          <div key={j.id} className="p-4 bg-[#0F172A] border border-slate-800 rounded-2xl flex justify-between items-center text-xs">
            <div>
              <span className="font-mono text-blue-400 block">{j.id} • {j.type}</span>
              <p className="text-white font-bold mt-0.5">{j.creator}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full">{j.status}</span>
              <p className="text-[11px] text-slate-500 font-mono mt-1">{j.duration}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

