import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@creatoros.ai');
  const [password, setPassword] = useState('CreatorOS@2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.login({ email, password });
      localStorage.setItem('creatoros_admin_token', res.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Access denied');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A11] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0F172A] border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">CreatorOS Control Plane</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">Restricted to Platform Administrators</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#090D16] border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Master Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#090D16] border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Authorize Admin Session'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

